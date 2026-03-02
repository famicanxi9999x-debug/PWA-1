import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { action, data } = req.body;
    const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: "API Key not configured on the server." });
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        let prompt = "";

        switch (action) {
            case 'rewrite':
                prompt = `Rewrite the following text to make it more professional, clear, and engaging:\n\n${data.text}`;
                break;
            case 'fix_grammar':
                prompt = `Fix all typographical and grammatical errors in the following text. Do not change the meaning. Return only the corrected text:\n\n${data.text}`;
                break;
            case 'translate':
                prompt = `Translate the following text to Vietnamese. If it is already in Vietnamese, translate to English:\n\n${data.text}`;
                break;
            case 'continue_writing':
                prompt = `Continue writing the following text naturally for one or two paragraphs:\n\n${data.text}`;
                break;
            case 'auto_tag':
                prompt = `Analyze the following text and generate an array of 2 to 4 relevant tags (1-2 words each). Return ONLY a JSON array of strings, e.g., ["tag1", "tag2"]:\n\n${data.text}`;
                break;
            case 'note_summary':
                prompt = `Provide a concise, professional summary of the following text in 2-3 sentences:\n\n${data.text}`;
                break;
            default:
                prompt = `Process this text:\n\n${data.text}`;
        }

        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
                // Provide basic sensible defaults for generation
                temperature: 0.7,
                maxOutputTokens: 1000,
            }
        });

        const response = result.response.text();

        if (action === 'auto_tag') {
            try {
                const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
                const tags = JSON.parse(jsonStr);
                return res.status(200).json({ text: response, tags: Array.isArray(tags) ? tags : [] });
            } catch (e) {
                return res.status(200).json({ text: response, tags: [] });
            }
        }

        return res.status(200).json({ text: response });

    } catch (error) {
        console.error("AI Server Error:", error);
        return res.status(500).json({ error: error.message || "Failed to generate AI content" });
    }
}
