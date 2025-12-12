const urlInput = document.getElementById("url-input");
const getOptionsBtn = document.getElementById("get-options-btn");
const messageDisplay = document.getElementById("message");
const qualitySection = document.getElementById("quality-section");
const qualityOptionsDiv = document.getElementById("quality-options");
const adDownloadSection = document.getElementById("ad-download-section");
const adTriggerBtn = document.getElementById("ad-trigger-btn");
const playerAndDownloadDiv = document.getElementById("player-and-download");
const videoTitleDisplay = document.getElementById("video-title");
const finalDownloadBtn = document.getElementById("final-download-btn");

let selectedFormat = null;
let currentVideoId = null;

// --- Utility Functions ---
const showMessage = (msg, isError = false) => {
    messageDisplay.textContent = msg;
    messageDisplay.className = isError ? 'error' : 'success';
    messageDisplay.classList.remove('hidden');
};

const hideAllSections = () => {
    messageDisplay.classList.add('hidden');
    qualitySection.classList.add('hidden');
    adDownloadSection.classList.add('hidden');
    playerAndDownloadDiv.classList.add('hidden');
    // Reset ad button state
    adTriggerBtn.disabled = false;
    adTriggerBtn.textContent = 'Watch Ad and Download';
    adTriggerBtn.classList.remove('hidden');
};

// --- Step 1: Get Options from Backend ---
const getDownloadOptions = async () => {
    hideAllSections();
    const url = urlInput.value.trim();
    if (url === "") {
        showMessage("Please enter a YouTube URL.", true);
        return;
    }
    
    showMessage("Fetching options...", false);
    
    try {
        const response = await fetch('/.netlify/functions/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: url }),
        });

        const data = await response.json();

        if (response.ok) {
            if (data.formats && data.formats.length > 0) {
                 showMessage(`Options found for: ${data.title}`, false);
                 currentVideoId = data.videoId;
                 displayQualityOptions(data.title, data.formats);
            } else {
                 showMessage("No suitable MP4 formats found for this video.", true);
            }
        } else {
            showMessage(`Error: ${data.error || 'Failed to get options.'}`, true);
        }
    } catch (error) {
        showMessage("Network error. Please check your connection or Netlify setup.", true);
    }
};

// --- Step 2: Display Quality Options ---
const displayQualityOptions = (title, formats) => {
    videoTitleDisplay.textContent = title;
    qualityOptionsDiv.innerHTML = ''; 
    qualitySection.classList.remove('hidden');

    formats.forEach(format => {
        const button = document.createElement('button');
        button.className = 'quality-btn';
        button.textContent = `${format.quality} (${format.size})`;
        
        button.addEventListener('click', () => {
            handleDownloadSelection(format);
        });
        qualityOptionsDiv.appendChild(button);
    });
};

// --- Step 3: Handle Selection and Show Ad Button ---
const handleDownloadSelection = (format) => {
    // Save the selected format and ITAG
    selectedFormat = format;
    
    // Hide Quality section, show Ad section
    qualitySection.classList.add('hidden');
    adDownloadSection.classList.remove('hidden');
    showMessage(`Selected: ${format.quality}. Click 'Watch Ad' to unlock the link.`, false);
};

// --- Step 4: Monetag Ad Trigger ---
const triggerMonetagAd = () => {
    if (!selectedFormat) {
        showMessage("Please select a video quality first.", true);
        return;
    }
    
    adTriggerBtn.disabled = true;
    adTriggerBtn.textContent = 'Ad Loading... Please Wait';
    
    // Monetag Rewarded Interstitial Code
    if (typeof show_10309318 === 'function') {
        show_10309318().then(() => {
            // This part runs ONLY AFTER the user watches the Ad
            unlockDownloadLink();
        })
        .catch((error) => {
            // This runs if Ad fails or is closed early
            showMessage("Ad failed or skipped. Please try again to unlock.", true);
            adTriggerBtn.disabled = false;
            adTriggerBtn.textContent = 'Watch Ad and Download';
        });
    } else {
        // Fallback if SDK fails to load - should not happen if added correctly
        showMessage("Ad SDK failed to load. Unlocking download directly (Fallback).", true);
        unlockDownloadLink(); 
    }
};

// --- Step 5: Unlock Download Link and Show Player (New Logic Here) ---
const unlockDownloadLink = () => {
    if (!selectedFormat || !currentVideoId) {
        showMessage("Internal error: Format or Video ID missing.", true);
        return;
    }
    
    // Generate the protected download URL using the NEW Netlify Function (get-download-url)
    // This URL calls the function, which immediately redirects to the fresh YouTube link (Fixes 410 error).
    const protectedDownloadUrl = `/.netlify/functions/get-download-url?videoId=${currentVideoId}&itag=${selectedFormat.itag}`;

    // Set the final download URL
    finalDownloadBtn.href = protectedDownloadUrl;
    
    // Show download link and player
    adTriggerBtn.classList.add('hidden'); // Hide the ad button
    playerAndDownloadDiv.classList.remove('hidden');
    adDownloadSection.querySelector('h3').textContent = "Download Unlocked!";
    showMessage(`Success! Your ${selectedFormat.quality} download is ready.`, false);
    
    // Embed the video player for preview 
    const playerContainer = document.getElementById("video-player-container");
    if (currentVideoId) {
        // We use the simple embed URL for the iframe
        playerContainer.innerHTML = `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${currentVideoId}" frameborder="0" allowfullscreen></iframe>`;
    }
};

// --- Event Listeners ---
getOptionsBtn.addEventListener('click', getDownloadOptions);
adTriggerBtn.addEventListener('click', triggerMonetagAd);

// Initialize (hide sections on load)
hideAllSections();
