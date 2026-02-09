import React from 'react';          
import { useNavigate } from 'react-router-dom';
import bg4 from "../../Assets/standarduser.png";
import bg5 from "../../Assets/imagedescribe.png";
import bg3 from "../../Assets/gen_1.png";
import model from "../../Assets/modelgen.png";
import bg6 from "../../Assets/anuthilogo.png";

import './Description.css';

function PaymentTermsPage() {
  const navigate = useNavigate();
 
  const termsSections = [
    {
      id: 'description1',
      title: 'Product Description - Image Configuration',
      content: 'This screen allows users to select image quality and size, and clearly shows the price per image or model generation based on their selection.',
      image: bg4
    },
    {
      id: 'description2',
      title: 'Image-Generation',
      content: 'Users upload a dress image and a model image to create a virtual try-on image using AI.',
      image: bg5
    },
    {
      id: 'description3',
      title: 'Product Description -  Image Generation',
      content: 'Generated image.',
      image: bg3
    },
      {
      id: 'description4',
      title: 'Product Description - Model Generation',
      content: 'This screen allows users to generate AI fashion models based on a text description and then reuse those models for image generation or virtual try-on',
      image: model
    },
  ];
 
  const handleBackToHome = () => {
    navigate('/');
  };
 
  return (
    <div className="payment-terms-container">
      <header className="terms-header">
        <div className="header-left"></div>
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
      
      <main className="all-terms-content">
        {termsSections.map((section, index) => (
          <section key={section.id} className="term-section">
            <div className="section-content">
              <h2>{section.title}</h2>
              <p>{section.content}</p>
              
              {/* Single image for each section */}
              {section.image && (
                <div className="section-image-container">
                  <img
                    src={section.image}
                    alt={section.title}
                    className={`section-image ${index === 2 ? 'third-image' : ''}`}
                  />

                 
                </div>
              )}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
 
export default PaymentTermsPage;