import React from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import VideoDownloader from './components/VideoDownloader';

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <div className="container">
          <VideoDownloader />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default App;