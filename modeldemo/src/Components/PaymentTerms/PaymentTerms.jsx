import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentTerms.css';
 
function PaymentTermsPage() {
  const navigate = useNavigate();
 
  const termsSections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      content: 'By proceeding with a payment, the User confirms that they have read, understood, and agreed to these Terms. If the User does not agree, they must not proceed with the transaction.'
    },
    {
      id: 'payment-services',
      title: 'Payment Services',
      content: 'Payments are processed through secure third-party payment gateways. Available payment methods may include: Credit Cards / Debit Cards, UPI, Net Banking, Wallets, and other payment methods as supported. Payment method availability may vary based on location, bank, or service provider.'
    },
    {
      id: 'user-responsibilities',
      title: 'User Responsibilities',
      content: 'The User agrees that they are authorized to use the selected payment method, all payment information provided is accurate and complete, the transaction does not violate applicable laws, and the Platform will not be used for fraudulent or unauthorized activities.'
    },
    {
      id: 'payment-authorization',
      title: 'Payment Authorization',
      content: 'By initiating a transaction, the User authorizes the payment gateway to debit the specified amount. Transactions are subject to authentication and approval by the User\'s bank or payment provider.'
    },
    {
      id: 'fees-charges',
      title: 'Fees & Charges',
      content: 'The Platform does not charge additional fees unless explicitly stated. Banks or payment service providers may apply processing fees, convenience fees, or taxes, which are borne by the User.'
    },
    {
      id: 'refunds',
      title: 'Refunds & Cancellations',
      content: 'Refunds are governed by the Platform\'s Refund Policy. Approved refunds will be credited to the original payment method. Refund processing time may vary and typically takes 5–10 business days or more depending on banks or payment providers.'
    },
    {
      id: 'data-security',
      title: 'Data Security',
      content: 'Payments are processed using industry-standard security measures through third-party payment gateways. The Platform does not store sensitive payment information such as card numbers, CVV, PINs, or UPI credentials.'
    },
    {
      id: 'contact',
      title: 'Contact & Support',
      content: 'For payment-related queries or support, please contact: Email: naveen.kumar@anuthisoft.com, Phone: 08192 315134'
    }
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
          <h1>Terms & Conditions</h1>
          {/* <p className="last-updated">Last Updated: {new Date().toLocaleDateString()}</p> */}
        </div>
        <div className="header-right">
          <button className="back-home-btn" onClick={handleBackToHome}>
            ← Back to Home
          </button>
        </div>
      </header>
      <div className="payment-section">
        <h3>Payment</h3>
      </div>
      {/* All Terms Sections */}
      <main className="all-terms-content">
        {termsSections.map((section, index) => (
          <section key={section.id} className="term-section">
            <div className="section-number">
              <span>{index + 1}</span>
            </div>
            <div className="section-content">
              <h2>{section.title}</h2>
              <p>{section.content}</p>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
 
export default PaymentTermsPage;