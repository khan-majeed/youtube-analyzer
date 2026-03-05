import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, SummaryLength } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeVideoContent(
  transcript: string,
  options: { length: SummaryLength; model: string }
): Promise<AnalysisResult> {
  const modelName = options.model === 'pro' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';

  const prompt = `
    Analyze the following YouTube video transcript and provide a detailed structured analysis in JSON format.
    
    Transcript:
    ${transcript.substring(0, 30000)} // Truncate if too long for prompt limits
    
    The analysis should include:
    1. A concise summary (TL;DR bullets and an executive summary of ${options.length} length).
    2. Exactly 3 key takeaways that are actionable or deep learnings.
    3. Sentiment analysis (score from -1 to 1, a label, and a breakdown of emotions).
    4. Deeper insights: main themes, viewer perception analysis, tone, strength of arguments, and any detected bias.
    5. Notable moments with timestamps (if possible to infer from context, otherwise general sections).
    6. Main topics discussed with relevance scores.

    Return ONLY the JSON object matching this structure:
    {
      "summary": { "tldr": ["string"], "executive": "string" },
      "keyTakeaways": [{ "title": "string", "description": "string", "icon": "string" }],
      "sentiment": { "score": number, "label": "string", "breakdown": [{ "name": "string", "value": number }] },
      "insights": { "themes": ["string"], "viewerPerception": "string", "tone": "string", "argumentStrength": "string", "bias": "string" },
      "notableMoments": [{ "timestamp": "string", "description": "string", "importance": number }],
      "topics": [{ "name": "string", "relevance": number }]
    }
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as AnalysisResult;
}

export async function analyzeVideoBySearch(
  videoId: string,
  options: { length: SummaryLength; model: string }
): Promise<AnalysisResult> {
  const modelName = options.model === 'pro' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';

  const prompt = `
    Analyze the YouTube video with ID "${videoId}". 
    Since the transcript is unavailable, use Google Search to find information about this video's content, title, and key discussions.
    
    Provide a detailed structured analysis in JSON format.
    
    The analysis should include:
    1. A concise summary (TL;DR bullets and an executive summary of ${options.length} length).
    2. Exactly 3 key takeaways that are actionable or deep learnings.
    3. Sentiment analysis (score from -1 to 1, a label, and a breakdown of emotions).
    4. Deeper insights: main themes, viewer perception analysis, tone, strength of arguments, and any detected bias.
    5. Notable moments with timestamps (if possible to find from search results).
    6. Main topics discussed with relevance scores.

    Return ONLY the JSON object matching this structure:
    {
      "summary": { "tldr": ["string"], "executive": "string" },
      "keyTakeaways": [{ "title": "string", "description": "string", "icon": "string" }],
      "sentiment": { "score": number, "label": "string", "breakdown": [{ "name": "string", "value": number }] },
      "insights": { "themes": ["string"], "viewerPerception": "string", "tone": "string", "argumentStrength": "string", "bias": "string" },
      "notableMoments": [{ "timestamp": "string", "description": "string", "importance": number }],
      "topics": [{ "name": "string", "relevance": number }]
    }
  `;

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as AnalysisResult;
}
