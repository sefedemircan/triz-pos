import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname
  
  console.log('Middleware - URL:', pathname)

  // Test ve debug sayfalarını muaf tut
  if (pathname === '/debug' || pathname === '/test' || pathname === '/emergency') {
    console.log('Middleware - Test/Debug/Emergency page, skipping auth checks')
    return supabaseResponse
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    // Basit auth kontrolü
    const { data: { session } } = await supabase.auth.getSession()
    
    const isAuthPage = pathname === '/login' || pathname === '/register'
    const isProtectedPage = pathname.startsWith('/dashboard')
    const isRootPage = pathname === '/'

    // Root page redirect
    if (isRootPage) {
      if (session?.user) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      } else {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    // Auth page'de session varsa dashboard'a yönlendir
    if (isAuthPage && session?.user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Protected page'de session yoksa login'e yönlendir
    if (isProtectedPage && !session?.user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return supabaseResponse

  } catch (error) {
    console.error('Middleware error:', error)
    
    // Hata durumunda güvenli fallback
    if (pathname.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    
    return supabaseResponse
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
} 