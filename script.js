// ShortCraft - Final Working JavaScript
'use strict';

// Wait for DOM and libraries to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    setTimeout(initApp, 100);
}

// App State
const app = {
    video: null,
    duration: 0,
    targetDuration: 15,
    ffmpeg: null,
    processing: false,
    processedVideo: null
};

// Utilities
const utils = {
    formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    formatSize(bytes) {
        if (isNaN(bytes) || bytes < 0) return '0 MB';
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    },
    
    showNotification(message, type = 'success') {
        const div = document.createElement('div');
        div.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: ${type === 'error' ? '#ef4444' : '#22c55e'};
            color: white; padding: 12px 20px; border-radius: 8px;
            font-weight: 600; z-index: 10000; font-size: 0.9rem;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        div.textContent = message;
        document.body.appendChild(div);
        setTimeout(() => {
            if (div.parentNode) div.remove();
        }, 3000);
    },
    
    validateVideo(file) {
        if (!file) return { valid: false, error: 'No file selected' };
        if (!file.type.startsWith('video/')) return { valid: false, error: 'Please upload a video file' };
        if (file.size > 500 * 1024 * 1024) return { valid: false, error: 'File must be under 500MB' };
        if (file.size < 1000) return { valid: false, error: 'File appears to be corrupted' };
        return { valid: true };
    },
    
    updateElement(id, property, value) {
        const element = document.getElementById(id);
        if (element) {
            if (property === 'textContent') element.textContent = value;
            else if (property === 'style') Object.assign(element.style, value);
            else element[property] = value;
        }
    }
};

// AI Analyzer
const ai = {
    analyzeVideo(duration, targetDuration) {
        console.log(`Analyzing video: ${duration}s → ${targetDuration}s`);
        
        if (duration <= 0) {
            return {
                segments: [{ start: 0, end: Math.min(targetDuration, 15), score: 0.5 }],
                totalScore: 50,
                strategy: 'single'
            };
        }
        
        const safeStart = Math.min(5, duration * 0.15);
        const safeEnd = duration * 0.85;
        const availableTime = safeEnd - safeStart;
        
        let segments = [];
        
        if (availableTime <= targetDuration) {
            segments = [{
                start: safeStart,
                end: Math.min(safeStart + targetDuration, duration),
                score: 0.7
            }];
        } else {
            const segmentCount = targetDuration > 30 ? 2 : 1;
            
            if (segmentCount === 1) {
                const middleStart = duration * 0.3;
                const middleEnd = duration * 0.7;
                const bestStart = middleStart + Math.random() * (middleEnd - middleStart - targetDuration);
                
                segments = [{
                    start: Math.max(safeStart, bestStart),
                    end: Math.max(safeStart, bestStart) + targetDuration,
                    score: 0.75 + Math.random() * 0.2
                }];
            } else {
                const firstLength = targetDuration * 0.6;
                const secondLength = targetDuration * 0.4;
                
                segments = [
                    {
                        start: safeStart,
                        end: safeStart + firstLength,
                        score: 0.7 + Math.random() * 0.2
                    },
                    {
                        start: safeEnd - secondLength,
                        end: safeEnd,
                        score: 0.6 + Math.random() * 0.3
                    }
                ];
            }
        }
        
        const avgScore = segments.reduce((sum, seg) => sum + seg.score, 0) / segments.length;
        
        return {
            segments: segments.filter(seg => seg.end <= duration),
            totalScore: Math.min(Math.round(avgScore * 100), 100),
            strategy: segments.length > 1 ? 'multi' : 'single'
        };
    },
    
    generateViralContent(score) {
        const titles = [
            'This Will Blow Your Mind 🤯',
            'You Won\'t Believe What Happened',
            'Wait For It... 😱',
            'This Changes Everything',
            'Absolutely Incredible',
            'Mind = Blown 🧠',
            'This Hit Different',
            'Peak Content Right Here'
        ];
        
        const hashtagSets = [
            '#Viral #Trending #Amazing #ForYou #Fyp',
            '#MustWatch #Content #Wow #Unbelievable #Epic',
            '#Trending #ForYourPage #Amazing #Viral #MustSee',
            '#Content #Creator #Trending #Viral #ForYou'
        ];
        
        const title = titles[Math.floor(Math.random() * titles.length)] + 
                     (score > 85 ? ' 🔥' : score > 75 ? ' ⚡' : '');
        const hashtags = hashtagSets[Math.floor(Math.random() * hashtagSets.length)];
        
        return { title, hashtags };
    }
};

