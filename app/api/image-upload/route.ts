import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { auth } from '@clerk/nextjs/server';

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

export async function POST(req: NextRequest) {
    // Resolve userId defensively to satisfy TypeScript and handle Clerk variations
    let userId: string | null = null;
    try {
        if (typeof auth === 'function') {
            const res = await (auth as any)(req).catch(() => undefined) || await (auth as any)().catch(() => undefined) || await (auth as any)({ req }).catch(() => undefined);
            userId = res?.userId ?? res?.user?.id ?? null;
        } else if (auth && typeof auth === 'object') {
            const authObj: any = auth as any;
            userId = authObj.userId ?? authObj.user?.id ?? null;
        }
    } catch (e) {
        userId = null;
    }

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
    const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const result = await new Promise<CloudinaryUploadResult>(
            (resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: "user_uploads" },
                    (error, result) => {
                        if(error) reject(error);
                        else resolve(result as CloudinaryUploadResult);
                    }
                )
                uploadStream.end(buffer);
            }
        )
        return NextResponse.json({ publicId: result.public_id }, { status: 200 });
    } catch (error) {
        console.log('Upload error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}