import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';
import prisma from "@/lib/prisma"


// Configuration
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
});

interface CloudinaryUploadResult {
    public_id: string;
    [key: string]: any;
}

const MAX_FILE_SIZE = 60 * 1024 * 1024; // 60MB
const MAX_USER_TOTAL_VIDEOS = 10;
const MAX_USER_HOURLY_VIDEOS = 3;
const MAX_GLOBAL_VIDEOS = 100;

export const bodyParser = {
    sizeLimit: '70mb', // Slightly larger than MAX_FILE_SIZE for overhead
};

export async function POST(req: NextRequest) {

    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Global Limit Check (Protect entire project)
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

        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const title = formData.get("title") as string;
        const description = formData.get("description") as string | null;
        const originalSize = formData.get("originalSize") as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // 4. Strict File Size Check
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({
                error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
            }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "video",
                        folder: "video-uploads",
                        transformation: [
                            { quality: "auto", fetch_format: "mp4" }
                        ]
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                    }
                )
                uploadStream.end(buffer);
            }
        )
        const video = await prisma.video.create({
            data: {
                title,
                description,
                originalSize: originalSize,
                compressedSize: String(result.bytes),
                publicId: result.public_id,
                format: result.format,
                duration: result.duration ? String(result.duration) : null,
                userId: userId
            }
        })
        return NextResponse.json(video);

    } catch (error) {
        console.log('Upload error:', error);
        return NextResponse.json({ error: 'Video Upload failed' }, { status: 500 });
    }
}
