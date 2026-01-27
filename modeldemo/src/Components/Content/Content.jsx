import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import './Content.css';
import api from "../../Services/api";

// =================== DYNAMIC IMPORT SETUP ===================

// Helper function to import all images from a folder
function importAll(r) {
  const images = {};
  r.keys().forEach((key) => {
    const imageName = key.replace('./', '').replace(/\.\w+$/, '');
    images[imageName] = r(key);
  });
  return images;
}

// Dynamic imports using Webpack Context
// Men's images
const menDresses = importAll(require.context('../../Assets/Men/Dress/', false, /\.(png|jpe?g|svg|webp)$/));
const menModels = importAll(require.context('../../Assets/Men/Model/', false, /\.(png|jpe?g|svg|webp)$/));

// Women's images
const womenDresses = importAll(require.context('../../Assets/Women/Dress/', false, /\.(png|jpe?g|svg|webp)$/));
const womenModels = importAll(require.context('../../Assets/Women/Model/', false, /\.(png|jpe?g|svg|webp)$/));

// Convert object to array for easier use in your existing code
const menDressesArray = Object.values(menDresses);
const menModelsArray = Object.values(menModels);
const womenDressesArray = Object.values(womenDresses);
const womenModelsArray = Object.values(womenModels);

// =================== IMAGE CATEGORIES ===================

const imageCategories = {
  women: {
    models: womenModelsArray,
    dresses: womenDressesArray
  },
  men: {
    models: menModelsArray,
    dresses: menDressesArray
  },
  boys: {
    models: [], 
    dresses: []
  },
  girls: {
    models: [],
    dresses: []
  },
  baby: {
    models: [],
    dresses: []
  },
  all: {
    models: [...womenModelsArray, ...menModelsArray],
    dresses: [...womenDressesArray, ...menDressesArray]
  }
};

// =================== CONTENT COMPONENT ===================

