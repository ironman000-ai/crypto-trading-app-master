import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const apiKey = process.env.COINGECKO_API_KEY;

  if (!path) {
    return NextResponse.json({ error: 'Path is required' }, { status: 400 });
  }

  try {
    const url = `https://api.coingecko.com/api/v3/${path}`;
    const params = new URLSearchParams(searchParams);
    params.delete('path'); // Remove our internal param
    if (apiKey) {
      params.append('x_cg_demo_api_key', apiKey);
    }
    const queryString = params.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    console.log('API Key:', apiKey ? 'present' : 'missing');
    console.log('Full URL:', fullUrl);

    const response = await fetch(fullUrl);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}