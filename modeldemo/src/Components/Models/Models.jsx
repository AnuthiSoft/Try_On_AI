// import React, { useState, useEffect, useMemo } from 'react';
// import './Models.css';
// import api from "../../Services/api";

// function ModelsPage() {
//   const [selectedCategory, setSelectedCategory] = useState('Men');
//   const [showSuggestionPopup, setShowSuggestionPopup] = useState(false);
//   const [selectedPrompt, setSelectedPrompt] = useState(null);
//   const [promptText, setPromptText] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [generating, setGenerating] = useState(false);
//   const [userImages, setUserImages] = useState([]);
//   const [error, setError] = useState("");
  
//   // State for fullscreen modal - only stores the clicked image
//   const [fullscreenImage, setFullscreenImage] = useState(null);
//   // State for delete confirmation
//   const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
//   // State for tracking downloading
//   const [downloading, setDownloading] = useState({});

//   const categories = ['All', 'Men', 'Women', 'Boy', 'Girl', 'Baby'];

//   const [prompts, setPrompts] = useState([
//     { id: 1, category: "Men", text: "Full body photo of a confident adult man wearing a tailored navy blue suit, head-to-toe visible, studio lighting", checked: false },
//     { id: 2, category: "Men", text: "Full body casual male model wearing hoodie, jeans and sneakers, urban background", checked: false },
//     { id: 3, category: "Men", text: "Full body athletic man wearing gym wear, muscular build, neutral background", checked: false },
//     { id: 4, category: "Men", text: "Full body bearded man wearing traditional ethnic kurta and pajama, festive lighting", checked: false },
//     { id: 5, category: "Men", text: "Full body business professional wearing formal blazer and trousers, studio setup", checked: false },
//     { id: 6, category: "Men", text: "Full body male model wearing summer casual outfit, outdoor daylight", checked: false },
//     { id: 7, category: "Men", text: "Full body man wearing winter jacket, scarf and boots, editorial photography", checked: false },
//     { id: 8, category: "Men", text: "Full body fitness model wearing sleeveless vest and shorts, high contrast lighting", checked: false },
//     { id: 9, category: "Men", text: "Full body man wearing smart casual shirt and chinos, lifestyle photo", checked: false },
//     { id: 10, category: "Men", text: "Full body luxury male fashion model wearing designer coat, premium studio lighting", checked: false },
//     { id: 11, category: "Women", text: "Full body elegant woman wearing modern saree, complete drape visible", checked: false },
//     { id: 12, category: "Women", text: "Full body female model wearing western casual outfit with footwear", checked: false },
//     { id: 13, category: "Women", text: "Full body woman wearing office formal attire, confident standing pose", checked: false },
//     { id: 14, category: "Women", text: "Full body female model wearing traditional ethnic dress, festive lighting", checked: false },
//     { id: 15, category: "Women", text: "Full body woman wearing summer dress, garden background", checked: false },
//     { id: 16, category: "Women", text: "Full body fashion-forward woman wearing oversized jacket, editorial style", checked: false },
//     { id: 17, category: "Women", text: "Full body woman wearing evening gown, luxury fashion shoot", checked: false },
//     { id: 18, category: "Women", text: "Full body female model wearing workout attire, clean background", checked: false },
//     { id: 19, category: "Women", text: "Full body woman wearing winter coat and boots, lifestyle photography", checked: false },
//     { id: 20, category: "Women", text: "Full body high-fashion woman wearing designer outfit, runway pose", checked: false },
//     { id: 21, category: "Boy", text: "Full body young boy wearing casual t-shirt, jeans and shoes", checked: false },
//     { id: 22, category: "Boy", text: "Full body boy wearing school uniform with shoes", checked: false },
//     { id: 23, category: "Boy", text: "Full body child boy wearing traditional ethnic wear, festive mood", checked: false },
//     { id: 24, category: "Boy", text: "Full body boy wearing sports outfit, energetic stance", checked: false },
//     { id: 25, category: "Boy", text: "Full body boy wearing hoodie and sneakers, modern look", checked: false },
//     { id: 26, category: "Boy", text: "Full body boy wearing winter jacket, playful smile", checked: false },
//     { id: 27, category: "Boy", text: "Full body boy wearing summer clothes, bright colors", checked: false },
//     { id: 28, category: "Boy", text: "Full body boy wearing party outfit, catalog style", checked: false },
//     { id: 29, category: "Boy", text: "Full body cute boy posing confidently, minimal background", checked: false },
//     { id: 30, category: "Boy", text: "Full body boy wearing cartoon-themed clothing", checked: false },
//     { id: 31, category: "Girl", text: "Full body young girl wearing colorful dress and shoes", checked: false },
//     { id: 32, category: "Girl", text: "Full body girl wearing traditional ethnic outfit", checked: false },
//     { id: 33, category: "Girl", text: "Full body casual girl wearing jeans and top", checked: false },
//     { id: 34, category: "Girl", text: "Full body girl wearing school uniform", checked: false },
//     { id: 35, category: "Girl", text: "Full body girl wearing party dress, elegant pose", checked: false },
//     { id: 36, category: "Girl", text: "Full body girl wearing winter clothing", checked: false },
//     { id: 37, category: "Girl", text: "Full body girl wearing summer frock", checked: false },
//     { id: 38, category: "Girl", text: "Full body cute girl posing naturally", checked: false },
//     { id: 39, category: "Girl", text: "Full body girl wearing sporty outfit", checked: false },
//     { id: 40, category: "Girl", text: "Full body fashionable girl wearing modern kidswear", checked: false },
//     { id: 41, category: "Baby", text: "Full body baby wearing soft cotton clothes", checked: false },
//     { id: 42, category: "Baby", text: "Full body baby wearing pastel outfit, smiling", checked: false },
//     { id: 43, category: "Baby", text: "Full body infant wearing traditional baby dress", checked: false },
//     { id: 44, category: "Baby", text: "Full body baby wrapped in cozy blanket", checked: false },
//     { id: 45, category: "Baby", text: "Full body baby wearing themed costume", checked: false },
//     { id: 46, category: "Baby", text: "Full body sleeping baby wearing white outfit", checked: false },
//     { id: 47, category: "Baby", text: "Full body baby sitting with toys", checked: false },
//     { id: 48, category: "Baby", text: "Full body infant wearing winter baby wear", checked: false },
//     { id: 49, category: "Baby", text: "Full body baby portrait, neutral background", checked: false },
//     { id: 50, category: "Baby", text: "Full body professional baby photoshoot", checked: false }
//   ]);

