
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
// Initialize the AI client inside the functions to ensure it uses the latest API key environment variable.
// The API key is obtained directly from process.env.API_KEY as per the library guidelines.

export const troubleshootAsset = async (issueDescription: string, assetType: string) => {
  // Always initialize GoogleGenAI with a named parameter.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Fix: Upgraded to gemini-3-pro-preview for advanced troubleshooting reasoning and added GenerateContentResponse type
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `I am an expert industrial maintenance engineer. 
      A user reports the following issue with a ${assetType}: "${issueDescription}".
      Provide a structured response including:
      1. Potential Causes
      2. Recommended immediate safety steps
      3. Troubleshooting checklist
      4. Required tools for repair
      Keep the tone professional and technical.`,
      config: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      }
    });

    // Access the .text property directly (do not call as a method).
    return response.text;
  } catch (error) {
    console.error("Gemini troubleshooting error:", error);
    return "I'm sorry, I'm having trouble processing your request right now. Please check your connection and try again.";
  }
};

export const analyzeMaintenanceImage = async (base64Image: string, assetName: string) => {
  // Always initialize GoogleGenAI with a named parameter.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Fix: vision-to-text analysis remains on gemini-3-flash-preview for speed and efficiency
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { 
            inlineData: { 
              data: base64Image, 
              mimeType: 'image/jpeg' 
            } 
          },
          { 
            text: `Analyze this maintenance photo for the asset "${assetName}". Identify visible wear, damage, or anomalies. Suggest potential repairs.` 
          }
        ]
      }
    });
    // Access the .text property directly.
    return response.text;
  } catch (error) {
    console.error("Gemini image analysis error:", error);
    return "Failed to analyze the image.";
  }
};
