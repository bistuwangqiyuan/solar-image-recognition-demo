import type { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  const providers: string[] = [];
  if (process.env.GROQ_API_KEY) providers.push('Groq (Llama 4 Scout)');
  if (process.env.MISTRAL_API_KEY) providers.push('Mistral (Pixtral)');
  if (process.env.GLM_API_KEY) providers.push('智谱 AI (GLM-4V)');
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY) {
    providers.push('Google Gemini');
  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: providers.length > 0,
      message: 'Solar Image Recognition API (Netlify)',
      version: '3.1.0',
      providers,
      python_cv: false,
    }),
  };
};
