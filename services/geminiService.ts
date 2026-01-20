import { GoogleGenAI, Type } from "@google/genai";

// Safe access to environment variables
const getApiKey = () => {
  try {
    return (typeof process !== 'undefined' && process.env?.API_KEY) || "";
  } catch (e) {
    return "";
  }
};

const apiKey = getApiKey();
const ai = new GoogleGenAI({ apiKey });

export const troubleshootAsset = async (issueDescription: string, assetType: string) => {
  if (!apiKey) {
    console.warn("Gemini API Key is missing. Troubleshooting disabled.");
    return "API Key not configured. Please check environment settings.";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
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

    return response.text;
  } catch (error) {
    console.error("Gemini troubleshooting error:", error);
    return "I'm sorry, I'm having trouble processing your request right now. Please check your connection and try again.";
  }
};

export const analyzeMaintenanceImage = async (base64Image: string, assetName: string) => {
  if (!apiKey) return "API Key missing.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: `Analyze this maintenance photo for the asset "${assetName}". Identify visible wear, damage, or anomalies. Suggest potential repairs.` }
        ]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini image analysis error:", error);
    return "Failed to analyze the image.";
  }
};