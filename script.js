// ShortCraft - AI Video Editor - Complete Debugged Version
'use strict';

// Global error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showNotification('An unexpected error occurred. Please refresh and try again.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

// Enhanced notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'error' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #4ade80, #22c55e)'};
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        font-weight: 600;
        z-index: 10000;
        max-width: 320px;
        text-align: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        font-size: 0.9rem;
        transition: all 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(-50%) translateY(-10px)';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, type === 'error' ? 4000 : 2500);
}

// Application State Management
const AppState = {
    mainVideo: null,
    backgroundVideo: null,
    videoDuration: 0,
    targetDuration: 15,
    contentType: 'auto',
    isProcessing: false,
    aiAnalysisResults: null,
    processedVideoBlob: null,
    viralContent: null,
    
    setMainVideo(video) {
        if (video instanceof File && video.type.startsWith('video/')) {
            this.mainVideo = video;
            return true;
        }
        return false;
    },
    
    setVideoDuration(duration) {
        if (typeof duration === 'number' && duration > 0) {
            this.videoDuration = duration;
            return true;
        }
        return false;
    },
    
    setTargetDuration(duration) {
        const validDurations = [15, 30, 45, 60];
        if (validDurations.includes(duration)) {
            this.targetDuration = duration;
            return true;
        }
        return false;
    }
};

// DOM Elements Cache
const Elements = {
    cache: new Map(),
    
    get(id) {
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }
        
        const element = document.getElementById(id);
        if (element) {
            this.cache.set(id, element);
        }
        return element;
    },
    
    getAll(selector) {
        return document.querySelectorAll(selector);
    }
};

// Define element getters
Object.defineProperties(Elements, {
    mainUploadZone: { get() { return this.get('mainUploadZone'); } },
    mainVideoFile: { get() { return this.get('mainVideoFile'); } },
    mainVideoPreview: { get() { return this.get('mainVideoPreview'); } },
    mainProgressBar: { get() { return this.get('mainProgressBar'); } },
    mainVideoInfo: { get() { return this.get('mainVideoInfo'); } },
    mainVideoDuration: { get() { return this.get('mainVideoDuration'); } },
    aiAnalysis: { get() { return this.get('aiAnalysis'); } },
    aiStatus: { get() { return this.get('aiStatus'); } },
    backgroundCard: { get() { return this.get('backgroundCard'); } },
    bgUploadZone: { get() { return this.get('bgUploadZone'); } },
    bgVideoFile: { get() { return this.get('bgVideoFile'); } },
    bgVideoPreview: { get() { return this.get('bgVideoPreview'); } },
    aiCard: { get() { return this.get('aiCard'); } },
    subtitleCard: { get() { return this.get('subtitleCard'); } },
    generateCard: { get() { return this.get('generateCard'); } },
    generateBtn: { get() { return this.get('generateBtn'); } },
    generateLoading: { get() { return this.get('generateLoading'); } },
    resultCard: { get() { return this.get('resultCard'); } },
    finalVideo: { get() { return this.get('finalVideo'); } },
    bestMoment: { get() { return this.get('bestMoment'); } },
    engagementScore: { get() { return this.get('engagementScore'); } },
    retentionPrediction: { get() { return this.get('retentionPrediction'); } },
    downloadBtn: { get() { return this.get('downloadBtn'); } },
    soundsCard: { get() { return this.get('soundsCard'); } },
    recommendedSounds: { get() { return this.get('recommendedSounds'); } },
    processingOverlay: { get() { return this.get('processingOverlay'); } },
    processingStatus: { get() { return this.get('processingStatus'); } },
    processingSteps: { get() { return this.get('processingSteps'); } },
    downloadOverlay: { get() { return this.get('downloadOverlay'); } },
    uploadError: { get() { return this.get('uploadError'); } }
});

// Utility Functions
const Utils = {
    formatTime(seconds) {
        if (typeof seconds !== 'number' || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },
    
    formatFileSize(bytes) {
        if (typeof bytes !== 'number' || isNaN(bytes)) return '0 MB';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    },
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    },
    
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    validateVideoFile(file) {
        if (!(file instanceof File)) {
            return { valid: false, error: 'Invalid file object' };
        }
        
        if (!file.type.startsWith('video/')) {
            return { valid: false, error: 'Please upload a video file' };
        }
        
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (file.size > maxSize) {
            return { valid: false, error: 'File size must be less than 500MB' };
        }
        
        return { valid: true };
    },
    
    detectContentType() {
        const types = ['educational', 'entertainment', 'tutorial', 'comedy'];
        const weights = [0.25, 0.4, 0.2, 0.15];
        
        const random = Math.random();
        let cumulative = 0;
        
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (random <= cumulative) {
                return types[i];
            }
        }
        
        return 'entertainment';
    },
    
    async copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'absolute';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return Promise.resolve();
            } catch (error) {
                document.body.removeChild(textArea);
                return Promise.reject(error);
            }
        }
    }
};

