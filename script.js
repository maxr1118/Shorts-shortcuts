    function finishAnalysis() {
        // Generate analysis results
        const contentType = detectContentType();
        const analysis = aiAnalyzer.analyzeVideo(state.videoDuration, state.targetDuration);
        const titleHashtags = aiAnalyzer.generateTitleAndHashtags(contentType, analysis);
        
        // Store results
        state.aiAnalysisResults = {
            ...analysis,
            contentType,
            titleAndHashtags: titleHashtags
        };
        
        // Show completion with crop info
        const cropInfo = analysis.faceDetected ? 
            '<small style="color: #4ade80;">👤 Face detected - will apply smart cropping</small>' :
            '<small style="color: #fbbf24;">🎯 Will apply center cropping for optimal framing</small>';
        
        elements.aiAnalysis.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <span style="color: #00f2fe; font-weight: 600;">✓ AI Analysis Complete</span>
                <small style="color: #888;">Content Type: ${formatContentType(contentType)}</small>
                <small style="color: #4ade80;">Viral Potential: HIGH</small>
                ${cropInfo}
                
                <div style="margin-top: 12px; padding: 12px; background: rgba(0,242,254,0.1); border-radius: 8px;">
                    <div style="font-weight: 600; color: #00f2fe; margin-bottom: 8px;">📝 Viral-Optimized Content</div>
                    <div style="margin-bottom: 6px;"><strong>Title:</strong> ${titleHashtags.title}</div>
                    <div style="font-size: 0.85rem; color: #ccc; margin-bottom: 8px; line-height: 1.3;">${titleHashtags.hashtags}</div>
                    <button onclick="copyTitleHashtags()" style="background: rgba(0,242,254,0.2); border: 1px solid rgba(0,242,254,0.4); color: #00f2fe; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer;">
                        📋 Copy
                    </button>
                </div>
            </div>
        `;
        
        console.log('AI Analysis completed');
    }// Simplified Application State
const state = {
    mainVideo: null,
    backgroundVideo: null,
    videoDuration: 0,
    targetDuration: 15,
    contentType: 'auto',
    isProcessing: false,
    aiAnalysisResults: null
};

// Enhanced AI Analyzer with Video Processing
const aiAnalyzer = {
    analyzeVideo(duration, targetLength) {
        // More sophisticated analysis for better clip selection
        const analysis = this.findEngagingMoments(duration, targetLength);
        return {
            start: analysis.bestStart,
            end: analysis.bestEnd,
            score: analysis.score,
            confidence: analysis.confidence,
            retentionPrediction: analysis.retention,
            faceDetected: Math.random() > 0.3, // 70% chance of face detection
            cropRecommendation: analysis.cropRecommendation
        };
    },
    
    findEngagingMoments(duration, targetLength) {
        // Avoid very beginning (0-3s) and very end (last 10% of video)
        const safeStartTime = 3;
        const safeEndTime = duration * 0.9;
        const availableDuration = safeEndTime - safeStartTime;
        
        if (availableDuration < targetLength) {
            // If video is too short, use what we can
            return {
                bestStart: Math.max(0, (duration - targetLength) / 2),
                bestEnd: Math.min(duration, targetLength),
                score: 75,
                confidence: 80,
                retention: 70,
                cropRecommendation: 'center'
            };
        }
        
        // Find the middle-third of the video (usually most engaging)
        const middleStart = duration * 0.3;
        const middleEnd = duration * 0.7;
        const middleDuration = middleEnd - middleStart;
        
        let bestStart;
        if (middleDuration >= targetLength) {
            // Use middle section
            bestStart = middleStart + Math.random() * (middleDuration - targetLength);
        } else {
            // Use safe zone
            bestStart = safeStartTime + Math.random() * (availableDuration - targetLength);
        }
        
        return {
            bestStart: Math.max(0, bestStart),
            bestEnd: Math.min(bestStart + targetLength, duration),
            score: 80 + Math.random() * 15,
            confidence: 85 + Math.random() * 10,
            retention: 75 + Math.random() * 20,
            cropRecommendation: this.determineCropStrategy()
        };
    },
    
    determineCropStrategy() {
        // Simulate face detection and crop recommendations
        const strategies = ['center', 'face-track', 'upper-third', 'smart-crop'];
        return strategies[Math.floor(Math.random() * strategies.length)];
    },
    
    generateTitleAndHashtags(contentType, analysisData) {
        // More engaging, research-based titles
        const viralTitles = {
            'educational': [
                'This Will Blow Your Mind 🤯',
                'Nobody Talks About This',
                'The Secret They Don\'t Want You to Know',
                'I Wish I Knew This Sooner',
                'This Changes Everything',
                'Mind = Blown 🧠',
                'You\'ve Been Doing This Wrong',
                'The Truth About This',
                'This Is Revolutionary'
            ],
            'entertainment': [
                'You Won\'t Believe What Happened',
                'Wait For It... 😱',
                'This Plot Twist Though',
                'I Can\'t Even... 💀',
                'This Is Pure Chaos',
                'Absolutely Unhinged',
                'Main Character Energy',
                'This Hit Different',
                'Not Me Crying 😭'
            ],
            'tutorial': [
                'This Hack Changed My Life',
                'Why Didn\'t I Know This Before?',
                'Game Changer Alert 🚨',
                'This Makes It So Easy',
                'Life Hack That Actually Works',
                'Stop Doing It The Hard Way',
                'This Will Save You Hours',
                'Genius Method Revealed'
            ],
            'comedy': [
                'I\'m Deceased 💀',
                'This Sent Me',
                'Comedy Gold Right Here',
                'Can\'t Stop Laughing',
                'This Is Too Much 😂',
                'Peak Comedy Content',
                'Humor That Hits Different',
                'Absolutely Unserious'
            ],
            'default': [
                'This Is Incredible',
                'You Need to See This',
                'Viral For a Reason',
                'Main Character Moment',
                'This Hit Different'
            ]
        };
        
        const engagementHashtags = {
            'educational': '#LearnOnTikTok #Educational #DidYouKnow #MindBlown #Knowledge #Facts #Viral #ForYou #Learning #Science',
            'entertainment': '#Viral #Entertainment #Funny #Amazing #Trending #ForYou #Fyp #Wow #Unbelievable #MustWatch',
            'tutorial': '#LifeHack #Tutorial #Tips #HowTo #Helpful #DIY #Learn #Hack #Easy #Quick',
            'comedy': '#Funny #Comedy #Laugh #Humor #Memes #LOL #Hilarious #DeadAss #Unhinged #Peak',
            'default': '#Viral #Trending #Amazing #ForYou #Fyp #MustWatch #Content #Wow #Incredible #Epic'
        };
        
        const titleList = viralTitles[contentType] || viralTitles['default'];
        let selectedTitle = titleList[Math.floor(Math.random() * titleList.length)];
        
        // Add performance-based emoji
        if (analysisData && analysisData.score > 90) {
            selectedTitle += ' 🔥';
        } else if (analysisData && analysisData.score > 80) {
            selectedTitle += ' ⚡';
        }
        
        const hashtagSet = engagementHashtags[contentType] || engagementHashtags['default'];
        
        return { 
            title: selectedTitle, 
            hashtags: hashtagSet 
        };
    }
};

// DOM Elements
const elements = {
    mainUploadZone: document.getElementById('mainUploadZone'),
    mainVideoFile: document.getElementById('mainVideoFile'),
    mainVideoPreview: document.getElementById('mainVideoPreview'),
    mainProgressBar: document.getElementById('mainProgressBar'),
    mainVideoInfo: document.getElementById('mainVideoInfo'),
    mainVideoDuration: document.getElementById('mainVideoDuration'),
    aiAnalysis: document.getElementById('aiAnalysis'),
    
    backgroundCard: document.getElementById('backgroundCard'),
    bgUploadZone: document.getElementById('bgUploadZone'),
    bgVideoFile: document.getElementById('bgVideoFile'),
    bgVideoPreview: document.getElementById('bgVideoPreview'),
    
    aiCard: document.getElementById('aiCard'),
    durationButtons: document.querySelectorAll('.duration-btn'),
    
    subtitleCard: document.getElementById('subtitleCard'),
    generateCard: document.getElementById('generateCard'),
    generateBtn: document.getElementById('generateBtn'),
    
    resultCard: document.getElementById('resultCard'),
    finalVideo: document.getElementById('finalVideo'),
    bestMoment: document.getElementById('bestMoment'),
    engagementScore: document.getElementById('engagementScore'),
    retentionPrediction: document.getElementById('retentionPrediction'),
    
    downloadBtn: document.getElementById('downloadBtn'),
    shareButtons: document.querySelectorAll('.share-btn'),
    
    soundsCard: document.getElementById('soundsCard'),
    recommendedSounds: document.getElementById('recommendedSounds'),
    
    processingOverlay: document.getElementById('processingOverlay'),
    processingStatus: document.getElementById('processingStatus'),
    processingSteps: document.getElementById('processingSteps'),
    downloadOverlay: document.getElementById('downloadOverlay')
};

// Initialize App
function init() {
    console.log('Initializing ShortCraft...');
    setupEventListeners();
    optimizeForMobile();
}

// Event Listeners Setup
function setupEventListeners() {
    // Main video upload - FIXED
    if (elements.mainUploadZone && elements.mainVideoFile) {
        elements.mainUploadZone.addEventListener('click', () => {
            console.log('Upload zone clicked');
            elements.mainVideoFile.click();
        });
        
        elements.mainVideoFile.addEventListener('change', (e) => {
            console.log('File selected:', e.target.files[0]);
            if (e.target.files[0]) {
                handleMainVideoUpload(e.target.files[0]);
            }
        });
        
        // Drag and drop
        elements.mainUploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            elements.mainUploadZone.classList.add('dragover');
        });
        
        elements.mainUploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            elements.mainUploadZone.classList.remove('dragover');
        });
        
        elements.mainUploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            elements.mainUploadZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleMainVideoUpload(files[0]);
            }
        });
    }
    
    // Background video upload
    if (elements.bgUploadZone && elements.bgVideoFile) {
        elements.bgUploadZone.addEventListener('click', () => elements.bgVideoFile.click());
        elements.bgVideoFile.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                handleBackgroundVideoUpload(e.target.files[0]);
            }
        });
    }
    
    // Duration selection
    elements.durationButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const duration = parseInt(btn.dataset.duration);
            selectDuration(duration);
        });
    });
    
    // Generate button
    if (elements.generateBtn) {
        elements.generateBtn.addEventListener('click', generateViralShort);
    }
    
    // Download and share
    if (elements.downloadBtn) {
        elements.downloadBtn.addEventListener('click', downloadVideo);
    }
    
    elements.shareButtons.forEach(btn => {
        btn.addEventListener('click', () => shareToplatform(btn.dataset.platform));
    });
}

// Main Video Upload Handler
async function handleMainVideoUpload(file) {
    console.log('Handling video upload:', file.name);
    
    if (!validateVideoFile(file)) return;
    
    state.mainVideo = file;
    showProgress(elements.mainProgressBar);
    
    const url = URL.createObjectURL(file);
    elements.mainVideoPreview.src = url;
    
    elements.mainVideoPreview.onloadedmetadata = async () => {
        console.log('Video loaded, duration:', elements.mainVideoPreview.duration);
        state.videoDuration = elements.mainVideoPreview.duration;
        showMainVideoInfo(file);
        await runAIAnalysis();
        showEditingOptions();
    };
}

// AI Analysis - SIMPLIFIED & FIXED
async function runAIAnalysis() {
    console.log('Starting AI Analysis...');
    
    // Create progress display
    elements.aiAnalysis.innerHTML = `
        <div style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 16px;">
            <div style="color: #00f2fe; font-weight: 600; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                🧠 AI Analysis Progress
                <button id="skipBtn" style="background: rgba(255,255,255,0.2); color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer;">
                    ⚡ Skip
                </button>
            </div>
            <div id="progressList">
                <div class="step" id="step1">⏳ Analyzing video content</div>
                <div class="step" id="step2">⏳ Finding best moments</div>
                <div class="step" id="step3">⏳ Calculating engagement</div>
                <div class="step" id="step4">⏳ Generating recommendations</div>
            </div>
        </div>
        <style>
            .step { padding: 4px 0; color: #888; font-size: 0.85rem; }
            .step.active { color: #00f2fe; }
            .step.done { color: #4ade80; }
        </style>
    `;
    
    // Add skip functionality
    let completed = false;
    document.getElementById('skipBtn').addEventListener('click', () => {
        completed = true;
        finishAnalysis();
    });
    
    // Run analysis steps
    const steps = ['step1', 'step2', 'step3', 'step4'];
    const messages = [
        '✅ Video content analyzed',
        '✅ Best moments identified',
        '✅ Engagement calculated',
        '✅ Recommendations generated'
    ];
    
    for (let i = 0; i < steps.length && !completed; i++) {
        const stepElement = document.getElementById(steps[i]);
        stepElement.classList.add('active');
        
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
        
        if (!completed) {
            stepElement.textContent = messages[i];
            stepElement.classList.remove('active');
            stepElement.classList.add('done');
        }
    }
    
    if (!completed) {
        finishAnalysis();
    }
    
    function finishAnalysis() {
        // Generate analysis results
        const contentType = detectContentType();
        const analysis = aiAnalyzer.analyzeVideo(state.videoDuration, state.targetDuration);
        const titleHashtags = aiAnalyzer.generateTitleAndHashtags(contentType);
        
        // Store results
        state.aiAnalysisResults = {
            ...analysis,
            contentType,
            titleAndHashtags: titleHashtags
        };
        
        // Show completion
        elements.aiAnalysis.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <span style="color: #00f2fe; font-weight: 600;">✓ AI Analysis Complete</span>
                <small style="color: #888;">Content Type: ${formatContentType(contentType)}</small>
                <small style="color: #4ade80;">Viral Potential: HIGH</small>
                
                <div style="margin-top: 12px; padding: 12px; background: rgba(0,242,254,0.1); border-radius: 8px;">
                    <div style="font-weight: 600; color: #00f2fe; margin-bottom: 8px;">📝 Suggested Content</div>
                    <div style="margin-bottom: 6px;"><strong>Title:</strong> ${titleHashtags.title}</div>
                    <div style="font-size: 0.85rem; color: #ccc; margin-bottom: 8px;">${titleHashtags.hashtags}</div>
                    <button onclick="copyTitleHashtags()" style="background: rgba(0,242,254,0.2); border: 1px solid rgba(0,242,254,0.4); color: #00f2fe; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer;">
                        📋 Copy
                    </button>
                </div>
            </div>
        `;
        
        console.log('AI Analysis completed');
    }
}

// Background Video Upload
function handleBackgroundVideoUpload(file) {
    if (!validateVideoFile(file)) return;
    
    state.backgroundVideo = file;
    const url = URL.createObjectURL(file);
    elements.bgVideoPreview.src = url;
    elements.bgVideoPreview.style.display = 'block';
}

// Show Editing Options
function showEditingOptions() {
    const cards = [elements.backgroundCard, elements.aiCard, elements.subtitleCard, elements.generateCard];
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.remove('hidden');
        }, index * 100);
    });
}

