import React from 'react';          
import { useNavigate } from 'react-router-dom';
import image from "../../Assets/bg4.png";  
import bg6 from "../../Assets/anuthilogo.png";

 import './ContactUs.css';
function PaymentTermsPage() {
  const navigate = useNavigate();
 
 const termsSections = [
  {
    id: 'description',
    title: 'Product/Service descriptions',
    content:'By proceeding with a payment on Anuthi Software Solutions, the User confirms that they have read, understood, and agreed to these Terms & Conditions. If the User does not agree, they must not proceed with the transaction.',
    image:'/images/user-responsibilities.svg'
  },
  
];
 
  const handleBackToHome = () => {
    navigate('/');
  };
 
  const handlePrint = () => {
    window.print();
  };
 
  return (
    <div className="payment-terms-container">
      {/* Header with Back Button */}
       
       
      <header className="terms-header">
        <div className="header-left">
         
        </div>
        <div className="header-center">
                  <div className="logo-container">
                      <img src={bg6} alt="Anuthi AI Logo" className="logo-image" />
                  </div>
                  <h1>Anuthi Software Solutions Pvt Ltd</h1>
            </div>
        <div className="header-right">
          <button className="back-home-btn" onClick={handleBackToHome}>
            ← Back to Home
          </button>
        </div>
      </header>
    
      {/* All Terms Sections */}
            <main className="all-terms-content">
                {termsSections.map((section, index) => (
                    <section key={section.id} className="term-section">
                        <div className="contact-info-container">
                            <div className="section-content">
                                <h2>Contact Us</h2></div>
                            <div className="contact-item">
                                <span className="icon location-icon">📍</span>
                                <p>
                                    #4247/34, 16th Cross,<br />
                                    Tharalabalu Badavane,<br />
                                    Davangere-577005, Karnataka, India
                                </p>
                            </div>

                            <div className="contact-item">
                                <span className="icon email-icon">✉️</span>
                                <p>
                                    naveen.kumar@anuthisoft.com<br />
                                    hr.manager@anuthisoft.com
                                </p>
                            </div>

                            <div className="contact-item">
                                <span className="icon phone-icon">📞</span>
                                <p>
                                    +91 8192 402509<br />
                                    +91 98452 32574<br/>
                                         08192 315134
                                </p>
                            </div>

                            <div className="contact-item">
                                <span className="icon web-icon">🌐</span>
                                <p>
                                    <a href="http://www.anuthisoft.com" target="_blank" rel="noreferrer">
                                        www.anuthisoft.com
                                    </a>
                                </p>
                            </div>
                        </div>

                    </section>
                ))}
            </main>
        </div>
    );
}
 
export default PaymentTermsPage;