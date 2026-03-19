import OpenAI from "openai"

const apiKey = process.env.OPENAI_API_KEY
// Avoid constructing the client with an undefined key (it can throw at import-time).
export const openai = apiKey ? new OpenAI({ apiKey }) : null

