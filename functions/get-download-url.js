const ytdl = require('ytdl-core');

exports.handler = async (event) => {
    // Only GET requests allowed
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { videoId, itag } = event.queryStringParameters;

    if (!videoId || !itag) {
        return { statusCode: 400, body: 'Video ID or ITAG is missing.' };
    }

    try {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        const info = await ytdl.getInfo(youtubeUrl);
        const format = ytdl.chooseFormat(info.formats, { quality: itag });

        if (!format || !format.url) {
            return { statusCode: 404, body: 'Download link not found.' };
        }

        // --- NEW LOGIC: Return the URL as JSON ---
        // Browser will fetch this URL, and JS will redirect immediately.
        return {
            statusCode: 200, 
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ freshUrl: format.url }) // Sending the fresh URL in the body
        };
        // --- END NEW LOGIC ---

    } catch (error) {
        console.error("URL Fetch Error:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Error generating fresh download link.' }),
        };
    }
};