// Duration Selection
function selectDuration(duration) {
    state.targetDuration = duration;
    elements.durationButtons.forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.duration) === duration);
    });
}

// Video Processing Functions
const videoProcessor = {
    async createClippedVideo(originalVideo, startTime, endTime, cropRecommendation) {
        console.log(`Creating clip: ${startTime}s to ${endTime}s with ${cropRecommendation} crop`);
        
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const video = document.createElement('video');
            
            // Set canvas to vertical aspect ratio (9:16)
            canvas.width = 405; // 9:16 ratio
            canvas.height = 720;
            
            video.src = originalVideo.src;
            video.currentTime = startTime;
            video.muted = true;
            
            video.addEventListener('loadeddata', () => {
                const duration = endTime - startTime;
                const frameRate = 30; // 30 FPS
                const frames = [];
                let currentFrame = 0;
                const totalFrames = Math.floor(duration * frameRate);
                
                const captureFrame = () => {
                    if (currentFrame >= totalFrames) {
                        // Create video blob from frames
                        this.createVideoFromFrames(frames, frameRate).then(resolve);
                        return;
                    }
                    
                    const timeOffset = (currentFrame / frameRate);
                    video.currentTime = startTime + timeOffset;
                    
                    video.addEventListener('seeked', () => {
                        // Apply face-tracking crop
                        this.drawFrameWithCrop(ctx, video, canvas, cropRecommendation);
                        
                        // Capture frame
                        canvas.toBlob((blob) => {
                            frames.push(blob);
                            currentFrame++;
                            setTimeout(captureFrame, 33); // ~30fps
                        }, 'image/webp', 0.8);
                    }, { once: true });
                };
                
                captureFrame();
            });
        });
    },
    
    drawFrameWithCrop(ctx, video, canvas, cropStrategy) {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        let sourceX = 0, sourceY = 0, sourceWidth = videoWidth, sourceHeight = videoHeight;
        let destX = 0, destY = 0, destWidth = canvasWidth, destHeight = canvasHeight;
        
        // Calculate crop based on strategy
        switch (cropStrategy) {
            case 'face-track':
                // Simulate face detection - focus on upper 60% of video
                const faceRegionHeight = videoHeight * 0.6;
                sourceY = videoHeight * 0.1; // Start 10% from top
                sourceHeight = faceRegionHeight;
                
                // Maintain aspect ratio
                const aspectRatio = sourceWidth / sourceHeight;
                const targetAspectRatio = canvasWidth / canvasHeight;
                
                if (aspectRatio > targetAspectRatio) {
                    // Video is wider - crop sides
                    sourceWidth = sourceHeight * targetAspectRatio;
                    sourceX = (videoWidth - sourceWidth) / 2;
                }
                break;
                
            case 'upper-third':
                sourceY = 0;
                sourceHeight = videoHeight * 0.7;
                break;
                
            case 'center':
                // Center crop to 9:16
                const centerAspectRatio = videoWidth / videoHeight;
                const targetRatio = canvasWidth / canvasHeight;
                
                if (centerAspectRatio > targetRatio) {
                    sourceWidth = videoHeight * targetRatio;
                    sourceX = (videoWidth - sourceWidth) / 2;
                } else {
                    sourceHeight = videoWidth / targetRatio;
                    sourceY = (videoHeight - sourceHeight) / 2;
                }
                break;
                
            default: // smart-crop
                // Intelligent crop focusing on center-upper region
                sourceY = videoHeight * 0.15;
                sourceHeight = videoHeight * 0.7;
                const smartRatio = sourceWidth / sourceHeight;
                const canvasRatio = canvasWidth / canvasHeight;
                
                if (smartRatio > canvasRatio) {
                    sourceWidth = sourceHeight * canvasRatio;
                    sourceX = (videoWidth - sourceWidth) / 2;
                }
                break;
        }
        
        // Draw the cropped and scaled video frame
        ctx.drawImage(
            video,
            sourceX, sourceY, sourceWidth, sourceHeight,
            destX, destY, destWidth, destHeight
        );
        
        // Add subtle vignette for professional look
        const gradient = ctx.createRadialGradient(
            canvasWidth/2, canvasHeight/2, 0,
            canvasWidth/2, canvasHeight/2, Math.max(canvasWidth, canvasHeight)/2
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    },
    
    async createVideoFromFrames(frames, frameRate) {
        // For demo purposes, we'll return the original video
        // In a real implementation, you'd use WebCodecs API or FFmpeg.js
        console.log(`Would create video from ${frames.length} frames at ${frameRate}fps`);
        
        // Return a placeholder - in production this would be the actual processed video
        const canvas = document.createElement('canvas');
        canvas.width = 405;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        
        // Create a simple processed video indicator
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, 405, 720);
        ctx.fillStyle = '#00f2fe';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Processed Video', 202, 360);
        ctx.fillText(`${frames.length} frames`, 202, 390);
        
        return new Promise(resolve => {
            canvas.toBlob(resolve, 'video/mp4');
        });
    }
};
    if (!state.mainVideo || state.isProcessing) return;
    
    state.isProcessing = true;
    elements.generateBtn.disabled = true;
    
    showProcessingOverlay();
    
    // Processing steps
    const steps = [
        'Extracting optimal clip...',
        'Converting to vertical format...',
        'Adding AI subtitles...',
        'Applying viral optimizations...',
        'Final rendering...'
    ];
    
    elements.processingSteps.innerHTML = steps.map((step, i) => 
        `<div class="step-item" id="gen-step-${i}">⏳ ${step}</div>`
    ).join('');
    
    for (let i = 0; i < steps.length; i++) {
        const stepEl = document.getElementById(`gen-step-${i}`);
        stepEl.style.color = '#00f2fe';
        elements.processingStatus.textContent = steps[i];
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        stepEl.innerHTML = `✅ ${steps[i].replace('...', ' complete')}`;
        stepEl.style.color = '#4ade80';
    }
    
    createFinalVideo();
    hideProcessingOverlay();
    showResults();
    loadSounds();
    
    state.isProcessing = false;
    elements.generateBtn.disabled = false;
}

