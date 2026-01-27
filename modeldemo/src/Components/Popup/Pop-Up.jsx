import React, { useRef } from 'react';
import './Pop-Up.css';

function Popup({ 
  isOpen, 
  onClose, 
  title = "Select Image", 
  icon = <i className="fa-solid fa-cloud-arrow-up"></i>, 
  buttonText = "Upload Image", 
  imageGroup = [],
  selectedImage,
  onSelectImage,
  onFileUpload,
  onFinalSelect 
}) {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileClick = () => {
    fileInputRef.current.click();
  };

  return (
   <div>dgf</div>
  );
}

export default Popup;