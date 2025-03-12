import React from 'react';
import './Footer.css';
import { FaGithub, FaTwitter, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Video Downloader</h3>
            <p>Download videos from YouTube, TikTok, and Facebook easily without any third-party applications.</p>
          </div>
          
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h3>Connect With Us</h3>
            <div className="social-icons">
              <a href="https://github.com" className="social-icon"><FaGithub /></a>
              <a href="https://twitter.com" className="social-icon"><FaTwitter /></a>
              <a href="https://instagram.com" className="social-icon"><FaInstagram /></a>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {year} Video Downloader. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;