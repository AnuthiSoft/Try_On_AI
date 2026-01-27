// import React, { useState } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { AuthProvider } from './contexts/AuthContext';
// import ProtectedRoute from './Components/ProtectedRoute';
// import Login from './Pages/Login';
// import Landing from "./Pages/Landing";
// import Signup from './Pages/SignUp';
// import Sidebar from "./Components/Sidebar/Sidebar";
// import Content from "./Components/Content/Content";
// import Header from "./Components/Header/Header";
// import GenerateImage from "./Components/GenerateImage/GenerateImage";
// import Models from "./Components/Models/Models";
// import Popup from "./Components/Popup/Pop-Up";
// import ManageUsers from "./Components/ManageUsers/ManageUser";
// import "./App.css";
 
// function App() {
//   const [showPopup, setShowPopup] = useState(false);
//   const [selectedCategory, setSelectedCategory] = useState("all");
 
//   const handleCategoryChange = (category) => {
//     setSelectedCategory(category.toLowerCase());
//   };
 
//   return (
//     <Router>
//       <AuthProvider>
//         <div className="app-container">
//           {showPopup && <Popup onClose={() => setShowPopup(false)} />}
//           <Routes>
//             <Route path="/" element={<Landing />} />
           
//             {/* Login Page */}
//             <Route path="/login" element={<Login />} />
           
//             {/* Signup Page */}
//             <Route path="/signup" element={<Signup />} />
           
//             {/* Home Page */}
//             <Route path="/home" element={
//               <ProtectedRoute>
//                 <div className="layout-container">
//                   <Sidebar />
//                   <div className="right-section">
//                     <Header onCategoryChange={handleCategoryChange} />
//                     <Content
//                       showPopup={() => setShowPopup(true)}
//                       selectedCategory={selectedCategory}
//                     />
//                   </div>
//                 </div>
//               </ProtectedRoute>
//             } />
           
//             {/* Models Page */}
//             <Route path="/models" element={
//               <ProtectedRoute>
//                 <div className="layout-container">
//                   <Sidebar />
//                   <div className="right-section">
//                     <Models />
//                   </div>
//                 </div>
//               </ProtectedRoute>
//             } />
           
//             {/* Generate Image Page */}
//             <Route path="/generate-image" element={
//               <ProtectedRoute>
//                 <div className="layout-container">
//                   <Sidebar />
//                   <div className="right-section">
//                     <GenerateImage />
//                   </div>
//                 </div>
//               </ProtectedRoute>
//             } />
           
//             {/* Manage Users Page - WITH ProtectedRoute */}
//             <Route path="/manage-users" element={
//               <ProtectedRoute>
//                 <div className="layout-container">
//                   <Sidebar />
//                   <div className="right-section">
//                     <ManageUsers />
//                   </div>
//                 </div>
//               </ProtectedRoute>
//             } />
           
//             {/* Catch all - redirect to home if authenticated, else to login */}
//             <Route path="*" element={
//               <ProtectedRoute>
//                 <div className="layout-container">
//                   <Sidebar />
//                   <div className="right-section">
//                     <Header onCategoryChange={handleCategoryChange} />
//                     <Content
//                       showPopup={() => setShowPopup(true)}
//                       selectedCategory={selectedCategory}
//                     />
//                   </div>
//                 </div>
//               </ProtectedRoute>
//             } />
//           </Routes>
//         </div>
//       </AuthProvider>
//     </Router>
//   );
// }
 
// export default App;
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './Components/ProtectedRoute';
import Login from './Pages/Login';
import Landing from "./Pages/Landing";
import Signup from './Pages/SignUp';
import AccountTypeInfo from './Pages/AccountTypeInfo'; // Add this import
import Sidebar from "./Components/Sidebar/Sidebar";
import Content from "./Components/Content/Content";
import Header from "./Components/Header/Header";
import GenerateImage from "./Components/GenerateImage/GenerateImage";
import Models from "./Components/Models/Models";
import Popup from "./Components/Popup/Pop-Up";
import ManageUsers from "./Components/ManageUsers/ManageUser";
import Wallet from "./Components/Wallet/Wallet";
import Configuration from "./Components/ImagePricingAdmin/ImagePricingAdmin";
import PaymentTermsStatic from "./Components/PaymentTerms/PaymentTerms"; // Import the static terms component
import ImageResize from "./Components/ImageResize/ImageResize";

import "./App.css";

function App() {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const handleCategoryChange = (category) => {
    setSelectedCategory(category.toLowerCase());
  };

  return (
    <Router>
      <AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="colored"
        />
        <div className="app-container">
          {showPopup && <Popup onClose={() => setShowPopup(false)} />}
          <Routes>
            <Route path="/" element={<Landing />} />
            
            {/* Login Page */}
            <Route path="/login" element={<Login />} />
            
            {/* Signup Page */}
            <Route path="/signup" element={<Signup />} />
            
            {/* Account Type Info Page - PUBLIC route */}
            <Route path="/account-type-info" element={<AccountTypeInfo />} />
            
            {/* Home Page */}
            <Route path="/home" element={
              <ProtectedRoute>
                <div className="layout-container">
                  <Sidebar />
                  <div className="right-section">
                    <Header onCategoryChange={handleCategoryChange} />
                    <Content
                      showPopup={() => setShowPopup(true)}
                      selectedCategory={selectedCategory}
                    />
                  </div>
                </div>
              </ProtectedRoute>
            } />
           
            {/* Models Page */}
            <Route path="/models" element={
              <ProtectedRoute>
                <div className="layout-container">
                  <Sidebar />
                  <div className="right-section">
                    <Models />
                  </div>
                </div>
              </ProtectedRoute>
            } />
           
            {/* Generate Image Page */}
            <Route path="/generate-image" element={
              <ProtectedRoute>
                <div className="layout-container">
                  <Sidebar />
                  <div className="right-section">
                    <GenerateImage />
                  </div>
                </div>
              </ProtectedRoute>
            } />
           
            {/* Manage Users Page - WITH ProtectedRoute */}
            <Route path="/manage-users" element={
              <ProtectedRoute>
                <div className="layout-container">
                  <Sidebar />
                  <div className="right-section">
                    <ManageUsers />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            {/* Wallet Page */}
            <Route path="/wallet" element={
              <ProtectedRoute>
                <div className="layout-container">
                  <Sidebar />
                  <div className="right-section">
                    <Wallet />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            {/* Image Resize Page ✅ */}
            <Route path="/image-resize" element={
              <ProtectedRoute>
                <div className="layout-container">
                  <Sidebar />
                  <div className="right-section">
                    <ImageResize />
                  </div>
                </div>
              </ProtectedRoute>
            } />
            {/* Configuration Page */}
            <Route path="/configuration" element={
              <ProtectedRoute>
                <div className="layout-container">
                  <Sidebar />
                  <div className="right-section">
                    <Configuration />
                  </div>
                </div>
              </ProtectedRoute>
            } />
             <Route path="/payment-terms" element={<PaymentTermsStatic />} />

           
            {/* Catch all - redirect to home if authenticated, else to login */}
            <Route path="*" element={
              <ProtectedRoute>
                <div className="layout-container">
                  <Sidebar />
                  <div className="right-section">
                    <Header onCategoryChange={handleCategoryChange} />
                    <Content
                      showPopup={() => setShowPopup(true)}
                      selectedCategory={selectedCategory}
                    />
                  </div>
                </div>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
    
  );
}
export default App;