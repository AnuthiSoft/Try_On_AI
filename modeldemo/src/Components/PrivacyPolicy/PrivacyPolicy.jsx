import React from 'react';
import { useNavigate } from 'react-router-dom';
import bg6 from "../../Assets/anuthilogo.png";


 
function PaymentTermsPage() {
  const navigate = useNavigate();
 
 const termsSections = [
  {
    id: 'who-we-are',
    title: 'Who We Are',
    content:
      'This Privacy Policy applies to services provided by Anuthi Software Solutions, India. Our platform enables users and fashion brands to upload images for AI-based Virtual Cloth Try-On and Model Image Generation, and to purchase usage credits through secure payment gateways such as Paytm.'
  },

  {
    id: 'information-collection',
    title: 'Information We Collect',
    content: [
      'Name and email address for account creation and communication.',
      'Mobile number for verification and support.',
      'Transaction details such as payment reference ID, amount, date, and status.',
      'User-uploaded images used for virtual try-on or AI image generation.',
      'We do not collect or store sensitive payment information such as debit/credit card numbers, CVV, UPI PINs, or net banking credentials.'
    ]
  },
  {
    id: 'automatic-data',
    title: 'Information Collected Automatically',
    content: [
      'Session identifiers and authentication tokens.',
      'Usage activity such as feature interactions and credit usage.'
    ]
  },
  {
    id: 'image-usage',
    title: 'User Image Uploads & AI Processing',
    content:
      'Images are uploaded voluntarily by users and are used solely to generate virtual try-on or model images requested by the user. Uploaded images are not used for advertising or resale. Images may be stored temporarily to allow preview, download, or management by the user. Users retain ownership of both uploaded images and generated outputs.'
  },
  {
    id: 'data-usage',
    title: 'How We Use Your Information',
    content: [
      'To create and manage user accounts.',
      'To process virtual try-on and AI image generation.',
      'To track wallet credits, usage, and billing.',
      'To provide customer support.',
      'To improve platform performance and reliability.'
    ]
  },
  {
    id: 'payments',
    title: 'Payments & Financial Data',
    content:
      'All payments on the Platform are processed through secure and authorized third-party payment gateways such as Paytm. The Platform does not store or process sensitive payment information including card details, CVV, PINs, or UPI credentials. All transactions are encrypted and handled in compliance with PCI-DSS standards and applicable RBI regulations.'
  },
  {
    id: 'wallet-usage',
    title: 'Wallet Balance Usage',
    content:
      'Wallet balance available on the Platform can be used exclusively for virtual try-on and image generation services. Wallet credits are consumed based on image quality, resolution, and service type. Wallet balance is non-transferable and cannot be used outside the Platform.'
  },
  {
    id: 'refunds',
    title: 'Refunds & Cancellations',
    content:
      'Refunds are processed in accordance with the Platform’s Refund Policy. Refund eligibility is determined after review. Approved refunds are credited to the original payment method or wallet as applicable. Processing timelines generally range from 3–5 business days and may vary depending on bank or payment gateway processing cycles.'
  },
  {
    id: 'data-security',
    title: 'Data Storage & Security',
    content:
      'User data is stored in secure, encrypted environments with restricted access. Industry-standard security practices such as HTTPS encryption, access control, and regular monitoring are implemented to protect user data. In the event of a data breach, affected users will be notified as required by law.'
  },
  {
    id: 'data-retention',
    title: 'Data Retention & Deletion',
    content:
      'User images, generated outputs, and account data are retained only as long as necessary. Users may delete uploaded images, generated content, or their entire account at any time. Certain transaction records may be retained for legal or financial compliance.'
  },
  {
    id: 'user-rights',
    title: 'User Rights',
    content: [
      'Right to access personal data.',
      'Right to correct inaccurate information.',
      'Right to delete uploaded images or account.'
      
    ]
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