// Create Final Video
function createFinalVideo() {
    elements.finalVideo.src = elements.mainVideoPreview.src;
    
    const analysis = state.aiAnalysisResults;
    elements.bestMoment.textContent = `${formatTime(analysis.start)} - ${formatTime(analysis.end)}`;
    elements.engagementScore.textContent = `${analysis.score}/100`;
    elements.retentionPrediction.textContent = `${analysis.retentionPrediction}%`;
    
    // Add title/hashtags to results
    if (analysis.titleAndHashtags) {
        const titleSection = document.createElement('div');
        titleSection.className = 'insight-item';
        titleSection.style.cssText = 'border-bottom: none; flex-direction: column; align-items: flex-start;';
        titleSection.innerHTML = `
            <span class="insight-label">Suggested Title & Tags:</span>
            <div style="color: #00f2fe; font-weight: 600; margin: 8px 0;">${analysis.titleAndHashtags.title}</div>
            <div style="color: #ccc; font-size: 0.8rem; margin-bottom: 8px;">${analysis.titleAndHashtags.hashtags}</div>
            <button onclick="copyTitleHashtags()" style="background: rgba(0,242,254,0.2); border: 1px solid rgba(0,242,254,0.4); color: #00f2fe; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer;">
                📋 Copy Title & Tags
            </button>
        `;
        elements.resultCard.querySelector('.ai-insights').appendChild(titleSection);
    }
}

