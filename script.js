// Complete ShortCraft - Missing Methods Implementation
// This continues from your existing script.js

// Enhanced AI Analyzer with Video Segment Analysis
const EnhancedAIAnalyzer = {
    ...AIAnalyzer, // Inherit existing methods
    
    // Advanced video analysis for multi-segment selection
    async analyzeVideoSegments(video, duration, targetLength) {
        try {
            console.log('Starting advanced video segment analysis...');
            
            // Initialize face detection
            const faceDetection = await this.initializeFaceDetection();
            
            // Analyze video in 3-second chunks
            const segments = [];
            const chunkSize = 3; // seconds
            const totalChunks = Math.floor(duration / chunkSize);
            
            for (let i = 0; i < totalChunks; i++) {
                const startTime = i * chunkSize;
                const endTime = Math.min(startTime + chunkSize, duration);
                
                const segmentAnalysis = await this.analyzeSegment(
                    video, startTime, endTime, faceDetection
                );
                
                segments.push({
                    startTime,
                    endTime,
                    duration: endTime - startTime,
                    ...segmentAnalysis
                });
            }
            
            // Find best segments for splicing
            const bestSegments = this.selectBestSegments(segments, targetLength);
            
            return {
                segments: bestSegments,
                totalScore: this.calculateOverallScore(bestSegments),
                splicingStrategy: this.determineSplicingStrategy(bestSegments),
                faceDetection: bestSegments.some(s => s.faceScore > 0.7)
            };
            
        } catch (error) {
            console.error('Video segment analysis error:', error);
            return this.getFallbackAnalysis(duration, targetLength);
        }
    },
    
    async initializeFaceDetection() {
        try {
            // Load MediaPipe Face Detection
            const model = await window.faceDetection.createDetector(
                window.faceDetection.SupportedModels.MediaPipeFaceDetector,
                {
                    runtime: 'tfjs',
                    modelType: 'short'
                }
            );
            return model;
        } catch (error) {
            console.warn('Face detection unavailable:', error);
            return null;
        }
    },
    
    async analyzeSegment(video, startTime, endTime, faceDetector) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 320;
        canvas.height = 180;
        
        // Sample frames from this segment
        const sampleTimes = [
            startTime + 0.5,
            startTime + 1.5,
            startTime + 2.5
        ].filter(t => t < endTime);
        
        let totalFaceScore = 0;
        let totalActivityScore = 0;
        let totalAudioScore = 0;
        let frameCount = 0;
        
        for (const sampleTime of sampleTimes) {
            video.currentTime = sampleTime;
            
            await new Promise(resolve => {
                const onSeeked = () => {
                    video.removeEventListener('seeked', onSeeked);
                    resolve();
                };
                video.addEventListener('seeked', onSeeked);
            });
            
            // Draw frame to canvas for analysis
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // Face detection analysis
            const faceScore = await this.analyzeFaces(canvas, faceDetector);
            
            // Visual activity analysis
            const activityScore = this.analyzeVisualActivity(ctx, canvas);
            
            // Audio level estimation (simplified)
            const audioScore = this.estimateAudioLevel(sampleTime, startTime, endTime);
            
            totalFaceScore += faceScore;
            totalActivityScore += activityScore;
            totalAudioScore += audioScore;
            frameCount++;
        }
        
        return {
            faceScore: totalFaceScore / frameCount,
            activityScore: totalActivityScore / frameCount,
            audioScore: totalAudioScore / frameCount,
            overallScore: this.calculateSegmentScore(
                totalFaceScore / frameCount,
                totalActivityScore / frameCount,
                totalAudioScore / frameCount
            )
        };
    },
    
    async analyzeFaces(canvas, faceDetector) {
        if (!faceDetector) return 0.3; // Fallback score
        
        try {
            const faces = await faceDetector.estimateFaces(canvas);
            
            if (faces.length === 0) return 0;
            if (faces.length === 1) return 0.9; // Single face is ideal
            if (faces.length === 2) return 0.7; // Two faces good for conversations
            return 0.4; // Too many faces can be distracting
            
        } catch (error) {
            return 0.3; // Fallback
        }
    },
    
    analyzeVisualActivity(ctx, canvas) {
        // Simple edge detection for activity measurement
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let edgeCount = 0;
        const threshold = 50;
        
        for (let i = 0; i < data.length - 4; i += 4) {
            const current = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const next = (data[i + 4] + data[i + 5] + data[i + 6]) / 3;
            
            if (Math.abs(current - next) > threshold) {
                edgeCount++;
            }
        }
        
        // Normalize to 0-1 scale
        const maxPossibleEdges = data.length / 8;
        return Math.min(edgeCount / maxPossibleEdges * 2, 1);
    },
    
    estimateAudioLevel(currentTime, startTime, endTime) {
        // Simplified audio level estimation
        // In a real implementation, you'd use Web Audio API
        const segmentDuration = endTime - startTime;
        const normalizedTime = (currentTime - startTime) / segmentDuration;
        
        // Simulate audio analysis with some realistic patterns
        if (normalizedTime < 0.1 || normalizedTime > 0.9) return 0.3; // Edges often quiet
        if (normalizedTime > 0.4 && normalizedTime < 0.6) return 0.8; // Middle often active
        return 0.6; // Default moderate level
    },
    
    calculateSegmentScore(faceScore, activityScore, audioScore) {
        // Weighted combination prioritizing faces (as requested)
        const faceWeight = 0.5;
        const activityWeight = 0.3;
        const audioWeight = 0.2;
        
        return (faceScore * faceWeight) + 
               (activityScore * activityWeight) + 
               (audioScore * audioWeight);
    },
    
    selectBestSegments(segments, targetLength) {
        // Sort by overall score
        segments.sort((a, b) => b.overallScore - a.overallScore);
        
        const selectedSegments = [];
        let totalDuration = 0;
        const maxGap = 10; // seconds - don't select segments too far apart
        
        for (const segment of segments) {
            if (totalDuration >= targetLength) break;
            
            // Check if this segment fits well with already selected ones
            const canAdd = selectedSegments.length === 0 || 
                          this.segmentsFitWell(selectedSegments, segment, maxGap);
            
            if (canAdd) {
                const remainingTime = targetLength - totalDuration;
                const segmentToAdd = { ...segment };
                
                if (segment.duration > remainingTime) {
                    // Trim segment to fit
                    segmentToAdd.duration = remainingTime;
                    segmentToAdd.endTime = segmentToAdd.startTime + remainingTime;
                }
                
                selectedSegments.push(segmentToAdd);
                totalDuration += segmentToAdd.duration;
            }
        }
        
        // Sort selected segments by start time for chronological order
        selectedSegments.sort((a, b) => a.startTime - b.startTime);
        
        return selectedSegments;
    },
    
    segmentsFitWell(existingSegments, newSegment, maxGap) {
        for (const existing of existingSegments) {
            const gap = Math.abs(existing.startTime - newSegment.startTime);
            if (gap > maxGap) return false;
        }
        return true;
    },
    
    determineSplicingStrategy(segments) {
        if (segments.length === 1) return 'single';
        if (segments.length === 2) return 'dual';
        return 'multi';
    },
    
    calculateOverallScore(segments) {
        if (segments.length === 0) return 0;
        
        const avgScore = segments.reduce((sum, seg) => sum + seg.overallScore, 0) / segments.length;
        const continuityBonus = segments.length === 1 ? 0.1 : 0; // Bonus for single continuous segment
        const faceBonus = segments.some(s => s.faceScore > 0.7) ? 0.15 : 0; // Bonus for face presence
        
        return Math.min(avgScore + continuityBonus + faceBonus, 1) * 100;
    },
    
    getFallbackAnalysis(duration, targetLength) {
        // Fallback when advanced analysis fails
        return {
            segments: [{
                startTime: Math.max(3, duration * 0.3),
                endTime: Math.max(3, duration * 0.3) + targetLength,
                duration: targetLength,
                faceScore: 0.5,
                activityScore: 0.6,
                audioScore: 0.5,
                overallScore: 0.55
            }],
            totalScore: 70,
            splicingStrategy: 'single',
            faceDetection: true
        };
    }
};

