import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./GenerateImage.css";
import "../Header/Header.css";
import api from "../../Services/api";

function GenerateImage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [dateRange, setDateRange] = useState({
    fromDate: "",
    toDate: ""
  });
  const [showDateModal, setShowDateModal] = useState(false);
  const [searchBatch, setSearchBatch] = useState("");
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [downloadingBatch, setDownloadingBatch] = useState(null);
  const [deletingBatch, setDeletingBatch] = useState(null);

  const dateRangeRef = useRef(null);

  // Load images
  const loadImages = async () => {
    setLoading(true);
    setError("");
    setImages([]);

    try {
      const params = {};
      if (searchBatch) params.job_name = searchBatch;
      if (dateRange.fromDate) params.from_date = dateRange.fromDate;
      if (dateRange.toDate) params.to_date = dateRange.toDate;

      const res = await api.get("/user-images/my/images", { params });

      if (!res.data?.images || res.data.images.length === 0) {
        setError("No images found");
        return;
      }

      setImages(res.data.images);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  // Download ZIP
  const downloadZip = async (batchName) => {
    try {
      setDownloadingBatch(batchName);
      const res = await api.get("/user-images/my/download-zip", {
        params: { job_name: batchName },
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${batchName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("❌ Failed to download ZIP");
    } finally {
      setDownloadingBatch(null);
    }
  };

  // Delete batch
  const deleteBatch = async (batchName) => {
    if (!window.confirm(`Are you sure you want to delete batch "${batchName}"?`)) {
      return;
    }

    try {
      setDeletingBatch(batchName);
      const clothsInBatch = images.filter(img => img.job_name === batchName);
      const deletePromises = clothsInBatch.map(cloth =>
        api.delete("/user-images/my/cloth", {
          params: { job_name: cloth.job_name, cloth_name: cloth.cloth_name }
        })
      );

      await Promise.all(deletePromises);
      await loadImages();
      alert(`✅ Batch "${batchName}" deleted successfully!`);
    } catch (err) {
      alert("❌ Failed to delete batch: " + (err.response?.data?.detail || err.message));
    } finally {
      setDeletingBatch(null);
    }
  };

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    loadImages();
  };

  // Date range handlers
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const applyDateRange = () => {
    loadImages();
    setShowDateModal(false);
  };

  const clearDateRange = () => {
    setDateRange({ fromDate: "", toDate: "" });
    loadImages();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  // Close modal on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateRangeRef.current && !dateRangeRef.current.contains(event.target)) {
        setShowDateModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDateRange({ fromDate: today, toDate: today });
    if (location.state?.batchName) setSearchBatch(location.state.batchName);
  }, []);

  // Load images when filters change
  useEffect(() => {
    if (dateRange.fromDate || dateRange.toDate || searchBatch) {
      loadImages();
    }
  }, [dateRange.fromDate, dateRange.toDate, searchBatch]);

  // Group by batch
  const batches = images.reduce((acc, item) => {
    acc[item.job_name] = acc[item.job_name] || [];
    acc[item.job_name].push(item);
    return acc;
  }, {});

  return (
    <div className="right-section">
      {/* HEADER */}
      <div className="header">
        <div className="header-left">
          <h1 className="header-title">Generated Images</h1>
        </div>
        <div className="header-right">
          <div className="header-controls">
            {/* SEARCH */}
            <div className="search-container">
              <div className="search-wrapper">
                <form onSubmit={handleSearch} className="search-form">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search a batch..."
                    value={searchBatch}
                    onChange={(e) => setSearchBatch(e.target.value)}
                  />
                  {searchBatch && (
                    <button
                      type="button"
                      className="clear-search-btn"
                      onClick={() => setSearchBatch("")}
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  )}
                  <div className="search-icon-right">
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </div>
                </form>
              </div>
            </div>

            {/* DATE RANGE PICKER */}
            <div className="date-range-container" ref={dateRangeRef}>
              <div 
                className="date-range-wrapper"
                onClick={() => setShowDateModal(!showDateModal)}
              >
                <div className="date-range-display">
                  <div className="date-range-values">
                    {dateRange.fromDate || dateRange.toDate ? (
                      <>
                        <div className="date-item">
                          <span className="date-label">From:</span>
                          <span className="date-value">
                            {dateRange.fromDate ? formatDate(dateRange.fromDate) : "Any"}
                          </span>
                        </div>
                        <div className="date-item">
                          <span className="date-label">To:</span>
                          <span className="date-value">
                            {dateRange.toDate ? formatDate(dateRange.toDate) : "Any"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="date-placeholder">Select date range</span>
                    )}
                  </div>
                  {(dateRange.fromDate || dateRange.toDate) && (
                    <button
                      className="clear-date-range-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearDateRange();
                      }}
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  )}
                </div>
                <div className="date-range-icon">
                  <i className="fa-solid fa-calendar-days"></i>
                </div>
              </div>

              {/* DATE RANGE MODAL */}
             {showDateModal && (
          <>
            <div 
              className="modal-backdrop" 
              onClick={() => setShowDateModal(false)}
            />
            <div className="date-range-modal">
              <div className="date-range-header">
                <h4>Select Date Range</h4>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowDateModal(false)}
                >
                  <i className="fa-solid fa-times"></i>
                </button>
              </div>
              <div className="date-range-fields">
                <div className="date-field">
                  <label htmlFor="fromDate">From Date</label>
                  <input
                    type="date"
                    id="fromDate"
                    name="fromDate"
                    value={dateRange.fromDate}
                    onChange={handleDateRangeChange}
                    max={dateRange.toDate || undefined}
                  />
                </div>
                <div className="date-field">
                  <label htmlFor="toDate">To Date</label>
                  <input
                    type="date"
                    id="toDate"
                    name="toDate"
                    value={dateRange.toDate}
                    onChange={handleDateRangeChange}
                    min={dateRange.fromDate || undefined}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
              <button
                className="date-range-apply-btn"
                onClick={applyDateRange}
                disabled={!dateRange.fromDate && !dateRange.toDate}
              >
                Apply Date Range
              </button>
            </div>
          </>
        )}
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="generate-content">
        <div className="generate-instructions">
          {loading && <div className="loader">Loading images...</div>}
          {error && <div className="error">{error}</div>}

          {Object.entries(batches).map(([batchName, cloths]) => (
            <div key={batchName} className="batch-box">
              <div className="batch-header">
                <div className="batch-title">
                  <i className="fa-solid fa-layer-group"></i>
                  <div>{batchName}</div>
                </div>
                <div className="batch-actions">
                  <button
                    className="download-zip-btn"
                    disabled={downloadingBatch === batchName}
                    onClick={() => downloadZip(batchName)}
                  >
                    {downloadingBatch === batchName ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i> Downloading...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-download"></i> Download
                      </>
                    )}
                  </button>
                  <button
                    className="delete-batch-btn"
                    disabled={deletingBatch === batchName}
                    onClick={() => deleteBatch(batchName)}
                  >
                    {deletingBatch === batchName ? (
                      <>
                        <i className="fa-solid fa-spinner fa-spin"></i> Deleting...
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-trash"></i> Delete
                      </>
                    )}
                  </button>
                </div>
              </div>

              {cloths.map((cloth, clothIdx) => (
                <div key={clothIdx} className="row">
                  <div className="tile cloth">
                    <a href={cloth.cloth_image_url} target="_blank" rel="noreferrer">
                      <img src={cloth.cloth_image_url} alt={`Cloth ${clothIdx + 1}`} />
                    </a>
                  </div>
                  <div className="separator" />
                  {cloth.generated_urls?.map((url, imgIdx) => (
                    <div key={imgIdx} className="tile">
                      <a href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt={`Generated ${imgIdx + 1}`} />
                      </a>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GenerateImage;

