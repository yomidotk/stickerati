import { removeBackground as imglyRemoveBackground } from '@imgly/background-removal';

/**
 * Removes the background from a given image file.
 * The processing runs completely client-side using @imgly/background-removal.
 * @param {File} file 
 * @returns {Promise<string>} Object URL of the resulting transparent PNG blob
 */
export async function removeBackground(file) {
  try {
    // Using default config which downloads models from unpkg/imgly CDN,
    // but the actual image processing happens 100% locally in the browser via WebAssembly.
    const blob = await imglyRemoveBackground(file);
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
