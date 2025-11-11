import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

// Configuration
    cloudinary.config({ 
        cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:  process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
    });

interface CloudinaryUploadResult{
    public_id: string;
    [key: string]: any;
}

// Allow larger request bodies for video uploads (default 10MB)
// Allow large uploads (up to 200MB)
export const bodyParser = {
  sizeLimit: '200mb',
};

export async function POST(req: NextRequest) {

    try {

        //todo to check user
    let userId: string | null = null;

    if(
        !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
    ){
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
                        if(error) reject(error);
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
                // required Prisma fields from schema
                publicId: result.public_id,
                format: result.format,
                duration: result.duration ? String(result.duration) : null
            }
        })
        return NextResponse.json(video);

    } catch (error) {
        console.log('Upload error:', error);
        return NextResponse.json({ error: 'Video Upload failed' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}