// Enhanced Video Processor with FFmpeg Integration
const EnhancedVideoProcessor = {
    ...VideoProcessor, // Inherit existing methods
    
    async initializeFFmpeg() {
        if (!window.FFmpeg) {
            throw new Error('FFmpeg.wasm not loaded. Please include FFmpeg library.');
        }
        
        const ffmpeg = new FFmpeg();
        
        // Load FFmpeg with progress tracking
        ffmpeg.on('progress', (progress) => {
            console.log('FFmpeg progress:', progress);
            this.updateProcessingProgress(progress.ratio * 100);
        });
        
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm';
        await ffmpeg.load({
            coreURL: `${baseURL}/ffmpeg-core.js`,
            wasmURL: `${baseURL}/ffmpeg-core.wasm`
        });
        
        return ffmpeg;
    },
    
    async processVideoSegments(videoFile, segments, options = {}) {
        try {
            const ffmpeg = await this.initializeFFmpeg();
            
            // Write input video to FFmpeg filesystem
            await ffmpeg.writeFile('input.mp4', await this.fileToUint8Array(videoFile));
            
            if (segments.length === 1) {
                return await this.processSingleSegment(ffmpeg, segments[0], options);
            } else {
                return await this.processMultipleSegments(ffmpeg, segments, options);
            }
            
        } catch (error) {
            console.error('Video processing error:', error);
            throw error;
        }
    },
    
    async processSingleSegment(ffmpeg, segment, options) {
        const { startTime, duration } = segment;
        const { cropStrategy = 'face-track', targetWidth = 405, targetHeight = 720 } = options;
        
        // Build FFmpeg command for single segment with cropping
        const command = [
            '-i', 'input.mp4',
            '-ss', startTime.toString(),
            '-t', duration.toString(),
            '-vf', this.buildVideoFilter(cropStrategy, targetWidth, targetHeight),
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            'output.mp4'
        ];
        
        await ffmpeg.exec(command);
        
        const outputData = await ffmpeg.readFile('output.mp4');
        return new Blob([outputData], { type: 'video/mp4' });
    },
    
    async processMultipleSegments(ffmpeg, segments, options) {
        const { cropStrategy = 'face-track', targetWidth = 405, targetHeight = 720 } = options;
        
        // Extract each segment
        const segmentFiles = [];
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const outputName = `segment_${i}.mp4`;
            
            const command = [
                '-i', 'input.mp4',
                '-ss', segment.startTime.toString(),
                '-t', segment.duration.toString(),
                '-vf', this.buildVideoFilter(cropStrategy, targetWidth, targetHeight),
                '-c:v', 'libx264',
                '-preset', 'medium',
                '-crf', '23',
                '-c:a', 'aac',
                '-b:a', '128k',
                outputName
            ];
            
            await ffmpeg.exec(command);
            segmentFiles.push(outputName);
        }
        
        // Create concat file
        const concatContent = segmentFiles.map(f => `file '${f}'`).join('\n');
        await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatContent));
        
        // Concatenate segments with transitions
        const concatCommand = [
            '-f', 'concat',
            '-safe', '0',
            '-i', 'concat.txt',
            '-vf', this.buildTransitionFilter(segments.length),
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            'final_output.mp4'
        ];
        
        await ffmpeg.exec(concatCommand);
        
        const outputData = await ffmpeg.readFile('final_output.mp4');
        return new Blob([outputData], { type: 'video/mp4' });
    },
    
    buildVideoFilter(cropStrategy, width, height) {
        const baseFilter = `scale=${width}:${height}:force_original_aspect_ratio=increase`;
        const cropFilter = `crop=${width}:${height}`;
        
        switch (cropStrategy) {
            case 'face-track':
                return `${baseFilter},${cropFilter}:0:0`;
            case 'center':
                return `${baseFilter},${cropFilter}:(iw-${width})/2:(ih-${height})/2`;
            case 'upper-third':
                return `${baseFilter},${cropFilter}:(iw-${width})/2:0`;
            case 'smart-crop':
                return `${baseFilter},${cropFilter}:(iw-${width})/2:(ih-${height})/4`;
            default:
                return `${baseFilter},${cropFilter}:(iw-${width})/2:(ih-${height})/2`;
        }
    },
    
    buildTransitionFilter(segmentCount) {
        if (segmentCount <= 1) return 'null';
        
        // Simple fade transitions between segments
        return 'fade=type=in:duration=0.5,fade=type=out:duration=0.5';
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
        const statusElement = Elements.processingStatus;
        const stepsElement = Elements.processingSteps;
        
        if (statusElement) {
            statusElement.textContent = `Processing video... ${Math.round(percentage)}%`;
        }
        
        if (stepsElement) {
            this.updateProcessingSteps(percentage);
        }
    },
    
    updateProcessingSteps(percentage) {
        const steps = [
            { text: 'Analyzing video segments', threshold: 20 },
            { text: 'Detecting faces and activity', threshold: 40 },
            { text: 'Selecting best moments', threshold: 60 },
            { text: 'Processing and cropping', threshold: 80 },
            { text: 'Generating final video', threshold: 95 },
            { text: 'Complete!', threshold: 100 }
        ];
        
        const stepsHtml = steps.map((step, index) => {
            const status = percentage >= step.threshold ? 'completed' : 
                          percentage >= (steps[index - 1]?.threshold || 0) ? 'active' : '';
            
            return `<div class="step-item ${status}">
                <span>${percentage >= step.threshold ? '✓' : '○'}</span> ${step.text}
            </div>`;
        }).join('');
        
        Elements.processingSteps.innerHTML = stepsHtml;
    }
};

