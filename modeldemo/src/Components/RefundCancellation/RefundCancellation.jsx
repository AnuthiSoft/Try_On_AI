import React from 'react';
import { useNavigate } from 'react-router-dom';
import bg6 from "../../Assets/anuthilogo.png";

function RefundCancellation() {
  const navigate = useNavigate();

  const refundSections = [
    {
      id: 'overview',
      title: 'Refund & Cancellation Overview',
      content:
        'This Refund and Cancellation Policy governs wallet top-ups, credit usage, and service-related refunds on the Anuthi Software Solutions platform. By using the Platform and making payments, users agree to the terms outlined below.'
    },
    {
      id: 'wallet-topups',
      title: 'Wallet Top-Ups',
      content: [
        'Wallet credits are purchased through secure third-party payment gateways such as Paytm.',
        'Once a wallet top-up is successfully completed and credits are added, the transaction is considered final.',
        'Wallet credits represent usage tokens and do not constitute real currency.'
      ]
    },
    {
      id: 'service-usage',
      title: 'Service Usage & Credit Deduction',
      content: [
        'Credits are deducted automatically when a user initiates Virtual Try-On or AI Model Image Generation.',
        'Credit deduction depends on service type, image quality, resolution, and selected plan.',
        'Once AI processing has started successfully, used credits cannot be reversed.'
      ]
    },
    {
      id: 'refund-eligibility',
      title: 'Refund Eligibility',
      content: [
        'Refunds may be considered only in cases of failed transactions, duplicate payments, or confirmed technical errors.',
        'Refunds are not applicable for successfully processed services or partially used credits.',
        'Refund eligibility is determined solely by Anuthi Software Solutions after internal review.'
      ]
    },
    {
      id: 'refund-processing',
      title: 'Refund Processing',
      content:
        'Approved refunds may be credited back to the user’s wallet or original payment method, depending on the transaction type and payment gateway rules. Refund processing timelines typically range from 3 to 5 business days but may vary based on bank or payment gateway processing cycles.'
    },
    {
      id: 'contact',
      title: 'Contact Information',
      content:
        'For refund or cancellation-related queries, please contact: Anuthi Software Solutions Pvt Ltd, Email: naveen.kumar@anuthisoft.com, Phone: 08192 315134'
    }
  ];

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="payment-terms-container">
      {/* Header */}
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

      <div className="payment-section">
        <h3>Refund & Cancellation Policy</h3>
      </div>

      {/* Content */}
      <main className="all-terms-content">
        {refundSections.map((section, index) => (
          <section key={section.id} className="term-section">
            {/* <div className="section-number">
              <span>{index + 1}</span>
            </div> */}
            <div className="section-content">
              <h2>{section.title}</h2>

              {Array.isArray(section.content) ? (
                <ul>
                  {section.content.map((item, i) => (
                    <li key={i}>{item}</li>
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

export default RefundCancellation;
