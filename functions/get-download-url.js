// Is file ko functions/ folder mein daalna hai
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
        // Construct the full URL for ytdl-core
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        
        // Fetch fresh info and choose the specific format
        const info = await ytdl.getInfo(youtubeUrl);
        const format = ytdl.chooseFormat(info.formats, { quality: itag });

        if (!format || !format.url) {
            return { statusCode: 404, body: 'Download link not found for selected quality.' };
        }

        // Return a 302 Redirect to the fresh URL
        return {
            statusCode: 302, // Temporary Redirect
            headers: {
                // The actual download link is placed in the 'Location' header
                'Location': format.url, 
                // Suggest a filename to the browser
                'Content-Disposition': `attachment; filename="${info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_')}.${format.container}"`
            },
            body: '' 
        };

    } catch (error) {
        console.error("Redirect Error:", error.message);
        return {
            statusCode: 500,
            body: 'Error generating fresh download link.'
        };
    }
};