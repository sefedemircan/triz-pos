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

    // Rol tabanlı erişim kontrolü
    if (isProtectedPage && session?.user) {
      try {
        // Kullanıcı profilini al
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('email', session.user.email)
          .single()

        const userRole = userProfile?.role || 'garson'

        // Admin-only sayfalar
        const adminOnlyPaths = [
          '/dashboard/admin',
          '/dashboard/staff',
          '/dashboard/categories'
        ]

        // Garson-only sayfalar
        const garsonOnlyPaths = [
          '/dashboard/garson'
        ]

        // Mutfak-only sayfalar
        const mutfakOnlyPaths = [
          '/dashboard/mutfak'
        ]

        // Admin olmayan kullanıcıların admin sayfalarına erişimini engelle
        if (adminOnlyPaths.some(path => pathname.startsWith(path)) && userRole !== 'admin') {
          console.log(`Middleware - Access denied: ${userRole} trying to access admin page`)
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Garson olmayan kullanıcıların garson sayfalarına erişimini engelle
        if (garsonOnlyPaths.some(path => pathname.startsWith(path)) && userRole !== 'garson') {
          console.log(`Middleware - Access denied: ${userRole} trying to access garson page`)
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // Mutfak olmayan kullanıcıların mutfak sayfalarına erişimini engelle
        if (mutfakOnlyPaths.some(path => pathname.startsWith(path)) && userRole !== 'mutfak') {
          console.log(`Middleware - Access denied: ${userRole} trying to access mutfak page`)
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        console.log(`Middleware - Access granted: ${userRole} accessing ${pathname}`)
      } catch (error) {
        console.error('Middleware - Role check error:', error)
        // Hata durumunda genel dashboard'a yönlendir
        if (pathname !== '/dashboard') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
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