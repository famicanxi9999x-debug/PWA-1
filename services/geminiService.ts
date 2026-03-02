
import { GoogleGenAI, Type } from "@google/genai";

// API Key must be obtained exclusively from process.env.API_KEY.
// Gracefully handle if not available - use fallback responses
const API_KEY = typeof process !== 'undefined' && process.env?.API_KEY ? process.env.API_KEY : '';
const ai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;


// Helper to check if an error is related to quota/rate limits
const isQuotaError = (error: any): boolean => {
  return (
    error?.status === 429 ||
    error?.code === 429 ||
    (error?.message && error.message.includes('429')) ||
    (error?.status === 'RESOURCE_EXHAUSTED') ||
    (error?.error?.code === 429) ||
    (error?.error?.status === 'RESOURCE_EXHAUSTED')
  );
};

// Helper for robust API calls with retry and exponential backoff
async function generateWithRetry(model: string, contents: any, config: any = {}, retries = 3, initialDelay = 2000) {
  if (!ai) {
    throw new Error('AI_NOT_INITIALIZED');
  }
  let delay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent({ model, contents, config });
    } catch (error: any) {
      if (isQuotaError(error) && i < retries - 1) {
        console.warn(`Gemini API Quota Hit. Retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}

export const generateTaskBreakdown = async (taskTitle: string): Promise<string[]> => {
  try {
    const response = await generateWithRetry(
      "gemini-3-flash-preview",
      `Break down the task "${taskTitle}" into 3-5 actionable, small subtasks. Return only the subtask titles.`,
      {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING
          }
        }
      }
    );

    const jsonStr = response.text?.trim();
    if (jsonStr) {
      return JSON.parse(jsonStr);
    }
    return [];
  } catch (error: any) {
    if (error?.message === 'AI_NOT_INITIALIZED') {
      console.info("Gemini Breakdown: AI not configured, using local fallback.");
    } else if (isQuotaError(error)) {
      console.warn("Gemini Service: Quota exceeded for task breakdown. Returning fallback.");
    } else {
      console.error("Gemini Breakdown Error:", error);
    }
    // Robust fallback
    return ["Analyze requirements", "Draft initial outline", "Review and refine"];
  }
};

export const suggestDailyPlan = async (tasks: string[], timeOfDay: string): Promise<string> => {
  try {
    const response = await generateWithRetry(
      "gemini-3-flash-preview",
      `I have these tasks: ${tasks.join(', ')}. It is currently ${timeOfDay}. Suggest a brief, 2-sentence strategy for my session.`
    );
    return response.text || "Prioritize the hardest task first.";
  } catch (error: any) {
    if (error?.message === 'AI_NOT_INITIALIZED') {
      console.info("Gemini Planner: AI not configured, using local fallback.");
      return "Focus on your top priority task. (AI not configured)";
    } else if (isQuotaError(error)) {
      console.warn("Gemini Service: Quota exceeded for daily plan. Returning fallback.");
      return "Focus on your top priority task. (AI currently unavailable due to high traffic)";
    }
    console.error("Gemini Planner Error:", error);
    return "Focus on your top priority task. (AI currently unavailable)";
  }
};

// Smart Tagging: Analyzes note content and returns relevant tags and context
export const analyzeNoteContent = async (content: string): Promise<{ tags: string[], context: string }> => {
  try {
    const response = await generateWithRetry(
      "gemini-3-flash-preview",
      `Analyze this note: "${content}". 
      1. Generate 2-3 short, relevant tags (e.g., 'React', 'Marketing', 'IELTS'). 
      2. Determine the context (Work, Study, Personal, or General).
      Return JSON.`,
      {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            context: { type: Type.STRING }
          }
        }
      }
    );

    const jsonStr = response.text?.trim();
    return jsonStr ? JSON.parse(jsonStr) : { tags: ['SmartTag'], context: 'General' };
  } catch (error: any) {
    if (error?.message === 'AI_NOT_INITIALIZED') {
      console.info("Gemini Tagging: AI not configured, using manual tags.");
    } else if (isQuotaError(error)) {
      console.warn("Gemini Service: Quota exceeded for note analysis.");
    } else {
      console.error("Gemini Tagging Error:", error);
    }
    return { tags: ['Manual'], context: 'General' };
  }
};

// Voice-to-Action: Parses transcript to decide if it's a Task or Note, and extracts details
export const parseVoiceInput = async (transcript: string): Promise<{
  type: 'TASK' | 'NOTE',
  title: string,
  details?: string,
  tags?: string[],
  dueDate?: string
}> => {
  try {
    const response = await generateWithRetry(
      "gemini-3-flash-preview",
      `Analyze this voice command: "${transcript}".
      Decide if it is a TASK (something to do) or a NOTE (information to remember).
      If Task: extract title and flexible due date string (e.g., "tomorrow at 5pm").
      If Note: extract title (summary) and tags.
      Return JSON.`,
      {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['TASK', 'NOTE'] },
            title: { type: Type.STRING },
            details: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            dueDate: { type: Type.STRING }
          }
        }
      }
    );

    const jsonStr = response.text?.trim();
    // Default fallback structure if parsing fails but string exists
    if (jsonStr) {
      return JSON.parse(jsonStr) as {
        type: 'TASK' | 'NOTE',
        title: string,
        details?: string,
        tags?: string[],
        dueDate?: string
      };
    }
    return { type: 'NOTE', title: transcript, tags: ['Voice'] };
  } catch (error: any) {
    if (error?.message === 'AI_NOT_INITIALIZED') {
      console.info("Gemini Voice: AI not configured, defaulting to note parsing.");
    } else if (isQuotaError(error)) {
      console.warn("Gemini Service: Quota exceeded for voice parsing.");
    } else {
      console.error("Gemini Voice Parse Error:", error);
    }
    return { type: 'NOTE', title: transcript, tags: ['Voice', 'Raw'] };
  }
};