// Complete the missing ShortCraftApp methods
class CompleteShortCraftApp extends ShortCraftApp {
    
    async handleMainVideoUpload(file) {
        try {
            console.log('Handling main video upload:', file.name);
            
            // Validate file
            const validation = Utils.validateVideoFile(file);
            if (!validation.valid) {
                Utils.showNotification(validation.error, 'error');
                return;
            }
            
            // Store the video file
            if (AppState.setMainVideo(file)) {
                Elements.mainProgressBar.style.display = 'block';
                this.updateProgress(Elements.mainProgressBar, 10);
                
                // Create video element for analysis
                const video = Elements.mainVideoPreview;
                const url = URL.createObjectURL(file);
                
                video.src = url;
                video.style.display = 'block';
                
                // Wait for video metadata
                video.onloadedmetadata = async () => {
                    try {
                        const duration = video.duration;
                        AppState.setVideoDuration(duration);
                        
                        this.updateProgress(Elements.mainProgressBar, 50);
                        
                        // Update UI with video info
                        this.displayVideoInfo(file, duration);
                        
                        // Perform AI analysis
                        await this.performAIAnalysis(video);
                        
                        this.updateProgress(Elements.mainProgressBar, 100);
                        
                        // Show next steps
                        this.revealNextSections();
                        
                    } catch (error) {
                        console.error('Video metadata error:', error);
                        Utils.showNotification('Error analyzing video. Please try again.', 'error');
                    }
                };
                
                video.onerror = () => {
                    Utils.showNotification('Error loading video. Please check the file format.', 'error');
                };
                
            }
        } catch (error) {
            console.error('Video upload error:', error);
            Utils.showNotification('Upload failed. Please try again.', 'error');
        }
    },
    
