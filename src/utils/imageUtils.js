import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

/**
 * Resizes and compresses an image to improve processing speed.
 * @param {File|Blob} file 
 * @param {number} maxDimension 
 * @returns {Promise<Blob>}
 */
export async function compressImage(file, maxDimension = 800) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      
      if (width > maxDimension || height > maxDimension) {
        const scale = maxDimension / Math.max(width, height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/webp', 0.9); // Use WebP for optimal compression
    };
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Removes the background from a given image file.
 * The processing runs completely client-side using @imgly/background-removal.
 * @param {Blob|File} file 
 * @returns {Promise<string>} Object URL of the resulting transparent PNG blob
 */
export async function removeBackground(file) {
  try {
    const config = {
      model: 'isnet', // Use the highest quality model available
      rescale: false  // Disable internal downscaling since we already compressed it to a good size
    };
    const blob = await imglyRemoveBackground(file, config);
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
}

/**
 * Creates a new image with a solid white sticker border around the transparent pixels.
 * @param {string} imageUrl 
 * @param {number} thickness 
 * @returns {Promise<string>} Object URL of the bordered PNG blob
 */
export async function addWhiteBorder(imageUrl, thickness = 15) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width + thickness * 2;
      canvas.height = img.height + thickness * 2;
      const ctx = canvas.getContext('2d');
      
      // Create a solid white silhouette of the image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tCtx = tempCanvas.getContext('2d');
      tCtx.drawImage(img, 0, 0);
      tCtx.globalCompositeOperation = 'source-in';
      tCtx.fillStyle = 'white';
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      
      // Draw the silhouette in a circle to create the thick border
      const steps = 36;
      for (let i = 0; i < steps; i++) {
        const angle = (i * 2 * Math.PI) / steps;
        const x = thickness + thickness * Math.cos(angle);
        const y = thickness + thickness * Math.sin(angle);
        ctx.drawImage(tempCanvas, x, y);
      }
      
      // Draw the original image on top in the center
      ctx.drawImage(img, thickness, thickness);
      
      canvas.toBlob((blob) => {
        resolve(URL.createObjectURL(blob));
      }, 'image/png');
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
}
