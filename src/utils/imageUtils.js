// Utility functions for handling images in the application

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Get the correct vehicle image URL based on the image path
 * @param {string} vehicleImagePath - The image path from the database
 * @returns {string} - The full URL to the image
 */
// ...existing code...

// ...existing code...

export const getVehicleImageUrl = (vehicleImagePath) => {
  if (!vehicleImagePath) {
    console.debug('No image path provided, using placeholder');
    return '/placeholder-vehicle.png';
  }

  // If it's already an absolute URL, return as-is
  if (/^https?:\/\//i.test(vehicleImagePath)) {
    return vehicleImagePath;
  }

  // Clean the filename - use just the base name
  const filename = vehicleImagePath.split(/[\/\\]/).pop();
  
  // Construct clean URL
  const base = BACKEND_URL.replace(/\/+$/, '');
  const imageUrl = `${base}/uploads/vehicles/${filename}`;
  
  // Log the URL transformation for debugging
  console.debug('Image URL transformation:', {
    original: vehicleImagePath,
    filename,
    final: imageUrl
  });

  return imageUrl;
};

export const handleImageError = (e, fallbackSrc = '/placeholder-vehicle.png') => {
  if (!e.target.src.includes(fallbackSrc)) {
    const originalSrc = e.target.src;
    console.warn('🚨 Image failed to load:', {
      originalSrc,
      fallbackSrc,
      vehicleId: e.target.dataset.vehicleId || 'unknown'
    });
    
    e.target.onerror = null; // Prevent infinite loop
    e.target.src = fallbackSrc;
    
    // Add visual indicator class for missing images
    e.target.classList.add('image-load-error');
  }
};

// Add new utility function to preload images
export const preloadVehicleImage = (vehicleImagePath) => {
  const url = getVehicleImageUrl(vehicleImagePath);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};