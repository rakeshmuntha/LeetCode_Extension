const YOUTUBE_API_KEY = 'AIzaSyDLFm6bQMiAeUMDsqRGz1AKP0S1yYpG0Vk';

export default async function displayYtLinks() {

    let title = document.querySelector('div[class^="text-title-"]');
    if (!title) return;
    const question = title?.textContent;
    console.log(question);
    const results = await searchYouTubeVideos(question);
    console.log(results);
}

async function searchYouTubeVideos(problemTitle: string) {
    try {
        const searchQuery = `${problemTitle} leetcode solution`;

        const response = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=10&key=${YOUTUBE_API_KEY}`
        );

        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status}`);
        }

        const data = await response.json();
        if (!data.items || !Array.isArray(data.items)) {
            throw new Error('Invalid response from YouTube API');
        }

        return data.items;
    }
    catch (error) {
        console.error('Error fetching YouTube videos:', error);
        return [];
    }
}