
import { GoogleGenAI } from "@google/genai";
import { InventoryItem } from "./inventoryService";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function getRestockSuggestions(items: InventoryItem[]) {
  if (!process.env.GEMINI_API_KEY) return null;

  const prompt = `
    Analyze the following inventory data and provide restock suggestions.
    Data: ${JSON.stringify(items.map(i => ({ name: i.name, stock: i.stockLevel, threshold: i.minThreshold, category: i.category })))}
    
    Return a JSON object with:
    - criticalItems: string[] (items that need immediate restock)
    - predictions: { itemName: string, suggestion: string }[] (suggested restock amounts/timing based on thresholds)
    - riskAnalysis: string (brief overview of potential supply chain risks if any)
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    const text = response.text.trim();
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error getting restock suggestions:", error);
    return null;
  }
}
