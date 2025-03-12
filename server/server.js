const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const ytdl = require('ytdl-core');
const axios = require('axios');
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 5001; // Changed from 5000 to 5001 to avoid conflicts

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Serve static files with error handling
const buildPath = path.join(__dirname, '../build');
app.use(express.static(buildPath, {
  fallthrough: true,
  maxAge: '1h'
}));

// Error handler for static files
app.use((err, req, res, next) => {
  if (err) {
    console.error('Static file error:', err);
    return res.status(500).json({ error: 'Error serving static file' });
  }
  next();
});

// Create temp directory if it doesn't exist
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Helper function to clean up temp files
const cleanupTempFiles = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) return console.error(err);
    
    // Delete files older than 1 hour
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return console.error(err);
        
        // If file is older than 1 hour, delete it
        if (now - stats.mtime.getTime() > 3600000) {
          fs.unlink(filePath, err => {
            if (err) console.error(err);
          });
        }
      });
    });
  });
};

// Clean up temp files every hour
setInterval(cleanupTempFiles, 3600000);

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running correctly' });
});

// Replace getVideoInfoWithFallback with a simpler version
async function getVideoInfoWithFallback(url) {
  try {
    const options = {
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive'
        }
      }
    };

    // First try with basic info
    const basicInfo = await ytdl.getBasicInfo(url, options);
    
    // Then get formats
    const formats = await Promise.all(
      basicInfo.formats.map(async format => {
        try {
          return {
            ...format,
            url: format.url || await ytdl.getURLVideoID(format.url)
          };
        } catch {
          return format;
        }
      })
    );

    return {
      source: 'ytdl',
      info: {
        ...basicInfo,
        formats
      }
    };
  } catch (error) {
    console.error('ytdl-core error:', error);
    throw error;
  }
}

// Add these helper functions
async function getTikTokVideoInfo(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const videoTitle = $('title').text() || 'TikTok Video';
    const videoMeta = $('meta[property="og:video"]').attr('content');
    const thumbnail = $('meta[property="og:image"]').attr('content');
    
    return {
      title: videoTitle,
      thumbnail: thumbnail || 'https://via.placeholder.com/640x360/4a6cf7/ffffff?text=TikTok+Video',
      duration: '0:00',
      author: 'TikTok User',
      formats: [
        {
          id: 'tt-mp4-hd',
          format: 'mp4',
          quality: 'HD',
          type: 'video',
          url: videoMeta,
          size: 'Unknown'
        },
        {
          id: 'tt-mp3',
          format: 'mp3',
          quality: 'High',
          type: 'audio',
          url: videoMeta,
          size: 'Unknown'
        }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to fetch TikTok video info: ${error.message}`);
  }
}

async function getFacebookVideoInfo(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const videoTitle = $('title').text() || 'Facebook Video';
    const videoUrl = $('meta[property="og:video"]').attr('content');
    const thumbnail = $('meta[property="og:image"]').attr('content');
    
    return {
      title: videoTitle,
      thumbnail: thumbnail || 'https://via.placeholder.com/640x360/4a6cf7/ffffff?text=Facebook+Video',
      duration: '0:00',
      author: 'Facebook User',
      formats: [
        {
          id: 'fb-mp4-hd',
          format: 'mp4',
          quality: 'HD',
          type: 'video',
          url: videoUrl,
          size: 'Unknown'
        },
        {
          id: 'fb-mp3',
          format: 'mp3',
          quality: 'High',
          type: 'audio',
          url: videoUrl,
          size: 'Unknown'
        }
      ]
    };
  } catch (error) {
    throw new Error(`Failed to fetch Facebook video info: ${error.message}`);
  }
}

// Update the YouTube section in the /api/info endpoint
app.post('/api/info', async (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    let platform;
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      platform = 'youtube';
      
      try {
        const videoId = ytdl.getVideoID(url);
        const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
        console.log('Processing YouTube video ID:', videoId);
        
        const { source, info } = await getVideoInfoWithFallback(cleanUrl);
        console.log('Successfully retrieved info using:', source);
        
        return res.json({
          platform,
          videoInfo: {
            title: info.videoDetails.title || 'Unknown Title',
            thumbnail: info.videoDetails.thumbnails?.[0]?.url || 
                      'https://via.placeholder.com/640x360/4a6cf7/ffffff?text=YouTube+Video',
            duration: info.videoDetails.lengthSeconds 
              ? formatDuration(parseInt(info.videoDetails.lengthSeconds)) 
              : '0:00',
            author: info.videoDetails.author?.name || 'Unknown Author',
          },
          formats: getYouTubeFormats(info.formats)
        });
      } catch (error) {
        console.error('YouTube processing error:', error);
        // Return fallback response
        return res.json({
          platform,
          videoInfo: {
            title: 'YouTube Video (Error retrieving details)',
            thumbnail: 'https://via.placeholder.com/640x360/4a6cf7/ffffff?text=YouTube+Video',
            duration: '0:00',
            author: 'Unknown',
          },
          formats: getDefaultFormats()
        });
      }
    } else if (url.includes('tiktok.com')) {
      platform = 'tiktok';
      
      try {
        const videoInfo = await getTikTokVideoInfo(url);
        return res.json({
          platform,
          videoInfo: {
            title: videoInfo.title,
            thumbnail: videoInfo.thumbnail,
            duration: videoInfo.duration,
            author: videoInfo.author,
          },
          formats: videoInfo.formats
        });
      } catch (error) {
        console.error('TikTok processing error:', error);
        return res.status(500).json({ error: 'Failed to fetch TikTok video information' });
      }
    } else if (url.includes('facebook.com') || url.includes('fb.watch')) {
      platform = 'facebook';
      
      try {
        const videoInfo = await getFacebookVideoInfo(url);
        return res.json({
          platform,
          videoInfo: {
            title: videoInfo.title,
            thumbnail: videoInfo.thumbnail,
            duration: videoInfo.duration,
            author: videoInfo.author,
          },
          formats: videoInfo.formats
        });
      } catch (error) {
        console.error('Facebook processing error:', error);
        return res.status(500).json({ error: 'Failed to fetch Facebook video information' });
      }
    } else {
      return res.status(400).json({ error: 'Unsupported platform' });
    }
  } catch (error) {
    console.error('Error fetching video info:', error.message);
    console.error('Stack trace:', error.stack);
    return res.status(500).json({
      error: 'Failed to fetch video information',
      details: error.message
    });
  }
});

// Update the YouTube download endpoint
app.get('/api/download/youtube', async (req, res) => {
  const { url, format, quality } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    const videoId = ytdl.getVideoID(url);
    const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const info = await ytdl.getBasicInfo(cleanUrl);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '') || videoId;
    
    // Set headers for proper download
    res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${title}.${format}"`);
    
    const stream = ytdl(cleanUrl, {
      format: format === 'mp3' ? 'audioonly' : 'videoandaudio',
      quality: format === 'mp3' ? 'highestaudio' : quality,
      filter: format === 'mp3' ? 'audioonly' : 'audioandvideo',
    });
    
    // Handle stream errors
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed' });
      }
    });
    
    // Pipe the stream to response
    stream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Failed to download video',
        details: error.message
      });
    }
  }
});

