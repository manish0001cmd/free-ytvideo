const ytdl = require('ytdl-core');

exports.handler = async (event) => {
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
            return { statusCode: 404, body: 'Download link not found for selected quality.' };
        }
        
        // --- NEW FIX: Encode Filename ---
        const safeFilename = encodeURIComponent(info.videoDetails.title.replace(/[^\w\s-]/g, ''));
        const filenameHeader = `attachment; filename*=UTF-8''${safeFilename}.${format.container}`;
        // --- END NEW FIX ---

        return {
            statusCode: 302,
            headers: {
                'Location': format.url, 
                // Using standard filename header (RFC 6266)
                'Content-Disposition': filenameHeader 
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
