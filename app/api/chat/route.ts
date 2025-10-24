import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OpenAI API key' }, { status: 500 });
  }
  const openai = new OpenAI({ apiKey });

  try {
    const data = await req.json();
    const { messages } = data as {
      messages: {
        role: 'user' | 'assistant' | 'system';
        content: string;
        images?: string[];
      }[];
    };
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    // Transform messages to OpenAI format. If images exist on a message,
    // create a multi-part content array according to the gpt-4o vision spec.
    const formattedMessages = messages.map((msg) => {
      if (msg.images && msg.images.length > 0) {
        const parts: any[] = [];
        if (msg.content && msg.content.trim().length > 0) {
          parts.push({ type: 'text', text: msg.content });
        }
        for (const image of msg.images) {
          parts.push({ type: 'image_url', image_url: { url: image } });
        }
        return { role: msg.role, content: parts };
      } else {
        return { role: msg.role, content: msg.content };
      }
    });

    // Call OpenAI chat completion API.
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: formattedMessages as any,
      max_tokens: 1000,
    });

    const reply = completion.choices[0]?.message?.content || '';
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error('Error in API route', err);
    return NextResponse.json({ error: err.message || 'Error' }, { status: 500 });
  }
}