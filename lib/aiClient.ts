// This file acts as a proxy client to our Vercel Serverless Function
export const aiCall = async (action: string, data: { text: string }): Promise<any> => {
    try {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, data }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Server responded with status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.warn("AI Server Call Failed. Mocking AI Response. (Run with Vercel CLI for full local testing):", error);

        // Graceful fallback for local Vite dev server without Vercel CLI
        if (action === 'auto_tag') {
            return { text: `[Mock AI Response for ${action}]`, tags: ["development", "mock"] };
        }
        return { text: `[Mock AI Response for ${action}] ${data.text.substring(0, 50)}...` };
    }
};
