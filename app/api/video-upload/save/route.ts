import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { title, description, originalSize, publicId, bytes, format, duration } = body;

        if (!publicId || !title) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const video = await prisma.video.create({
            data: {
                title,
                description: description || null,
                originalSize: String(originalSize),
                compressedSize: String(bytes || 0),
                publicId,
                format: format || 'mp4',
                duration: duration ? String(duration) : null,
                userId,
            }
        });

        return NextResponse.json(video);

    } catch (error) {
        console.error('Save error:', error);
        return NextResponse.json({ error: 'Failed to save video metadata' }, { status: 500 });
    }
}
