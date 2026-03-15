/**
 * Resize and compress image to Base64
 * Max width: 1024px
 * Target size: < 300KB
 */
export async function resizeAndCompressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions
        const maxWidth = 1024;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        // Start with high quality
        let quality = 0.9;
        let base64 = canvas.toDataURL('image/jpeg', quality);
        
        // Reduce quality until size is acceptable (< 300KB)
        // Base64 adds ~33% overhead, so target ~225KB in base64
        const maxBase64Size = 300 * 1024 * 1.33;
        
        while (base64.length > maxBase64Size && quality > 0.5) {
          quality -= 0.1;
          base64 = canvas.toDataURL('image/jpeg', quality);
        }

        if (base64.length > maxBase64Size) {
          reject(new Error('Image too large. Please use a smaller image (max ~200KB).'));
          return;
        }

        resolve(base64);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): string | null {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  
  if (!validTypes.includes(file.type)) {
    return 'Please upload a valid image file (JPEG, PNG, or WebP)';
  }

  // Check file size (max 5MB before compression)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return 'Image file is too large. Please use an image smaller than 5MB.';
  }

  return null;
}
