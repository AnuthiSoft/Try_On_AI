import React, { useState } from 'react';
import './Header.css';

function Header({ onCategoryChange }) {
  const categories = ['All', 'Men', 'Women', 'Boys', 'Girls', 'Baby'];
  const [activeCategory, setActiveCategory] = useState('All');

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
    if (onCategoryChange) {
      onCategoryChange(category);
    }
  };

  return (
    <div className="header">
      <h1 className="header-title">All Products</h1>
      
      <div className="category-nav-container">
        <div className="category-nav">
          {categories.map((category) => (
            <button 
              key={category} 
              className={`category-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Header;