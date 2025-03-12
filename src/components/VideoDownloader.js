import React, { useState, useEffect } from 'react';
import './VideoDownloader.css';
import { FaYoutube, FaTiktok, FaFacebook, FaLink, FaDownload } from 'react-icons/fa';
import { MdAudioFile, MdVideoFile } from 'react-icons/md';
import { downloadVideo } from '../services/api'; // Remove getDownloadUrl since it's not used

// Update your API base URL
const API_BASE_URL = 'http://localhost:5001';

const VideoDownloader = () => {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [downloadOptions, setDownloadOptions] = useState([]);

  // Detect platform from URL
  useEffect(() => {
    if (!url) {
      setPlatform(null);
      setVideoInfo(null);
      setDownloadOptions([]);
      return;
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      if (hostname.includes('youtube') || hostname.includes('youtu.be')) {
        setPlatform('youtube');
      } else if (hostname.includes('tiktok')) {
        setPlatform('tiktok');
      } else if (hostname.includes('facebook') || hostname.includes('fb.watch')) {
        setPlatform('facebook');
      } else {
        setPlatform(null);
      }
    } catch (err) {
      setPlatform(null);
    }
  }, [url]);

  // Handle URL input change
  const handleUrlChange = (e) => {
    setUrl(e.target.value);
    setError('');
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!url) {
      setError('Please enter a video URL');
      return;
    }

    if (!platform) {
      setError('Unsupported platform. Please enter a YouTube, TikTok, or Facebook URL');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/api/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.videoInfo) {
        setVideoInfo(data.videoInfo);
        setDownloadOptions(data.formats || []);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error processing video:', err);
      setError(err.message || 'Failed to process video. Please try again.');
      setVideoInfo(null);
      setDownloadOptions([]);
    } finally {
      setLoading(false);
    }
  };

  // This function is no longer needed as we're using the real API

  // Update the handleDownload function
  const handleDownload = async (option) => {
    if (!url || !platform) return;

    try {
      setLoading(true);
      await downloadVideo(
        platform,
        url,
        option.format,
        option.quality,
        option.hasOwnProperty('watermark') ? option.watermark : null
      );
      setLoading(false);
    } catch (error) {
      console.error('Download error:', error);
      setError('Failed to start download. Please try again.');
      setLoading(false);
    }
  };

  // Get platform icon
  const getPlatformIcon = () => {
    switch (platform) {
      case 'youtube':
        return <FaYoutube className="platform-icon youtube" />;
      case 'tiktok':
        return <FaTiktok className="platform-icon tiktok" />;
      case 'facebook':
        return <FaFacebook className="platform-icon facebook" />;
      default:
        return <FaLink className="platform-icon" />;
    }
  };

  // Update the download options rendering
  const renderDownloadOptions = () => (
    <div className="download-options">
      <h4>Download Options</h4>
      <div className="options-container">
        {downloadOptions.map((option) => (
          <button
            key={option.id}
            className={`download-option ${option.type === 'audio' ? 'audio' : 'video'}`}
            onClick={() => handleDownload(option)}
            disabled={loading}
          >
            <div className="option-icon">
              {option.type === 'audio' ? <MdAudioFile /> : <MdVideoFile />}
            </div>
            <div className="option-details">
              <span className="option-format">
                {option.format.toUpperCase()} {option.quality}
                {option.hasOwnProperty('watermark') && (
                  <span className="watermark-indicator">
                    {option.watermark ? 'With Watermark' : 'No Watermark'}
                  </span>
                )}
              </span>
              <span className="option-size">{option.size}</span>
            </div>
            <div className="download-icon">
              {loading ? (
                <div className="loading-spinner-small"></div>
              ) : (
                <FaDownload />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="video-downloader">
      <div className="downloader-header">
        <h2>Download Videos from YouTube, TikTok, and Facebook</h2>
        <p>Paste the video link below and download in your preferred format</p>
      </div>
      
      <form onSubmit={handleSubmit} className="url-form">
        <div className="url-input-container">
          {platform && (
            <div className="platform-indicator">
              {getPlatformIcon()}
            </div>
          )}
          <input
            type="text"
            value={url}
            onChange={handleUrlChange}
            placeholder="Paste YouTube, TikTok, or Facebook video URL here..."
            className={platform ? `has-platform ${platform}` : ''}
          />
        </div>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Processing...' : 'Download'}
        </button>
      </form>
      
      {error && <div className="error-message">{error}</div>}
      
      {loading && (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Analyzing video...</p>
        </div>
      )}
      
      {videoInfo && !loading && (
        <div className="video-info-container">
          <div className="video-info">
            <div className="video-thumbnail">
              <img src={videoInfo.thumbnail} alt={videoInfo.title} />
              <span className="video-duration">{videoInfo.duration}</span>
            </div>
            <div className="video-details">
              <h3>{videoInfo.title}</h3>
              <p>By: {videoInfo.author}</p>
            </div>
          </div>
          {renderDownloadOptions()}
        </div>
      )}
      
      <div className="features-section" id="features">
        <h3>Features</h3>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon"><FaYoutube /></div>
            <h4>YouTube Downloads</h4>
            <p>Download YouTube videos in MP4 format or extract audio in MP3 format.</p>
          </div>
          <div className="feature">
            <div className="feature-icon"><FaTiktok /></div>
            <h4>TikTok Downloads</h4>
            <p>Download TikTok videos with or without watermark, or extract the audio.</p>
          </div>
          <div className="feature">
            <div className="feature-icon"><FaFacebook /></div>
            <h4>Facebook Downloads</h4>
            <p>Download Facebook videos in high quality or extract the audio track.</p>
          </div>
        </div>
      </div>
      
      <div className="how-it-works" id="how-it-works">
        <h3>How It Works</h3>
        <ol className="steps">
          <li>
            <span className="step-number">1</span>
            <div className="step-content">
              <h4>Copy Video URL</h4>
              <p>Copy the URL of the video you want to download from YouTube, TikTok, or Facebook.</p>
            </div>
          </li>
          <li>
            <span className="step-number">2</span>
            <div className="step-content">
              <h4>Paste URL</h4>
              <p>Paste the URL in the input field above and click the Download button.</p>
            </div>
          </li>
          <li>
            <span className="step-number">3</span>
            <div className="step-content">
              <h4>Choose Format</h4>
              <p>Select your preferred format and quality from the available options.</p>
            </div>
          </li>
          <li>
            <span className="step-number">4</span>
            <div className="step-content">
              <h4>Download</h4>
              <p>Click on your chosen format to start the download process.</p>
            </div>
          </li>
        </ol>
      </div>
      
      <div className="faq-section" id="faq">
        <h3>Frequently Asked Questions</h3>
        <div className="faq-list">
          <div className="faq-item">
            <h4>Is this service free to use?</h4>
            <p>Yes, our video downloader is completely free to use with no hidden charges.</p>
          </div>
          <div className="faq-item">
            <h4>Is it legal to download videos?</h4>
            <p>Downloading videos for personal use is generally acceptable, but redistributing copyrighted content is not. Please respect copyright laws and the content creators.</p>
          </div>
          <div className="faq-item">
            <h4>What video quality can I download?</h4>
            <p>Depending on the original video, you can download in various qualities from SD to HD.</p>
          </div>
          <div className="faq-item">
            <h4>Can I download private or restricted videos?</h4>
            <p>No, you can only download publicly available videos that are not restricted by the platform.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoDownloader;