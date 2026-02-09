import React, { useState,useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Landing.css";
import logo from "../Assets/icon.png";
import bg1 from "../Assets/bg.png";
import bg2 from "../Assets/bg2.png";
import bg3 from "../Assets/bg3.png";
import bg4 from "../Assets/bg4.png";   // ✅ NEW IMAGE

 
function Landing() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 4; // Change this based on number of images
  const [showPages, setShowPages] = useState(false);
  const pagesRef = useRef(null);
 
  const pageItems = [
    { name: 'About Us', path: '/aboutUs' },
    { name: 'Contact', path: '/contactUs' },
    { name: 'Service descriptions', path: '/description' },
    { name: 'purchase flow', path: '/purchase-flow' },
    { name: 'Privacy Policy', path: '/privacy-policy' },
    { name: 'Terms And Conditions', path: '/payment-terms' },
    { name: 'Refund & Cancellation Policy', path: '/refund-cancellation' },

  ];
 const togglePages = () => {
    setShowPages(!showPages);
  };

  const handlePageClick = (path) => {
    navigate(path);
    setShowPages(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pagesRef.current && !pagesRef.current.contains(event.target)) {
        setShowPages(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  // Auto slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % totalSlides);
    }, 4000); // Change slide every 4 seconds
 
    return () => clearInterval(interval);
  }, []);
 
  const handleLogin = () => navigate("/login");
  const handleAboutUs = () => navigate("/about");
  const handleContactUs = () => navigate("/contact");
  const handleSignup = () => navigate("/signup");
  const handleGetStarted = () => navigate("/signup");
  const handleBookDemo = () => navigate("/demo");
  const handleLogoClick = () => navigate("/");
   const handleOpenTermsPage = () => {
    navigate("/payment-terms"); // Navigates to static page
  };
  const handleRefundCancellation = () => navigate("/refund-cancellation");

  return (
    <div className="landing-page">
      {/* Background with model image slideshow */}
      <div className="landing-background">
        <div className="gradient-circle l-circle-1"></div>
        <div className="gradient-circle l-circle-2"></div>
        <div className="gradient-circle l-circle-3"></div>
        <div className="gradient-circle l-circle-4"></div>
        <div className="gradient-circle l-circle-5"></div>
        <div className="gradient-circle l-circle-6"></div>
       
        {/* Background Slideshow */}
              <div className="model-background">
  <div
    key={currentSlide}
    className="bg-image animated"
    style={{
      backgroundImage:
        currentSlide === 0
          ? `url(${bg1})`
          : currentSlide === 1
          ? `url(${bg2})`
          : currentSlide === 2
          ? `url(${bg3})`
          : currentSlide === 3
          ? `url(${bg4})`
          : `url(${bg})`  
    }}
  />
</div>


        {/* Slideshow Indicator */}
        <div className="slideshow-indicator">
          {[...Array(totalSlides)].map((_, index) => (
            <div
              key={index}
              className={`slideshow-dot ${index === currentSlide ? 'active' : ''}`}
            />
          ))}
        </div>
      </div>
 
      {/* Header */}
      <header className="landing-header">
        <div className="header-logo" onClick={handleLogoClick}>
          <div className="logo-icon">
            <img src={logo} alt="Anuthi AI Logo" className="logo-image" />
          </div>
          <div className="logo-text">Anuthi AI</div>
        </div>
        
        <div className="header-action">
          <div className="pages-dropdown-container" ref={pagesRef}>
      <button 
        className="header-btn login-btn" 
        onClick={togglePages}
        style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
      >
        Company
        <span style={{ fontSize: '10px' }}>
          {showPages ? '▲' : '▼'}
        </span>
      </button>

      {showPages && (
        <div className="pages-dropdown">
          <div className="pages-list">
            {pageItems.map((item, index) => (
              <div 
                key={index}
                className="page-item"
                onClick={() => handlePageClick(item.path)}
              >
                {item.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
          <button className="header-btn login-btn" onClick={handleLogin}>
            Login
          </button>
          <button className="header-btn signup-btn" onClick={handleSignup}>
            Sign Up
          </button>
        </div>
      </header>
 
      {/* Main Content */}
      <main className="landing-main">
        <div className="hero-container">
          {/* Left Column - Text Content */}
          <div className="hero-content">
            <h1 className="hero-title">
              Generate AI Fashion Models  for your brand in seconds
            </h1>
           
            <p className="hero-subtitle">
              From flatlay to lifestyle-ready in minutes.
            </p>
 
            {/* Separator line */}
            <div className="hero-separator"></div>
 
            {/* CTA Buttons */}
            <div className="hero-buttons">
              <button className="cta-btn primary-cta" onClick={handleGetStarted}>
                Get Started Free
              </button>
              {/* <button className="cta-btn terms-cta" onClick={handleOpenTermsPage}>
                 View Payment Terms
              </button> */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
 
export default Landing;