//   const filteredPrompts = useMemo(() => {
//     if (!selectedCategory || selectedCategory === "All") {
//       return prompts;
//     }
//     return prompts.filter(p => p.category === selectedCategory);
//   }, [selectedCategory, prompts]);

//   const loadUserImages = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/auth/model-images/my");
//       setUserImages(Array.isArray(res.data) ? res.data : []);
//       setError("");
//     } catch {
//       setError("Failed to load generated images");
//       setUserImages([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadUserImages();
//   }, []);

//   const handleCheckboxChange = (promptId) => {
//     const updated = prompts.map(p => ({
//       ...p,
//       checked: p.id === promptId
//     }));
//     setPrompts(updated);

//     const selected = updated.find(p => p.checked);
//     setSelectedPrompt(selected?.text || null);
//     setPromptText(selected?.text || "");
//   };

//   const handleApplyPrompts = () => {
//     if (selectedPrompt) setShowSuggestionPopup(false);
//   };

//   const handleGenerate = async () => {
//     if (!promptText.trim()) {
//       alert("Please select a prompt from suggestions");
//       return;
//     }

//     setGenerating(true);
//     setError("");

//     const TEMP_ID = "__GENERATING__";

//     setUserImages(prev => [
//       { job_id: TEMP_ID, isGenerating: true },
//       ...prev.filter(img => img.job_id !== TEMP_ID)
//     ]);

//     try {
//       const res = await api.post("/auth/image/generate", {
//         prompt: promptText,
//         size: "1024x1024"
//       });

//       if (res.data?.image_base64) {
//         const newImage = {
//           job_id: res.data.job_id,
//           image_url: `data:image/png;base64,${res.data.image_base64}`,
//           created_at: new Date().toISOString()
//         };

//         setUserImages(prev =>
//           prev.map(img => img.job_id === TEMP_ID ? newImage : img)
//         );
//       }
//     } catch (err) {
//       setError(err.response?.data?.detail || "Image generation failed");
//       setUserImages(prev => prev.filter(img => img.job_id !== TEMP_ID));
//     } finally {
//       setGenerating(false);
//     }
//   };

//   const formatDate = (dateString) =>
//     new Date(dateString).toLocaleDateString('en-US', {
//       month: 'short',
//       day: 'numeric',
//       year: 'numeric'
//     });

//   // Function to open fullscreen image
//   const openFullscreenImage = (image) => {
//     setFullscreenImage(image);
//   };

//   // Function to close fullscreen image
//   const closeFullscreenImage = () => {
//     setFullscreenImage(null);
//   };

//   // Function to download image to PC
//   const handleDownload = async (image) => {
//     if (!image || !image.job_id || image.isGenerating) return;
    
//     try {
//       setDownloading(prev => ({ ...prev, [image.job_id]: true }));
//       setError("");
      
//       // Generate filename
//       const date = new Date(image.created_at || Date.now());
//       const timestamp = date.toISOString().split('T')[0];
//       const filename = `model-${image.job_id.slice(-8)}-${timestamp}.png`;
      
//       // Method 1: Try direct download from base64 (if available)
//       if (image.image_url && image.image_url.startsWith('data:')) {
//         const link = document.createElement('a');
//         link.href = image.image_url;
//         link.download = filename;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         return;
//       }
      
//       // Method 2: Use API download endpoint
//       try {
//         // First, let's test if the API endpoint exists
//         const response = await api.get(`/auth/model-images/${image.job_id}/download-file`, {
//           responseType: 'blob'
//         });
        
//         // Create blob URL for download
//         const blob = new Blob([response.data], { type: 'image/png' });
//         const blobUrl = window.URL.createObjectURL(blob);
        
