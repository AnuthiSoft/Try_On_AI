import { useState, useRef, useEffect, useCallback } from "react";
import api from "../../Services/api";
import "./ImageResize.css";

export default function ImageResize() {
  // State management
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [outputUrl, setOutputUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [downloadCount, setDownloadCount] = useState(0);
  const [preset, setPreset] = useState("1024x1024");
  const [keepAspectRatio, setKeepAspectRatio] = useState(true);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [validationErrors, setValidationErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileSize, setFileSize] = useState(0);
  
  // Refs
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);
  const controllerRef = useRef(null);
  const errorTimeoutRef = useRef(null);
  const successTimeoutRef = useRef(null);

  // Constants
  const MAX_FILE_SIZE_MB = 10;
  const MAX_DIMENSION = 2048;
  const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];

  // Size presets - prominently featuring the requested sizes
  const sizePresets = [
    { 
      id: "1024x1024", 
      label: "Square", 
      icon: "⬜", 
      width: 1024, 
      height: 1024,
      description: "Perfect for profile pictures"
    },
    { 
      id: "1024x1536", 
      label: "Portrait", 
      icon: "📱", 
      width: 1024, 
      height: 1536,
      description: "Mobile portrait orientation"
    },
    { 
      id: "1536x1024", 
      label: "Landscape", 
      icon: "🖼️", 
      width: 1536, 
      height: 1024,
      description: "Desktop landscape orientation"
    },
  ];

  const platformPresets = [
    { id: "instagram", label: "Instagram", icon: "📸", width: 1080, height: 1080 },
    { id: "twitter", label: "Twitter", icon: "🐦", width: 1200, height: 675 },
    { id: "facebook", label: "Facebook", icon: "📘", width: 1200, height: 630 },
    { id: "linkedin", label: "LinkedIn", icon: "💼", width: 1200, height: 627 },
    { id: "pinterest", label: "Pinterest", icon: "📌", width: 1000, height: 1500 },
    { id: "youtube", label: "YouTube", icon: "📺", width: 1280, height: 720 },
  ];

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up object URLs
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (outputUrl) URL.revokeObjectURL(outputUrl);
      
      // Clear timeouts
      if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      
      // Abort any ongoing requests
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, [previewUrl, outputUrl]);

  // Drag and drop handlers
  useEffect(() => {
    const dropArea = dropAreaRef.current;
    if (!dropArea) return;

    const handleDrag = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
      }
    };

    dropArea.addEventListener("dragenter", handleDrag);
    dropArea.addEventListener("dragover", handleDrag);
    dropArea.addEventListener("dragleave", handleDrag);
    dropArea.addEventListener("drop", handleDrop);

    return () => {
      dropArea.removeEventListener("dragenter", handleDrag);
      dropArea.removeEventListener("dragover", handleDrag);
      dropArea.removeEventListener("dragleave", handleDrag);
      dropArea.removeEventListener("drop", handleDrop);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && outputUrl) {
        e.preventDefault();
        handleDownload();
      }
      // Ctrl+R or Cmd+R to resize again
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && file) {
        e.preventDefault();
        handleSubmit({ preventDefault: () => {} });
      }
      // Escape to clear
      if (e.key === 'Escape') {
        handleCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [outputUrl, file]);

  // File validation
  const validateFile = (selectedFile) => {
    const errors = {};
    
    // Check file type
    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    const mimeType = selectedFile.type;
    
    if (!ALLOWED_FORMATS.includes(fileExtension) && !mimeType.startsWith('image/')) {
      errors.type = `Unsupported file type. Allowed: ${ALLOWED_FORMATS.join(', ')}`;
    }
    
    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      errors.size = `File too large. Maximum size: ${MAX_FILE_SIZE_MB}MB`;
    }
    
    return errors;
  };

  const showError = useCallback((message) => {
    // Clear any existing timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    setError(message);
    
    // Auto-dismiss after 5 seconds
    errorTimeoutRef.current = setTimeout(() => {
      setError(null);
    }, 5000);
  }, []);

  const showSuccess = useCallback((message) => {
    // Clear any existing timeout
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }
    
    setSuccess(message);
    
    // Auto-dismiss after 3 seconds
    successTimeoutRef.current = setTimeout(() => {
      setSuccess(null);
    }, 3000);
  }, []);

  const validateAndSetFile = (selectedFile) => {
    const errors = validateFile(selectedFile);
    
    if (Object.keys(errors).length > 0) {
      showError(errors.type || errors.size);
      return;
    }
    
    // Clean up previous preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    // Clean up previous output
    if (outputUrl) {
      URL.revokeObjectURL(outputUrl);
      setOutputUrl(null);
    }
    
    setFile(selectedFile);
    setFileSize(selectedFile.size);
    setError(null);
    setValidationErrors({});
    setSuccess(null);
    setActiveTab("adjust");
    
    // Create preview
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    
    // Get original dimensions
    const img = new Image();
    img.onload = () => {
      const dimensions = {
        width: img.width,
        height: img.height
      };
      
      setOriginalDimensions(dimensions);
      
      // Auto-select the closest preset based on aspect ratio
      const imgRatio = dimensions.width / dimensions.height;
      const presetsWithRatios = sizePresets.map(p => ({
        ...p,
        ratio: p.width / p.height,
        diff: Math.abs((p.width / p.height) - imgRatio)
      }));
      
      const closestPreset = presetsWithRatios.sort((a, b) => a.diff - b.diff)[0];
      setPreset(closestPreset.id);
      setWidth(closestPreset.width);
      setHeight(closestPreset.height);
      
      // Validate dimensions
      validateDimensions(closestPreset.width, closestPreset.height);
    };
    img.onerror = () => {
      showError("Failed to load image. Please try another file.");
      clearFile();
    };
    img.src = url;
  };

  const validateDimensions = (newWidth, newHeight) => {
    const errors = {};
    
    if (newWidth <= 0 || newHeight <= 0) {
      errors.dimensions = "Dimensions must be positive numbers";
    }
    
    if (newWidth > MAX_DIMENSION || newHeight > MAX_DIMENSION) {
      errors.maxDimensions = `Maximum dimension is ${MAX_DIMENSION}px`;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePresetChange = (presetId) => {
    const selectedPreset = sizePresets.find(p => p.id === presetId);
    if (!selectedPreset) return;
    
    setPreset(selectedPreset.id);
    setWidth(selectedPreset.width);
    setHeight(selectedPreset.height);
    
    if (validateDimensions(selectedPreset.width, selectedPreset.height)) {
      showSuccess(`Applied ${selectedPreset.label} preset (${selectedPreset.width}×${selectedPreset.height})`);
    }
  };

  const handlePlatformPreset = (presetItem) => {
    setWidth(presetItem.width);
    setHeight(presetItem.height);
    setPreset("custom");
    
    if (validateDimensions(presetItem.width, presetItem.height)) {
      showSuccess(`Applied ${presetItem.label} preset`);
    }
  };

  const handleWidthChange = (value) => {
    const newWidth = parseInt(value) || 1;
    setWidth(newWidth);
    setPreset("custom");
    validateDimensions(newWidth, height);
    
    if (keepAspectRatio && originalDimensions.width > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      const newHeight = Math.round(newWidth / ratio);
      setHeight(newHeight);
    }
  };

  const handleHeightChange = (value) => {
    const newHeight = parseInt(value) || 1;
    setHeight(newHeight);
    setPreset("custom");
    validateDimensions(width, newHeight);
    
    if (keepAspectRatio && originalDimensions.height > 0) {
      const ratio = originalDimensions.width / originalDimensions.height;
      const newWidth = Math.round(newHeight * ratio);
      setWidth(newWidth);
    }
  };

  const quickSizeChange = (multiplier) => {
    const newWidth = Math.round(width * multiplier);
    const newHeight = Math.round(height * multiplier);
    
    if (validateDimensions(newWidth, newHeight)) {
      setWidth(newWidth);
      setHeight(newHeight);
      setPreset("custom");
      showSuccess(`Scaled to ${newWidth}×${newHeight}`);
    }
  };

  const resetToOriginal = () => {
    if (originalDimensions.width > 0) {
      setWidth(originalDimensions.width);
      setHeight(originalDimensions.height);
      setPreset("custom");
      
      if (validateDimensions(originalDimensions.width, originalDimensions.height)) {
        showSuccess("Reset to original dimensions");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      showError("Please select an image first");
      return;
    }
    
    // Validate dimensions
    if (!validateDimensions(width, height)) {
      if (validationErrors.dimensions) {
        showError(validationErrors.dimensions);
      } else if (validationErrors.maxDimensions) {
        showError(validationErrors.maxDimensions);
      }
      return;
    }
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("width", width.toString());
    formData.append("height", height.toString());
    
    try {
      setLoading(true);
      setIsProcessing(true);
      setProgress(0);
      setError(null);
      setSuccess(null);
      setOutputUrl(null);
      
      // Create AbortController for request cancellation
      controllerRef.current = new AbortController();
      
      // Progress simulation for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 90) return prev + 10;
          return prev;
        });
      }, 200);
      
      // API call with progress tracking
      const res = await api.post("/image/resize", formData, {
        signal: controllerRef.current.signal,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 50) / progressEvent.total);
            setProgress(percentCompleted);
          }
        },
        responseType: 'blob',
        timeout: 60000, // 60 second timeout
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Validate response
      if (!res.data || res.data.size === 0) {
        throw new Error("Server returned empty response");
      }
      
      // Validate that response is an image
      if (!res.data.type.startsWith('image/')) {
        throw new Error("Server returned non-image data");
      }
      
      // Clean up previous output URL
      if (outputUrl) {
        URL.revokeObjectURL(outputUrl);
      }
      
      const url = URL.createObjectURL(res.data);
      setOutputUrl(url);
      
      showSuccess(`✓ Image resized successfully to ${width}×${height}`);
      setDownloadCount(0);
      setActiveTab("result");
      
    } catch (err) {
      clearInterval(progressInterval);
      
      if (err.name === 'AbortError') {
        showError("Request was cancelled");
      } else if (err.code === 'ECONNABORTED') {
        showError("Request timeout. Please try again.");
      } else if (err.response) {
        // Handle server errors
        const status = err.response.status;
        switch (status) {
          case 400:
            if (err.response.data?.detail) {
              showError(err.response.data.detail);
            } else {
              showError("Invalid request. Please check your parameters.");
            }
            break;
          case 413:
            showError("File too large. Please use a smaller image.");
            break;
          case 415:
            showError("Unsupported image format");
            break;
          case 429:
            showError("Too many requests. Please wait a moment.");
            break;
          case 500:
          case 502:
          case 503:
          case 504:
            showError("Server error. Please try again later.");
            break;
          default:
            showError(`Error ${status}: ${err.response.statusText}`);
        }
      } else if (err.request) {
        // Network error
        showError("Network error. Please check your connection.");
      } else {
        showError("Failed to resize image. Please try again.");
      }
      
      console.error("Resize error:", err);
    } finally {
      setLoading(false);
      setIsProcessing(false);
      setProgress(0);
      controllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
      setLoading(false);
      setIsProcessing(false);
      setProgress(0);
      showError("Request cancelled");
    }
  };

  const handleDownload = () => {
    if (!outputUrl) return;
    
    try {
      const link = document.createElement('a');
      link.href = outputUrl;
      link.download = `resized_${width}x${height}_${Date.now()}.jpg`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadCount(prev => prev + 1);
      showSuccess("✓ Download started!");
    } catch (err) {
      showError("Failed to download image");
      console.error("Download error:", err);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setFile(null);
    setOriginalDimensions({ width: 0, height: 0 });
    setFileSize(0);
  };

  const clearAll = () => {
    // Clean up URLs
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    
    // Reset state
    setFile(null);
    setPreviewUrl(null);
    setOutputUrl(null);
    setOriginalDimensions({ width: 0, height: 0 });
    setFileSize(0);
    setWidth(1024);
    setHeight(1024);
    setPreset("1024x1024");
    setError(null);
    setSuccess(null);
    setValidationErrors({});
    setDownloadCount(0);
    setActiveTab("upload");
    
    // Cancel any ongoing request
    handleCancel();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="image-resizer-container">
      {/* Header */}
      <header className="resizer-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="app-icon">🖼️</span>
            Image Resizer Pro
          </h1>
          <p className="app-description">
            Resize images to {sizePresets.map(p => `${p.width}×${p.height}`).join(', ')} and more
          </p>
        </div>
        
        <div className="header-actions">
          <button 
            className="header-action-btn"
            onClick={clearAll}
            title="Clear all (Esc)"
          >
            🗑️
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="resizer-main">
        {/* Left Panel - Controls */}
        <div className="control-panel">
          <div className="panel-card">
            {/* Status Indicators */}
            <div className="status-indicators">
              <div className="status-item">
                <span className="status-label">File:</span>
                <span className="status-value">
                  {file ? file.name : 'No file selected'}
                </span>
              </div>
              <div className="status-item">
                <span className="status-label">Size:</span>
                <span className="status-value">
                  {file ? formatFileSize(fileSize) : '--'}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="control-tabs">
              <button 
                className={`control-tab ${activeTab === "upload" ? "active" : ""}`}
                onClick={() => setActiveTab("upload")}
              >
                <span className="tab-icon">📤</span>
                <span className="tab-label">Upload</span>
              </button>
              <button 
                className={`control-tab ${activeTab === "adjust" ? "active" : ""}`}
                onClick={() => file && setActiveTab("adjust")}
                disabled={!file}
              >
                <span className="tab-icon">⚙️</span>
                <span className="tab-label">Resize</span>
              </button>
              <button 
                className={`control-tab ${activeTab === "result" ? "active" : ""}`}
                onClick={() => outputUrl && setActiveTab("result")}
                disabled={!outputUrl}
              >
                <span className="tab-icon">📄</span>
                <span className="tab-label">Result</span>
              </button>
            </div>

            {/* Upload Section */}
            {activeTab === "upload" && (
              <div className="tab-content">
                <div className="upload-section">
                  <h3 className="section-title">Upload Image</h3>
                  <p className="section-subtitle">
                    Supported formats: {ALLOWED_FORMATS.join(', ').toUpperCase()}
                    <br />
                    Max size: {MAX_FILE_SIZE_MB}MB
                  </p>
                  
                  <div 
                    ref={dropAreaRef}
                    className={`upload-area ${dragActive ? "drag-active" : ""}`}
                    onClick={triggerFileInput}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={(e) => validateAndSetFile(e.target.files[0])}
                      style={{ display: "none" }}
                    />
                    
                    {!previewUrl ? (
                      <div className="upload-placeholder">
                        <div className="upload-icon">📁</div>
                        <h4>Drag & Drop Image Here</h4>
                        <p className="upload-hint">or click to browse files</p>
                        <div className="upload-limits">
                          <span className="limit-badge">Max {MAX_FILE_SIZE_MB}MB</span>
                          <span className="limit-badge">JPG, PNG, WebP</span>
                        </div>
                      </div>
                    ) : (
                      <div className="upload-preview">
                        <img src={previewUrl} alt="Preview" className="preview-image" />
                        <div className="preview-info">
                          <div className="preview-details">
                            <span className="file-name">{file.name}</span>
                            <span className="file-size">{formatFileSize(fileSize)}</span>
                          </div>
                          <button 
                            className="change-file-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerFileInput();
                            }}
                          >
                            Change File
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Adjust Section */}
            {activeTab === "adjust" && (
              <div className="tab-content">
                {/* Original Dimensions */}
                {originalDimensions.width > 0 && (
                  <div className="original-dimensions">
                    <div className="dimensions-card">
                      <span className="dimensions-label">Original Size:</span>
                      <span className="dimensions-value">
                        {originalDimensions.width} × {originalDimensions.height} px
                      </span>
                      <button 
                        className="reset-dimensions-btn"
                        onClick={resetToOriginal}
                        title="Reset to original size"
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                )}

                {/* Size Presets */}
                <div className="section">
                  <h3 className="section-title">
                    <span className="section-icon">🎯</span>
                    Quick Size Presets
                  </h3>
                  <p className="section-description">
                    Select from our most popular sizes
                  </p>
                  
                  <div className="size-presets-grid">
                    {sizePresets.map((presetItem) => (
                      <button
                        key={presetItem.id}
                        className={`size-preset-card ${preset === presetItem.id ? "selected" : ""}`}
                        onClick={() => handlePresetChange(presetItem.id)}
                        title={presetItem.description}
                      >
                        <div className="preset-header">
                          <span className="preset-icon">{presetItem.icon}</span>
                          <span className="preset-label">{presetItem.label}</span>
                        </div>
                        <div className="preset-dimensions">
                          {presetItem.width} × {presetItem.height}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform Presets */}
                <div className="section">
                  <h3 className="section-title">
                    <span className="section-icon">🌐</span>
                    Social Media Presets
                  </h3>
                  
                  <div className="platform-presets-grid">
                    {platformPresets.map((presetItem) => (
                      <button
                        key={presetItem.id}
                        className="platform-preset-btn"
                        onClick={() => handlePlatformPreset(presetItem)}
                        title={`${presetItem.label}: ${presetItem.width}×${presetItem.height}`}
                      >
                        <span className="platform-icon">{presetItem.icon}</span>
                        <span className="platform-name">{presetItem.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Dimensions */}
                <div className="section">
                  <h3 className="section-title">
                    <span className="section-icon">📐</span>
                    Custom Dimensions
                  </h3>
                  
                  <div className="dimension-controls">
                    <div className="dimension-input-group">
                      <label className="input-label">
                        Width (px)
                        <span className="input-hint">Max: {MAX_DIMENSION}px</span>
                      </label>
                      <div className="input-with-controls">
                        <button 
                          className="dim-control-btn decrease"
                          onClick={() => handleWidthChange(width - 10)}
                          disabled={loading || width <= 10}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={width}
                          onChange={(e) => handleWidthChange(e.target.value)}
                          className="dimension-input"
                          min="10"
                          max={MAX_DIMENSION}
                          disabled={loading}
                        />
                        <button 
                          className="dim-control-btn increase"
                          onClick={() => handleWidthChange(width + 10)}
                          disabled={loading || width >= MAX_DIMENSION}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="dimension-separator">×</div>

                    <div className="dimension-input-group">
                      <label className="input-label">
                        Height (px)
                        <span className="input-hint">Max: {MAX_DIMENSION}px</span>
                      </label>
                      <div className="input-with-controls">
                        <button 
                          className="dim-control-btn decrease"
                          onClick={() => handleHeightChange(height - 10)}
                          disabled={loading || height <= 10}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={height}
                          onChange={(e) => handleHeightChange(e.target.value)}
                          className="dimension-input"
                          min="10"
                          max={MAX_DIMENSION}
                          disabled={loading}
                        />
                        <button 
                          className="dim-control-btn increase"
                          onClick={() => handleHeightChange(height + 10)}
                          disabled={loading || height >= MAX_DIMENSION}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quick Scale Buttons */}
                  <div className="quick-scale-section">
                    <label className="scale-label">Quick Scale:</label>
                    <div className="scale-buttons">
                      {[0.5, 0.75, 1, 1.25, 1.5].map((multiplier) => (
                        <button
                          key={multiplier}
                          className={`scale-btn ${multiplier === 1 ? 'original' : ''}`}
                          onClick={() => multiplier === 1 ? resetToOriginal() : quickSizeChange(multiplier)}
                          disabled={loading}
                          title={multiplier === 1 ? 'Original size' : `Scale to ${multiplier * 100}%`}
                        >
                          {multiplier === 1 ? 'Original' : `${multiplier * 100}%`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Current Size Display */}
                  <div className="current-size-display">
                    <div className="size-display-card">
                      <span className="size-label">Target Size:</span>
                      <span className="size-value">{width} × {height} px</span>
                      {originalDimensions.width > 0 && (
                        <span className="size-change">
                          ({Math.round((width / originalDimensions.width) * 100)}% of original)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="options-section">
                    <div className="option-item">
                      <label className="option-checkbox">
                        <input
                          type="checkbox"
                          checked={keepAspectRatio}
                          onChange={(e) => setKeepAspectRatio(e.target.checked)}
                          disabled={loading}
                        />
                        <span className="checkbox-label">Maintain aspect ratio</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Validation Errors */}
                {Object.keys(validationErrors).length > 0 && (
                  <div className="validation-errors">
                    {Object.values(validationErrors).map((error, index) => (
                      <div key={index} className="validation-error">
                        ⚠️ {error}
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Button */}
                <button
                  className={`resize-button ${loading ? 'loading' : ''}`}
                  onClick={handleSubmit}
                  disabled={loading || !file || Object.keys(validationErrors).length > 0}
                >
                  {loading ? (
                    <>
                      <span className="button-spinner"></span>
                      Processing... {progress}%
                    </>
                  ) : (
                    <>
                      <span className="button-icon">✨</span>
                      Resize Image
                      <span className="button-hotkey">(Ctrl+R)</span>
                    </>
                  )}
                </button>

                {/* Progress Bar */}
                {loading && (
                  <div className="progress-section">
                    <div className="progress-info">
                      <span>Uploading & Processing</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <button 
                      className="cancel-button"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Result Section */}
            {activeTab === "result" && outputUrl && (
              <div className="tab-content">
                <div className="result-section">
                  <div className="result-header">
                    <h3 className="result-title">✓ Resize Complete!</h3>
                    <div className="result-dimensions-badge">
                      {width} × {height}
                    </div>
                  </div>
                  
                  <div className="result-actions">
                    <button 
                      className="result-action-btn primary"
                      onClick={handleDownload}
                    >
                      <span className="action-icon">⬇</span>
                      Download Image
                      <span className="action-hotkey">(Ctrl+S)</span>
                    </button>
                    
                    <button 
                      className="result-action-btn secondary"
                      onClick={() => window.open(outputUrl, '_blank')}
                    >
                      <span className="action-icon">👁️</span>
                      View in New Tab
                    </button>
                  </div>

                  <div className="result-stats">
                    <div className="stat-card">
                      <div className="stat-title">Original</div>
                      <div className="stat-value">{originalDimensions.width}×{originalDimensions.height}</div>
                    </div>
                    <div className="stat-arrow">→</div>
                    <div className="stat-card resized">
                      <div className="stat-title">Resized</div>
                      <div className="stat-value">{width}×{height}</div>
                    </div>
                  </div>

                  <div className="additional-actions">
                    <button 
                      className="additional-action-btn"
                      onClick={() => handleSubmit({ preventDefault: () => {} })}
                      disabled={loading}
                    >
                      <span className="action-icon">↻</span>
                      Resize Again
                    </button>
                    <button 
                      className="additional-action-btn"
                      onClick={clearAll}
                    >
                      <span className="action-icon">🆕</span>
                      New Image
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="preview-panel">
          <div className="preview-header">
            <h2 className="preview-title">
              {outputUrl ? 'Resized Result' : 'Image Preview'}
            </h2>
            <div className="preview-actions">
              {outputUrl && (
                <>
                  <span className="preview-badge">
                    {width}×{height} px
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="preview-content">
            {!file ? (
              <div className="empty-preview">
                <div className="empty-icon">🖼️</div>
                <h3>No Image Selected</h3>
                <p>Upload an image to begin resizing</p>
              </div>
            ) : outputUrl ? (
              <div className="result-preview">
                <img 
                  src={outputUrl} 
                  alt="Resized result" 
                  className="result-image"
                />
                <div className="result-overlay">
                  <div className="overlay-content">
                    <div className="image-size-info">
                      {width} × {height} pixels
                    </div>
                    <div className="image-actions">
                      <button 
                        className="overlay-action-btn"
                        onClick={handleDownload}
                      >
                        ⬇ Download
                      </button>
                      <button 
                        className="overlay-action-btn secondary"
                        onClick={() => window.open(outputUrl, '_blank')}
                      >
                        👁️ View Full
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="image-preview">
                <img 
                  src={previewUrl} 
                  alt="Original" 
                  className="original-image"
                />
                <div className="preview-info">
                  <div className="preview-size">
                    {originalDimensions.width} × {originalDimensions.height} px
                  </div>
                  <div className="preview-note">
                    Adjust settings on the left to resize
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Notifications */}
      <div className="notifications-container">
        {error && (
          <div className="notification error">
            <span className="notification-icon">⚠️</span>
            <span className="notification-message">{error}</span>
            <button 
              className="notification-close"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}
        
        {success && (
          <div className="notification success">
            <span className="notification-icon">✅</span>
            <span className="notification-message">{success}</span>
          </div>
        )}
      </div>
    </div>
  );
}