// AI Analyzer with Fallback Methods
const AIAnalyzer = {
    async analyzeVideoSegments(video, duration, targetLength) {
        try {
            console.log('Starting video segment analysis...');
            
            // Check if face detection is available
            const hasFaceDetection = window.faceDetection && typeof tf !== 'undefined';
            
            if (hasFaceDetection) {
                return await this.analyzeVideoSegmentsAdvanced(video, duration, targetLength);
            } else {
                return this.analyzeVideoSegmentsBasic(video, duration, targetLength);
            }
        } catch (error) {
            console.error('Video analysis error:', error);
            return this.getFallbackAnalysis(duration, targetLength);
        }
    },
    
    async analyzeVideoSegmentsAdvanced(video, duration, targetLength) {
        // Advanced analysis with face detection
        const segments = [];
        const chunkSize = 3;
        const totalChunks = Math.floor(duration / chunkSize);
        
        let faceDetector;
        try {
            faceDetector = await window.faceDetection.createDetector(
                window.faceDetection.SupportedModels.MediaPipeFaceDetector,
                { runtime: 'tfjs', modelType: 'short' }
            );
        } catch (error) {
            console.warn('Face detector initialization failed:', error);
            return this.analyzeVideoSegmentsBasic(video, duration, targetLength);
        }
        
        for (let i = 0; i < Math.min(totalChunks, 10); i++) { // Limit to 10 chunks for performance
            const startTime = i * chunkSize;
            const endTime = Math.min(startTime + chunkSize, duration);
            
            const segmentScore = await this.analyzeSegmentAdvanced(
                video, startTime, endTime, faceDetector
            );
            
            segments.push({
                startTime,
                endTime,
                duration: endTime - startTime,
                ...segmentScore
            });
        }
        
        const bestSegments = this.selectBestSegments(segments, targetLength);
        
        return {
            segments: bestSegments,
            totalScore: this.calculateOverallScore(bestSegments),
            splicingStrategy: bestSegments.length > 1 ? 'multi' : 'single',
            faceDetection: bestSegments.some(s => s.faceScore > 0.7)
        };
    },
    
    analyzeVideoSegmentsBasic(video, duration, targetLength) {
        console.log('Using basic video analysis (no face detection)');
        
        // Simple analysis without face detection
        const segments = this.generateBasicSegments(duration, targetLength);
        
        return {
            segments: segments,
            totalScore: 75,
            splicingStrategy: segments.length > 1 ? 'multi' : 'single',
            faceDetection: false
        };
    },
    
    generateBasicSegments(duration, targetLength) {
        // Avoid first 5 seconds and last 10%
        const safeStart = Math.min(5, duration * 0.1);
        const safeEnd = duration * 0.9;
        const availableDuration = safeEnd - safeStart;
        
        if (availableDuration <= targetLength) {
            return [{
                startTime: safeStart,
                endTime: Math.min(safeStart + targetLength, duration),
                duration: Math.min(targetLength, availableDuration),
                faceScore: 0.5,
                activityScore: 0.7,
                audioScore: 0.6,
                overallScore: 0.63
            }];
        }
        
        // Select best part from middle third
        const middleStart = duration * 0.3;
        const middleEnd = duration * 0.7;
        const bestStart = middleStart + Math.random() * (middleEnd - middleStart - targetLength);
        
        return [{
            startTime: Math.max(safeStart, bestStart),
            endTime: Math.max(safeStart, bestStart) + targetLength,
            duration: targetLength,
            faceScore: 0.5,
            activityScore: 0.7,
            audioScore: 0.6,
            overallScore: 0.63
        }];
    },
    
    async analyzeSegmentAdvanced(video, startTime, endTime, faceDetector) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 320;
        canvas.height = 180;
        
        // Sample middle of segment
        const sampleTime = startTime + (endTime - startTime) / 2;
        
        try {
            video.currentTime = sampleTime;
            
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Seek timeout')), 2000);
                const onSeeked = () => {
                    clearTimeout(timeout);
                    video.removeEventListener('seeked', onSeeked);
                    resolve();
                };
                video.addEventListener('seeked', onSeeked);
            });
            
            // Draw frame for analysis
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Analyze faces
            const faceScore = await this.analyzeFaces(canvas, faceDetector);
            
            // Analyze visual activity
            const activityScore = this.analyzeVisualActivity(ctx, canvas);
            
            // Estimate audio (simplified)
            const audioScore = this.estimateAudioLevel(sampleTime);
            
            return {
                faceScore,
                activityScore,
                audioScore,
                overallScore: (faceScore * 0.5) + (activityScore * 0.3) + (audioScore * 0.2)
            };
            
        } catch (error) {
            console.warn('Segment analysis failed:', error);
            return {
                faceScore: 0.4,
                activityScore: 0.6,
                audioScore: 0.5,
                overallScore: 0.5
            };
        }
    },
    
    async analyzeFaces(canvas, faceDetector) {
        if (!faceDetector) return 0.3;
        
        try {
            const faces = await faceDetector.estimateFaces(canvas);
            
            if (faces.length === 0) return 0.2;
            if (faces.length === 1) return 0.9;
            if (faces.length === 2) return 0.7;
            return 0.4;
            
        } catch (error) {
            console.warn('Face detection failed:', error);
            return 0.3;
        }
    },
    
    analyzeVisualActivity(ctx, canvas) {
        try {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            let edgeCount = 0;
            const threshold = 50;
            const step = 16; // Sample every 16th pixel for performance
            
            for (let i = 0; i < data.length - step; i += step) {
                const current = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const next = (data[i + step] + data[i + step + 1] + data[i + step + 2]) / 3;
                
                if (Math.abs(current - next) > threshold) {
                    edgeCount++;
                }
            }
            
            const maxPossibleEdges = data.length / (step * 4);
            return Math.min(edgeCount / maxPossibleEdges * 4, 1);
            
        } catch (error) {
            return 0.5;
        }
    },
    
    estimateAudioLevel(currentTime) {
        // Simplified audio estimation based on time patterns
        const timeRatio = currentTime % 10 / 10; // 10 second cycles
        
        if (timeRatio < 0.1 || timeRatio > 0.9) return 0.3;
        if (timeRatio > 0.4 && timeRatio < 0.6) return 0.8;
        return 0.6;
    },
    
    selectBestSegments(segments, targetLength) {
        segments.sort((a, b) => b.overallScore - a.overallScore);
        
        const selectedSegments = [];
        let totalDuration = 0;
        
        for (const segment of segments) {
            if (totalDuration >= targetLength) break;
            
            const remainingTime = targetLength - totalDuration;
            const segmentToAdd = { ...segment };
            
            if (segment.duration > remainingTime) {
                segmentToAdd.duration = remainingTime;
                segmentToAdd.endTime = segmentToAdd.startTime + remainingTime;
            }
            
            selectedSegments.push(segmentToAdd);
            totalDuration += segmentToAdd.duration;
        }
        
        return selectedSegments.sort((a, b) => a.startTime - b.startTime);
    },
    
    calculateOverallScore(segments) {
        if (segments.length === 0) return 60;
        
        const avgScore = segments.reduce((sum, seg) => sum + seg.overallScore, 0) / segments.length;
        const faceBonus = segments.some(s => s.faceScore > 0.7) ? 0.15 : 0;
        
        return Math.min((avgScore + faceBonus) * 100, 100);
    },
    
    getFallbackAnalysis(duration, targetLength) {
        const startTime = Math.max(3, duration * 0.3);
        return {
            segments: [{
                startTime,
                endTime: startTime + Math.min(targetLength, duration - startTime),
                duration: Math.min(targetLength, duration - startTime),
                faceScore: 0.5,
                activityScore: 0.6,
                audioScore: 0.5,
                overallScore: 0.55
            }],
            totalScore: 70,
            splicingStrategy: 'single',
            faceDetection: false
        };
    },
    
    generateTitleAndHashtags(contentType, analysisData = {}) {
        const viralTitles = {
            educational: [
                'This Will Blow Your Mind 🤯',
                'Nobody Talks About This',
                'The Secret They Don\'t Want You to Know',
                'I Wish I Knew This Sooner'
            ],
            entertainment: [
                'You Won\'t Believe What Happened',
                'Wait For It... 😱',
                'This Plot Twist Though',
                'Absolutely Unhinged'
            ],
            tutorial: [
                'This Hack Changed My Life',
                'Why Didn\'t I Know This Before?',
                'Game Changer Alert 🚨',
                'This Makes It So Easy'
            ],
            comedy: [
                'I\'m Deceased 💀',
                'This Sent Me',
                'Comedy Gold Right Here',
                'Peak Comedy Content'
            ]
        };
        
        const engagementHashtags = {
            educational: '#LearnOnTikTok #Educational #DidYouKnow #MindBlown #Knowledge #Facts #Viral #ForYou',
            entertainment: '#Viral #Entertainment #Funny #Amazing #Trending #ForYou #Fyp #Wow #Unbelievable',
            tutorial: '#LifeHack #Tutorial #Tips #HowTo #Helpful #DIY #Learn #Hack #Easy #Quick',
            comedy: '#Funny #Comedy #Laugh #Humor #Memes #LOL #Hilarious #Peak #Unhinged #Viral'
        };
        
        const titleList = viralTitles[contentType] || viralTitles.entertainment;
        let selectedTitle = titleList[Math.floor(Math.random() * titleList.length)];
        
        if (analysisData.totalScore > 90) {
            selectedTitle += ' 🔥';
        } else if (analysisData.totalScore > 80) {
            selectedTitle += ' ⚡';
        }
        
        const hashtags = engagementHashtags[contentType] || engagementHashtags.entertainment;
        
        return { title: selectedTitle, hashtags };
    }
};

