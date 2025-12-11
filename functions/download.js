const ytdl = require('ytdl-core');

// Helper function to create a readable label
const getQualityLabel = (format) => {
    // Only consider formats that have both video and audio
    if (format.qualityLabel && format.hasVideo && format.hasAudio) return format.qualityLabel;
    
    // Fallback for other formats
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

        if (!url || !ytdl.validateURL(url)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid YouTube URL or URL is missing.' }),
            };
        }

        const info = await ytdl.getInfo(url);
        const videoTitle = info.videoDetails.title;

        // Filter and map formats: Focus on MP4 files with both audio and video
        const formats = info.formats
            .filter(f => f.hasVideo && f.hasAudio && f.container === 'mp4' && f.contentLength)
            .sort((a, b) => b.height - a.height) 
            .map(f => ({
                itag: f.itag,
                quality: getQualityLabel(f),
                container: f.container,
                url: f.url, // The direct download URL
                size: f.contentLength ? (f.contentLength / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown Size' 
            }));

        // Send Title and filtered formats back to the frontend
        return {
            statusCode: 200,
            body: JSON.stringify({ videoId: info.videoDetails.videoId, title: videoTitle, formats }),
        };

    } catch (error) {
        console.error("Backend Error:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error processing link. Please check link validity.' }),
        };
    }
};