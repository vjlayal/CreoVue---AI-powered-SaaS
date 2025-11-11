export interface Video {
    id: string;
    title: string;
    description?: string | null;
    // sizes and duration are stored as strings in the DB and may be null
    originalSize?: string | null;
    compressedSize?: string | null;
    duration?: string | null;
    createdAt: string | Date;
    updatedAt?: string | Date;
    publicId: string;
    format: string;
}