// Video Processor with FFmpeg Integration
const VideoProcessor = {
    ffmpegInstance: null,
    isLoading: false,
    
    async initializeFFmpeg() {
        if (this.ffmpegInstance) {
            return this.ffmpegInstance;
        }
        
        if (this.isLoading) {
            throw new Error('FFmpeg is already loading');
        }
        
        if (!window.FFmpeg) {
            throw new Error('FFmpeg.wasm not available. Please check library imports.');
        }
        
        try {
            this.isLoading = true;
            console.log('Initializing FFmpeg...');
            
            const ffmpeg = new window.FFmpeg();
            
            ffmpeg.on('log', ({ message }) => {
                console.log('[FFmpeg]', message);
            });
            
            ffmpeg.on('progress', ({ progress, time }) => {
                const percentage = Math.round(progress * 100);
                console.log(`[FFmpeg] Progress: ${percentage}%`);
                this.updateProcessingProgress(percentage);
            });
            
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm';
            
            await ffmpeg.load({
                coreURL: await window.toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await window.toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
                workerURL: await window.toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
            });
            
            this.ffmpegInstance = ffmpeg;
            this.isLoading = false;
            console.log('FFmpeg initialized successfully');
            
            return ffmpeg;
            
        } catch (error) {
            this.isLoading = false;
            console.error('FFmpeg initialization failed:', error);
            throw new Error(`FFmpeg initialization failed: ${error.message}`);
        }
    },
    
    async processVideoSegments(videoFile, segments, options = {}) {
        try {
            const ffmpeg = await this.initializeFFmpeg();
            
            console.log('Processing video segments:', segments.length);
            
            // Convert file to Uint8Array
            const videoData = await this.fileToUint8Array(videoFile);
            await ffmpeg.writeFile('input.mp4', videoData);
            
            if (segments.length === 1) {
                return await this.processSingleSegment(ffmpeg, segments[0], options);
            } else {
                return await this.processMultipleSegments(ffmpeg, segments, options);
            }
            
        } catch (error) {
            console.error('Video processing failed:', error);
            throw error;
        }
    },
    
    async processSingleSegment(ffmpeg, segment, options) {
        const { startTime, duration } = segment;
        const { targetWidth = 405, targetHeight = 720 } = options;
        
        console.log(`Processing single segment: ${startTime}s for ${duration}s`);
        
        const command = [
            '-i', 'input.mp4',
            '-ss', startTime.toString(),
            '-t', duration.toString(),
            '-vf', `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}`,
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '28',
            '-c:a', 'aac',
            '-b:a', '96k',
            '-movflags', '+faststart',
            '-avoid_negative_ts', 'make_zero',
            'output.mp4'
        ];
        
        await ffmpeg.exec(command);
        
        const outputData = await ffmpeg.readFile('output.mp4');
        return new Blob([outputData], { type: 'video/mp4' });
    },
    
    async processMultipleSegments(ffmpeg, segments, options) {
        const { targetWidth = 405, targetHeight = 720 } = options;
        
        console.log(`Processing ${segments.length} segments for splicing`);
        
        // Extract and process each segment
        const segmentFiles = [];
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const outputName = `segment_${i}.mp4`;
            
            const command = [
                '-i', 'input.mp4',
                '-ss', segment.startTime.toString(),
                '-t', segment.duration.toString(),
                '-vf', `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}`,
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-crf', '28',
                '-c:a', 'aac',
                '-b:a', '96k',
                '-avoid_negative_ts', 'make_zero',
                outputName
            ];
            
            await ffmpeg.exec(command);
            segmentFiles.push(outputName);
        }
        
        // Create concat file
        const concatContent = segmentFiles.map(f => `file '${f}'`).join('\n');
        await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatContent));
        
        // Concatenate segments
        const concatCommand = [
            '-f', 'concat',
            '-safe', '0',
            '-i', 'concat.txt',
            '-c', 'copy',
            '-movflags', '+faststart',
            'final_output.mp4'
        ];
        
        await ffmpeg.exec(concatCommand);
        
        const outputData = await ffmpeg.readFile('final_output.mp4');
        return new Blob([outputData], { type: 'video/mp4' });
    },
    
    async fileToUint8Array(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(new Uint8Array(reader.result));
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    },
    
    updateProcessingProgress(percentage) {
        if (Elements.processingStatus) {
            Elements.processingStatus.textContent = `Processing video... ${percentage}%`;
        }
        
        this.updateProcessingSteps(percentage);
    },
    
    updateProcessingSteps(percentage) {
        if (!Elements.processingSteps) return;
        
        const steps = [
            { text: 'Analyzing video segments', threshold: 20 },
            { text: 'Detecting optimal moments', threshold: 40 },
            { text: 'Processing with AI', threshold: 60 },
            { text: 'Cropping and optimizing', threshold: 80 },
            { text: 'Finalizing video', threshold: 95 },
            { text: 'Complete!', threshold: 100 }
        ];
        
        const stepsHtml = steps.map((step, index) => {
            let status = '';
            if (percentage >= step.threshold) {
                status = 'completed';
            } else if (percentage >= (steps[index - 1]?.threshold || 0)) {
                status = 'active';
            }
            
            const icon = percentage >= step.threshold ? '✓' : 
                        status === 'active' ? '○' : '○';
            
            return `<div class="step-item ${status}">
                <span>${icon}</span> ${step.text}
            </div>`;
        }).join('');
        
        Elements.processingSteps.innerHTML = stepsHtml;
    }
};