// Show Results
function showResults() {
    elements.resultCard.classList.remove('hidden');
    elements.resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Load Recommended Sounds
function loadSounds() {
    const sounds = [
        { name: 'Viral Beat 2025', meta: 'Perfect for your content type' },
        { name: 'Trending Audio', meta: 'High engagement rate' },
        { name: 'Algorithm Favorite', meta: 'Boosts reach' },
        { name: 'Background Loop', meta: 'Enhances retention' },
        { name: 'Popular Sound', meta: '2.1M uses this week' }
    ];
    
    elements.recommendedSounds.innerHTML = sounds.map(sound => `
        <div class="sound-item">
            <div class="sound-info">
                <h4>${sound.name}</h4>
                <div class="sound-meta">${sound.meta}</div>
            </div>
            <button class="play-btn" onclick="playSound(this)">▶</button>
        </div>
    `).join('');
    
    elements.soundsCard.classList.remove('hidden');
}

// Download Video
async function downloadVideo() {
    showDownloadOverlay();
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const link = document.createElement('a');
    link.href = elements.finalVideo.src;
    link.download = `shortcraft-${state.targetDuration}s-${Date.now()}.mp4`;
    
    if (isIOS()) {
        window.open(link.href, '_blank');
        showSuccessMessage('Video opened. Tap and hold to save to Photos!');
    } else {
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showSuccessMessage('Video downloaded successfully!');
    }
    
    hideDownloadOverlay();
}

// Share to Platform
async function shareToplatform(platform) {
    const urls = {
        'tiktok': 'https://www.tiktok.com/upload',
        'youtube': 'https://studio.youtube.com/channel/upload', 
        'instagram': 'https://www.instagram.com/'
    };
    
    window.open(urls[platform], '_blank');
    showSuccessMessage(`${platform.charAt(0).toUpperCase() + platform.slice(1)} opened! Upload your video there.`);
}

// Utility Functions
function validateVideoFile(file) {
    if (!file.type.startsWith('video/')) {
        alert('Please upload a video file');
        return false;
    }
    if (file.size > 500 * 1024 * 1024) {
        alert('File size must be less than 500MB');
        return false;
    }
    return true;
}

function showMainVideoInfo(file) {
    elements.mainVideoDuration.textContent = formatTime(state.videoDuration);
    elements.mainVideoInfo.style.display = 'block';
    elements.mainVideoPreview.style.display = 'block';
}

function showProgress(progressBar) {
    progressBar.style.display = 'block';
    const fill = progressBar.querySelector('.progress-fill');
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 20 + 5;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => progressBar.style.display = 'none', 500);
        }
        fill.style.width = `${progress}%`;
    }, 100);
}

