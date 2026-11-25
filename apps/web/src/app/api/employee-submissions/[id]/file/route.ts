import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = 'http://localhost:3131'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  if (!token) {
    return NextResponse.json({ message: 'Não autenticado.' }, { status: 401 })
  }

  const { id } = await context.params
  const download = request.nextUrl.searchParams.get('download')
  const query = download ? `?download=${encodeURIComponent(download)}` : ''

  try {
    const upstream = await fetch(
      `${API_BASE_URL}/employee-submissions/${encodeURIComponent(id)}/file${query}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
      }
    )

    if (!upstream.ok) {
      let message = 'Não foi possível carregar o arquivo PDF.'
      try {
        const err = (await upstream.json()) as { message?: string }
        if (err?.message) message = err.message
      } catch {}
      return NextResponse.json({ message }, { status: upstream.status })
    }

    const pdfBytes = await upstream.arrayBuffer()
    const contentDisposition =
      upstream.headers.get('content-disposition') ||
      'inline; filename="documento.pdf"'

    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': contentDisposition,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NextResponse.json(
      { message: 'Erro de comunicação ao buscar o arquivo PDF.' },
      { status: 502 }
    )
  }
}
