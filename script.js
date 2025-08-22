// Application State
const state = {
    currentVideo: null,
    videoDuration: 0,
    isProcessing: false
};

// DOM Elements Cache
const elements = {
    uploadZone: document.getElementById('uploadZone'),
    fileInput: document.getElementById('videoFile'),
    videoPreview: document.getElementById('videoPreview'),
    progressBar: document.getElementById('progressBar'),
    progressFill: document.querySelector('.progress-fill'),
    videoInfo: document.getElementById('videoInfo'),
    videoDuration: document.getElementById('videoDuration'),
    videoSize: document.getElementById('videoSize'),
    trimCard: document.getElementById('trimCard'),
    subtitleCard: document.getElementById('subtitleCard'),
    processCard: document.getElementById('processCard'),
    soundsCard: document.getElementById('soundsCard'),
    resultCard: document.getElementById('resultCard'),
    startRange: document.getElementById('startRange'),
    endRange: document.getElementById('endRange'),
    startTime: document.getElementById('startTime'),
    endTime: document.getElementById('endTime'),
    processBtn: document.getElementById('processBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    shareBtn: document.getElementById('shareBtn'),
    finalVideo: document.getElementById('finalVideo'),
    processingOverlay: document.getElementById('processingOverlay'),
    processingStatus: document.getElementById('processingStatus'),
    trendingSounds: document.getElementById('trendingSounds'),
    recommendedSounds: document.getElementById('recommendedSounds')
};

// Initialize Application
function init() {
    setupEventListeners();
    optimizeForMobile();
}

// Event Listeners Setup
function setupEventListeners() {
    // File Upload
    elements.uploadZone.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and Drop
    elements.uploadZone.addEventListener('dragover', handleDragOver);
    elements.uploadZone.addEventListener('dragleave', handleDragLeave);
    elements.uploadZone.addEventListener('drop', handleDrop);
    
    // Trim Controls
    elements.startRange.addEventListener('input', updateStartTime);
    elements.endRange.addEventListener('input', updateEndTime);
    
    // Process Button
    elements.processBtn.addEventListener('click', processVideo);
    
    // Download and Share
    elements.downloadBtn.addEventListener('click', downloadVideo);
    elements.shareBtn.addEventListener('click', shareToYoutube);
}

// File Handling
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) handleVideoUpload(file);
}

function handleDragOver(event) {
    event.preventDefault();
    elements.uploadZone.classList.add('dragover');
}

function handleDragLeave(event) {
    event.preventDefault();
    elements.uploadZone.classList.remove('dragover');
}

function handleDrop(event) {
    event.preventDefault();
    elements.uploadZone.classList.remove('dragover');
    const files = event.dataTransfer.files;
    if (files.length > 0) handleVideoUpload(files[0]);
}

// Video Upload Processing
function handleVideoUpload(file) {
    if (!validateFile(file)) return;
    
    state.currentVideo = file;
    showProgress();
    loadVideo(file);
}

function validateFile(file) {
    if (!file.type.startsWith('video/')) {
        showAlert('Please upload a video file');
        return false;
    }
    
    if (file.size > 500 * 1024 * 1024) {
        showAlert('File size must be less than 500MB');
        return false;
    }
    
    return true;
}

function showProgress() {
    elements.progressBar.style.display = 'block';
    animateProgress();
}

function animateProgress() {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                elements.progressBar.style.display = 'none';
            }, 500);
        }
        elements.progressFill.style.width = `${progress}%`;
    }, 100);
}

function loadVideo(file) {
    const url = URL.createObjectURL(file);
    elements.videoPreview.src = url;
    
    elements.videoPreview.onloadedmetadata = () => {
        state.videoDuration = elements.videoPreview.duration;
        showVideoInfo(file);
        setupTrimControls();
        showEditingUI();
        loadSounds();
    };
}

function showVideoInfo(file) {
    elements.videoDuration.textContent = formatTime(state.videoDuration);
    elements.videoSize.textContent = formatFileSize(file.size);
    elements.videoInfo.style.display = 'block';
    elements.videoPreview.style.display = 'block';
}

function showEditingUI() {
    const cards = [elements.trimCard, elements.subtitleCard, elements.processCard];
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.remove('hidden');
        }, index * 150);
    });
}

// Trim Controls
function setupTrimControls() {
    elements.startRange.max = state.videoDuration;
    elements.endRange.max = state.videoDuration;
    elements.endRange.value = Math.min(20, state.videoDuration);
    
    updateStartTime();
    updateEndTime();
}

function updateStartTime() {
    const value = parseFloat(elements.startRange.value);
    elements.startTime.textContent = formatTime(value);
    if (elements.videoPreview) {
        elements.videoPreview.currentTime = value;
    }
}

function updateEndTime() {
    const value = parseFloat(elements.endRange.value);
    elements.endTime.textContent = formatTime(value);
}

