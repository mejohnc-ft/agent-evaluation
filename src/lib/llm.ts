import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const apiKey = process.env.OPENROUTER_API_KEY;
const modelId = process.env.MODEL_ID;
if (!apiKey || !modelId) throw new Error("OPENROUTER_API_KEY and MODEL_ID must be set");

const openrouter = createOpenRouter({ apiKey });

export const chatModel = openrouter(modelId);
export { modelId };
