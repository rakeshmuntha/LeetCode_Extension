import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        console.log("hi there");
        const { searchParams } = new URL(req.url);
        const problemTitle = searchParams.get("problemTitle");

        if (!problemTitle) {
            return NextResponse.json(
                { error: "problemTitle is required" },
                { status: 400 }
            );
        }

        const searchQuery = `${problemTitle} leetcode solution`;

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=10&key=${process.env.YOUTUBE_API_KEY}`
        );
        
        const data = await response.json();

        if (!data.items || !Array.isArray(data.items)) {
            throw new Error("Invalid response from YouTube API");
        }

        return NextResponse.json(data.items);
    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Failed to fetch videos" },
            { status: 500 }
        );
    }
}