//         const link = document.createElement('a');
//         link.href = blobUrl;
//         link.download = filename;
//         document.body.appendChild(link);
//         link.click();
        
//         // Cleanup
//         setTimeout(() => {
//           document.body.removeChild(link);
//           window.URL.revokeObjectURL(blobUrl);
//         }, 100);
        
//       } catch (apiError) {
//         console.error("API download failed:", apiError);
        
//         // Fallback: Open image in new tab for manual save
//         if (image.image_url) {
//           window.open(image.image_url, '_blank');
//         } else {
//           throw new Error("No image URL available");
//         }
//       }
      
//     } catch (err) {
//       console.error("Download error:", err);
//       setError("Failed to download image. Try right-clicking the image and selecting 'Save Image As...'");
//     } finally {
//       setDownloading(prev => ({ ...prev, [image.job_id]: false }));
//     }
//   };

//   // Function to delete image
//   const handleDelete = async (image) => {
//     if (!image || !image.job_id || image.isGenerating) return;
    
//     try {
//       await api.delete(`/auth/model-images/${image.job_id}`);
      
//       // Remove the image from local state
//       setUserImages(prev => prev.filter(img => img.job_id !== image.job_id));
      
//       // Close any open modals
//       setShowDeleteConfirm(null);
//       if (fullscreenImage?.job_id === image.job_id) {
//         closeFullscreenImage();
//       }
      
//       // Show success message
//       setError(""); // Clear any previous errors
//       // You could add a toast notification here: setSuccess("Image deleted successfully");
      
//     } catch (err) {
//       console.error("Delete failed:", err);
//       setError("Failed to delete image. Please try again.");
//     }
//   };

//   // Function to confirm deletion
//   const confirmDelete = (image) => {
//     setShowDeleteConfirm(image);
//   };

//   // Function to cancel deletion
//   const cancelDelete = () => {
//     setShowDeleteConfirm(null);
//   };

//   // Handle keyboard Escape to close modal
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       if (e.key === 'Escape') {
//         if (fullscreenImage) {
//           closeFullscreenImage();
//         }
//         if (showDeleteConfirm) {
//           cancelDelete();
//         }
//       }
//     };

//     window.addEventListener('keydown', handleKeyDown);
//     return () => window.removeEventListener('keydown', handleKeyDown);
//   }, [fullscreenImage, showDeleteConfirm]);

//   return (
//     <div className="models-container">
//       <div className="header">
//         <h1 className="header-title">Models</h1>
//       </div>

//       <div className="main-content">
//         {/* PROMPT INPUT */}
//         <div className="input-section">
//           <textarea
//             className="prompt-textarea"
//             value={promptText}
//             onChange={(e) => setPromptText(e.target.value)}
//             placeholder="Describe your model or select from suggestions..."
//           />
//           <div className="button-group">
//             <button className="ai-suggestion-btn" onClick={() => setShowSuggestionPopup(true)}>
//               AI Suggestions
//             </button>
//             <button className="generate-btn" onClick={handleGenerate} disabled={generating || loading}>
//               {generating ? "Generating..." : "Generate"}
//             </button>
//           </div>
//         </div>

//         {/* Error message */}
//         {error && (
//           <div className="error-message">
//             {error}
//           </div>
//         )}

//         {/* GENERATED IMAGES */}
//         <div className="generated_images">
//           <p className="generate">
//             Generated Models
//             {userImages.length > 0 && (
//               <span className="image-count">
//                 {userImages.filter(img => !img.isGenerating).length} {userImages.filter(img => !img.isGenerating).length === 1 ? 'Image' : 'Images'}
//               </span>
//             )}
//           </p>

//           <div className="images-grid">
//             {loading ? (
//               <div className="loading-state-card">
//                 <div className="loading-spinner"></div>
//                 <p className="loading-text">Loading images...</p>
//               </div>
//             ) : userImages.length > 0 ? (
//               userImages.map((img, index) => (
//                 <div 
//                   key={img.job_id || index} 
//                   className="image-card"
//                   onClick={() => !img.isGenerating && openFullscreenImage(img)}
//                   style={{ cursor: img.isGenerating ? 'default' : 'pointer' }}
//                 >
//                   {img.isGenerating ? (
//                     <div className="generating-card">
//                       <div className="loading-spinner"></div>
//                       <p className="loading-text">Generating your image...</p>
//                     </div>
//                   ) : (
//                     <>
//                       <img src={img.image_url} alt="AI Generated" className="generated-img" />
//                       <div className="image-info">
//                         <div className="image-date">{formatDate(img.created_at)}</div>
//                         <div className="image-actions">
//                           <button 
//                             className="image-action-btn download-action"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               handleDownload(img);
//                             }}
//                             disabled={downloading[img.job_id]}
//                             title="Download"
//                           >
//                             {downloading[img.job_id] ? (
//                               <div className="mini-spinner"></div>
//                             ) : (
//                               <i className="fas fa-download"></i>
//                             )}
//                           </button>
//                           <button 
//                             className="image-action-btn delete-action"
//                             onClick={(e) => {
//                               e.stopPropagation();
//                               confirmDelete(img);
//                             }}
//                             title="Delete"
//                           >
//                             <i className="fas fa-trash"></i>
//                           </button>
//                         </div>
//                       </div>
//                     </>
//                   )}
//                 </div>
//               ))
//             ) : (
//               <div className="empty-state-card">
//                 <div className="empty-icon">🖼️</div>
//                 <h3 className="empty-title">No Images Generated Yet</h3>
//                 <p className="empty-description">
//                   Enter a prompt or use AI suggestions to create your first fashion model!
//                 </p>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* AI SUGGESTIONS POPUP */}
//       {showSuggestionPopup && (
//         <div className="suggestions-popup-overlay">
//           <div className="suggestions-popup">
//             <div className="popup-headers">
//               <div>
//                 <h3> AI Prompt Suggestions</h3>
//                 <p className="popup-subtitle">
                 
//                 </p>
//               </div>
//               <button
//                 className="close-btn"
//                 onClick={() => setShowSuggestionPopup(false)}
//               >
//                 ×
//               </button>
//             </div>

//             <div className="popup-category-bar">
//               {categories.map(cat => (
//                 <button
//                   key={cat}
//                   className={`popup-category-btn ${selectedCategory === cat ? "active" : ""}`}
//                   onClick={() => setSelectedCategory(cat)}
//                 >
//                   {cat}
//                 </button>
//               ))}
//             </div>

//             <div className="popup-content">
//               {filteredPrompts.map(prompt => (
//                 <div
//                   key={prompt.id}
//                   className={`prompt-item ${prompt.checked ? "selected" : ""}`}
//                   onClick={() => handleCheckboxChange(prompt.id)}
//                 >
//                   <input type="checkbox" checked={prompt.checked} readOnly />
//                   <div className="prompt-text">{prompt.text}</div>
//                 </div>
//               ))}
//             </div>

//             <div className="popup-footer">
//               <button
//                 className="popup-btn cancel-btn"
//                 onClick={() => setShowSuggestionPopup(false)}
//               >
//                 Cancel
//               </button>
//               <button
//                 className="popup-btn apply-btn"
//                 onClick={handleApplyPrompts}
//                 disabled={!selectedPrompt}
//               >
//                 Apply Prompt
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* FULL SCREEN IMAGE MODAL */}
//       {fullscreenImage && !fullscreenImage.isGenerating && (
//         <div className="fullscreen-modal-overlay" onClick={closeFullscreenImage}>
//           <div className="fullscreen-modal-content" onClick={(e) => e.stopPropagation()}>
//             <button className="modal-close-btn" onClick={closeFullscreenImage}>
//               ×
//             </button>
            