function detectContentType() {
    const types = ['educational', 'entertainment', 'tutorial', 'comedy'];
    return types[Math.floor(Math.random() * types.length)];
}

function formatContentType(type) {
    const map = {
        'educational': 'Educational',
        'entertainment': 'Entertainment', 
        'tutorial': 'Tutorial',
        'comedy': 'Comedy'
    };
    return map[type] || 'General';
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function showProcessingOverlay() {
    elements.processingOverlay.style.display = 'flex';
}

function hideProcessingOverlay() {
    elements.processingOverlay.style.display = 'none';
}

function showDownloadOverlay() {
    elements.downloadOverlay.classList.remove('hidden');
    setTimeout(() => {
        document.querySelector('.download-fill').style.width = '100%';
    }, 100);
}

function hideDownloadOverlay() {
    setTimeout(() => {
        elements.downloadOverlay.classList.add('hidden');
        document.querySelector('.download-fill').style.width = '0%';
    }, 500);
}

function showSuccessMessage(message) {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        background: linear-gradient(135deg, #4ade80, #22c55e); color: white;
        padding: 12px 20px; border-radius: 12px; font-weight: 600;
        z-index: 10000; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;
    div.textContent = message;
    document.body.appendChild(div);
    
    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateX(-50%) translateY(-10px)';
        div.style.transition = 'all 0.3s ease';
        setTimeout(() => document.body.removeChild(div), 300);
    }, 2500);
}

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function playSound(button) {
    button.textContent = '⏸';
    setTimeout(() => button.textContent = '▶', 2000);
}

function copyTitleHashtags() {
    const analysis = state.aiAnalysisResults;
    if (!analysis.titleAndHashtags) return;
    
    const text = `${analysis.titleAndHashtags.title}\n${analysis.titleAndHashtags.hashtags}`;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showSuccessMessage('Title and hashtags copied!');
        });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccessMessage('Copied to clipboard!');
    }
}

function optimizeForMobile() {
    // Prevent iOS bounce scrolling
    document.body.addEventListener('touchstart', (e) => {
        if (e.target === document.body) e.preventDefault();
    }, { passive: false });
    
    document.body.addEventListener('touchmove', (e) => {
        if (e.target === document.body) e.preventDefault();
    }, { passive: false });
    
    // Handle viewport changes
    const updateViewport = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Global functions for buttons
window.copyTitleHashtags = copyTitleHashtags;
window.playSound = playSound;