// Mock API endpoint for TikTok downloads (for demonstration purposes)
app.get('/api/download/tiktok', async (req, res) => {
  const { url, format, quality, watermark } = req.query;
  
  try {
    const videoInfo = await getTikTokVideoInfo(url);
    const selectedFormat = videoInfo.formats.find(f => 
      f.format === format && 
      (f.type === 'audio' || f.watermark === (watermark === 'true'))
    );

    if (!selectedFormat || !selectedFormat.url) {
      throw new Error('Selected format not available');
    }

    const fileName = `tiktok-${quality}${watermark === 'true' ? '-wm' : ''}.${format}`;
    res.header('Content-Disposition', `attachment; filename="${fileName}"`);
    
    if (format === 'mp3') {
      // Handle audio download
      const tempFile = path.join(tempDir, `${Date.now()}.mp4`);
      const writeStream = fs.createWriteStream(tempFile);
      
      const response = await fetch(selectedFormat.url);
      response.body.pipe(writeStream);
      
      writeStream.on('finish', () => {
        // Convert to MP3 using ffmpeg
        const outputFile = tempFile.replace('.mp4', '.mp3');
        exec(`ffmpeg -i ${tempFile} -vn -ab 128k -ar 44100 -y ${outputFile}`, (error) => {
          if (error) {
            console.error('FFmpeg error:', error);
            return res.status(500).send('Error converting to MP3');
          }
          
          res.download(outputFile, fileName, () => {
            // Cleanup temp files
            fs.unlink(tempFile, () => {});
            fs.unlink(outputFile, () => {});
          });
        });
      });
    } else {
      // Handle video download
      const response = await fetch(selectedFormat.url);
      response.body.pipe(res);
    }
  } catch (error) {
    console.error('TikTok download error:', error);
    res.status(500).json({ error: 'Failed to download TikTok video' });
  }
});