//             <img 
//               src={fullscreenImage.image_url} 
//               alt="Full screen model" 
//               className="fullscreen-image" 
//             />
            
//             <div className="modal-actions">
//               <button 
//                 className="modal-action-btn download-btn"
//                 onClick={() => handleDownload(fullscreenImage)}
//                 disabled={downloading[fullscreenImage.job_id]}
//               >
//                 {downloading[fullscreenImage.job_id] ? (
//                   <>
//                     <div className="mini-spinner"></div>
//                     Downloading...
//                   </>
//                 ) : (
//                   <>
//                     <i className="fa-solid fa-download"></i> Download
//                   </>
//                 )}
//               </button>
              
//               <button 
//                 className="modal-action-btn delete-btn"
//                 onClick={() => {
//                   confirmDelete(fullscreenImage);
//                   closeFullscreenImage();
//                 }}
//               >
//                 <i className="fa-solid fa-trash"></i> Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* DELETE CONFIRMATION MODAL */}
//       {showDeleteConfirm && (
//         <div className="confirm-modal-overlay">
//           <div className="confirm-modal">
//             <div className="confirm-modal-header">
//               <h3>Delete Image</h3>
//               <button className="confirm-close-btn" onClick={cancelDelete}>
//                 ×
//               </button>
//             </div>
//             <div className="confirm-modal-body">
//               <p>Are you sure you want to delete this image?</p>
//               <p className="confirm-warning">This action cannot be undone.</p>
//             </div>
//             <div className="confirm-modal-footer">
//               <button className="confirm-btn cancel-btn" onClick={cancelDelete}>
//                 Cancel
//               </button>
//               <button 
//                 className="confirm-btn delete-confirm-btn" 
//                 onClick={() => handleDelete(showDeleteConfirm)}
//               >
//                 Delete
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// export default ModelsPage;

import React, { useState, useEffect, useMemo } from 'react';
import './Models.css';
import api from "../../Services/api";

