import React from 'react';          
import { useNavigate } from 'react-router-dom';
import image from "../../Assets/bg4.png";  
import bg6 from "../../Assets/anuthilogo.png";

import './AboutUs.css';

function PaymentTermsPage() {
  const navigate = useNavigate();
 
 const termsSections = [
  {
    id: 'about-us',
    title: 'About Us',
    content:' Anuthi Software Solutions is a Software development and services company. Anuthi Softwares is a dynamic company that specializes in providing top-notch services to its clients. The company has been in operation for over 9 years and has a proven track record of excellence in service delivery. Our team of experts is dedicated to ensuring that our clients get the best possible experience when working with us.',
    image:'/images/user-responsibilities.svg'
  },
   {
    id: 'services',
    title: 'Services',
    content: [
      'Software Development',
      'AI Solutions',
      'Website Designing',
      'Application Development',
      'Custom Software Solutions',
      'E-Commerce Solutions',
      'Web Portals',
      'Mobile Applications',
      'Any Web / Windows Applications',
    ],
    image: '/images/user-responsibilities.svg',
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
  {termsSections.map((section) => (
    <section key={section.id} className="term-section">
      <div className="section-content">
        <h2>{section.title}</h2>

        {/* If content is array → show list */}
        {Array.isArray(section.content) ? (
          <ul>
            {section.content.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="content-text">{section.content}</p>
        )}
      </div>
    </section>
  ))}
</main>

    </div>
  );
}
 
export default PaymentTermsPage;