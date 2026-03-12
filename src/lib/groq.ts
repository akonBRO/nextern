import Groq from 'groq-sdk';

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function askGroq(messages: { role: 'user' | 'assistant'; content: string }[]) {
  const response = await groq.chat.completions.create({
    model: 'llama3-8b-8192',
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  });
  return response.choices[0].message.content;
}
