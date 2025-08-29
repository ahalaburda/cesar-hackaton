const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');

class ImageGenerationService {
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    this.baseImagePath = path.join(__dirname, '../assets/base_monkey.png');
  }

  /**
   * Generate a new avatar image based on the base image and accessories
   * @param {Array} accessories - Array of accessories to add
   * @param {string} userId - User ID for tracking
   * @returns {Promise<string>} - URL of the generated image
   */
  async generateAvatar(accessories = [], userId) {
    try {
      // Read the base image
      const baseImage = fs.readFileSync(this.baseImagePath);
      const base64Image = baseImage.toString('base64');

      // Build the prompt based on accessories
      const accessoriesText = accessories.length > 0 
        ? accessories.join(', ') 
        : 'no accessories';

      const prompt = `A cute animated cartoon monkey, standing in front view, same style and proportions as the base image. 
Add the following accessories: [${accessoriesText}]. 
Keep the same colors, lighting, and drawing style as the base image. 
Do not change pose, size, or proportions of the monkey.`;

      console.log(`Generating avatar for user ${userId} with accessories: ${accessoriesText}`);

      // Create content with image and text
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Image,
            },
          },
        ],
      });

      // Extract the generated image
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          
          // Save the image locally and return the path
          const outputPath = path.join(__dirname, `../assets/generated_${userId}_${Date.now()}.png`);
          fs.writeFileSync(outputPath, buffer);
          
          console.log(`Avatar generated successfully for user ${userId}: ${outputPath}`);
          return outputPath;
        }
      }

      throw new Error('No image generated in response');
    } catch (error) {
      console.error('Error generating avatar:', error);
      throw new Error('Failed to generate avatar image');
    }
  }

  /**
   * Generate avatar with specific prompt customization
   * @param {string} customPrompt - Custom prompt for the avatar
   * @param {string} userId - User ID for tracking
   * @returns {Promise<string>} - URL of the generated image
   */
  async generateCustomAvatar(customPrompt, userId) {
    try {
      console.log(`Generating custom avatar for user ${userId} with prompt: ${customPrompt}`);

      // Generate image using Gemini 2.5 Flash Image
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: customPrompt,
      });

      // Extract the generated image
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, "base64");
          
          // Save the image locally and return the path
          const outputPath = path.join(__dirname, `../assets/custom_${userId}_${Date.now()}.png`);
          fs.writeFileSync(outputPath, buffer);
          
          console.log(`Custom avatar generated successfully for user ${userId}: ${outputPath}`);
          return outputPath;
        }
      }

      throw new Error('No image generated in response');
    } catch (error) {
      console.error('Error generating custom avatar:', error);
      throw new Error('Failed to generate custom avatar image');
    }
  }

  /**
   * Get available accessories based on user level
   * @param {number} level - User level
   * @returns {Array} - Array of available accessories
   */
  getAvailableAccessories(level) {
    const baseAccessories = ['collar', 'bracelet'];
    const level2Accessories = [...baseAccessories, 'hat'];
    const level3Accessories = [...level2Accessories, 'sneakers', 'glasses'];
    const level4Accessories = [...level3Accessories, 'backpack', 'watch'];
    const level5Accessories = [...level4Accessories, 'necklace', 'earrings'];

    if (level >= 5) return level5Accessories;
    if (level >= 4) return level4Accessories;
    if (level >= 3) return level3Accessories;
    if (level >= 2) return level2Accessories;
    return baseAccessories;
  }

  /**
   * Calculate cost for avatar generation based on accessories
   * @param {Array} accessories - Array of accessories
   * @returns {number} - Cost in bananas
   */
  calculateGenerationCost(accessories = []) {
    const baseCost = 1; // Base cost for generating avatar
    const accessoryCost = accessories.length * 0.5; // 0.5 bananas per accessory
    return Math.ceil(baseCost + accessoryCost);
  }
}

module.exports = ImageGenerationService;
