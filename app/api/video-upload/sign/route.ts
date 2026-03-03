import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';
import prisma from "@/lib/prisma";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_USER_TOTAL_VIDEOS = 10;
const MAX_USER_HOURLY_VIDEOS = 3;
const MAX_GLOBAL_VIDEOS = 100;

export async function POST() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Global Limit Check
        const totalVideos = await prisma.video.count();
        if (totalVideos >= MAX_GLOBAL_VIDEOS) {
            return NextResponse.json({
                error: 'Global upload limit reached. Please contact support or try again later.'
            }, { status: 429 });
        }

        // 2. User Total Limit Check
        const userTotalVideos = await prisma.video.count({
            where: { userId }
        });
        if (userTotalVideos >= MAX_USER_TOTAL_VIDEOS) {
            return NextResponse.json({
                error: `You have reached your limit of ${MAX_USER_TOTAL_VIDEOS} videos.`
            }, { status: 403 });
        }

        // 3. User Hourly Rate Limit
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const hourlyVideos = await prisma.video.count({
            where: {
                userId,
                createdAt: { gte: oneHourAgo }
            }
        });
        if (hourlyVideos >= MAX_USER_HOURLY_VIDEOS) {
            return NextResponse.json({
                error: `Rate limit exceeded. You can upload ${MAX_USER_HOURLY_VIDEOS} videos per hour.`
            }, { status: 429 });
        }

        if (
            !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
            !process.env.CLOUDINARY_API_KEY ||
            !process.env.CLOUDINARY_API_SECRET
        ) {
            return NextResponse.json({ error: 'Cloudinary not configured properly' }, { status: 500 });
        }

        // Generate a signed upload signature
        const timestamp = Math.round(new Date().getTime() / 1000);

        // Check if user has a watermark configured
        const userSettings = await prisma.userSetting.findUnique({
            where: { userId },
        });

        // Build transformation string for Cloudinary
        // This is the Cloudinary URL-style transformation syntax
        // q_auto = auto quality (compression), f_mp4 = convert to mp4
        let transformationStr = 'q_auto/f_mp4';

        // If user has a watermark, add overlay transformation
        if (userSettings?.watermarkPublicId) {
            // Cloudinary overlay expects slashes replaced with colons in public_id
            const overlayId = userSettings.watermarkPublicId.replace(/\//g, ':');
            transformationStr += `/l_${overlayId},w_150,g_south_east,x_20,y_20,o_60`;
        }

        // Include transformation in the params to sign
        // Cloudinary requires ALL upload params to be signed for security
        const paramsToSign: Record<string, string | number> = {
            timestamp,
            folder: 'video-uploads',
            transformation: transformationStr,
        };

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            process.env.CLOUDINARY_API_SECRET!
        );

        return NextResponse.json({
            signature,
            timestamp,
            cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
            apiKey: process.env.CLOUDINARY_API_KEY,
            folder: 'video-uploads',
            transformation: transformationStr,
        });

    } catch (error) {
        console.error('Sign error:', error);
        return NextResponse.json({ error: 'Failed to generate upload signature' }, { status: 500 });
    }
}
