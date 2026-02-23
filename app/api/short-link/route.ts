import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    
    if (!data) {
      return NextResponse.json(
        { error: 'Missing data parameter' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SHORT_LINK_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API Key not configured' },
        { status: 500 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const slug = `mc-${timestamp}`;
    
    const baseUrl = 'https://s.ofhe.cn';
    const targetUrl = `${baseUrl}/mc-painter?data=${encodeURIComponent(data)}`;
    
    const response = await fetch('https://s.ofhe.cn/api/v1/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
      },
      body: JSON.stringify({
        domain: 's.ofhe.cn',
        slug: slug,
        target_url: targetUrl,
        title: 'MC Painter Share',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: 'Failed to create short link', details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating short link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
