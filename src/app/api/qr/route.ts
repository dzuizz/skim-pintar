import { generateQRDataURL } from '@/lib/paynow-qr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const amount = parseFloat(searchParams.get('amount') || '0')
  const reference = searchParams.get('reference') || ''

  if (!amount || !reference) {
    return NextResponse.json({ error: 'Missing amount or reference' }, { status: 400 })
  }

  const qrDataURL = await generateQRDataURL({ amount, reference })
  return NextResponse.json({ qrDataURL })
}
