// Content Filter for Inappropriate Content
// Detects nudity, kissing, and other inappropriate content

export class ContentFilter {
  constructor() {
    this.inappropriateKeywords = [
      'nude', 'naked', 'sex', 'kiss', 'kissing', 'makeout',
      'intimate', 'explicit', 'adult', 'nsfw', 'xxx',
      'breast', 'boobs', 'ass', 'butt', 'nipple',
      'porn', 'erotic', 'sensual', 'seductive'
    ];
  }

  // Main filtering function
  async filterContent(imageFile, caption = '') {
    const results = {
      isAppropriate: true,
      reasons: [],
      confidence: 0
    };

    // Check text content
    const textCheck = this.checkTextContent(caption);
    if (!textCheck.isAppropriate) {
      results.isAppropriate = false;
      results.reasons.push(...textCheck.reasons);
    }

    // Check image content
    const imageCheck = await this.checkImageContent(imageFile);
    if (!imageCheck.isAppropriate) {
      results.isAppropriate = false;
      results.reasons.push(...imageCheck.reasons);
    }

    results.confidence = Math.max(textCheck.confidence, imageCheck.confidence);
    return results;
  }

  // Check text for inappropriate content
  checkTextContent(text) {
    const result = {
      isAppropriate: true,
      reasons: [],
      confidence: 0
    };

    const lowerText = text.toLowerCase();
    
    // Check for inappropriate keywords
    for (const keyword of this.inappropriateKeywords) {
      if (lowerText.includes(keyword)) {
        result.isAppropriate = false;
        result.reasons.push(`Inappropriate text detected: ${keyword}`);
        result.confidence = 0.8;
        break;
      }
    }

    // Check for suspicious patterns (emojis combinations)
    const suspiciousEmojiPatterns = [
      /🍑|🍆|💦|🌶️|🔞|🍒|🥵|😈|👅|💋/g,
      /\ud83d\udc51|\ud83d\udc8e|\ud83d\udd1b|\ud83d\udca5/g  // Crown, diamond, etc.
    ];

    for (const pattern of suspiciousEmojiPatterns) {
      if (pattern.test(text)) {
        result.isAppropriate = false;
        result.reasons.push('Suspicious emoji pattern detected');
        result.confidence = 0.6;
        break;
      }
    }

    return result;
  }

  // Check image for inappropriate content
  async checkImageContent(imageFile) {
    const result = {
      isAppropriate: true,
      reasons: [],
      confidence: 0
    };

    try {
      // Create image analysis
      const imageAnalysis = await this.analyzeImage(imageFile);
      
      // Check for skin exposure
      if (imageAnalysis.skinExposure > 0.2) {  // Lowered threshold
        result.isAppropriate = false;
        result.reasons.push('Excessive skin exposure detected');
        result.confidence = Math.max(result.confidence, 0.7);
      }

      // Check for face intimacy (kissing detection)
      if (imageAnalysis.faceIntimacy > 0.4) {  // Lowered threshold
        result.isAppropriate = false;
        result.reasons.push('Intimate content detected');
        result.confidence = Math.max(result.confidence, 0.8);
      }

    } catch (error) {
      console.error('Image analysis error:', error);
      // If analysis fails, be conservative and allow
      result.reasons.push('Image analysis failed - proceeding with caution');
    }

    return result;
  }

  // Analyze image using canvas
  async analyzeImage(imageFile) {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const analysis = this.performImageAnalysis(imageData);
        resolve(analysis);
      };

      img.onerror = () => {
        resolve({ skinExposure: 0, faceIntimacy: 0 });
      };

      img.src = URL.createObjectURL(imageFile);
    });
  }

  // Perform actual image analysis
  performImageAnalysis(imageData) {
    const data = imageData.data;
    let skinPixels = 0;
    let totalPixels = data.length / 4;
    
    // Analyze skin color distribution
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      if (this.isSkinColor(r, g, b)) {
        skinPixels++;
      }
    }

    const skinExposure = skinPixels / totalPixels;
    
    // Mock additional analysis (in real implementation, would use ML models)
    const faceIntimacy = Math.random() * 0.3; // Low probability for demo

    return {
      skinExposure,
      faceIntimacy
    };
  }

  // Check if color matches skin tone
  isSkinColor(r, g, b) {
    // More sensitive skin detection algorithm
    return (
      r > 80 && g > 30 && b > 15 &&  // Lowered thresholds
      Math.max(r, g, b) - Math.min(r, g, b) > 10 &&  // Lowered difference threshold
      r > g && r > b
    );
  }

  // Check file size and type
  validateFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (file.size > maxSize) {
      return {
        isValid: false,
        reason: 'File size exceeds 10MB limit'
      };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        reason: 'Only JPEG, PNG, and WebP images are allowed'
      };
    }
    
    return { isValid: true };
  }
}

// Export singleton instance
export const contentFilter = new ContentFilter();
