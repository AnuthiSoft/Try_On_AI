import React from 'react';          
import { useNavigate } from 'react-router-dom';
import bg4 from "../../Assets/wallet.png";
import bg5 from "../../Assets/AddCredits.png";
import addCredits from "../../Assets/add.png";
import refund from "../../Assets/refund.png";
import debit from "../../Assets/debits.png";
import config from "../../Assets/configarion.png";
import bg6 from "../../Assets/anuthilogo.png";
import './PurchaseFlow.css';


function PaymentTermsPage() {
  const navigate = useNavigate();
 
  const termsSections = [
    {
  id: 'wallet-overview',
  title: 'Wallet Overview',
  content:
    'The Platform provides a digital wallet system that allows users to purchase and manage credits. Wallet credits are used to access services such as Virtual Try-On and AI Model Image Generation. The available wallet balance reflects the total credits currently usable on the Platform.',
    image: bg4
},
{
  id: 'wallet-credits',
  title: 'Wallet Credits & Usage',
  content: [
    'Credits are deducted automatically when a service is used.',
    'Credit deduction depends on users (Normal User or Enterprise User), service type, image quality, image size.',
    'Virtual Try-On generally consumes more credits than Model Image Generation due to higher AI processing requirements.',
    'Wallet credits have no cash value and are non-transferable.'
  ],
  image: config
},
{
  id: 'transaction-history',
  title: 'Transaction History',
  content:
    'The Wallet Dashboard displays a detailed transaction history including credit additions, credit usage, and refunds. Each transaction shows the service name, date and time, and the number of credits added or deducted, allowing users to track usage and expenses transparently.',
    image: bg4
},
{
  id: 'credit-debits',
  title: 'Credit Debits',
  content:
    'When a user generates images using Virtual Try-On or Model Image Generation, the corresponding number of credits is deducted from the wallet. These transactions are recorded as debits in the transaction history and cannot be reversed once processing has successfully started.',
    image: debit
},
{
  id: 'credit-additions',
  title: 'Credit Additions',
  content:
    'Credits may be added to the wallet through successful payments or approved refunds. Added credits are immediately reflected in the available wallet balance and can be used for Platform services.',
    image: addCredits


},
{
  id: 'refund-wallet',
  title: 'Refunds & Wallet Adjustments',
  content:[
    'In cases where a refund is approved', 
    'if user enter incorrect prompts:',
    'Prompts referencing real or identifiable individuals are not allowed',
    'the refunded amount may be credited back to the user’s wallet or original payment method, depending on the refund type and transaction status. Wallet refunds appear as credit additions in the transaction history.',
  ],
    image: refund
},
{
  id: 'wallet-limits',
  title: 'Wallet Limitations',
  content:
    'Wallet credits can only be used within the Platform for approved services. Credits cannot be transferred to other users, exchanged for cash, or used outside the Platform.'
},
{
  id: 'wallet-disputes',
  title: 'Wallet Disputes & Support',
  content:
    'If a user believes there is an error in credit deduction or refund processing, they may contact support with the relevant transaction details. All disputes are reviewed internally, and resolutions are provided based on usage logs and system records.'
}
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
                {Array.isArray(section.content) ? (
          <ul>
            {section.content.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="content-text">{section.content}</p>
        )}
        
              
              {/* Single image for each section */}
              {section.image && (
                <div className="section-image-container">
                   <img
                    src={section.image}
                    alt={section.title}
                    className={`section-image ${index === 4 ? 'add-credits' : ''}`}
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