import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
dotenv.config();
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function sendRequestToOpenAI(model, message) {
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const response = await openai.chat.completions.create({
                model: model,
                messages: [{ role: 'user', content: message }],
                max_tokens: 1024,
            });
            return response.choices[0].message.content || '';
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : 'No stack trace';
            console.error(`Error sending request to OpenAI (attempt ${i + 1}):`, errorMessage, errorStack);
            if (i === MAX_RETRIES - 1)
                throw error;
            await sleep(RETRY_DELAY);
        }
    }
    return '';
}
async function sendRequestToAnthropic(model, message) {
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            console.log(`Sending request to Anthropic with model: ${model} and message: ${message}`);
            const response = await anthropic.messages.create({
                model: model,
                messages: [{ role: 'user', content: message }],
                max_tokens: 1024,
            });
            console.log(`Received response from Anthropic: ${JSON.stringify(response.content)}`);
            return response.content[0].type === 'text' ? response.content[0].text : '';
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const errorStack = error instanceof Error ? error.stack : 'No stack trace';
            console.error(`Error sending request to Anthropic (attempt ${i + 1}):`, errorMessage, errorStack);
            if (i === MAX_RETRIES - 1)
                throw error;
            await sleep(RETRY_DELAY);
        }
    }
    return '';
}
async function sendLLMRequest(provider, model, message) {
    switch (provider.toLowerCase()) {
        case 'openai':
            return sendRequestToOpenAI(model, message);
        case 'anthropic':
            return sendRequestToAnthropic(model, message);
        default:
            throw new Error(`Unsupported LLM provider: ${provider}`);
    }
}
export { sendLLMRequest };
//# sourceMappingURL=llmService.js.map