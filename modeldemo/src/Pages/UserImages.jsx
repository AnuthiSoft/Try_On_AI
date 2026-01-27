import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from "../Services/api";

const UserImages = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchUserImages();
  }, []);

  /* ===============================
     FETCH USER IMAGES
  =============================== */
  const fetchUserImages = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await api.get("/user-images/my/images");
      setImages(res.data?.images || []);
    } catch (err) {
      setError("Failed to load images. Please login again.");
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     GENERATE IMAGE
  =============================== */
  const handleGenerateImage = async () => {
    try {
      setLoading(true);

      const payload = {
        prompt: "A beautiful AI generated image",
        size: "1024x1024"
      };

      await api.post("/image/generate", payload);
      await fetchUserImages();
    } catch (err) {
      setError("Failed to generate image");
      console.error("Generate error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     DELETE IMAGE
  =============================== */
  const handleDeleteImage = async (imageId) => {
    if (!window.confirm("Delete this image?")) return;

    try {
      await api.delete(`/user-images/my/image/${imageId}`);
      setImages(prev => prev.filter(img => (img.id || img._id) !== imageId));
    } catch (err) {
      setError("Failed to delete image");
      console.error("Delete error:", err);
    }
  };

  if (loading && images.length === 0) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading your images...</p>
      </div>
    );
  }

  return (
    <div className="user-images-container">
      <div className="user-header">
        <div>
          <h1>My Images</h1>
          <p className="user-info">
            {user?.email} • {user?.role}
          </p>
        </div>
        <div className="header-actions">
          <button
            onClick={handleGenerateImage}
            className="generate-btn"
            disabled={loading}
          >
            Generate New Image
          </button>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="error-alert">
          {error}
          <button onClick={fetchUserImages}>Retry</button>
        </div>
      )}

      {images.length === 0 ? (
        <div className="empty-state">
          <p>No images yet. Generate your first image!</p>
          <button onClick={handleGenerateImage} className="generate-btn">
            Generate Image
          </button>
        </div>
      ) : (
        <div className="images-grid">
          {images.map((image) => (
            <div key={image.id || image._id} className="image-card">
              <img
                src={image.url || image.image_url}
                alt={image.filename || "Generated image"}
                className="image-preview"
              />
              <div className="image-info">
                <h3>{image.filename || "Image"}</h3>
                <p>
                  Created:{" "}
                  {image.created_at &&
                    new Date(image.created_at).toLocaleDateString()}
                </p>
                {image.prompt && <p>Prompt: {image.prompt}</p>}
              </div>
              <div className="image-actions">
                <button className="download-btn">Download</button>
                <button
                  className="delete-btn"
                  onClick={() =>
                    handleDeleteImage(image.id || image._id)
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserImages;