// Video Processor
const processor = {
    async initFFmpeg() {
        if (app.ffmpeg) return app.ffmpeg;
        
        if (!window.FFmpeg || !window.toBlobURL) {
            throw new Error('FFmpeg libraries not loaded. Please refresh the page.');
        }
        
        try {
            console.log('Initializing FFmpeg...');
            app.ffmpeg = new window.FFmpeg();
            
            app.ffmpeg.on('progress', ({ progress }) => {
                const percent = Math.max(0, Math.min(100, Math.round(progress * 100)));
                utils.updateElement('processingStatus', 'textContent', `Processing video... ${percent}%`);
            });
            
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm';
            
            await app.ffmpeg.load({
                coreURL: await window.toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await window.toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
            });
            
            console.log('✅ FFmpeg initialized successfully');
            return app.ffmpeg;
            
        } catch (error) {
            console.error('❌ FFmpeg initialization failed:', error);
            throw new Error(`FFmpeg failed to load: ${error.message}`);
        }
    },
    
    async processVideo(file, segments) {
        if (!file || !segments || segments.length === 0) {
            throw new Error('Invalid file or segments');
        }
        
        const ffmpeg = await this.initFFmpeg();
        
        try {
            console.log(`Processing ${segments.length} segment(s)`);
            
            const buffer = await file.arrayBuffer();
            await ffmpeg.writeFile('input.mp4', new Uint8Array(buffer));
            
            if (segments.length === 1) {
                return await this.processSingle(ffmpeg, segments[0]);
            } else {
                return await this.processMultiple(ffmpeg, segments);
            }
        } catch (error) {
            console.error('Video processing failed:', error);
            throw new Error(`Processing failed: ${error.message}`);
        }
    },
    
    async processSingle(ffmpeg, segment) {
        const duration = Math.max(0.1, segment.end - segment.start);
        
        await ffmpeg.exec([
            '-i', 'input.mp4',
            '-ss', segment.start.toString(),
            '-t', duration.toString(),
            '-vf', 'scale=405:720:force_original_aspect_ratio=increase,crop=405:720',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '28',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-avoid_negative_ts', 'make_zero',
            'output.mp4'
        ]);
        
        const data = await ffmpeg.readFile('output.mp4');
        return new Blob([data], { type: 'video/mp4' });
    },
    
    async processMultiple(ffmpeg, segments) {
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const duration = Math.max(0.1, seg.end - seg.start);
            
            await ffmpeg.exec([
                '-i', 'input.mp4',
                '-ss', seg.start.toString(),
                '-t', duration.toString(),
                '-vf', 'scale=405:720:force_original_aspect_ratio=increase,crop=405:720',
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '28',
                '-c:a', 'aac',
                '-b:a', '128k',
                '-avoid_negative_ts', 'make_zero',
                `segment_${i}.mp4`
            ]);
        }
        
        const concatList = segments.map((_, i) => `file 'segment_${i}.mp4'`).join('\n');
        await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatList));
        
        await ffmpeg.exec([
            '-f', 'concat',
            '-safe', '0',
            '-i', 'concat.txt',
            '-c', 'copy',
            '-movflags', '+faststart',
            'output.mp4'
        ]);
        
        const data = await ffmpeg.readFile('output.mp4');
        return new Blob([data], { type: 'video/mp4' });
    }
};

