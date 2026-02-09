import { useEffect, useState } from "react";
import api from "../../Services/api";
import "./ImagePricingAdmin.css";

const SIZES = ["1024x1024", "1024x1536", "1536x1024"];
const QUALITIES = ["basic", "standard", "premium"];

export default function ImagePricingAdmin() {
  const [userRole, setUserRole] = useState("");
  const [pricing, setPricing] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({ model: false, tryon: false });
  
  // Selection state for users
  const [selectedTryon, setSelectedTryon] = useState({
    quality: "",
    size: "",
    price: 0
  });
  
  const [selectedModel, setSelectedModel] = useState({
    size: "",
    price: 0
  });

  const setVal = (key, val) =>
    setPricing(prev => ({ ...prev, [key]: Number(val) || 0 }));

  const getVal = key => Number(pricing[key] || 0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUserRole(payload.role);
      loadPricingData(payload.role);
    } catch {
      console.error("Invalid token");
    }
  }, []);

  const loadPricingData = async (role) => {
    setLoading(true);
    try {
      if (role === "super_admin") {
        // Super admin fetches from admin endpoints
        const [modelRes, tryonRes] = await Promise.all([
          api.get("/admin/model-pricing"),
          api.get("/admin/tryon-pricing")
        ]);

        console.log("Admin Model Pricing:", modelRes.data);
        console.log("Admin Tryon Pricing:", tryonRes.data);

        const modelPrices = modelRes.data?.size_only || {};
        const tryonPrices = tryonRes.data?.quality_size || {};

        // Store model pricing for both plans
        SIZES.forEach(s => {
          if (modelPrices[s]) {
            setVal(`mg_${s}_n`, modelPrices[s]?.normal || 0);
            setVal(`mg_${s}_e`, modelPrices[s]?.enterprise || 0);
          } else {
            setVal(`mg_${s}_n`, 0);
            setVal(`mg_${s}_e`, 0);
          }
        });

        // Store tryon pricing for both plans
        QUALITIES.forEach(q => {
          SIZES.forEach(s => {
            if (tryonPrices[q] && tryonPrices[q][s]) {
              setVal(`vt_${q}_${s}_n`, tryonPrices[q][s]?.normal || 0);
              setVal(`vt_${q}_${s}_e`, tryonPrices[q][s]?.enterprise || 0);
            } else {
              setVal(`vt_${q}_${s}_n`, 0);
              setVal(`vt_${q}_${s}_e`, 0);
            }
          });
        });

      } else {
        // Regular users (normal/enterprise) fetch from user pricing endpoints
        const [modelRes, tryonRes] = await Promise.all([
          api.get("/pricing/model"),
          api.get("/pricing/tryon")
        ]);

        console.log("User Model Pricing:", modelRes.data);
        console.log("User Tryon Pricing:", tryonRes.data);

        const modelPrices = modelRes.data?.prices || {};
        const tryonPrices = tryonRes.data?.prices || {};

        // For users, store single price (based on their role)
        SIZES.forEach(s => {
          setVal(`mg_${s}`, modelPrices[s] || 0);
        });

        QUALITIES.forEach(q => {
          SIZES.forEach(s => {
            setVal(`vt_${q}_${s}`, tryonPrices[q]?.[s] || 0);
          });
        });
      }
    } catch (err) {
      console.error("Failed to load pricing:", err);
      alert("Failed to load pricing data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const saveModelPricing = async () => {
    if (userRole !== "super_admin") return;
    
    setSaving(prev => ({ ...prev, model: true }));
    try {
      const payload = { size_only: {} };
      
      SIZES.forEach(s => {
        payload.size_only[s] = {
          normal: getVal(`mg_${s}_n`),
          enterprise: getVal(`mg_${s}_e`)
        };
      });

      await api.put("/admin/model-pricing", payload);
      alert("✅ Model generation pricing saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert(`❌ Failed to save: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSaving(prev => ({ ...prev, model: false }));
    }
  };

  const saveTryonPricing = async () => {
    if (userRole !== "super_admin") return;
    
    setSaving(prev => ({ ...prev, tryon: true }));
    try {
      const payload = { quality_size: {} };
      
      QUALITIES.forEach(q => {
        payload.quality_size[q] = {};
        SIZES.forEach(s => {
          payload.quality_size[q][s] = {
            normal: getVal(`vt_${q}_${s}_n`),
            enterprise: getVal(`vt_${q}_${s}_e`)
          };
        });
      });

      await api.put("/admin/tryon-pricing", payload);
      alert("✅ Virtual try-on pricing saved successfully!");
    } catch (error) {
      console.error("Save error:", error);
      alert(`❌ Failed to save: ${error.response?.data?.detail || error.message}`);
    } finally {
      setSaving(prev => ({ ...prev, tryon: false }));
    }
  };

  // Get price for display based on user role
  const getPrice = (type, quality, size) => {
    if (userRole === "super_admin") {
      // Admin sees 0 since they're configuring
      return 0;
    }
    
    if (userRole === "enterprise") {
      // Enterprise users - check if we have stored both prices
      if (type === "mg") {
        return getVal(`mg_${size}_e`) || getVal(`mg_${size}`);
      } else {
        return getVal(`vt_${quality}_${size}_e`) || getVal(`vt_${quality}_${size}`);
      }
    } else {
      // Normal users
      if (type === "mg") {
        return getVal(`mg_${size}_n`) || getVal(`mg_${size}`);
      } else {
        return getVal(`vt_${quality}_${size}_n`) || getVal(`vt_${quality}_${size}`);
      }
    }
  };

  // Handle Virtual Try-On selection
  const handleTryonSelect = (quality, size) => {
    if (userRole === "super_admin") return;
    
    const price = getPrice("vt", quality, size);
    setSelectedTryon({ quality, size, price });
  };

  // Handle Model Generation selection
  const handleModelSelect = (size) => {
    if (userRole === "super_admin") return;
    
    const price = getPrice("mg", null, size);
    setSelectedModel({ size, price });
  };

  // Check if tryon item is selected
  const isTryonSelected = (quality, size) => {
    return selectedTryon.quality === quality && selectedTryon.size === size;
  };

  // Check if model item is selected
  const isModelSelected = (size) => {
    return selectedModel.size === size;
  };

  const handleFinalSelect = async () => {
  try {
    // Save Model Generation selection
    if (selectedModel.size) {
      await api.post("/pricing/select", {
        mode: "model",
        size: selectedModel.size
      });
    }

    // Save Virtual Try-On selection
    if (selectedTryon.size && selectedTryon.quality) {
      await api.post("/pricing/select", {
        mode: "tryon",
        quality: selectedTryon.quality,
        size: selectedTryon.size
      });
    }

    alert("✅ Selection saved successfully!");
  } catch (error) {
    console.error("Selection save failed:", error);
    alert(
      error.response?.data?.detail ||
      "❌ Failed to save selection. Please try again."
    );
  }
};


  // Render editable price input for super admin
  const renderAdminPriceInput = (type, quality, size, plan) => {
    const planSuffix = plan === "enterprise" ? "_e" : "_n";
    const key = `${type}${quality ? '_' + quality : ''}_${size}${planSuffix}`;
    
    return (
      <div className="input-groups">
        <input
          type="number"
          min="0"
          step="0.01"
          className="price-input"
          disabled={loading}
          value={pricing[key] ?? ""}
          onChange={e => setVal(key, e.target.value)}
          placeholder="0.00"
        />
      </div>
    );
  };

  // Render price display for regular users
  const renderUserPrice = (type, quality, size) => {
    const price = getPrice(type, quality, size);
    return (
      <div className="price-display">
        <span className="price-value">
          ₹{price.toFixed(2)}
        </span>
        <span className="price-unit"></span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="container">
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading pricing data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        {/* Header */}
        <div className="header">
          <h1 className="header-title">
            {userRole === "super_admin" 
              ? "Image Price Configuration" 
              : "Select Image Quality"
            }
          </h1>
          <div className={`auth-status ${userRole === "super_admin" ? 'admin' : 'user'}`}>
            {userRole === "super_admin" 
              ? "🔧 Super Admin Dashboard" 
              : userRole === "enterprise" 
                ? "🏢 Enterprise Plan" 
                : "👤 StandardUser Plan"
            }
          </div>
        </div>

        {/* Configuration Grid */}
        <div className="dashboard-grid">
          {/* Virtual Try-On Card */}
          <div className="config-card">
            <div className="card-headers">
              Virtual Try-On Pricing
            </div>

            <div className="pricing-section">
              {userRole === "super_admin" && (
                <table className="pricing-table">
                  <thead>
                    <tr>
                      <th>Image Size</th>
                      <th>
                        <span className="plan-badge plan-normal">
                          👤 Normal Plan
                        </span>
                      </th>
                      <th>
                        <span className="plan-badge plan-enterprise">
                          🏢 Enterprise Plan
                        </span>
                      </th>
                    </tr>
                  </thead>
                </table>
              )}
              
              {/* Show all qualities */}
              {QUALITIES.map(q => (
                <div key={q}>
                  <div className={`quality-badge quality-${q}`}>
                    {q.charAt(0).toUpperCase() + q.slice(1)} Quality
                  </div>
                  
                  <table className="pricing-table">
                    {userRole !== "super_admin" && (
                      <thead>
                        <tr>
                          <th>Image Size</th>
                          <th>Price per Image</th>
                         
                        </tr>
                      </thead>
                    )}
                    <tbody>
                      {SIZES.map(s => (
                        <tr 
                          key={`${q}_${s}`}
                          className={`price-row ${isTryonSelected(q, s) ? 'selected' : ''} ${userRole !== "super_admin" ? 'clickable-row' : ''}`}
                          onClick={() => userRole !== "super_admin" && handleTryonSelect(q, s)}
                        >
                          <td>
                            <strong>{s.replace("x", " × ")}</strong>
                          </td>
                          {userRole === "super_admin" ? (
                            <>
                              <td>
                                {renderAdminPriceInput("vt", q, s, "normal")}
                              </td>
                              <td>
                                {renderAdminPriceInput("vt", q, s, "enterprise")}
                              </td>
                            </>
                          ) : (
                            <>
                              <td>
                                {renderUserPrice("vt", q, s)}
                              </td>
                              
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {userRole === "super_admin" && (
              <div className="card-actions">
                <button
                  className="save-button save-tryon"
                  disabled={saving.tryon}
                  onClick={saveTryonPricing}
                >
                  {saving.tryon ? (
                    <>
                      <span className="loading-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>Save</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Model Generation Card */}
          <div className="config-card">
            <div className="card-headers">
              Model Generation Pricing
            </div>

            <div className="pricing-section">
              <table className="pricing-table">
                <thead>
                  <tr>
                    <th>Image Size</th>
                    {userRole === "super_admin" ? (
                      <>
                        <th>
                          <span className="plan-badge plan-normal">
                            👤 Normal Plan
                          </span>
                        </th>
                        <th>
                          <span className="plan-badge plan-enterprise">
                            🏢 Enterprise Plan
                          </span>
                        </th>
                      </>
                    ) : (
                      <>
                        <th>Price per Image</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {SIZES.map(s => (
                    <tr 
                      key={s}
                      className={`price-row ${isModelSelected(s) ? 'selected' : ''} ${userRole !== "super_admin" ? 'clickable-row' : ''}`}
                      onClick={() => userRole !== "super_admin" && handleModelSelect(s)}
                    >
                      <td>
                        <strong>{s.replace("x", " × ")}</strong>
                      </td>
                      {userRole === "super_admin" ? (
                        <>
                          <td>
                            {renderAdminPriceInput("mg", null, s, "normal")}
                          </td>
                          <td>
                            {renderAdminPriceInput("mg", null, s, "enterprise")}
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            {renderUserPrice("mg", null, s)}
                          </td>
                         
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {userRole === "super_admin" && (
              <div className="card-actions">
                <button
                  className="save-button save-model"
                  disabled={saving.model}
                  onClick={saveModelPricing}
                >
                  {saving.model ? (
                    <>
                      <span className="loading-spinner"></span>
                      Saving...
                    </>
                  ) : (
                    <>Save</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Purchase Section for Users */}
        {userRole !== "super_admin" && (selectedTryon.size || selectedModel.size) && (
          <div className="purchase-section visible">
            <div className="purchase-summary">


              <div className="selected-item-details">
                {/* Virtual Try-On Summary */}
                <div className="summary-card">
                  <div className="summary-header">
                    <div className="summary-title virtual-tryon-title">
                      <span>✨</span> Virtual Try-On
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => setSelectedTryon({ quality: "", size: "", price: 0 })}
                    >
                      X
                    </button>
                  </div>

                  <div className="tryon-summary-line">
                    <div>
                      <span className="summary-quality">
                        {selectedTryon.quality.charAt(0).toUpperCase() + selectedTryon.quality.slice(1)}
                      </span>
                      <span className="summary-size" style={{ marginLeft: "8px" }}>
                        {selectedTryon.size.replace("x", " × ")}
                      </span>
                    </div>
                    <span className="summary-price">
                      ₹{selectedTryon.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Model Generation Summary */}
                <div className="summary-card">
                  <div className="summary-header">
                    <div className="summary-title model-generation-title">
                      <span>🤖</span> Model Generation
                    </div>
                    <button
                      className="remove-btn"
                      onClick={() => setSelectedModel({ size: "", price: 0 })}
                    >
                      X
                    </button>
                  </div>

                  <div className="model-summary-line">
                    <span className="summary-size">
                      {selectedModel.size.replace("x", " × ")}
                    </span>
                    <span className="summary-price">
                      ₹{selectedModel.price.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>


              {/* Purchase Button */}
             
            </div>
             <div className="purchase-actions">
                <button className="purchase-button"
                onClick={handleFinalSelect}
                >
                  Select
                </button>
              </div>
          </div>
        )}


      </div>
    </div>
  );
}