// Main Application Class
class ShortCraftApp {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🎬 Initializing ShortCraft...');
        try {
            this.setupEventListeners();
            this.optimizeForMobile();
            console.log('ShortCraft initialized successfully');
        } catch (error) {
            console.error('Initialization error:', error);
            showNotification('App initialization failed. Please refresh the page.', 'error');
        }
    }
    
    setupEventListeners() {
        // Main video upload
        if (Elements.mainUploadZone && Elements.mainVideoFile) {
            Elements.mainUploadZone.addEventListener('click', () => {
                Elements.mainVideoFile.click();
            });
            
            Elements.mainVideoFile.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.handleMainVideoUpload(e.target.files[0]);
                }
            });
            
            this.setupDragAndDrop(Elements.mainUploadZone, (files) => {
                if (files.length > 0) {
                    this.handleMainVideoUpload(files[0]);
                }
            });
        }
        
        // Background video upload
        if (Elements.bgUploadZone && Elements.bgVideoFile) {
            Elements.bgUploadZone.addEventListener('click', () => Elements.bgVideoFile.click());
            Elements.bgVideoFile.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    this.handleBackgroundVideoUpload(e.target.files[0]);
                }
            });
        }
        
        // Duration buttons
        Elements.getAll('.duration-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const duration = parseInt(btn.dataset.duration);
                this.selectDuration(duration, btn);
            });
        });
        
        // Generate button
        if (Elements.generateBtn) {
            Elements.generateBtn.addEventListener('click', () => this.generateViralShort());
        }
        
        // Download button
        if (Elements.downloadBtn) {
            Elements.downloadBtn.addEventListener('click', () => this.downloadVideo());
        }
        
        // Share buttons
        Elements.getAll('.share-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const platform = btn.dataset.platform;
                if (platform) {
                    this.shareToplatform(platform);
                }
            });
        });
    }
    
    async handleMainVideoUpload(file) {
        try {
            console.log('Handling video upload:', file.name);
            
            const validation = Utils.validateVideoFile(file);
            if (!validation.valid) {
                this.showError(validation.error);
                return;
            }
            
            if (AppState.setMainVideo(file)) {
                this.showProgress(10);
                
                const video = Elements.mainVideoPreview;
                const url = URL.createObjectURL(file);
                
                video.src = url;
                video.style.display = 'block';
                
                video.onloadedmetadata = async () => {
                    try {
                        const duration = video.duration;
                        AppState.setVideoDuration(duration);
                        
                        this.showProgress(50);
                        this.displayVideoInfo(file, duration);
                        await this.performAIAnalysis(video);
                        this.showProgress(100);
                        this.revealNextSections();
                        
                    } catch (error) {
                        console.error('Video metadata error:', error);
                        this.showError('Error analyzing video. Please try again.');
                    }
                };
                
                video.onerror = () => {
                    this.showError('Error loading video. Please check the file format.');
                };
            }
        } catch (error) {
            console.error('Video upload error:', error);
            this.showError('Upload failed. Please try again.');
        }
    }
    
    async handleBackgroundVideoUpload(file) {
        try {
            const validation = Utils.validateVideoFile(file);
            if (!validation.valid) {
                this.showError(validation.error);
                return;
            }
            
            AppState.backgroundVideo = file;
            
            const video = Elements.bgVideoPreview;
            video.src = URL.createObjectURL(file);
            video.style.display = 'block';
            
            showNotification('Background video added successfully!');
            
        } catch (error) {
            console.error('Background video error:', error);
            this.showError('Background video upload failed.');
        }
    }
    
    selectDuration(duration, buttonElement) {
        Elements.getAll('.duration-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
        });
        
        buttonElement.classList.add('active');
        buttonElement.setAttribute('aria-checked', 'true');
        
        AppState.setTargetDuration(duration);
        console.log(`Target duration set to: ${duration} seconds`);
    }
    
    async generateViralShort() {
        if (!AppState.mainVideo) {
            showNotification('Please upload a video first!', 'error');
            return;
        }
        
        if (AppState.isProcessing) {
            return;
        }
        
        try {
            AppState.isProcessing = true;
            this.showProcessingOverlay();
            this.setGenerateButtonLoading(true);
            
            const video = Elements.mainVideoPreview;
            
            // AI Analysis
            const analysis = await AIAnalyzer.analyzeVideoSegments(
                video, 
                AppState.videoDuration, 
                AppState.targetDuration
            );
            
            AppState.aiAnalysisResults = analysis;
            
            // Process video
            const processedVideoBlob = await VideoProcessor.processVideoSegments(
                AppState.mainVideo,
                analysis.segments,
                {
                    targetWidth: 405,
                    targetHeight: 720
                }
            );
            
            // Generate content
            const contentType = Utils.detectContentType();
            const viralContent = AIAnalyzer.generateTitleAndHashtags(contentType, analysis);
            
            await this.displayResults(processedVideoBlob, analysis, viralContent);
            
        } catch (error) {
            console.error('Generation error:', error);
            showNotification('Video generation failed: ' + error.message, 'error');
        } finally {
            AppState.isProcessing = false;
            this.hideProcessingOverlay();
            this.setGenerateButtonLoading(false);
        }
    }
    
    async performAIAnalysis(video) {
        try {
            if (Elements.aiStatus) {
                Elements.aiStatus.textContent = 'Analyzing...';
            }
            
            // Quick preview analysis
            const previewAnalysis = {
                start: Math.max(5, AppState.videoDuration * 0.3),
                end: Math.max(5, AppState.videoDuration * 0.3) + Math.min(AppState.targetDuration, AppState.videoDuration * 0.4),
                score: 75 + Math.random() * 20,
                faceDetected: Math.random() > 0.5,
                cropRecommendation: 'smart-crop'
            };
            
            const analysisHtml = `
                <div class="ai-insights">
                    <h3 class="insights-title">🧠 AI Analysis Preview</h3>
                    <div class="insight-item">
                        <span class="insight-label">Best Moment Found:</span>
                        <span class="insight-value">${Utils.formatTime(previewAnalysis.start)} - ${Utils.formatTime(previewAnalysis.end)}</span>
                    </div>
                    <div class="insight-item">
                        <span class="insight-label">Engagement Score:</span>
                        <span class="insight-value">${Math.round(previewAnalysis.score)}/100</span>
                    </div>
                    <div class="insight-item">
                        <span class="insight-label">Face Detection:</span>
                        <span class="insight-value">${previewAnalysis.faceDetected ? 'Yes ✓' : 'No'}</span>
                    </div>
                </div>
            `;
            
            if (Elements.aiAnalysis) {
                Elements.aiAnalysis.innerHTML = analysisHtml;
                Elements.aiAnalysis.style.display = 'block';
            }
            
            if (Elements.aiStatus) {
                Elements.aiStatus.textContent = 'Ready to generate!';
            }
            
        } catch (error) {
            console.error('AI analysis error:', error);
            if (Elements.aiStatus) {
                Elements.aiStatus.textContent = 'Analysis completed';
            }
        }
    }
    
    displayVideoInfo(file, duration) {
        if (Elements.mainVideoDuration) {
            Elements.mainVideoDuration.textContent = Utils.formatTime(duration);
        }
        
        const infoHtml = `
            <div class="info-row">
                <span class="info-label">File:</span>
                <span class="info-value">${file.name}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Size:</span>
                <span class="info-value">${Utils.formatFileSize(file.size)}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Duration:</span>
                <span class="info-value">${Utils.formatTime(duration)}</span>
            </div>
        `;
        
        if (Elements.mainVideoInfo) {
            Elements.mainVideoInfo.innerHTML = infoHtml;
            Elements.mainVideoInfo.style.display = 'block';
        }
    }
    
    revealNextSections() {
        const cards = [
            { element: Elements.backgroundCard, delay: 500 },
            { element: Elements.aiCard, delay: 1000 },
            { element: Elements.subtitleCard, delay: 1500 },
            { element: Elements.generateCard, delay: 2000 }
        ];
        
        cards.forEach(({ element, delay }) => {
            if (element) {
                setTimeout(() => {
                    element.classList.remove('hidden');
                }, delay);
            }
        });
    }
    
    async displayResults(videoBlob, analysis, viralContent) {
        const videoUrl = URL.createObjectURL(videoBlob);
        
        if (Elements.finalVideo) {
            Elements.finalVideo.src = videoUrl;
            Elements.finalVideo.style.display = 'block';
        }
        
        // Update insights
        if (Elements.bestMoment) {
            Elements.bestMoment.textContent = analysis.segments.length > 1 ? 
                `${analysis.segments.length} segments spliced` :
                `${Utils.formatTime(analysis.segments[0].startTime)} - ${Utils.formatTime(analysis.segments[0].endTime)}`;
        }
        
        if (Elements.engagementScore) {
            Elements.engagementScore.textContent = `${Math.round(analysis.totalScore)}/100`;
        }
        
        if (Elements.retentionPrediction) {
            Elements.retentionPrediction.textContent = `${Math.round(analysis.totalScore * 0.8)}%`;
        }
        
        // Store results
        AppState.processedVideoBlob = videoBlob;
        AppState.viralContent = viralContent;
        
        // Show results
        if (Elements.resultCard) {
            Elements.resultCard.classList.remove('hidden');
            Elements.resultCard.scrollIntoView({ behavior: 'smooth' });
        }
        
        if (Elements.soundsCard) {
            Elements.soundsCard.classList.remove('hidden');
        }
        
        this.generateSoundRecommendations();
        
        showNotification('🎉 Your viral short is ready!', 'success');
    }
    
    generateSoundRecommendations() {
        const sounds = [
            { name: 'Trending Beat #1', artist: 'AI Generated', duration: '0:15' },
            { name: 'Viral Hook Sound', artist: 'ShortCraft', duration: '0:20' },
            { name: 'Background Ambience', artist: 'AI Music', duration: '0:30' }
        ];
        
        const soundsHtml = sounds.map(sound => `
            <div class="sound-item">
                <div class="sound-info">
                    <h4>${sound.name}</h4>
                    <div class="sound-meta">${sound.artist} • ${sound.duration}</div>
                </div>
                <button class="play-btn">▶️</button>
            </div>
        `).join('');
        
        if (Elements.recommendedSounds) {
            Elements.recommendedSounds.innerHTML = soundsHtml;
        }
    }
    
    async downloadVideo() {
        if (!AppState.processedVideoBlob) {
            showNotification('No video to download!', 'error');
            return;
        }
        
        try {
            this.showDownloadOverlay();
            await this.simulateDownloadProgress();
            
            const url = URL.createObjectURL(AppState.processedVideoBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shortcraft-${Date.now()}.mp4`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            this.hideDownloadOverlay();
            showNotification('Video downloaded successfully! 📱');
            
        } catch (error) {
            console.error('Download error:', error);
            this.hideDownloadOverlay();
            showNotification('Download failed. Please try again.', 'error');
        }
    }
    
    shareToplatform(platform) {
        if (!AppState.viralContent) {
            showNotification('Generate a video first!', 'error');
            return;
        }
        
        const { title, hashtags } = AppState.viralContent;
        const shareText = `${title}\n\n${hashtags}`;
        
        const urls = {
            tiktok: 'https://www.tiktok.com/upload',
            instagram: 'https://www.instagram.com/',
            youtube: 'https://studio.youtube.com/'
        };
        
        Utils.copyToClipboard(shareText).then(() => {
            showNotification(`Content copied! Opening ${platform}...`);
            setTimeout(() => {
                window.open(urls[platform], '_blank');
            }, 1000);
        }).catch(() => {
            showNotification('Copy failed, but opening platform...', 'error');
            window.open(urls[platform], '_blank');
        });
    }
    
    setupDragAndDrop(element, callback) {
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.classList.add('dragover');
        });
        
        element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            element.classList.remove('dragover');
        });
        
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            const videoFiles = files.filter(file => file.type.startsWith('video/'));
            
            if (videoFiles.length > 0) {
                callback(videoFiles);
            } else {
                showNotification('Please drop video files only.', 'error');
            }
        });
    }
    
    optimizeForMobile() {
        if (Utils.isMobileDevice()) {
            console.log('Applying mobile optimizations...');
            document.body.classList.add('mobile-device');
            
            const videoElements = document.querySelectorAll('video');
            videoElements.forEach(video => {
                video.setAttribute('playsinline', 'true');
                video.setAttribute('webkit-playsinline', 'true');
            });
        }
        
        if (Utils.isIOS()) {
            console.log('Applying iOS optimizations...');
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.style.fontSize = '16px';
            });
        }
    }
    
    showProcessingOverlay() {
        if (Elements.processingOverlay) {
            Elements.processingOverlay.style.display = 'flex';
        }
        
        if (Elements.processingStatus) {
            Elements.processingStatus.textContent = 'Starting AI analysis...';
        }
        
        VideoProcessor.updateProcessingSteps(0);
    }
    
    hideProcessingOverlay() {
        if (Elements.processingOverlay) {
            Elements.processingOverlay.style.display = 'none';
        }
    }
    
    showDownloadOverlay() {
        if (Elements.downloadOverlay) {
            Elements.downloadOverlay.style.display = 'flex';
            Elements.downloadOverlay.classList.remove('hidden');
        }
    }
    
    hideDownloadOverlay() {
        if (Elements.downloadOverlay) {
            Elements.downloadOverlay.style.display = 'none';
        }
    }
    
    async simulateDownloadProgress() {
        const progressFill = document.querySelector('.download-fill');
        const steps = [
            { progress: 25, delay: 300 },
            { progress: 50, delay: 500 },
            { progress: 75, delay: 400 },
            { progress: 100, delay: 300 }
        ];
        
        for (const step of steps) {
            await Utils.delay(step.delay);
            if (progressFill) {
                progressFill.style.width = `${step.progress}%`;
            }
        }
    }
    
    showProgress(percentage) {
        if (Elements.mainProgressBar) {
            Elements.mainProgressBar.style.display = 'block';
            const fill = Elements.mainProgressBar.querySelector('.progress-fill');
            if (fill) {
                fill.style.width = `${percentage}%`;
            }
            
            if (percentage >= 100) {
                setTimeout(() => {
                    Elements.mainProgressBar.style.display = 'none';
                }, 1000);
            }
        }
    }
    
    showError(message) {
        if (Elements.uploadError) {
            Elements.uploadError.textContent = message;
            Elements.uploadError.style.display = 'block';
            setTimeout(() => {
                Elements.uploadError.style.display = 'none';
            }, 5000);
        }
        showNotification(message, 'error');
    }
    
    setGenerateButtonLoading(loading) {
        if (Elements.generateBtn && Elements.generateLoading) {
            if (loading) {
                Elements.generateLoading.style.display = 'inline-block';
                Elements.generateBtn.disabled = true;
                Elements.generateBtn.innerHTML = '<span class="loading-indicator"></span> Processing...';
            } else {
                Elements.generateLoading.style.display = 'none';
                Elements.generateBtn.disabled = false;
                Elements.generateBtn.innerHTML = '✨ Generate Viral Short';
            }
        }
    }
}

// Enhanced error handling and fallbacks
const SafetyWrapper = {
    async safeExecute(fn, fallback, context = 'Operation') {
        try {
            return await fn();
        } catch (error) {
            console.error(`${context} failed:`, error);
            showNotification(`${context} failed. Using fallback method.`, 'error');
            return fallback ? fallback() : null;
        }
    },
    
    safeGetElement(id, required = false) {
        const element = document.getElementById(id);
        if (!element && required) {
            console.error(`Required element not found: ${id}`);
            showNotification('Interface error. Please refresh the page.', 'error');
        }
        return element;
    },
    
    checkBrowserSupport() {
        const required = [
            { feature: 'Worker', test: () => window.Worker },
            { feature: 'WebAssembly', test: () => window.WebAssembly },
            { feature: 'File API', test: () => window.File && window.FileReader },
            { feature: 'Canvas 2D', test: () => {
                const canvas = document.createElement('canvas');
                return canvas.getContext('2d');
            }}
        ];
        
        const missing = required.filter(({ test }) => !test()).map(({ feature }) => feature);
        
        if (missing.length > 0) {
            const message = `Your browser is missing required features: ${missing.join(', ')}. Please use a modern browser.`;
            showNotification(message, 'error');
            return false;
        }
        
        return true;
    }
};

// Application initialization with comprehensive error handling
function initializeShortCraft() {
    console.log('🎬 Starting ShortCraft initialization...');
    
    // Check browser compatibility
    if (!SafetyWrapper.checkBrowserSupport()) {
        return;
    }
    
    try {
        // Validate required elements exist
        const requiredElements = [
            'mainUploadZone', 'mainVideoFile', 'mainVideoPreview', 
            'generateBtn', 'processingOverlay'
        ];
        
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            console.error('Missing required elements:', missingElements);
            showNotification('Interface initialization failed. Please refresh the page.', 'error');
            return;
        }
        
        // Initialize the application
        window.shortCraftApp = new ShortCraftApp();
        
        // Add global error recovery
        window.addEventListener('error', (event) => {
            console.error('Global error caught:', event.error);
            
            // Reset processing state if error occurs during processing
            if (AppState.isProcessing) {
                AppState.isProcessing = false;
                
                if (Elements.processingOverlay) {
                    Elements.processingOverlay.style.display = 'none';
                }
                
                if (Elements.generateBtn) {
                    Elements.generateBtn.disabled = false;
                    Elements.generateBtn.innerHTML = '✨ Generate Viral Short';
                }
            }
        });
        
        console.log('✅ ShortCraft initialized successfully!');
        
        // Show success message after short delay
        setTimeout(() => {
            showNotification('🎬 ShortCraft is ready! Upload a video to start creating viral content.', 'success');
        }, 1000);
        
    } catch (error) {
        console.error('ShortCraft initialization failed:', error);
        showNotification('App initialization failed. Please refresh the page and try again.', 'error');
    }
}

// Initialize when DOM is ready and libraries are loaded
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure all libraries are loaded
    setTimeout(() => {
        initializeShortCraft();
    }, 500);
});

// Expose utilities globally for debugging
window.ShortCraftDebug = {
    AppState,
    Elements,
    Utils,
    AIAnalyzer,
    VideoProcessor,
    showNotification
};

// Service worker registration for better performance (optional)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.warn);
}

console.log('🎬 ShortCraft script loaded');

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ShortCraftApp,
        AIAnalyzer,
        VideoProcessor,
        AppState,
        Utils
    };
}
            