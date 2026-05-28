import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!auth) return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const resp = await fetch(`${BACKEND}/api/analyse`, {
      method: 'POST',
      headers: { authorization: auth },
      body: formData,
    })
    const data = await resp.json()
    return NextResponse.json(data, { status: resp.status })
  } catch (e: any) {
    return NextResponse.json({ detail: 'Backend unreachable: ' + e.message }, { status: 502 })
  }
}
