const ytdl = require('ytdl-core');

exports.handler = async (event) => {
    // Only GET requests allowed for this redirect function
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const { videoId, itag } = event.queryStringParameters;

    if (!videoId || !itag) {
        return { statusCode: 400, body: 'Video ID or ITAG is missing.' };
    }

    try {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Fetch fresh info and choose the specific format
        const info = await ytdl.getInfo(youtubeUrl);
        const format = ytdl.chooseFormat(info.formats, { quality: itag });

        if (!format || !format.url) {
            return { statusCode: 404, body: 'Download link not found for selected quality.' };
        }

        // --- FINAL FIX: Simplified 302 Redirect ---
        // We only return the Location header (the fresh URL)
        // This is the fastest and most reliable way to avoid 410 error.
        return {
            statusCode: 302, 
            headers: {
                'Location': format.url, 
                // Removed Content-Disposition to avoid header complexity and timing issues.
            },
            body: '' 
        };
        // --- END FINAL FIX ---

    } catch (error) {
        console.error("Redirect Error:", error.message);
        return {
            statusCode: 500,
            body: 'Error generating fresh download link.'
        };
    }
};
