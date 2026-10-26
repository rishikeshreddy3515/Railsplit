import { NextResponse } from 'next/server';
import { defaultHybridProvider } from '@/lib/hybrid-provider';

const provider = defaultHybridProvider;

export async function GET() {
  const stations = await provider.getStations();
  return NextResponse.json(stations);
}
