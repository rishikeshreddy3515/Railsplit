import { NextRequest, NextResponse } from 'next/server';
import { defaultHybridProvider } from '@/lib/hybrid-provider';
import { searchSplitJourneys } from '@/lib/split-search';
import { TravelClass, Station } from '@/lib/types';

const provider = defaultHybridProvider;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const fromCode = searchParams.get('from');
  const toCode = searchParams.get('to');
  const date = searchParams.get('date');
  const travelClass = searchParams.get('class') as TravelClass | null;
  const splitsParam = searchParams.get('splits');
  const includeSplits = splitsParam !== null ? splitsParam === 'true' : true;
  const trainNumber = searchParams.get('trainNumber') || undefined;
  const fresh = searchParams.get('fresh') === 'true';

  if (!fromCode || !toCode || !date || !travelClass) {
    return NextResponse.json(
      { error: 'Missing required parameters: from, to, date, class' },
      { status: 400 }
    );
  }

  if (fromCode === toCode) {
    return NextResponse.json(
      { error: 'Origin and destination must be different' },
      { status: 400 }
    );
  }

  const validClasses: TravelClass[] = ['SL', '3A', '2A', '1A', 'CC', '2S'];
  if (!validClasses.includes(travelClass)) {
    return NextResponse.json(
      { error: `Invalid class. Valid options: ${validClasses.join(', ')}` },
      { status: 400 }
    );
  }

  // If user requested a fresh query, clear in-memory cache to force live check
  if (fresh) {
    provider.clearCache();
  }

  // Resolve station names
  const stations = await provider.getStations();
  const fromStation: Station | undefined = stations.find(
    (s) => s.code === fromCode
  );
  const toStation: Station | undefined = stations.find(
    (s) => s.code === toCode
  );

  if (!fromStation || !toStation) {
    return NextResponse.json(
      { error: 'Invalid station code(s)' },
      { status: 400 }
    );
  }

  const results = await searchSplitJourneys(provider, {
    from: fromStation,
    to: toStation,
    date,
    travelClass,
    includeSplits,
    trainNumber,
  });

  return NextResponse.json(results);
}
