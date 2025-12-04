import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// import { getUser, getUserId } from './lib/action/auth'

const roles = [
  {
    name: 'call centre',
    path: ['/dashboard', '/profile', '/login', '/signup', '/', 'ccenter', '/logout', 'jobs'],
  },
  {
    name: 'fleet manager',
    path: ['/fleetManager', '/jobs', '/dashboard', '/drivers', '/vehicles', '/technician', '/ccenter', '/profile', '/logs', '/login', '/signup', '/', '/logout', '/jobWorkShop', '/reports', '/userManagement'],
  },
]

const publicRoutes = ['/login', '/signup', '/', '/logout', '/register',
  '/register/company', '/register/workshop',
  '/register/workshop/jobCard', '/register/onboarding',
  '/register/success', '/register/workshop/success',
  '/register/workshop/fileUpload']

// const userId = await getUserId()
// const user = await getUser()
    // console.log("The user id is", user.user?.id)
    // console.log("The user role is", user.user?.user_metadata.role)
    // console.log("The user is", user.user)

// Ensure paths are normalized (leading slash) to avoid mismatches like 'ccenter' vs '/ccenter'
function ensureLeadingSlash(p: string) {
  if (!p) return p
  return p.startsWith('/') ? p : `/${p}`
}

function getAllowedPaths(role: string): string[] {
  const raw = roles.find(r => r.name === role)?.path || []
  return raw.map(ensureLeadingSlash)
}

export async function middleware(req: NextRequest) {

  //Thsi is new section If the user is accessing the /logout page, clear cookies and redirect
  if (req.nextUrl.pathname === '/logout') {
    const response = NextResponse.redirect(new URL('/login', req.url))
    // List all cookies you want to clear
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
    // Add more cookies here if needed
    return response
  }



  const path = req.nextUrl.pathname
  // Check for Supabase session cookies
  const accessToken = req.cookies.get('access_token')?.value
  const isAuthenticated = !!accessToken
  const normalizedPublicRoutes = publicRoutes.map(ensureLeadingSlash)
  const isPublicRoute = normalizedPublicRoutes.includes(path)

  // Redirect unauthenticated users trying to access protected routes
  if (!isAuthenticated && !isPublicRoute) {
    console.log('Not authenticated — redirecting to /login')
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If authenticated, get user role from database
  if (isAuthenticated) {
    try {
      const supabase = await createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      console.log("The user id is", user?.id)

      const { data: userData, error: userError } = await supabase.from("profiles").select("*").eq("id", user?.id).single()
      if (userError) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      console.log("The user data is", userData)
      console.log("The user role is", userData.role)

      if (user) {
        if (userData.role !== null) {
          const allowedPaths = getAllowedPaths(decodeURIComponent(userData.role))
          const isAllowed = allowedPaths.some(p => path.startsWith(p))
          if (!isAllowed) {
            console.log(`Role "${decodeURIComponent(userData.role)}" is not allowed to access "${path}" — redirecting to /dashboard`)
            return NextResponse.redirect(new URL('/login', req.url))
          }
          // switch (role) {
          //   case "call center":
          //     return NextResponse.redirect(new URL('/callcenter', req.url))
          //     break
          //   case "fleet manager":
          //     return NextResponse.redirect(new URL('/fleetManager', req.url))
          //     break
          //   case "cost center":
          //     return NextResponse.redirect(new URL('/ccenter', req.url))
          //     break
          //   case "customer":
          //     return NextResponse.redirect(new URL('/customer', req.url))
          //     break
          //   default:
          //     return NextResponse.redirect(new URL('/dashboard', req.url))
          // }
        } else {
          console.log('No role found for user — redirecting to /dashboard')
          return NextResponse.redirect(new URL('/dashboard', req.url))
        }
      }
    } catch (error) {
      console.error('Error in middleware:', error)
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next|.*\\.(?:png|jpg|jpeg|svg|ico|css|js)).*)'
  ],
}