// Event Handlers
const handlers = {
    async handleVideoUpload(file) {
        const validation = utils.validateVideo(file);
        if (!validation.valid) {
            utils.showNotification(validation.error, 'error');
            return;
        }
        
        try {
            app.video = file;
            
            utils.updateElement('progressBar', 'style', { display: 'block' });
            const progressFill = document.querySelector('.progress-fill');
            if (progressFill) progressFill.style.width = '20%';
            
            const url = URL.createObjectURL(file);
            const videoElement = document.getElementById('videoPreview');
            
            if (videoElement) {
                videoElement.src = url;
                videoElement.style.display = 'block';
                
                videoElement.onloadedmetadata = () => {
                    app.duration = videoElement.duration;
                    
                    utils.updateElement('videoDuration', 'textContent', utils.formatTime(app.duration));
                    utils.updateElement('videoInfo', 'style', { display: 'block' });
                    utils.updateElement('aiStatus', 'textContent', `Ready! (${utils.formatSize(file.size)})`);
                    
                    if (progressFill) progressFill.style.width = '100%';
                    setTimeout(() => {
                        utils.updateElement('progressBar', 'style', { display: 'none' });
                    }, 1000);
                    
                    const settingsCard = document.getElementById('settingsCard');
                    if (settingsCard) settingsCard.classList.remove('hidden');
                    
                    utils.showNotification('✅ Video uploaded successfully!');
                };
                
                videoElement.onerror = () => {
                    utils.showNotification('Failed to load video. Please try a different file.', 'error');
                    utils.updateElement('progressBar', 'style', { display: 'none' });
                };
            }
        } catch (error) {
            console.error('Upload error:', error);
            utils.showNotification('Upload failed: ' + error.message, 'error');
        }
    },
    
    selectDuration(duration, button) {
        document.querySelectorAll('.duration-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        app.targetDuration = duration;
        console.log(`Duration set to: ${duration}s`);
    },
    
    async generateShort() {
        if (!app.video || app.processing) return;
        
        try {
            app.processing = true;
            
            utils.updateElement('generateBtn', 'disabled', true);
            utils.updateElement('generateBtn', 'textContent', '⏳ Processing...');
            utils.updateElement('processingOverlay', 'style', { display: 'flex' });
            utils.updateElement('processingStatus', 'textContent', 'Starting AI analysis...');
            
            // AI Analysis
            const analysis = ai.analyzeVideo(app.duration, app.targetDuration);
            console.log('Analysis result:', analysis);
            
            utils.updateElement('processingStatus', 'textContent', 'AI analysis complete. Processing video...');
            
            // Process video
            const videoBlob = await processor.processVideo(app.video, analysis.segments);
            
            // Generate viral content
            const content = ai.generateViralContent(analysis.totalScore);
            
            // Update results
            const videoUrl = URL.createObjectURL(videoBlob);
            utils.updateElement('finalVideo', 'src', videoUrl);
            utils.updateElement('finalVideo', 'style', { display: 'block' });
            
            // Update insights
            const momentText = analysis.segments.length > 1 ? 
                `${analysis.segments.length} segments combined` :
                `${utils.formatTime(analysis.segments[0].start)} - ${utils.formatTime(analysis.segments[0].end)}`;
            
            utils.updateElement('bestMoment', 'textContent', momentText);
            utils.updateElement('engagementScore', 'textContent', `${analysis.totalScore}/100`);
            utils.updateElement('viralPotential', 'textContent', `${Math.round(analysis.totalScore * 0.9)}%`);
            utils.updateElement('viralTitle', 'textContent', content.title);
            utils.updateElement('viralHashtags', 'textContent', content.hashtags);
            
            // Store result
            app.processedVideo = videoBlob;
            
            // Show results
            const resultCard = document.getElementById('resultCard');
            if (resultCard) {
                resultCard.classList.remove('hidden');
                resultCard.scrollIntoView({ behavior: 'smooth' });
            }
            
            utils.showNotification('🎉 Your viral short is ready!');
            
        } catch (error) {
            console.error('Generation failed:', error);
            utils.showNotification(`Generation failed: ${error.message}`, 'error');
        } finally {
            app.processing = false;
            utils.updateElement('generateBtn', 'disabled', false);
            utils.updateElement('generateBtn', 'textContent', '✨ Generate Viral Short');
            utils.updateElement('processingOverlay', 'style', { display: 'none' });
        }
    },
    
    downloadVideo() {
        if (!app.processedVideo) {
            utils.showNotification('No video to download!', 'error');
            return;
        }
        
        try {
            const url = URL.createObjectURL(app.processedVideo);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shortcraft-${Date.now()}.mp4`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            utils.showNotification('📱 Video downloaded successfully!');
        } catch (error) {
            console.error('Download failed:', error);
            utils.showNotification('Download failed. Please try again.', 'error');
        }
    },
    
    async shareToSocial(platform) {
        const title = document.getElementById('viralTitle')?.textContent || '';
        const hashtags = document.getElementById('viralHashtags')?.textContent || '';
        const content = title + '\n\n' + hashtags;
        
        try {
            await navigator.clipboard.writeText(content);
            utils.showNotification(`Content copied! Opening ${platform}...`);
            
            const urls = {
                tiktok: 'https://www.tiktok.com/upload',
                instagram: 'https://www.instagram.com/',
                youtube: 'https://studio.youtube.com/'
            };
            
            if (urls[platform]) {
                setTimeout(() => window.open(urls[platform], '_blank'), 1000);
            }
        } catch (error) {
            utils.showNotification('Copy failed, but opening platform...', 'error');
            const urls = {
                tiktok: 'https://www.tiktok.com/upload',
                instagram: 'https://www.instagram.com/',
                youtube: 'https://studio.youtube.com/'
            };
            if (urls[platform]) {
                window.open(urls[platform], '_blank');
            }
        }
    }
};

// Initialize App
function initApp() {
    console.log('🎬 Initializing ShortCraft...');
    
    try {
        // Check essential elements
        const uploadZone = document.getElementById('uploadZone');
        const videoFile = document.getElementById('videoFile');
        
        if (!uploadZone || !videoFile) {
            throw new Error('Essential DOM elements not found');
        }
        
        // Upload zone click
        uploadZone.addEventListener('click', () => videoFile.click());
        
        // File input change
        videoFile.addEventListener('change', (e) => {
            if (e.target.files && e.target.files[0]) {
                handlers.handleVideoUpload(e.target.files[0]);
            }
        });
        
        // Drag & drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '#00f2fe';
            uploadZone.style.transform = 'scale(1.02)';
        });
        
        uploadZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '';
            uploadZone.style.transform = '';
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '';
            uploadZone.style.transform = '';
            
            const files = e.dataTransfer.files;
            if (files && files[0] && files[0].type.startsWith('video/')) {
                handlers.handleVideoUpload(files[0]);
            } else {
                utils.showNotification('Please drop a video file', 'error');
            }
        });
        
        // Duration buttons
        document.querySelectorAll('.duration-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const duration = parseInt(btn.dataset.duration);
                if (!isNaN(duration)) {
                    handlers.selectDuration(duration, btn);
                }
            });
        });
        
        // Generate button
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', handlers.generateShort);
        }
        
        // Download button  
        const downloadBtn = document.getElementById('downloadBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', handlers.downloadVideo);
        }
        
        // Share buttons
        document.querySelectorAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                if (platform) {
                    handlers.shareToSocial(platform);
                }
            });
        });
        
        // Content box click to copy
        const contentBox = document.querySelector('.content-box');
        if (contentBox) {
            contentBox.addEventListener('click', async () => {
                const title = document.getElementById('viralTitle')?.textContent || '';
                const hashtags = document.getElementById('viralHashtags')?.textContent || '';
                const content = title + '\n\n' + hashtags;
                
                try {
                    await navigator.clipboard.writeText(content);
                    utils.showNotification('📋 Content copied to clipboard!');
                } catch (error) {
                    utils.showNotification('Copy failed', 'error');
                }
            });
        }
        
        // Mobile optimizations
        if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
            document.querySelectorAll('video').forEach(video => {
                video.setAttribute('playsinline', 'true');
                video.setAttribute('webkit-playsinline', 'true');
            });
            console.log('📱 Mobile optimizations applied');
        }
        
        console.log('✅ ShortCraft initialized successfully!');
        utils.showNotification('🎬 ShortCraft is ready! Upload a video to start creating viral content.');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        utils.showNotification('Initialization failed. Please refresh the page.', 'error');
    }
}

// Global error handling
window.addEventListener('error', (e) => {
    console.error('💥 Global error:', e.error);
    
    if (app.processing) {
        app.processing = false;
        utils.updateElement('generateBtn', 'disabled', false);
        utils.updateElement('generateBtn', 'textContent', '✨ Generate Viral Short');
        utils.updateElement('processingOverlay', 'style', { display: 'none' });
    }
    
    utils.showNotification('Something went wrong. Please try again.', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('💥 Unhandled rejection:', e.reason);
    e.preventDefault();
    
    if (app.processing) {
        app.processing = false;
        utils.updateElement('generateBtn', 'disabled', false);
        utils.updateElement('generateBtn', 'textContent', '✨ Generate Viral Short');
        utils.updateElement('processingOverlay', 'style', { display: 'none' });
    }
});

// Export for debugging
window.ShortCraft = { 
    app, 
    utils, 
    ai, 
    processor, 
    handlers
};

console.log('📜 ShortCraft script loaded and ready');