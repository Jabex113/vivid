# Video Downloader

A React-based web application that allows users to download videos from YouTube, TikTok, and Facebook in various formats (MP3, MP4) without using third-party APIs.

## Features

- Paste video links from YouTube, TikTok, or Facebook
- Automatic platform detection
- Download videos in MP4 format with different quality options
- Extract audio in MP3 format
- For TikTok videos, download with or without watermark
- Clean, responsive UI

## Tech Stack

- **Frontend**: React.js, CSS3, Axios
- **Backend**: Node.js, Express
- **Video Processing**: ytdl-core (for YouTube)

## Installation and Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Frontend Setup

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm start
   ```
5. The app will be available at `http://localhost:3000`

### Backend Setup

1. Navigate to the server directory:
   ```
   cd server
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Start the server:
   ```
   npm start
   ```
4. The server will run on `http://localhost:5001`

## How It Works

1. The user pastes a video URL from YouTube, TikTok, or Facebook
2. The application detects the platform based on the URL
3. The backend fetches information about the video
4. The user selects their preferred format and quality
5. The backend processes the download request and serves the file to the user

## Implementation Details

### YouTube Downloads

For YouTube videos, we use the `ytdl-core` library to extract video information and download streams. This allows us to offer various quality options and formats without relying on third-party services.

### TikTok and Facebook Downloads

For TikTok and Facebook videos, we implement custom solutions to extract video URLs and download the content. This involves analyzing the page structure and finding the direct media links.

## Deployment

To build the application for production:

1. Build the React frontend:
   ```
   npm run build
   ```
2. The build files will be generated in the `build` directory
3. Configure your server to serve these static files and the backend API

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Disclaimer

This application is for educational purposes only. Users should respect copyright laws and the terms of service of the platforms they download content from. Only download videos that you have the right to download.