// Mock API endpoint for Facebook downloads (for demonstration purposes)
app.get('/api/download/facebook', async (req, res) => {
  const { url, format, quality } = req.query;
  
  try {
    const videoInfo = await getFacebookVideoInfo(url);
    const selectedFormat = videoInfo.formats.find(f => 
      f.format === format && f.quality === quality
    );

    if (!selectedFormat || !selectedFormat.url) {
      throw new Error('Selected format not available');
    }

    const fileName = `facebook-${quality}.${format}`;
    res.header('Content-Disposition', `attachment; filename="${fileName}"`);
    
    if (format === 'mp3') {
      // Handle audio download similar to TikTok
      const tempFile = path.join(tempDir, `${Date.now()}.mp4`);
      const writeStream = fs.createWriteStream(tempFile);
      
      const response = await fetch(selectedFormat.url);
      response.body.pipe(writeStream);
      
      writeStream.on('finish', () => {
        const outputFile = tempFile.replace('.mp4', '.mp3');
        exec(`ffmpeg -i ${tempFile} -vn -ab 128k -ar 44100 -y ${outputFile}`, (error) => {
          if (error) {
            console.error('FFmpeg error:', error);
            return res.status(500).send('Error converting to MP3');
          }
          
          res.download(outputFile, fileName, () => {
            fs.unlink(tempFile, () => {});
            fs.unlink(outputFile, () => {});
          });
        });
      });
    } else {
      // Handle video download
      const response = await fetch(selectedFormat.url);
      response.body.pipe(res);
    }
  } catch (error) {
    console.error('Facebook download error:', error);
    res.status(500).json({ error: 'Failed to download Facebook video' });
  }
});

// Helper function to format duration
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
}

// Helper function to get YouTube formats
function getYouTubeFormats(formats) {
  try {
    if (!formats || !Array.isArray(formats)) {
      console.error('Invalid formats provided to getYouTubeFormats:', formats);
      return getDefaultFormats();
    }
    
    const result = [];
    
    // Get video formats with audio
    const videoFormats = ytdl.filterFormats(formats, format => format.hasVideo && format.hasAudio);
    
    // 720p
    const format720 = videoFormats.find(format => format.qualityLabel === '720p');
    if (format720) {
      result.push({
        id: 'yt-mp4-720',
        format: 'mp4',
        quality: '720p',
        type: 'video',
        size: formatBytes(format720.contentLength)
      });
    }
    
    // 480p
    const format480 = videoFormats.find(format => format.qualityLabel === '480p');
    if (format480) {
      result.push({
        id: 'yt-mp4-480',
        format: 'mp4',
        quality: '480p',
        type: 'video',
        size: formatBytes(format480.contentLength)
      });
    }
    
    // 360p
    const format360 = videoFormats.find(format => format.qualityLabel === '360p');
    if (format360) {
      result.push({
        id: 'yt-mp4-360',
        format: 'mp4',
        quality: '360p',
        type: 'video',
        size: formatBytes(format360.contentLength)
      });
    }
    
    // If no video formats were found, add a default one
    if (result.length === 0) {
      result.push({
        id: 'yt-mp4-360',
        format: 'mp4',
        quality: '360p',
        type: 'video',
        size: 'Unknown'
      });
    }
    
    // Audio formats
    const audioFormats = ytdl.filterFormats(formats, 'audioonly');
    
    if (audioFormats && audioFormats.length > 0) {
      // High quality audio
      const highAudio = audioFormats.reduce((prev, curr) => 
        (prev.audioBitrate || 0) > (curr.audioBitrate || 0) ? prev : curr
      );
      
      if (highAudio) {
        result.push({
          id: 'yt-mp3-high',
          format: 'mp3',
          quality: 'High',
          type: 'audio',
          size: formatBytes(highAudio.contentLength)
        });
      }
      
      // Medium quality audio
      if (highAudio && highAudio.audioBitrate) {
        const mediumAudio = audioFormats.find(format => 
          (format.audioBitrate || 0) < (highAudio.audioBitrate || 0) && (format.audioBitrate || 0) >= 128
        );
        
        if (mediumAudio) {
          result.push({
            id: 'yt-mp3-medium',
            format: 'mp3',
            quality: 'Medium',
            type: 'audio',
            size: formatBytes(mediumAudio.contentLength)
          });
        }
      }
    } else {
      // Add a default audio option if none were found
      result.push({
        id: 'yt-mp3-high',
        format: 'mp3',
        quality: 'High',
        type: 'audio',
        size: 'Unknown'
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error in getYouTubeFormats:', error);
    return getDefaultFormats();
  }
}

// Helper function to get default formats when there's an error
function getDefaultFormats() {
  return [
    { id: 'yt-mp4-720', format: 'mp4', quality: '720p', type: 'video', size: 'Unknown' },
    { id: 'yt-mp4-480', format: 'mp4', quality: '480p', type: 'video', size: 'Unknown' },
    { id: 'yt-mp3-high', format: 'mp3', quality: 'High', type: 'audio', size: 'Unknown' }
  ];
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (!bytes) return 'Unknown';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Byte';
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

// Serve React app
app.get('*', (req, res, next) => {
  const indexPath = path.join(buildPath, 'index.html');
  res.sendFile(indexPath, err => {
    if (err) {
      console.error('Error serving index.html:', err);
      res.status(500).send('Error loading application');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});