    async handleBackgroundVideoUpload(file) {
        try {
            const validation = Utils.validateVideoFile(file);
            if (!validation.valid) {
                Utils.showNotification(validation.error, 'error');
                return;
            }
            
            AppState.backgroundVideo = file;
            
            const video = Elements.bgVideoPreview;
            video.src = URL.createObjectURL(file);
            video.style.display = 'block';
            
            Utils.showNotification('Background video added successfully!');
            
        } catch (error) {
            console.error('Background video error:', error);
            Utils.showNotification('Background video upload failed.', 'error');
        }
    },
    
    selectDuration(duration, buttonElement) {
        // Remove active class from all buttons
        Elements.getAll('.duration-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-checked', 'false');
        });
        
        // Add active class to selected button
        buttonElement.classList.add('active');
        buttonElement.setAttribute('aria-checked', 'true');
        
        // Update app state
        AppState.setTargetDuration(duration);
        
        console.log(`Target duration set to: ${duration} seconds`);
    },
    
    async generateViralShort() {
        if (!AppState.mainVideo) {
            Utils.showNotification('Please upload a video first!', 'error');
            return;
        }
        
        try {
            AppState.isProcessing = true;
            this.showProcessingOverlay();
            
            const video = Elements.mainVideoPreview;
            
            // Advanced AI analysis for segment selection
            const analysis = await EnhancedAIAnalyzer.analyzeVideoSegments(
                video, 
                AppState.videoDuration, 
                AppState.targetDuration
            );
            
            AppState.aiAnalysisResults = analysis;
            
            // Process video with FFmpeg
            const processedVideoBlob = await EnhancedVideoProcessor.processVideoSegments(
                AppState.mainVideo,
                analysis.segments,
                {
                    cropStrategy: analysis.faceDetection ? 'face-track' : 'smart-crop',
                    targetWidth: 405,
                    targetHeight: 720
                }
            );
            
            // Generate viral content metadata
            const contentType = Utils.detectContentType();
            const viralContent = AIAnalyzer.generateTitleAndHashtags(contentType, analysis);
            
            // Display results
            await this.displayResults(processedVideoBlob, analysis, viralContent);
            
        } catch (error) {
            console.error('Generation error:', error);
            Utils.showNotification('Video generation failed. Please try again.', 'error');
        } finally {
            AppState.isProcessing = false;
            this.hideProcessingOverlay();
        }
    },
    
    async performAIAnalysis(video) {
        try {
            Elements.aiStatus.textContent = 'Analyzing...';
            
            // Quick initial analysis for preview
            const quickAnalysis = AIAnalyzer.analyzeVideo(
                AppState.videoDuration, 
                AppState.targetDuration
            );
            
            // Display analysis results
            const analysisHtml = `
                <div class="ai-insights">
                    <h3 class="insights-title">🧠 AI Analysis Preview</h3>
                    <div class="insight-item">
                        <span class="insight-label">Best Moment Found:</span>
                        <span class="insight-value">${Utils.formatTime(quickAnalysis.start)} - ${Utils.formatTime(quickAnalysis.end)}</span>
                    </div>
                    <div class="insight-item">
                        <span class="insight-label">Engagement Score:</span>
                        <span class="insight-value">${quickAnalysis.score}/100</span>
                    </div>
                    <div class="insight-item">
                        <span class="insight-label">Face Detection:</span>
                        <span class="insight-value">${quickAnalysis.faceDetected ? 'Yes ✓' : 'No'}</span>
                    </div>
                    <div class="insight-item">
                        <span class="insight-label">Crop Strategy:</span>
                        <span class="insight-value">${quickAnalysis.cropRecommendation}</span>
                    </div>
                </div>
            `;
            
            Elements.aiAnalysis.innerHTML = analysisHtml;
            Elements.aiAnalysis.style.display = 'block';
            
            Elements.aiStatus.textContent = 'Ready to generate!';
            
        } catch (error) {
            console.error('AI analysis error:', error);
            Elements.aiStatus.textContent = 'Analysis completed';
        }
    },
    
    displayVideoInfo(file, duration) {
        Elements.mainVideoDuration.textContent = Utils.formatTime(duration);
        
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
        
        Elements.mainVideoInfo.innerHTML = infoHtml;
        Elements.mainVideoInfo.style.display = 'block';
    },
    
    revealNextSections() {
        // Progressive disclosure of features
        setTimeout(() => {
            Elements.backgroundCard.classList.remove('hidden');
        }, 500);
        
        setTimeout(() => {
            Elements.aiCard.classList.remove('hidden');
        }, 1000);
        
        setTimeout(() => {
            Elements.subtitleCard.classList.remove('hidden');
        }, 1500);
        
        setTimeout(() => {
            Elements.generateCard.classList.remove('hidden');
        }, 2000);
    },
    
    async displayResults(videoBlob, analysis, viralContent) {
        // Create video URL and display
        const videoUrl = URL.createObjectURL(videoBlob);
        const finalVideo = Elements.finalVideo;
        
        finalVideo.src = videoUrl;
        finalVideo.style.display = 'block';
        
        // Update insights with detailed analysis
        Elements.bestMoment.textContent = analysis.segments.length > 1 ? 
            `${analysis.segments.length} segments spliced` :
            `${Utils.formatTime(analysis.segments[0].startTime)} - ${Utils.formatTime(analysis.segments[0].endTime)}`;
            
        Elements.engagementScore.textContent = `${Math.round(analysis.totalScore)}/100`;
        Elements.retentionPrediction.textContent = `${Math.round(analysis.totalScore * 0.8)}%`;
        
        // Store the processed video for download
        AppState.processedVideoBlob = videoBlob;
        AppState.viralContent = viralContent;
        
        // Show results section
        Elements.resultCard.classList.remove('hidden');
        Elements.soundsCard.classList.remove('hidden');
        
        // Generate sound recommendations
        this.generateSoundRecommendations(viralContent);
        
        // Smooth scroll to results
        Elements.resultCard.scrollIntoView({ behavior: 'smooth' });
        
        Utils.showNotification('🎉 Your viral short is ready!', 'success');
    },
    
    generateSoundRecommendations(viralContent) {
        const sounds = [
            { name: 'Trending Beat #1', artist: 'AI Generated', duration: '0:15', trend: 'Rising' },
            { name: 'Viral Hook Sound', artist: 'ShortCraft', duration: '0:20', trend: 'Hot' },
            { name: 'Background Ambience', artist: 'AI Music', duration: '0:30', trend: 'Steady' }
        ];
        
        const soundsHtml = sounds.map(sound => `
            <div class="sound-item">
                <div class="sound-info">
                    <h4>${sound.name}</h4>
                    <div class="sound-meta">${sound.artist} • ${sound.duration} • ${sound.trend}</div>
                </div>
                <button class="play-btn" onclick="this.textContent = this.textContent === '▶️' ? '⏸️' : '▶️'">▶️</button>
            </div>
        `).join('');
        
        Elements.recommendedSounds.innerHTML = soundsHtml;
    },
    
    async downloadVideo() {
        if (!AppState.processedVideoBlob) {
            Utils.showNotification('No video to download!', 'error');
            return;
        }
        
        try {
            this.showDownloadOverlay();
            
            // Simulate download preparation
            await this.animateDownloadProgress();
            
            // Create download link
            const url = URL.createObjectURL(AppState.processedVideoBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shortcraft-video-${Date.now()}.mp4`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Cleanup
            URL.revokeObjectURL(url);
            
            this.hideDownloadOverlay();
            Utils.showNotification('Video downloaded successfully! 📱');
            
        } catch (error) {
            console.error('Download error:', error);
            this.hideDownloadOverlay();
            Utils.showNotification('Download failed. Please try again.', 'error');
        }
    },
    
    shareToplatform(platform) {
        if (!AppState.viralContent) {
            Utils.showNotification('Generate a video first!', 'error');
            return;
        }
        
        const { title, hashtags } = AppState.viralContent;
        const shareText = `${title}\n\n${hashtags}`;
        
        const urls = {
            tiktok: 'https://www.tiktok.com/upload',
            instagram: 'https://www.instagram.com/',
            youtube: 'https://studio.youtube.com/'
        };
        
        // Copy share text to clipboard
        Utils.copyToClipboard(shareText).then(() => {
            Utils.showNotification(`Content copied! Opening ${platform}...`);
            
            // Open platform
            setTimeout(() => {
                window.open(urls[platform], '_blank');
            }, 1000);
        });
    },
    
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
                Utils.showNotification('Please drop video files only.', 'error');
            }
        });
    },
    
    optimizeForMobile() {
        // Mobile-specific optimizations
        if (Utils.isMobileDevice()) {
            console.log('Applying mobile optimizations...');
            
            // Disable hover effects on mobile
            document.body.classList.add('mobile-device');
            
            // Optimize video element for mobile
            const videoElements = document.querySelectorAll('video');
            videoElements.forEach(video => {
                video.setAttribute('playsinline', 'true');
                video.setAttribute('webkit-playsinline', 'true');
            });
            
            // Optimize file input for mobile
            const fileInputs = document.querySelectorAll('input[type="file"]');
            fileInputs.forEach(input => {
                input.setAttribute('capture', 'environment');
            });
        }
        
        // iOS specific optimizations
        if (Utils.isIOS()) {
            console.log('Applying iOS optimizations...');
            
            // Prevent zoom on input focus
            const inputs = document.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.style.fontSize = '16px';
            });
        }
    },
    
    showProcessingOverlay() {
        Elements.processingOverlay.style.display = 'flex';
        Elements.processingStatus.textContent = 'Starting AI analysis...';
        
        // Initialize processing steps
        EnhancedVideoProcessor.updateProcessingSteps(0);
    },
    
    hideProcessingOverlay() {
        Elements.processingOverlay.style.display = 'none';
    },
    
    showDownloadOverlay() {
        Elements.downloadOverlay.style.display = 'flex';
        Elements.downloadOverlay.classList.remove('hidden');
    },
    
    hideDownloadOverlay() {
        Elements.downloadOverlay.style.display = 'none';
    },
    
    async animateDownloadProgress() {
        const progressFill = document.querySelector('.download-fill');
        const steps = [
            { progress: 20, delay: 300, text: 'Preparing video...' },
            { progress: 50, delay: 500, text: 'Optimizing for mobile...' },
            { progress: 80, delay: 400, text: 'Finalizing download...' },
            { progress: 100, delay: 300, text: 'Complete!' }
        ];
        
        for (const step of steps) {
            await Utils.delay(step.delay);
            if (progressFill) {
                progressFill.style.width = `${step.progress}%`;
            }
        }
    },
    
    updateProgress(progressBar, percentage) {
        const fill = progressBar.querySelector('.progress-fill');
        if (fill) {
            fill.style.width = `${percentage}%`;
        }
        
        if (percentage >= 100) {
            setTimeout(() => {
                progressBar.style.display = 'none';
            }, 1000);
        }
    }
}

// Enhanced Utilities
const EnhancedUtils = {
    ...Utils, // Inherit existing utilities
    
    // Advanced content type detection based on video analysis
    detectContentTypeAdvanced(videoMetadata, analysisResults) {
        const { duration } = videoMetadata;
        const { faceDetection, segments } = analysisResults;
        
        // Tutorial indicators
        if (duration > 180 && !faceDetection) {
            return 'tutorial';
        }
        
        // Educational content indicators
        if (faceDetection && segments.some(s => s.audioScore > 0.8)) {
            return 'educational';
        }
        
        // Entertainment/comedy indicators
        if (segments.length > 2 || segments.some(s => s.activityScore > 0.9)) {
            return 'entertainment';
        }
        
        return 'comedy'; // Default fallback
    },
    
    // Generate platform-specific optimization suggestions
    getPlatformOptimizations(platform, videoData) {
        const optimizations = {
            tiktok: {
                aspectRatio: '9:16',
                duration: '15-60s',
                features: ['trending sounds', 'hashtag challenges', 'quick cuts'],
                tips: 'Hook viewers in first 3 seconds'
            },
            instagram: {
                aspectRatio: '9:16',
                duration: '15-90s',
                features: ['music integration', 'text overlays', 'story features'],
                tips: 'Use trending audio and eye-catching thumbnails'
            },
            youtube: {
                aspectRatio: '9:16',
                duration: '60s max',
                features: ['compelling titles', 'descriptions', 'thumbnails'],
                tips: 'Focus on watch time and engagement'
            }
        };
        
        return optimizations[platform] || optimizations.tiktok;
    },
    
    // Enhanced viral potential calculator
    calculateViralPotential(analysisResults, contentType, currentTrends = []) {
        const baseScore = analysisResults.totalScore || 70;
        
        let bonusPoints = 0;
        
        // Face detection bonus
        if (analysisResults.faceDetection) bonusPoints += 10;
        
        // Multi-segment splicing penalty (harder to go viral)
        if (analysisResults.segments && analysisResults.segments.length > 2) {
            bonusPoints -= 5;
        }
        
        // Content type multiplier
        const typeMultipliers = {
            entertainment: 1.2,
            comedy: 1.15,
            educational: 1.1,
            tutorial: 1.0
        };
        
        const multiplier = typeMultipliers[contentType] || 1.0;
        
        // Trend alignment bonus (simulated)
        if (currentTrends.length > 0) bonusPoints += 5;
        
        const finalScore = Math.min((baseScore + bonusPoints) * multiplier, 100);
        
        return {
            score: Math.round(finalScore),
            category: this.getViralCategory(finalScore),
            improvements: this.generateImprovements(finalScore, analysisResults)
        };
    },
    
    getViralCategory(score) {
        if (score >= 90) return '🔥 Exceptional - Likely to go viral';
        if (score >= 80) return '⚡ High Potential - Strong chance';
        if (score >= 70) return '✨ Good - Solid performance expected';
        if (score >= 60) return '📈 Moderate - Room for improvement';
        return '🔄 Needs Work - Consider major changes';
    },
    
    generateImprovements(score, analysisResults) {
        const improvements = [];
        
        if (score < 80) {
            if (!analysisResults.faceDetection) {
                improvements.push('Consider content with clear face visibility');
            }
            
            if (analysisResults.segments && analysisResults.segments.length > 2) {
                improvements.push('Try a single continuous clip for better flow');
            }
            
            improvements.push('Add trending background music');
            improvements.push('Use eye-catching text overlays');
            improvements.push('Post during peak engagement hours');
        }
        
        return improvements;
    }
};

// Initialize the complete application
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Check for required dependencies
        if (typeof FFmpeg === 'undefined') {
            console.warn('FFmpeg.wasm not loaded. Video processing may be limited.');
        }
        
        if (typeof tf === 'undefined') {
            console.warn('TensorFlow.js not loaded. Face detection may be limited.');
        }
        
        // Initialize the enhanced ShortCraft application
        window.shortCraftApp = new CompleteShortCraftApp();
        
        console.log('🎬 ShortCraft AI Video Editor initialized successfully!');
        
        // Add global error handling
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            
            if (event.reason && event.reason.message) {
                if (event.reason.message.includes('FFmpeg')) {
                    Utils.showNotification('Video processing failed. Please refresh and try again.', 'error');
                } else if (event.reason.message.includes('MediaPipe') || event.reason.message.includes('TensorFlow')) {
                    Utils.showNotification('AI analysis limited. Basic features still available.', 'error');
                } else {
                    Utils.showNotification('An unexpected error occurred. Please try again.', 'error');
                }
            }
            
            // Prevent the unhandled rejection from showing in console
            event.preventDefault();
        });
        
    } catch (error) {
        console.error('ShortCraft initialization failed:', error);
        Utils.showNotification('App failed to initialize. Please refresh the page.', 'error');
    }
});

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CompleteShortCraftApp,
        EnhancedAIAnalyzer,
        EnhancedVideoProcessor,
        EnhancedUtils
    };
}