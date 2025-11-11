import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'


const isPublicRoute = createRouteMatcher([
    "/",
    "/sign-in",
    "/sign-up",
    "/home",
])

const isPublicApiRoute = createRouteMatcher([
    "/api/videos"
])




export default clerkMiddleware(async (auth, req) => {
    // Resolve userId robustly: `auth` may be a function or an object depending on Clerk version.
    let userId: string | null = null;
    try {
        if (typeof auth === 'function') {
            const authRes = await auth();
            userId = authRes?.userId ?? null;
        } else if (auth && typeof auth === 'object' && 'userId' in auth) {
            userId = (auth as any).userId ?? null;
        } else if (req && typeof (req as any).auth === 'function') {
            const authRes = await (req as any).auth();
            userId = authRes?.userId ?? null;
        }
    } catch (e) {
        // if anything goes wrong while resolving auth, treat as unauthenticated
        userId = null;
    }
    const currentUrl = new URL(req.url);
    const isDashboard = currentUrl.pathname === "/home"
    const isApiRequest = currentUrl.pathname.startsWith("/api")

    if(userId && isPublicRoute(req) && !isDashboard) {
        return NextResponse.redirect(new URL("/home", req.url))
    }

    //if not logged in and trying to access a private route, redirect to sign in
    if(!userId){
        if(!isPublicApiRoute(req) && !isPublicRoute(req)){
            return NextResponse.redirect(new URL("/sign-in", req.url))
        }
        if(isApiRequest && !isPublicApiRoute(req)){
            return NextResponse.redirect(new URL("/sign-in", req.url))
        }
    }
    return NextResponse.next()
})

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}