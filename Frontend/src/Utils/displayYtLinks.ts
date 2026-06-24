const YOUTUBE_API_KEY = 'AIzaSyDLFm6bQMiAeUMDsqRGz1AKP0S1yYpG0Vk';

export default async function displayYtLinks() {

    let title = document.querySelector('div[class^="text-title-"]');
    if (!title) return;
    const question = title?.textContent;
    console.log(question);
    const results = await browser.runtime.sendMessage({
        type: "youtube-search",
        question
    });
    console.log(results);

    const ids = results
        .map((item: any) => item.id.videoId)
        .join(",");

        console.log(ids);
    const detailsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${ids}&key=${YOUTUBE_API_KEY}`
    );
    const details = await detailsResponse.json();
    console.log(details);

}

async function searchYouTubeVideos(problemTitle: string) {
    console.log("ji re");
    return await fetch(`http://localhost:3001/api/youtube?problemTitle=${problemTitle}`);
}