function Content({ selectedCategory = "all" }) {
  const [openPopup, setOpenPopup] = useState(false);
  const [openBatchPopup, setOpenBatchPopup] = useState(false);
  const [batchName, setBatchName] = useState("");
  const [batchError, setBatchError] = useState("");
  const [selectedImages, setSelectedImages] = useState([]);
  const [currentDiv, setCurrentDiv] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(selectedCategory);
  const [deletingIndex, setDeletingIndex] = useState(null);
  const [sizeConfig, setSizeConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [configError, setConfigError] = useState("");
  const [imageSizeInfo, setImageSizeInfo] = useState(null);
  const [selectedModelsFromAPI, setSelectedModelsFromAPI] = useState([]);
  const [loadingSelectedModels, setLoadingSelectedModels] = useState(false);
  const fileInputRef = useRef(null);
  const batchInputRef = useRef(null);
  const navigate = useNavigate();

  // State for current category images - each category has its own state
  const [categoryImages, setCategoryImages] = useState(() => {
    // Initialize with all categories
    const initialState = {};
    
    Object.keys(imageCategories).forEach(category => {
      initialState[category] = {
        dresses: imageCategories[category].dresses.slice(0, 4), // Start with first 4 images
        models: imageCategories[category].models.slice(0, 4) // Start with first 4 images
      };
    });
    
    return initialState;
  });

  // Update currentCategory when selectedCategory prop changes
  useEffect(() => {
    setCurrentCategory(selectedCategory);
  }, [selectedCategory]);

  // Load size configuration on component mount
  useEffect(() => {
    const fetchSizeConfig = async () => {
      try {
        setLoadingConfig(true);
        const res = await api.get("/user/image-config");

        if (res.data?.tryon?.size) {
          setSizeConfig(res.data.tryon.size);
          return;
        }

        throw new Error("No size config");
      } catch {
        setConfigError("Please select image size first");
      } finally {
        setLoadingConfig(false);
      }
    };

    fetchSizeConfig();
  }, []);

  // Load selected models from API when opening popup for "All" category models
  useEffect(() => {
    if (openPopup && currentCategory === "all" && currentDiv === "second") {
      loadSelectedModelsFromAPI();
    }
  }, [openPopup, currentCategory, currentDiv]);

  // Function to load selected models from API
  const loadSelectedModelsFromAPI = async () => {
    try {
      setLoadingSelectedModels(true);
      const response = await api.get("/auth/model-images/my/selected");
      const selected = Array.isArray(response.data) ? response.data : [];
      setSelectedModelsFromAPI(selected);
    } catch (error) {
      console.error("Failed to load selected models:", error);
      setSelectedModelsFromAPI([]);
    } finally {
      setLoadingSelectedModels(false);
    }
  };

  // Function to validate image dimensions
  const validateImageSize = (file, requiredSize) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const actual = `${img.width}x${img.height}`;
        setImageSizeInfo({ actual, required: requiredSize });

        const [rw, rh] = requiredSize.split("x").map(Number);
        resolve(img.width === rw && img.height === rh);
      };
      img.src = URL.createObjectURL(file);
    });

  const handleOpenPopup = (divType) => {
    setCurrentDiv(divType);
    setSelectedImages([]);
    setOpenPopup(true);
  };

  const handleGenerateClick = () => {
    setOpenBatchPopup(true);
    setBatchName("");
    setBatchError("");
  };

  const handleBatchNameSubmit = async () => {
    if (!batchName.trim()) {
      setBatchError("Please enter a batch name");
      return;
    }

    try {
      const formData = new FormData();

      // Add dresses - ALL images, not limited to 4
      for (let i = 0; i < categoryImages[currentCategory].dresses.length; i++) {
        const file = await urlToFile(
          categoryImages[currentCategory].dresses[i],
          `cloth_${i}.png`
        );
        formData.append("cloth_images", file);
      }

      // Add models - ALL images, not limited to 4
      for (let i = 0; i < categoryImages[currentCategory].models.length; i++) {
        const file = await urlToFile(
          categoryImages[currentCategory].models[i],
          `person_${i}.png`
        );
        formData.append("person_images", file);
      }

      formData.append("job_name", batchName);
      formData.append("quality", "premium");
      formData.append("size", sizeConfig || "1024x1536");

      await api.post("/tryon/virtual-tryon", formData);

      setOpenBatchPopup(false);
      navigate("/generate-image", { state: { batchName } });

    } catch (err) {
      setBatchError(err?.response?.data?.detail || "Failed to start generation");
    }
  };

  const urlToFile = async (url, filename) => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  };

  const handleBatchPopupClose = () => {
    setOpenBatchPopup(false);
    setBatchName("");
    setBatchError("");
  };

  // File upload handler
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    const isPerson = currentDiv === "second";

    const valid = [];
    const errors = [];

    for (const file of files) {
      if (isPerson && sizeConfig) {
        const ok = await validateImageSize(file, sizeConfig);
        if (!ok) {
          errors.push(`${file.name} must be ${sizeConfig}`);
          continue;
        }
      }
      valid.push(URL.createObjectURL(file));
    }

    if (errors.length) {
      alert(errors.join("\n"));
    }

    setSelectedImages((p) => [...p, ...valid]);
    e.target.value = "";
  };

  const handleToggleImageSelection = (img) => {
    setSelectedImages(prev => {
      if (prev.includes(img)) {
        return prev.filter(item => item !== img);
      } else {
        return [...prev, img];
      }
    });
  };

  const handleFinalSelect = () => {
    if (selectedImages.length === 0) return;
    
    // REMOVED THE .slice(0, 4) LIMIT - Now users can add unlimited images
    setCategoryImages(prev => ({
      ...prev,
      [currentCategory]: {
        ...prev[currentCategory],
        [currentDiv === "first" ? "dresses" : "models"]: [
          ...prev[currentCategory][currentDiv === "first" ? "dresses" : "models"],
          ...selectedImages
        ]
      }
    }));

    setOpenPopup(false);
    setSelectedImages([]);
  };

  const handleRemoveAllSelected = () => {
    setSelectedImages([]);
  };

  // Handle delete image
  const handleDeleteImage = (divType, index) => {
    setDeletingIndex(`${divType}-${index}`);
    
    setTimeout(() => {
      setCategoryImages(prev => ({
        ...prev,
        [currentCategory]: {
          ...prev[currentCategory],
          [divType === "first" ? "dresses" : "models"]: 
            prev[currentCategory][divType === "first" ? "dresses" : "models"]
              .filter((_, i) => i !== index)
        }
      }));
      setDeletingIndex(null);
    }, 300);
  };

  // Handle unselect API image
  const handleUnselectAPIImage = async (imageId, imageUrl) => {
    try {
      await api.post("/auth/model-images/select", {
        job_ids: [imageId],
        selected: false
      });
      
      // Remove from local state
      setSelectedModelsFromAPI(prev => prev.filter(img => img.job_id !== imageId));
      
      // If this image is currently selected in the popup, remove it
      setSelectedImages(prev => prev.filter(img => img !== imageUrl));
      
    } catch (error) {
      console.error("Failed to unselect image:", error);
      alert("Failed to unselect image. Please try again.");
    }
  };

  const getIconForDiv = (divType) => {
    switch(divType) {
      case "first": return <i className="fa-solid fa-shirt"></i>;
      case "second": return <i className="fa-solid fa-user"></i>;
      default: return <i className="fa-solid fa-image"></i>;
    }
  };

  const getTitleForDiv = (divType) => {
    switch(divType) {
      case "first": return "Dresses";
      case "second": return "Models";
      default: return "Images";
    }
  };

  const getButtonText = (divType) => {
    switch(divType) {
      case "first": return "Add Dress";
      case "second": return "Add Model";
      default: return "Add Image";
    }
  };

  const getPopupTitle = (divType) => {
    switch(divType) {
      case "first": return "Dress";
      case "second": return "Model";
      default: return "Image";
    }
  };

  const getImageCount = (imagesArray) => {
    return imagesArray.length;
  };

  // Get available images for current category from predefined categories
  const getAvailableImages = () => {
    if (!currentDiv || !currentCategory) return [];
    
    if (currentDiv === "first") {
      return imageCategories[currentCategory].dresses || [];
    } else if (currentDiv === "second") {
      return imageCategories[currentCategory].models || [];
    }
    return [];
  };

  // Filter out images that are already selected in the current view
  const getFilteredAvailableImages = () => {
    if (!currentCategory || !currentDiv) return [];
    
    const currentImages = currentDiv === "first" 
      ? categoryImages[currentCategory].dresses 
      : categoryImages[currentCategory].models;
    
    const availableImages = getAvailableImages();
    
    // Filter out images that are already in use
    return availableImages.filter(img => !currentImages.includes(img));
  };

  // Check if an image is from selected models API
  const isImageFromAPI = (imgUrl) => {
    return selectedModelsFromAPI.some(model => model.image_url === imgUrl);
  };

  // Get API image info by URL
  const getAPIImageInfo = (imgUrl) => {
    return selectedModelsFromAPI.find(model => model.image_url === imgUrl);
  };

  // Display size information
  const renderSizeInfo = () => {
    if (!sizeConfig || currentDiv !== "second") return null;

    return (
      <div className="size-info-banner">
        <strong>Required size:</strong> {sizeConfig} (from DB)
        {imageSizeInfo && (
          <div className="size-actual">
            Uploaded image: <strong>{imageSizeInfo.actual}</strong>
          </div>
        )}
      </div>
    );
  };

  // Render selected models section
  const renderSelectedModelsSection = () => {
    if (currentCategory !== "all" || currentDiv !== "second" || selectedModelsFromAPI.length === 0) {
      return null;
    }

    return (
      <div className="selected-models-section">
        <div className="section-title">
          <i className="fas fa-check-circle"></i>
          <span>Your Selected Models ({selectedModelsFromAPI.length})</span>
        </div>
        <div className="selected-models-grid">
          {selectedModelsFromAPI.map((model, index) => {
            const isSelected = selectedImages.includes(model.image_url);
            
            return (
              <div
                key={model.job_id}
                className={`image-container api-image ${isSelected ? "selected" : ""}`}
                onClick={() => handleToggleImageSelection(model.image_url)}
              >
                <img src={model.image_url} alt={`Selected model ${index + 1}`} />
                
                <div className="api-image-badge">
                  <i className="fas fa-check-circle"></i>
                  <span>Selected</span>
                </div>
                
                {isSelected && (
                  <div className="selected-checkmark">
                    <i className="fa-solid fa-check"></i>
                  </div>
                )}
                
                <div className="api-image-actions">
                  <button 
                    className="unselect-api-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm("Do you want to unselect this model from Models page?")) {
                        handleUnselectAPIImage(model.job_id, model.image_url);
                      }
                    }}
                    title="Unselect this model"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render main div for current category
  const renderMainDiv = (divType) => {
    if (!currentCategory) return null;
    
    const imagesArray = divType === "first" 
      ? categoryImages[currentCategory].dresses 
      : categoryImages[currentCategory].models;
    
    const imageCount = getImageCount(imagesArray);
    
    return (
      <div className="content-div" style={{position: 'relative'}}>
        <div className="main-div-header">
          <div className="main-div-title">
            {getTitleForDiv(divType)} ({imageCount} images)
          </div>
          
          <button 
            className="plus-button"
            onClick={() => handleOpenPopup(divType)}
          >
            <i className="fa-solid fa-plus"></i>
            <span>{getButtonText(divType)}</span>
          </button>
        </div>
        
        <div className="sub-divs-container">
          {imagesArray.map((img, index) => {
            const isDeleting = deletingIndex === `${divType}-${index}`;
            
            return (
              <div 
                key={index}
                className={`sub-div has-image ${isDeleting ? 'deleting' : ''}`}
              >
                <img src={img} alt={`${divType} ${index + 1}`} />
                
                <div className="delete-overlay">
                  <button 
                    className="delete-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteImage(divType, index);
                    }}
                    title="Delete image"
                  >
                    <i className="fa-solid fa-times"></i>
                  </button>
                </div>
              </div>
            );
          })}
          
          {/* Show only one empty slot - users can add unlimited images */}
          {imagesArray.length === 0 && (
            <div 
              className="sub-div empty"
              onClick={() => handleOpenPopup(divType)}
            >
              <i className="fa-solid fa-cloud-arrow-up"></i>
              <span>{getButtonText(divType)}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="content">
      <div className="main-container">
        <div className="two-divs-container">
          {renderMainDiv("first")}
          {renderMainDiv("second")}
        </div>
        <div className="button-container">
          <button
            className="btnGenerate-large"
            onClick={handleGenerateClick}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i>
            <span className="btn-text">Generate</span>
          </button>
        </div>
      </div>

      {openPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <div className="popup-header">
              <div>
                <h3>Select {getPopupTitle(currentDiv)} for {currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}</h3>
                {renderSizeInfo()}
                <p className="selection-count">
                  {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
                  {selectedImages.length > 0 && (
                    <button
                      className="clear-selection-btn"
                      onClick={handleRemoveAllSelected}
                    >
                      Clear All
                    </button>
                  )}
                </p>
              </div>
              <button className="close-btn" onClick={() => setOpenPopup(false)}>X</button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/*"
              multiple
              onChange={handleFileUpload}
            />

            <div className="image-grid">
              <div
                className="upload-box-popup"
                onClick={() => fileInputRef.current.click()}
              >
                {getIconForDiv(currentDiv)}
                <div className="upload-text-popup">{getButtonText(currentDiv)}</div>
                <div className="upload-hint">
                  {currentCategory === "all" 
                    ? "Upload images for any category" 
                    : `Upload ${currentCategory} images`}
                  {currentDiv === "second" && sizeConfig && (
                    <div className="size-hint">
                      <i className="fa-solid fa-info-circle"></i>
                      Must be {sizeConfig} size (from database)
                    </div>
                  )}
                </div>
              </div>

              {getFilteredAvailableImages().map((img, index) => (
                <div
                  key={index}
                  className={`image-container ${selectedImages.includes(img) ? "selected" : ""}`}
                  onClick={() => handleToggleImageSelection(img)}
                >
                  <img src={img} alt={`${currentDiv} ${index + 1}`} />
                  {selectedImages.includes(img) && (
                    <div className="selected-checkmark">
                      <i className="fa-solid fa-check"></i>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Selected Models Section - appears below normal images */}
            {renderSelectedModelsSection()}

            <div className="popup-buttons">
              <button onClick={() => setOpenPopup(false)}>Cancel</button>
              <button 
                disabled={selectedImages.length === 0} 
                onClick={handleFinalSelect}
              >
                Add {selectedImages.length > 0 ? `(${selectedImages.length}) ` : ''}Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Name Popup */}
      {openBatchPopup && (
        <div className="batch-popup-overlay">
          <div className="batch-popup-container">
            <div className="batch-popup-card">
              <div className="batch-popup-header">
                <div className="batch-popup-title">
                  <h3>Enter Batch Name</h3>
                </div>
                <button className="batch-popup-close" onClick={handleBatchPopupClose}>
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>

              <div className="batch-popup-body">
                <div className="batch-input-group">
                  <div className="batch-input-wrapper">
                    <input
                      ref={batchInputRef}
                      type="text"
                      className="batch-name-input"
                      placeholder="Enter batch name"
                      value={batchName}
                      onChange={(e) => {
                        setBatchName(e.target.value);
                        setBatchError("");
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleBatchNameSubmit();
                        }
                      }}
                      autoFocus
                    />
                  </div>
                  {batchError && <div className="batch-error-message">{batchError}</div>}
                </div>
              </div>

              <div className="batch-popup-footer">
                <button className="batch-cancel-btn" onClick={handleBatchPopupClose}>
                  Cancel
                </button>
                <button className="batch-submit-btn" onClick={handleBatchNameSubmit}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Content;