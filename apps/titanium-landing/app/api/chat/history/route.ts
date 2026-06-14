import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId || !supabaseUrl || !supabaseKey) {
      return NextResponse.json({ messages: [] });
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/chat_sessions?session_uuid=eq.${sessionId}&select=messages`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      console.error('Supabase GET Error:', await response.text());
      return NextResponse.json({ messages: [] });
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return NextResponse.json({ messages: data[0].messages || [] });
    }

    return NextResponse.json({ messages: [] });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ messages: [] });
  }
}

export async function POST(req: Request) {
  try {
    const { sessionId, messages } = await req.json();

    if (!sessionId || !supabaseUrl || !supabaseKey) {
      return NextResponse.json({ success: false, error: 'Missing sessionId or Supabase config' });
    }

    // Usamos on_conflict para hacer upsert basado en session_uuid (asumiendo que es UNIQUE)
    // Si session_uuid no es UNIQUE en BD, esto fallará y requeriría una consulta previa.
    const response = await fetch(`${supabaseUrl}/rest/v1/chat_sessions?on_conflict=session_uuid`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        session_uuid: sessionId,
        messages: messages,
        updated_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      console.error('Supabase POST Error:', await response.text());
      return NextResponse.json({ success: false });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving chat history:', error);
    return NextResponse.json({ success: false });
  }
}
