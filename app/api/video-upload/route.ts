import { NextResponse } from 'next/server';

// This route has been split into:
// - /api/video-upload/sign  (generates Cloudinary upload signature)
// - /api/video-upload/save  (saves video metadata after direct upload)
//
// Direct file upload through this route is no longer supported
// to avoid Vercel's 4.5MB body size limit on serverless functions.

export async function POST() {
    return NextResponse.json(
        { error: 'This endpoint is deprecated. Use /api/video-upload/sign and /api/video-upload/save instead.' },
        { status: 410 }
    );
}
