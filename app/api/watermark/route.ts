import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    [key: string]: any;
}

const MAX_WATERMARK_SIZE = 2 * 1024 * 1024; // 2MB

// GET — fetch the user's current watermark settings
export async function GET() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await prisma.userSetting.findUnique({
        where: { userId },
    });

    return NextResponse.json({
        watermarkPublicId: settings?.watermarkPublicId ?? null,
        watermarkUrl: settings?.watermarkUrl ?? null,
    });
}

// POST — upload a new watermark logo
export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.size > MAX_WATERMARK_SIZE) {
            return NextResponse.json({
                error: `Watermark image too large. Maximum size is ${MAX_WATERMARK_SIZE / (1024 * 1024)}MB.`,
            }, { status: 400 });
        }

        // Delete old watermark from Cloudinary if exists
        const existingSettings = await prisma.userSetting.findUnique({
            where: { userId },
        });
        if (existingSettings?.watermarkPublicId) {
            try {
                await cloudinary.uploader.destroy(existingSettings.watermarkPublicId);
            } catch {
                // Ignore deletion errors for old watermarks
            }
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'watermarks',
                        resource_type: 'image',
                        transformation: [
                            { width: 300, height: 300, crop: 'limit' }, // Cap size
                            { quality: 'auto', fetch_format: 'png' },  // Keep transparency
                        ],
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                    }
                );
                uploadStream.end(buffer);
            }
        );

        // Upsert user settings
        const settings = await prisma.userSetting.upsert({
            where: { userId },
            update: {
                watermarkPublicId: result.public_id,
                watermarkUrl: result.secure_url,
            },
            create: {
                userId,
                watermarkPublicId: result.public_id,
                watermarkUrl: result.secure_url,
            },
        });

        return NextResponse.json({
            watermarkPublicId: settings.watermarkPublicId,
            watermarkUrl: settings.watermarkUrl,
        });
    } catch (error) {
        console.error('Watermark upload error:', error);
        return NextResponse.json({ error: 'Watermark upload failed' }, { status: 500 });
    }
}

// DELETE — remove watermark
export async function DELETE() {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const settings = await prisma.userSetting.findUnique({
            where: { userId },
        });

        if (settings?.watermarkPublicId) {
            try {
                await cloudinary.uploader.destroy(settings.watermarkPublicId);
            } catch {
                // Ignore
            }
        }

        await prisma.userSetting.update({
            where: { userId },
            data: {
                watermarkPublicId: null,
                watermarkUrl: null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Watermark delete error:', error);
        return NextResponse.json({ error: 'Failed to remove watermark' }, { status: 500 });
    }
}
