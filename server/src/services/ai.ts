import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

let client: GoogleGenerativeAI | null = null;
const getClient = (): GoogleGenerativeAI | null => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    if (!client) client = new GoogleGenerativeAI(apiKey);
    return client;
};

export const isAiEnabled = (): boolean => Boolean(process.env.GEMINI_API_KEY);

export interface InsightPayload {
    title: string;
    message: string;
    recommendations: string[];
}

/**
 * Asks Gemini to turn a JSON snapshot of real inventory/sales data into a short,
 * actionable insight. Falls back to `fallback` (deterministic, non-AI) whenever
 * no API key is configured or the model call fails, so the feature degrades
 * gracefully rather than breaking the request.
 */
export const generateInsight = async (
    instructions: string,
    data: Record<string, unknown>,
    fallback: InsightPayload
): Promise<InsightPayload & { aiGenerated: boolean }> => {
    const genAI = getClient();
    if (!genAI) {
        return { ...fallback, aiGenerated: false };
    }

    try {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: { responseMimeType: 'application/json' },
        });

        const prompt = `You are an inventory management analyst. ${instructions}
Respond with ONLY a JSON object of the shape: {"title": string, "message": string, "recommendations": string[]}.
Keep "title" under 6 words, "message" under 40 words, and provide 2-4 short "recommendations".
Base your answer strictly on this data (do not invent numbers not present here):
${JSON.stringify(data)}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);

        if (typeof parsed.title === 'string' && typeof parsed.message === 'string' && Array.isArray(parsed.recommendations)) {
            return {
                title: parsed.title,
                message: parsed.message,
                recommendations: parsed.recommendations.filter((r: unknown) => typeof r === 'string'),
                aiGenerated: true,
            };
        }
        return { ...fallback, aiGenerated: false };
    } catch (error) {
        console.error('Gemini insight generation failed, using fallback:', error);
        return { ...fallback, aiGenerated: false };
    }
};
