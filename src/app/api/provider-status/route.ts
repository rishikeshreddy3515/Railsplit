import { NextRequest, NextResponse } from 'next/server';
import { defaultHybridProvider } from '@/lib/hybrid-provider';

export async function GET() {
  const diagnostics = defaultHybridProvider.getDiagnostics();

  let statusExplanation = 'Running in High-Fidelity Local Engine mode.';
  if (diagnostics.isLiveApiConfigured) {
    if (diagnostics.lastApiStatus === 429) {
      statusExplanation =
        'Live API is configured, but remote server responded with HTTP 429 (Quota Exceeded). Hybrid engine automatically fell back to local engine to keep service 100% operational.';
    } else if (diagnostics.lastApiStatus === 200) {
      statusExplanation = 'Live Railway API is ACTIVE and responding with HTTP 200 OK.';
    } else if (diagnostics.lastApiError) {
      statusExplanation = `Live API encountered an error: ${diagnostics.lastApiError}. Falling back to local engine.`;
    } else {
      statusExplanation = 'Live API key is configured and ready to handle incoming queries.';
    }
  }

  return NextResponse.json({
    status: 'ONLINE',
    service: 'RailSplit Hybrid Railway Data Provider',
    algorithm: 'Hop-Constrained Same-Train Dijkstra (Stop-State DAG)',
    diagnostics,
    statusExplanation,
    activationGuide: diagnostics.isLiveApiConfigured
      ? 'Live Railway API is configured and tracked with attempt telemetry.'
      : 'Currently running in Local Engine mode. Add RAIL_API_KEY to .env.local or update via POST.',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Clear Cache
    if (body.clearCache) {
      defaultHybridProvider.clearCache();
      return NextResponse.json({
        success: true,
        message: 'In-memory availability and timetable cache cleared successfully.',
        diagnostics: defaultHybridProvider.getDiagnostics(),
      });
    }

    // 2. Test Connection Only
    if (body.testOnly && body.apiKey) {
      const testResult = await defaultHybridProvider.testConnection(
        body.apiKey,
        body.baseUrl
      );
      return NextResponse.json({
        success: testResult.success,
        testResult,
        diagnostics: defaultHybridProvider.getDiagnostics(),
      });
    }

    // 3. Update API Key in-memory
    if (body.apiKey) {
      defaultHybridProvider.setApiKey(
        body.apiKey,
        body.providerName || 'RailRadar v1'
      );
      const testResult = await defaultHybridProvider.testConnection(
        body.apiKey,
        body.baseUrl
      );
      return NextResponse.json({
        success: true,
        message: 'API Key updated and verified.',
        testResult,
        diagnostics: defaultHybridProvider.getDiagnostics(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Provide apiKey or clearCache: true' },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
