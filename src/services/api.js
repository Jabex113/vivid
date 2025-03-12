const API_BASE_URL = process.env.REACT_APP_API_URL || window.location.origin;

export const getVideoInfo = async (url) => {
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
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw new Error(error.message || 'Failed to fetch video information');
  }
};

export const downloadVideo = async (platform, url, format, quality, watermark = null) => {
  try {
    const params = new URLSearchParams({
      url,
      format,
      quality,
      ...(watermark !== null && { watermark: watermark.toString() }),
    });

    const downloadUrl = `${API_BASE_URL}/api/download/${platform}?${params}`;
    
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error('Download failed');
    
    const blob = await response.blob();
    const fileUrl = window.URL.createObjectURL(blob);
    
    // Create temporary download link
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${platform}-${format}-${quality}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(fileUrl);
  } catch (error) {
    console.error('Download error:', error);
    throw new Error('Failed to download video');
  }
};