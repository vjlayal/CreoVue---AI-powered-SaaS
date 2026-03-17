import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import { getUserTier } from "@/lib/subscription";

// Simple in-memory rate limiting (for demo/development purposes)
// To prevent any charges on free Groq tier, strict daily limit enforced
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();
const DAILY_LIMIT = 5; 
const DAILY_WINDOW = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const now = Date.now();
        const userLimit = rateLimitMap.get(userId);
        
        // Reset if window passed
        if (userLimit && now > userLimit.resetTime) {
            rateLimitMap.delete(userId);
        }

        const currentCount = rateLimitMap.get(userId)?.count || 0;
        const remaining = Math.max(0, DAILY_LIMIT - currentCount);
        
        return NextResponse.json({ 
            limit: DAILY_LIMIT, 
            used: currentCount, 
            remaining 
        });
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch limit" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Verify tier (Premium only feature)
        const tier = await getUserTier(userId);
        if (tier !== "premium") {
            return NextResponse.json({ error: "Upgrade to Premium to use AI features" }, { status: 403 });
        }

        // Rate limit check
        const now = Date.now();
        const userLimit = rateLimitMap.get(userId);
        
        // Reset if window passed
        if (userLimit && now > userLimit.resetTime) {
            rateLimitMap.delete(userId);
        }

        const currentLimit = rateLimitMap.get(userId);

        if (currentLimit) {
            if (currentLimit.count >= DAILY_LIMIT) {
                return NextResponse.json({ 
                    error: `Daily limit exceeded. Try again tomorrow. (${DAILY_LIMIT} requests / 24 hours)` 
                }, { status: 429 });
            }
            currentLimit.count++;
        } else {
            rateLimitMap.set(userId, { count: 1, resetTime: now + DAILY_WINDOW });
        }

        const body = await req.json();
        const { keywords, platform, imageBase64, imageMimeType } = body;

        if (!keywords) {
            return NextResponse.json({ error: "Keywords are required" }, { status: 400 });
        }
        if (!platform) {
            return NextResponse.json({ error: "Platform is required" }, { status: 400 });
        }

        if (!process.env.GROQ_API_KEY) {
            return NextResponse.json({ error: "Groq API Key is missing" }, { status: 500 });
        }

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const systemPrompt = `You are an expert social media manager. Generate 3 engaging caption variations for a post on ${platform}. 
Make them captivating, use appropriate emojis, and include 3-5 relevant trending hashtags at the end of each.
Format the output strictly as a JSON object containing a "captions" array of 3 strings. Example: {"captions": ["Caption 1", "Caption 2", "Caption 3"]}`;

        const userText = `Here are the keywords/context: "${keywords}". Include the visual context of the image if one is provided.`;

        const messages: any[] = [
            {
                role: "system",
                content: systemPrompt
            }
        ];

        if (imageBase64) {
             const imageUrl = `data:${imageMimeType || "image/jpeg"};base64,${imageBase64}`;
             messages.push({
                 role: "user",
                 content: [
                     { type: "text", text: userText },
                     { type: "image_url", image_url: { url: imageUrl } }
                 ]
             });
        } else {
             messages.push({
                 role: "user",
                 content: userText
             });
        }

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            temperature: 0.7,
            max_tokens: 1024,
            response_format: { type: "json_object" }
        });

        const responseText = chatCompletion.choices[0]?.message?.content || "";
        
        let captions = [];
        try {
            // Groq returns JSON directly when response_format is used, but we requested an array previously.
            // Adjusting parse logic to handle Groq JSON response format smoothly.
            const jsonStr = responseText.replace(/```json\n|\n```|```/g, "").trim();
            const parsed = JSON.parse(jsonStr);
            
            if (Array.isArray(parsed)) {
                captions = parsed;
            } else if (parsed.captions && Array.isArray(parsed.captions)) {
                captions = parsed.captions;
            } else {
                captions = Object.values(parsed);
            }
        } catch (e) {
            console.error("Failed to parse Gemini output:", responseText);
            // Fallback: split by newlines if parsing fails, trying to extract bullet points
            captions = responseText.split('\n').filter(line => line.trim().length > 10).map(line => line.replace(/^[-*0-9.]*\s*/, '').trim()).slice(0, 3);
            if (captions.length === 0) {
                 return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
            }
        }

        return NextResponse.json({ captions });

    } catch (error: any) {
        console.error("Error generating captions:", error);
        return NextResponse.json(
            { error: error?.message || "Failed to generate captions" }, 
            { status: 500 }
        );
    }
}
