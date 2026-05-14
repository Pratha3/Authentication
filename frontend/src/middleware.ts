import { type NextRequest, NextResponse } from 'next/server'

// JWT lives in localStorage — auth guards run client-side via useAuth hook.
// This middleware only ensures Next.js static assets bypass any future logic.
export function middleware(_request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
