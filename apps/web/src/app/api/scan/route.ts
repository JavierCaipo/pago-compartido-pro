import { NextResponse } from 'next/server';
import { analyzeReceiptAction } from '../../../features/bill-splitter/actions/analyze-receipt';

type RateLimitRecord = { count: number; firstRequestAt: number };

const windowMs = 10 * 60 * 1000;
const maxRequests = 5;

function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('x-client-ip') ||
    'unknown-ip'
  );
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const now = Date.now();

  const rateLimitStore = globalThis?.__geminiScanRateLimitStore as Map<string, RateLimitRecord> | undefined;
  const bucket = rateLimitStore ?? new Map<string, RateLimitRecord>();
  if (globalThis) {
    (globalThis as any).__geminiScanRateLimitStore = bucket;
  }

  const record = bucket.get(ip) ?? { count: 0, firstRequestAt: now };
  if (now - record.firstRequestAt > windowMs) {
    record.count = 0;
    record.firstRequestAt = now;
  }

  record.count += 1;

  if (record.count > maxRequests) {
    bucket.set(ip, record);
    return NextResponse.json(
      { error: 'Has alcanzado el límite de escaneos. Por favor, espera unos minutos.' },
      { status: 429 }
    );
  }

  bucket.set(ip, record);

  const formData = await request.formData();
  const result = await analyzeReceiptAction(formData);

  if (!result.success) {
    const status = result.error?.toLowerCase().includes('configuración') ? 500 : 400;
    return NextResponse.json(
      { error: result.error || 'Error al procesar el recibo.' },
      { status }
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
