// Isme koi Content-Disposition header nahi hai, sirf Location header.
const ytdl = require('ytdl-core');

exports.handler = async (event) => {
    // ...
    const { videoId, itag } = event.queryStringParameters;
    // ...
    try {
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const info = await ytdl.getInfo(youtubeUrl);
        const format = ytdl.chooseFormat(info.formats, { quality: itag });

        if (!format || !format.url) {
            return { statusCode: 404, body: 'Download link not found.' };
        }

        return {
            statusCode: 302, 
            headers: {
                // The most reliable way: only redirect
                'Location': format.url, 
            },
            body: '' 
        };
    } catch (error) {
        // ...
        return {
            statusCode: 500,
            body: 'Error generating fresh download link.'
        };
    }
};