// Sound Loading
function loadSounds() {
    const trendingSounds = [
        { name: 'Original Sound - @creator_viral', meta: 'Trending • 3.2M uses', type: 'trending' },
        { name: 'Aesthetic Vibes Beat', meta: 'Lo-Fi • 2.1M uses', type: 'trending' },
        { name: 'Upbeat Energy Track', meta: 'Pop • 1.8M uses', type: 'trending' },
        { name: 'Chill Hip-Hop Loop', meta: 'Hip-Hop • 1.5M uses', type: 'trending' },
        { name: 'Motivational Rise', meta: 'Inspirational • 1.2M uses', type: 'trending' }
    ];

    const recommended = [
        { name: 'Perfect Hook Beat', meta: 'High engagement • Perfect match', type: 'recommended' },
        { name: 'Emotional Journey', meta: 'Connects with viewers', type: 'recommended' },
        { name: 'Energy Boost Drop', meta: 'Keeps viewers watching', type: 'recommended' },
        { name: 'TikTok Viral Sound', meta: 'Algorithm favorite', type: 'recommended' },
        { name: 'Universal Appeal', meta: 'Works for any content', type: 'recommended' }
    ];

    renderSounds(elements.trendingSounds, trendingSounds);
    renderSounds(elements.recommendedSounds, recommended);
    
    setTimeout(() => {
        elements.soundsCard.classList.remove('hidden');
    }, 300);
}

function renderSounds(container, sounds) {
    container.innerHTML = sounds.map(sound => `
        <div class="sound-item">
            <div class="sound-info">
                <div class="sound-name">${sound.name}</div>
                <div class="sound-meta">
                    <span class="trending-badge">${sound.type === 'recommended' ? '⭐ Recommended' : '🔥 Trending'}</span>
                    <span>${sound.meta}</span>
                </div>
            </div>
            <button class="play-btn" onclick="playSound(this)">▶</button>
        </div>
    `).join('');
}

// Sound Playback
function playSound(button) {
    button.textContent = '⏸';
    button.style.background = '#ff6b6b';
    
    // Simulate 3-second preview
    setTimeout(() => {
        button.textContent = '▶';
        button.style.background = '#4ecdc4';
    }, 3000);
}

// Video Processing
async function processVideo() {
    if (!state.currentVideo || state.isProcessing) return;
    
    state.isProcessing = true;
    elements.processBtn.disabled = true;
    
    showProcessingOverlay();
    
    const processingSteps = [
        'Analyzing video content...',
        'Finding most engaging moments...',
        'Extracting optimal 20s clip...',
        'Converting to vertical format...',
        'Generating AI subtitles...',
        'Applying professional polish...',
        'Finalizing your short...'
    ];

    for (let i = 0; i < processingSteps.length; i++) {
        elements.processingStatus.textContent = processingSteps[i];
        await delay(1500);
    }

    createFinalVideo();
    hideProcessingOverlay();
    showResults();
    
    state.isProcessing = false;
    elements.processBtn.disabled = false;
}

function createFinalVideo() {
    // In production, this would be the processed video URL
    elements.finalVideo.src = elements.videoPreview.src;
}

function showResults() {
    elements.resultCard.classList.remove('hidden');
    elements.resultCard.scrollIntoView({ 
        behavior: 'smooth',
        block: 'center'
    });
}

// Download and Share Functions
function downloadVideo() {
    const link = document.createElement('a');
    link.href = elements.finalVideo.src;
    link.download = `shortcraft-${Date.now()}.mp4`;
    link.setAttribute('type', 'video/mp4');
    
    // iOS-specific handling
    if (isIOS()) {
        window.open(link.href, '_blank');
        showAlert('Video opened in new tab. Tap and hold to save to Photos.');
    } else {
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

async function shareToYoutube() {
    if (navigator.share && navigator.canShare) {
        try {
            const response = await fetch(elements.finalVideo.src);
            const blob = await response.blob();
            const file = new File([blob], 'shortcraft-video.mp4', { type: 'video/mp4' });
            
            if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'My Short Video',
                    text: 'Created with ShortCraft',
                    files: [file]
                });
            } else {
                fallbackShare();
            }
        } catch (error) {
            fallbackShare();
        }
    } else {
        fallbackShare();
    }
}

function fallbackShare() {
    window.open('https://studio.youtube.com/channel/upload', '_blank');
    showAlert('YouTube Studio opened. Upload your downloaded video there.');
}

// Processing Overlay
function showProcessingOverlay() {
    elements.processingOverlay.style.display = 'flex';
}

function hideProcessingOverlay() {
    elements.processingOverlay.style.display = 'none';
}

// Utility Functions
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatFileSize(bytes) {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function showAlert(message) {
    // Simple alert for now - could be replaced with custom toast
    alert(message);
}

// Mobile Optimizations
function optimizeForMobile() {
    // Prevent iOS bounce scrolling
    document.body.addEventListener('touchstart', preventBounce, { passive: false });
    document.body.addEventListener('touchend', preventBounce, { passive: false });
    document.body.addEventListener('touchmove', preventBounce, { passive: false });
    
    // Optimize viewport for iOS
    handleViewportResize();
    window.addEventListener('resize', handleViewportResize);
    window.addEventListener('orientationchange', handleViewportResize);
    
    // Enhanced touch handling
    setupTouchHandling();
}

function preventBounce(e) {
    if (e.target === document.body) {
        e.preventDefault();
    }
}

function handleViewportResize() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function setupTouchHandling() {
    let touchStartY = 0;
    
    document.addEventListener('touchstart', (e) => {
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        const touchY = e.touches[0].clientY;
        const touchDiff = touchY - touchStartY;
        
        // Prevent pull-to-refresh on iOS
        if (touchDiff > 0 && window.scrollY === 0) {
            e.preventDefault();
        }
    }, { passive: false });
}

// Performance Optimizations
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimized range input handlers
elements.startRange.addEventListener('input', debounce(updateStartTime, 100));
elements.endRange.addEventListener('input', debounce(updateEndTime, 100));

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Service Worker Registration (Optional for PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // Uncomment to register service worker
        // navigator.serviceWorker.register('/sw.js');
    });
}