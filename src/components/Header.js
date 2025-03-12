import React from 'react';
import './Header.css';
import { FaDownload } from 'react-icons/fa';

const Header = () => {
  return (
    <header className="header">
      <div className="container header-container">
        <div className="logo">
          <FaDownload className="logo-icon" />
          <h1>Video Downloader</h1>
        </div>
        <nav className="nav">
          <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#how-it-works">How It Works</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;