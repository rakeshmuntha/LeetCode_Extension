import { NextResponse } from "next/server";

function parseDuration(iso: string): string {
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "0:00";
    const h = parseInt(match[1] || "0");
    const m = parseInt(match[2] || "0");
    const s = parseInt(match[3] || "0");
    const mm = h > 0 ? `${h}:${String(m).padStart(2, "0")}` : `${m}`;
    return `${mm}:${String(s).padStart(2, "0")}`;
}

function formatViews(views: string): string {
    const n = parseInt(views || "0");
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K views`;
    return `${n} views`;
}

function formatDate(dateStr: string): string {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 2_592_000) return `${Math.floor(diff / 86400)} days ago`;
    if (diff < 31_536_000) return `${Math.floor(diff / 2_592_000)} months ago`;
    return `${Math.floor(diff / 31_536_000)} years ago`;
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const problemTitle = searchParams.get("problemTitle");

        if (!problemTitle) {
            return NextResponse.json(
                { error: "problemTitle is required" },
                { status: 400 }
            );
        }

        const apiKey = process.env.YOUTUBE_API_KEY;
        const searchQuery = `${problemTitle} leetcode solution`;

        const searchRes = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=10&key=${apiKey}`
        );
        const searchData = await searchRes.json();

        if (!searchData.items?.length) {
            return NextResponse.json([]);
        }

        const ids = searchData.items
            .map((item: { id: { videoId: string } }) => item.id.videoId)
            .join(",");

        const detailsRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${ids}&key=${apiKey}`
        );
        const detailsData = await detailsRes.json();

        if (!detailsData.items?.length) {
            return NextResponse.json([]);
        }

        const videos = detailsData.items.map((item: {
            id: string;
            snippet: { title: string; channelTitle: string; publishedAt: string };
            contentDetails: { duration: string };
            statistics: { viewCount?: string };
        }) => ({
            id: item.id,
            title: item.snippet.title,
            channel: item.snippet.channelTitle,
            duration: parseDuration(item.contentDetails.duration),
            views: formatViews(item.statistics.viewCount || "0"),
            publishedAt: formatDate(item.snippet.publishedAt),
        }));

        return NextResponse.json(videos);
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to fetch videos" },
            { status: 500 }
        );
    }
}

