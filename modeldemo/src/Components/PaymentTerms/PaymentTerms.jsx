import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PaymentTerms.css';
 
function PaymentTermsPage() {
  const navigate = useNavigate();
 
 const termsSections = [
  {
    id: 'acceptance',
    title: 'Acceptance of Terms',
    content:'By proceeding with a payment on Anuthi Software Solutions, the User confirms that they have read, understood, and agreed to these Terms & Conditions. If the User does not agree, they must not proceed with the transaction.'
  },
  {
    id: 'payment-services',
    title: 'Payment Services',
      content: 'Payments are processed through secure third-party payment gateways. Available payment methods may include: Credit Cards / Debit Cards, UPI, Net Banking, Wallets, and other payment methods as supported. Payment method availability may vary based on location, bank, or service provider.'
  },
  {
     id: 'privacy-policy', 
     title: 'Privacy Policy', 
     content: 'Payments on the Platform are processed through authorized and secure third-party payment gateways. The Platform does not store or process sensitive payment information such as card details, CVV, PINs, or bank credentials. All transactions are encrypted and handled in compliance with applicable RBI regulations and PCI-DSS security standards.' },
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
    content:'Refunds are processed in accordance with the Platform’s Refund Policy. Refund eligibility is determined by the Platform after review of the request. Approved refunds are credited to the original payment method used during the transaction. Refund processing timelines typically range from 3–5 business days, subject to bank or payment gateway processing cycles.'
  },
  {
    id: 'wallet-balance',
    title: 'Wallet Balance Usage',
    content:'The wallet balance available on the Platform can be used exclusively for image generation and virtual try-on services offered on the Platform. Wallet balance is utilized through the purchase and consumption of tokens or credits based on service usage. Wallet balance cannot be used for any purpose outside the Platform and is non-transferable.'
  },
  {
    id: 'wallet-withdrawal',
    title: 'Wallet Withdrawal',
    content:[ 
    'Wallet credits added to the Platform are intended exclusively for use toward Platform services such as Virtual Try-On and AI Image Generation.',
    'Wallet credits are usage tokens and do not have cash value.',
    'Direct or instant withdrawal of wallet credits by the User is not supported.Users may sometimes request withdrawal in situations such as account deletion however, the Platform does not support wallet withdrawals under any circumstances.',
    'In such cases, users may contact Anuthi Software Solutions via email for clarification or refund review, where applicable, in accordance with the Platform’s Refund Policy. Approved refunds, if any, may be credited back to the User’s wallet as credits or to the original payment method depending on the transaction status and payment gateway rules. ',
    'Wallet-based refunds will appear as credit additions in the transaction history.',
    'Refund processing timelines may vary and typically take 3–5 business days or longer depending on bank or payment gateway processing cycles.'
    ],
  },
  {
    id: 'data-security',
    title: 'Data Security',
    content:'Payments are processed using industry-standard security measures through third-party payment gateways. The Platform does not store sensitive payment information such as card numbers, CVV, PINs, or UPI credentials.'
  },
  {
    id: 'contact',
    title: 'Contact & Support',
    content:'For payment-related queries or support, please contact: Business Name: Anuthi Software Solutions Pvt Ltd, Email: naveen.kumar@anuthisoft.com, Phone: 08192 315134'
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
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
 
export default PaymentTermsPage;