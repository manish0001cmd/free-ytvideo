// functions/get-download-url.js

// ... (baaki code same) ...

        // Return a 302 Redirect to the fresh URL
        return {
            statusCode: 302, // <--- Yeh 302 hona chahiye
            headers: {
                // 'Location' header mein hum fresh URL daalte hain
                'Location': format.url, 
                // Suggest a filename to the browser
                'Content-Disposition': `attachment; filename="${info.videoDetails.title.replace(/[^a-zA-Z0-9]/g, '_')}.${format.container}"`
            },
            body: '' 
        };

// ... (baaki code same) ...