function ModelsPage() {
  const [selectedCategory, setSelectedCategory] = useState('Men');
  const [showSuggestionPopup, setShowSuggestionPopup] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [userImages, setUserImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loadingSelected, setLoadingSelected] = useState(false);
  const [error, setError] = useState("");
  const [selectionLoading, setSelectionLoading] = useState(false);
  
  // State for fullscreen modal - only stores the clicked image
  const [fullscreenImage, setFullscreenImage] = useState(null);
  // State for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  // State for tracking downloading
  const [downloading, setDownloading] = useState({});

  const categories = ['All', 'Men', 'Women', 'Boy', 'Girl', 'Baby'];

  const [prompts, setPrompts] = useState([
    { id: 1, category: "Men", text: "Full body photo of a confident adult man wearing a tailored navy blue suit, head-to-toe visible, studio lighting", checked: false },
    { id: 2, category: "Men", text: "Full body casual male model wearing hoodie, jeans and sneakers, urban background", checked: false },
    { id: 3, category: "Men", text: "Full body athletic man wearing gym wear, muscular build, neutral background", checked: false },
    { id: 4, category: "Men", text: "Full body bearded man wearing traditional ethnic kurta and pajama, festive lighting", checked: false },
    { id: 5, category: "Men", text: "Full body business professional wearing formal blazer and trousers, studio setup", checked: false },
    { id: 6, category: "Men", text: "Full body male model wearing summer casual outfit, outdoor daylight", checked: false },
    { id: 7, category: "Men", text: "Full body man wearing winter jacket, scarf and boots, editorial photography", checked: false },
    { id: 8, category: "Men", text: "Full body fitness model wearing sleeveless vest and shorts, high contrast lighting", checked: false },
    { id: 9, category: "Men", text: "Full body man wearing smart casual shirt and chinos, lifestyle photo", checked: false },
    { id: 10, category: "Men", text: "Full body luxury male fashion model wearing designer coat, premium studio lighting", checked: false },
    { id: 11, category: "Women", text: "Full body elegant woman wearing modern saree, complete drape visible", checked: false },
    { id: 12, category: "Women", text: "Full body female model wearing western casual outfit with footwear", checked: false },
    { id: 13, category: "Women", text: "Full body woman wearing office formal attire, confident standing pose", checked: false },
    { id: 14, category: "Women", text: "Full body female model wearing traditional ethnic dress, festive lighting", checked: false },
    { id: 15, category: "Women", text: "Full body woman wearing summer dress, garden background", checked: false },
    { id: 16, category: "Women", text: "Full body fashion-forward woman wearing oversized jacket, editorial style", checked: false },
    { id: 17, category: "Women", text: "Full body woman wearing evening gown, luxury fashion shoot", checked: false },
    { id: 18, category: "Women", text: "Full body female model wearing workout attire, clean background", checked: false },
    { id: 19, category: "Women", text: "Full body woman wearing winter coat and boots, lifestyle photography", checked: false },
    { id: 20, category: "Women", text: "Full body high-fashion woman wearing designer outfit, runway pose", checked: false },
    { id: 21, category: "Boy", text: "Full body young boy wearing casual t-shirt, jeans and shoes", checked: false },
    { id: 22, category: "Boy", text: "Full body boy wearing school uniform with shoes", checked: false },
    { id: 23, category: "Boy", text: "Full body child boy wearing traditional ethnic wear, festive mood", checked: false },
    { id: 24, category: "Boy", text: "Full body boy wearing sports outfit, energetic stance", checked: false },
    { id: 25, category: "Boy", text: "Full body boy wearing hoodie and sneakers, modern look", checked: false },
    { id: 26, category: "Boy", text: "Full body boy wearing winter jacket, playful smile", checked: false },
    { id: 27, category: "Boy", text: "Full body boy wearing summer clothes, bright colors", checked: false },
    { id: 28, category: "Boy", text: "Full body boy wearing party outfit, catalog style", checked: false },
    { id: 29, category: "Boy", text: "Full body cute boy posing confidently, minimal background", checked: false },
    { id: 30, category: "Boy", text: "Full body boy wearing cartoon-themed clothing", checked: false },
    { id: 31, category: "Girl", text: "Full body young girl wearing colorful dress and shoes", checked: false },
    { id: 32, category: "Girl", text: "Full body girl wearing traditional ethnic outfit", checked: false },
    { id: 33, category: "Girl", text: "Full body casual girl wearing jeans and top", checked: false },
    { id: 34, category: "Girl", text: "Full body girl wearing school uniform", checked: false },
    { id: 35, category: "Girl", text: "Full body girl wearing party dress, elegant pose", checked: false },
    { id: 36, category: "Girl", text: "Full body girl wearing winter clothing", checked: false },
    { id: 37, category: "Girl", text: "Full body girl wearing summer frock", checked: false },
    { id: 38, category: "Girl", text: "Full body cute girl posing naturally", checked: false },
    { id: 39, category: "Girl", text: "Full body girl wearing sporty outfit", checked: false },
    { id: 40, category: "Girl", text: "Full body fashionable girl wearing modern kidswear", checked: false },
    { id: 41, category: "Baby", text: "Full body baby wearing soft cotton clothes", checked: false },
    { id: 42, category: "Baby", text: "Full body baby wearing pastel outfit, smiling", checked: false },
    { id: 43, category: "Baby", text: "Full body infant wearing traditional baby dress", checked: false },
    { id: 44, category: "Baby", text: "Full body baby wrapped in cozy blanket", checked: false },
    { id: 45, category: "Baby", text: "Full body baby wearing themed costume", checked: false },
    { id: 46, category: "Baby", text: "Full body sleeping baby wearing white outfit", checked: false },
    { id: 47, category: "Baby", text: "Full body baby sitting with toys", checked: false },
    { id: 48, category: "Baby", text: "Full body infant wearing winter baby wear", checked: false },
    { id: 49, category: "Baby", text: "Full body baby portrait, neutral background", checked: false },
    { id: 50, category: "Baby", text: "Full body professional baby photoshoot", checked: false }
  ]);

  const filteredPrompts = useMemo(() => {
    if (!selectedCategory || selectedCategory === "All") {
      return prompts;
    }
    return prompts.filter(p => p.category === selectedCategory);
  }, [selectedCategory, prompts]);

  // Load all user images
  const loadUserImages = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/model-images/my");
      setUserImages(Array.isArray(res.data) ? res.data : []);
      setError("");
    } catch {
      setError("Failed to load generated images");
      setUserImages([]);
    } finally {
      setLoading(false);
    }
  };

  // Load selected images
  const loadSelectedImages = async () => {
    try {
      setLoadingSelected(true);
      const res = await api.get("/auth/model-images/my/selected");
      const selectedIds = Array.isArray(res.data) ? res.data.map(img => img.job_id) : [];
      setSelectedImages(selectedIds);
    } catch {
      setSelectedImages([]);
    } finally {
      setLoadingSelected(false);
    }
  };

  // Check if image is selected
  const isImageSelected = (imageId) => {
    return selectedImages.includes(imageId);
  };

  // Toggle image selection
  const toggleImageSelection = async (imageId) => {
    if (!imageId) return;
    
    const isCurrentlySelected = isImageSelected(imageId);
    
    try {
      setSelectionLoading(true);
      setError("");
      
      await api.post("/auth/model-images/select", {
        job_ids: [imageId],
        selected: !isCurrentlySelected
      });
      
      // Update local state
      if (isCurrentlySelected) {
        // Remove from selected
        setSelectedImages(prev => prev.filter(id => id !== imageId));
      } else {
        // Add to selected
        setSelectedImages(prev => [...prev, imageId]);
      }
      
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update selection");
    } finally {
      setSelectionLoading(false);
    }
  };

  // Select multiple images
  const handleSelectMultiple = async () => {
    // Get all non-selected image IDs
    const nonSelectedImages = userImages
      .filter(img => !img.isGenerating && !isImageSelected(img.job_id))
      .map(img => img.job_id);
    
    if (nonSelectedImages.length === 0) {
      setError("All images are already selected");
      return;
    }
    
    try {
      setSelectionLoading(true);
      setError("");
      
      await api.post("/auth/model-images/select", {
        job_ids: nonSelectedImages,
        selected: true
      });
      
      // Update local state
      setSelectedImages(prev => [...prev, ...nonSelectedImages]);
      
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to select images");
    } finally {
      setSelectionLoading(false);
    }
  };

  // Unselect all images
  const handleUnselectAll = async () => {
    if (selectedImages.length === 0) {
      setError("No images are selected");
      return;
    }
    
    try {
      setSelectionLoading(true);
      setError("");
      
      await api.post("/auth/model-images/select", {
        job_ids: selectedImages,
        selected: false
      });
      
      // Clear all selections
      setSelectedImages([]);
      
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to unselect images");
    } finally {
      setSelectionLoading(false);
    }
  };

  useEffect(() => {
    loadUserImages();
    loadSelectedImages();
  }, []);

  const handleCheckboxChange = (promptId) => {
    const updated = prompts.map(p => ({
      ...p,
      checked: p.id === promptId
    }));
    setPrompts(updated);

    const selected = updated.find(p => p.checked);
    setSelectedPrompt(selected?.text || null);
    setPromptText(selected?.text || "");
  };

  const handleApplyPrompts = () => {
    if (selectedPrompt) setShowSuggestionPopup(false);
  };

  const handleGenerate = async () => {
    if (!promptText.trim()) {
      alert("Please select a prompt from suggestions");
      return;
    }

    setGenerating(true);
    setError("");

    const TEMP_ID = "__GENERATING__";

    setUserImages(prev => [
      { job_id: TEMP_ID, isGenerating: true },
      ...prev.filter(img => img.job_id !== TEMP_ID)
    ]);

    try {
      const res = await api.post("/auth/image/generate", {
        prompt: promptText,
        
      });

      if (res.data?.image_base64) {
        const newImage = {
          job_id: res.data.job_id,
          image_url: `data:image/png;base64,${res.data.image_base64}`,
          created_at: new Date().toISOString()
        };

        setUserImages(prev =>
          prev.map(img => img.job_id === TEMP_ID ? newImage : img)
        );
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Image generation failed");
      setUserImages(prev => prev.filter(img => img.job_id !== TEMP_ID));
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

  // Function to open fullscreen image
  const openFullscreenImage = (image) => {
    if (!image.isGenerating) {
      setFullscreenImage(image);
    }
  };

  // Function to close fullscreen image
  const closeFullscreenImage = () => {
    setFullscreenImage(null);
  };

  // Function to download image to PC
  const handleDownload = async (image) => {
    if (!image || !image.job_id || image.isGenerating) return;
    
    try {
      setDownloading(prev => ({ ...prev, [image.job_id]: true }));
      setError("");
      
      // Generate filename
      const date = new Date(image.created_at || Date.now());
      const timestamp = date.toISOString().split('T')[0];
      const filename = `model-${image.job_id.slice(-8)}-${timestamp}.png`;
      
      // Method 1: Try direct download from base64 (if available)
      if (image.image_url && image.image_url.startsWith('data:')) {
        const link = document.createElement('a');
        link.href = image.image_url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // Method 2: Use API download endpoint
      try {
        const response = await api.get(`/auth/model-images/${image.job_id}/download-file`, {
          responseType: 'blob'
        });
        
        const blob = new Blob([response.data], { type: 'image/png' });
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
        }, 100);
        
      } catch (apiError) {
        console.error("API download failed:", apiError);
        
        if (image.image_url) {
          window.open(image.image_url, '_blank');
        } else {
          throw new Error("No image URL available");
        }
      }
      
    } catch (err) {
      console.error("Download error:", err);
      setError("Failed to download image. Try right-clicking the image and selecting 'Save Image As...'");
    } finally {
      setDownloading(prev => ({ ...prev, [image.job_id]: false }));
    }
  };

  // Function to delete image
  const handleDelete = async (image) => {
    if (!image || !image.job_id || image.isGenerating) return;
    
    try {
      await api.delete(`/auth/model-images/${image.job_id}`);
      
      // Remove from selected images if present
      if (isImageSelected(image.job_id)) {
        setSelectedImages(prev => prev.filter(id => id !== image.job_id));
      }
      
      // Remove the image from local state
      setUserImages(prev => prev.filter(img => img.job_id !== image.job_id));
      
      // Close any open modals
      setShowDeleteConfirm(null);
      if (fullscreenImage?.job_id === image.job_id) {
        closeFullscreenImage();
      }
      
      setError("");
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete image. Please try again.");
    }
  };

  // Function to confirm deletion
  const confirmDelete = (image) => {
    setShowDeleteConfirm(image);
  };

  // Function to cancel deletion
  const cancelDelete = () => {
    setShowDeleteConfirm(null);
  };

  // Handle keyboard Escape to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (fullscreenImage) {
          closeFullscreenImage();
        }
        if (showDeleteConfirm) {
          cancelDelete();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [fullscreenImage, showDeleteConfirm]);

  return (
    <div className="models-container">
      <div className="header">
        <h1 className="header-title">Models</h1>
      </div>

      <div className="main-content">
        {/* PROMPT INPUT */}
        <div className="input-section">
          <textarea
            className="prompt-textarea"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Describe your model or select from suggestions..."
          />
          <div className="button-group">
            <button className="ai-suggestion-btn" onClick={() => setShowSuggestionPopup(true)}>
              AI Suggestions
            </button>
            <button className="generate-btn" onClick={handleGenerate} disabled={generating || loading}>
              {generating ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* GENERATED IMAGES */}
        <div className="generated_images">
          <p className="generate">
            Generated Models
            {userImages.length > 0 && (
              <span className="image-count">
                {userImages.filter(img => !img.isGenerating).length} {userImages.filter(img => !img.isGenerating).length === 1 ? 'Image' : 'Images'}
                {selectedImages.length > 0 && (
                  <span className="selected-count">
                    · {selectedImages.length} Selected
                  </span>
                )}
              </span>
            )}
          </p>

          <div className="images-grid">
            {loading ? (
              <div className="loading-state-card">
                <div className="loading-spinner"></div>
                <p className="loading-text">Loading images...</p>
              </div>
            ) : userImages.length > 0 ? (
              userImages.map((img, index) => (
                <div 
                  key={img.job_id || index} 
                  className={`image-card ${isImageSelected(img.job_id) ? 'selected' : ''}`}
                  onClick={() => !img.isGenerating && openFullscreenImage(img)}
                  style={{ cursor: img.isGenerating ? 'default' : 'pointer' }}
                >
                  {img.isGenerating ? (
                    <div className="generating-card">
                      <div className="loading-spinner"></div>
                      <p className="loading-text">Generating your image...</p>
                    </div>
                  ) : (
                    <>
                      {/* Selection indicator */}
                      {isImageSelected(img.job_id) && (
                        <div className="selected-indicator">
                          <i className="fas fa-check-circle"></i>
                          <span>Selected</span>
                        </div>
                      )}
                      
                      <img src={img.image_url} alt="AI Generated" className="generated-img" />
                      <div className="image-info">
                        <div className="image-date">{formatDate(img.created_at)}</div>
                        <div className="image-actions">
                          {/* Select/Unselect Button */}
                          <button 
                            className={`image-action-btn ${isImageSelected(img.job_id) ? 'unselect-action' : 'select-action'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleImageSelection(img.job_id);
                            }}
                            disabled={selectionLoading}
                            title={isImageSelected(img.job_id) ? "Unselect" : "Select"}
                          >
                            <i className={`fas ${isImageSelected(img.job_id) ? 'fa-times' : 'fa-check'}`}></i>
                          </button>
                          
                          <button 
                            className="image-action-btn download-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(img);
                            }}
                            disabled={downloading[img.job_id]}
                            title="Download"
                          >
                            {downloading[img.job_id] ? (
                              <div className="mini-spinner"></div>
                            ) : (
                              <i className="fas fa-download"></i>
                            )}
                          </button>
                          <button 
                            className="image-action-btn delete-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDelete(img);
                            }}
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className="empty-state-card">
                <div className="empty-icon">🖼️</div>
                <h3 className="empty-title">No Images Generated Yet</h3>
                <p className="empty-description">
                  Enter a prompt or use AI suggestions to create your first fashion model!
                </p>
              </div>
            )}
          </div>
          
          {/* Selection Controls at Bottom */}
          {userImages.length > 0 && (
            <div className="selection-controls-bottom">
              <div className="selection-stats">
                <i className="fas fa-check-circle"></i>
                <span>
                  {selectedImages.length} of {userImages.filter(img => !img.isGenerating).length} images selected
                </span>
              </div>
              <div className="selection-buttons">
                {selectedImages.length === userImages.filter(img => !img.isGenerating).length ? (
                  <button 
                    className="selection-btn unselect-all-btn"
                    onClick={handleUnselectAll}
                    disabled={selectionLoading || selectedImages.length === 0}
                  >
                    {selectionLoading ? (
                      <>
                        <div className="mini-spinner"></div> Unselecting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-times"></i> Unselect All
                      </>
                    )}
                  </button>
                ) : (
                  <button 
                    className="selection-btn select-all-btn"
                    onClick={handleSelectMultiple}
                    disabled={selectionLoading}
                  >
                    {selectionLoading ? (
                      <>
                        <div className="mini-spinner"></div> Selecting...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check-double"></i> Select All
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI SUGGESTIONS POPUP */}
      {showSuggestionPopup && (
        <div className="suggestions-popup-overlay">
          <div className="suggestions-popup">
            <div className="popup-headers">
              <div>
                <h3> AI Prompt Suggestions</h3>
                <p className="popup-subtitle">
                 
                </p>
              </div>
              <button
                className="close-btn"
                onClick={() => setShowSuggestionPopup(false)}
              >
                ×
              </button>
            </div>

            <div className="popup-category-bar">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`popup-category-btn ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="popup-content">
              {filteredPrompts.map(prompt => (
                <div
                  key={prompt.id}
                  className={`prompt-item ${prompt.checked ? "selected" : ""}`}
                  onClick={() => handleCheckboxChange(prompt.id)}
                >
                  <input type="checkbox" checked={prompt.checked} readOnly />
                  <div className="prompt-text">{prompt.text}</div>
                </div>
              ))}
            </div>

            <div className="popup-footer">
              <button
                className="popup-btn cancel-btn"
                onClick={() => setShowSuggestionPopup(false)}
              >
                Cancel
              </button>
              <button
                className="popup-btn apply-btn"
                onClick={handleApplyPrompts}
                disabled={!selectedPrompt}
              >
                Apply Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL SCREEN IMAGE MODAL */}
      {fullscreenImage && !fullscreenImage.isGenerating && (
        <div className="fullscreen-modal-overlay" onClick={closeFullscreenImage}>
          <div className="fullscreen-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeFullscreenImage}>
              ×
            </button>
            
            <img 
              src={fullscreenImage.image_url} 
              alt="Full screen model" 
              className="fullscreen-image" 
            />
            
            <div className="modal-actions">
              <button 
                className={`modal-action-btn select-btn ${isImageSelected(fullscreenImage.job_id) ? 'selected' : ''}`}
                onClick={() => {
                  toggleImageSelection(fullscreenImage.job_id);
                }}
                disabled={selectionLoading}
              >
                {isImageSelected(fullscreenImage.job_id) ? (
                  <>
                    <i className="fa-solid fa-times"></i> Unselect
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-check"></i> Select
                  </>
                )}
              </button>
              
              <button 
                className="modal-action-btn download-btn"
                onClick={() => handleDownload(fullscreenImage)}
                disabled={downloading[fullscreenImage.job_id]}
              >
                {downloading[fullscreenImage.job_id] ? (
                  <>
                    <div className="mini-spinner"></div>
                    Downloading...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-download"></i> Download
                  </>
                )}
              </button>
              
              <button 
                className="modal-action-btn delete-btn"
                onClick={() => {
                  confirmDelete(fullscreenImage);
                  closeFullscreenImage();
                }}
              >
                <i className="fa-solid fa-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <div className="confirm-modal-header">
              <h3>Delete Image</h3>
              <button className="confirm-close-btn" onClick={cancelDelete}>
                ×
              </button>
            </div>
            <div className="confirm-modal-body">
              <p>Are you sure you want to delete this image?</p>
              <p className="confirm-warning">This action cannot be undone.</p>
            </div>
            <div className="confirm-modal-footer">
              <button className="confirm-btn cancel-btn" onClick={cancelDelete}>
                Cancel
              </button>
              <button 
                className="confirm-btn delete-confirm-btn" 
                onClick={() => handleDelete(showDeleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelsPage;