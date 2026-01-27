// Pages/AccountTypeInfo.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AccountTypeInfo.css';

const AccountTypeInfo = () => {
  const navigate = useNavigate();

  const handleSelectAccount = (type) => {
    // Store selection
    localStorage.setItem('selectedAccountType', type);
    
    // Send message to opener if opened from popup
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ 
        type: 'accountTypeSelected', 
        accountType: type 
      }, '*');
      window.close();
    } else {
      // For static page: go back or to signup page
      navigate('/signup', { state: { accountType: type } });
    }
  };

  const handleClose = () => {
    // If opened in a new tab, close it
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // If it's the only page, redirect to home
      navigate('/');
    }
  };

  return (
    <div className="account-type-info-page">
      <div className="account-type-container">
        {/* Header */}
        <header className="account-type-header">
          <h1>
            <i className="fas fa-info-circle"></i>
            Account Types Comparison
          </h1>
          <p className="subtitle">Choose the account type that best fits your needs</p>
        </header>

        {/* Account Types Grid - Same content */}
        <div className="account-types-grid">
          {/* Standard Account */}
          <div className="account-type-card">
            <div className="type-header-section">
              <div className="account-type-icon standard">
                <i className="fas fa-user"></i>
              </div>
              <div>
                <h2 className="account-type-title">Standard Account</h2>
                <p className="account-type-subtitle">For individual users & personal use</p>
              </div>
            </div>
            
            <div className="account-type-features">
              <h3>What's included:</h3>
              <ul>
                <li><i className="fas fa-check"></i> Basic profile management</li>
                <li><i className="fas fa-check"></i> Access to public features</li>
                <li><i className="fas fa-check"></i> Personal dashboard</li>
                <li><i className="fas fa-check"></i> Email notifications</li>
                <li><i className="fas fa-check"></i> Community access</li>
                <li><i className="fas fa-check"></i> Basic analytics</li>
                <li><i className="fas fa-check"></i> Up to 3 projects</li>
                <li><i className="fas fa-check"></i> 5GB storage</li>
              </ul>
            </div>
            
            <div className="account-type-price">
              <span className="price">Free</span>
              <span className="period">/ forever</span>
            </div>
            
            <p className="best-for">Best for: Students, Hobbyists, Individuals</p>
            
            <div className="account-type-footer">
              <button 
                className="select-btn" 
                onClick={() => handleSelectAccount('standard')}
              >
                <i className="fas fa-user"></i> Select Standard
              </button>
            </div>
          </div>

          {/* Enterprise Account */}
          <div className="account-type-card featured">
            <div className="featured-badge">Recommended for Businesses</div>
            <div className="type-header-section">
              <div className="account-type-icon enterprise">
                <i className="fas fa-building"></i>
              </div>
              <div>
                <h2 className="account-type-title">Enterprise Account</h2>
                <p className="account-type-subtitle">For businesses & organizations</p>
              </div>
            </div>
            
            <div className="account-type-features">
              <h3>All Standard features plus:</h3>
              <ul>
                <li><i className="fas fa-check"></i> <strong>Team management</strong></li>
                <li><i className="fas fa-check"></i> <strong>Unlimited projects</strong></li>
                <li><i className="fas fa-check"></i> <strong>Advanced analytics</strong></li>
                <li><i className="fas fa-check"></i> <strong>Priority support</strong></li>
                <li><i className="fas fa-check"></i> <strong>Custom integrations</strong></li>
                <li><i className="fas fa-check"></i> <strong>API access</strong></li>
                <li><i className="fas fa-check"></i> <strong>Custom branding</strong></li>
                <li><i className="fas fa-check"></i> <strong>Unlimited storage</strong></li>
                <li><i className="fas fa-check"></i> <strong>SLA guarantee</strong></li>
                <li><i className="fas fa-check"></i> <strong>Dedicated account manager</strong></li>
              </ul>
            </div>
            
            <div className="account-type-price">
              <span className="price">Custom</span>
              <span className="period">/ contact sales</span>
            </div>
            
            <p className="best-for">Best for: Companies, Teams, Organizations</p>
            
            <div className="account-type-footer">
              <button 
                className="select-btn enterprise-btn" 
                onClick={() => handleSelectAccount('enterprise')}
              >
                <i className="fas fa-building"></i> Select Enterprise
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="comparison-section">
          <h2><i className="fas fa-table"></i> Detailed Comparison</h2>
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Standard</th>
                <th>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Users</td>
                <td>1 user</td>
                <td>Unlimited users</td>
              </tr>
              <tr>
                <td>Storage</td>
                <td>5 GB</td>
                <td>Unlimited</td>
              </tr>
              <tr>
                <td>Support</td>
                <td>Community</td>
                <td>24/7 Priority</td>
              </tr>
              <tr>
                <td>Customization</td>
                <td>Basic</td>
                <td>Full</td>
              </tr>
              <tr>
                <td>API Access</td>
                <td>Limited</td>
                <td>Full</td>
              </tr>
              <tr>
                <td>Security</td>
                <td>Standard</td>
                <td>Advanced</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <footer className="account-type-footer">
          <button 
            className="close-button"
            onClick={handleClose}
          >
            <i className="fas fa-arrow-left"></i> Back to Sign Up
          </button>
          <p className="contact-info">
            Need help choosing? <a href="mailto:sales@example.com">Contact our sales team</a> | 
            Call us: <a href="tel:+18001234567">1-800-123-4567</a>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AccountTypeInfo;