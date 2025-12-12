const ytdl = require('ytdl-core');

// Helper function to create a readable label
const getQualityLabel = (format) => {
    // ... (same as before) ...
    if (format.qualityLabel && format.hasVideo && format.hasAudio) return format.qualityLabel;
    if (format.container === 'mp4' && format.hasVideo) return `Video Only (${format.qualityLabel || 'Unknown'})`;
    if (format.hasAudio && !format.hasVideo) return `Audio Only (${format.audioQuality || 'Normal'})`;
    return 'Other Format';
};

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { url } = JSON.parse(event.body);

        // --- NEW VALIDATION: Get Video ID First ---
        const videoId = ytdl.getVideoID(url); // Try to extract video ID
        
        if (!videoId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'URL is malformed or not a valid YouTube video link.' }),
            };
        }
        
        const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`; // Use normalized URL
        // --- END NEW VALIDATION ---
        
        const info = await ytdl.getInfo(youtubeUrl); // Use the normalized URL for getInfo
        const videoTitle = info.videoDetails.title;

        // Filter for MP4 files with both audio and video
        const formats = info.formats
            .filter(f => f.hasVideo && f.hasAudio && f.container === 'mp4' && f.contentLength)
            .sort((a, b) => b.height - a.height) 
            .map(f => ({
                itag: f.itag,
                quality: getQualityLabel(f),
                container: f.container,
                size: f.contentLength ? (f.contentLength / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown Size' 
            }));

        return {
            statusCode: 200,
            body: JSON.stringify({ videoId: videoId, title: videoTitle, formats }), // Use extracted video ID
        };

    } catch (error) {
        // Logging the actual error message will help future debugging
        console.error("Backend Error:", error.message);
        // We return the generic error message
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error processing link. Please check link validity.' }),
        };
    }
};
