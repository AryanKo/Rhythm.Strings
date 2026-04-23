import { tracks } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    const audioElement = document.getElementById('audio-element');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const repeatBtn = document.getElementById('repeat-btn');

    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');

    const trackListContainer = document.getElementById('track-list');
    const currentTrackName = document.getElementById('current-track-name');

    const progressBar = document.getElementById('progress-bar');
    const progressWrapper = document.getElementById('progress-wrapper');
    const timeCurrent = document.getElementById('time-current');
    const timeTotal = document.getElementById('time-total');

    const volumeBtn = document.getElementById('volume-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeProgress = document.getElementById('volume-progress');
    const volumeIconHigh = document.getElementById('volume-icon-high');
    const volumeIconLow = document.getElementById('volume-icon-low');
    const volumeIconMute = document.getElementById('volume-icon-mute');

    let currentTrackIndex = 0;
    let isPlaying = false;
    let isRepeating = true; // Default to repeat active

    // Queue State
    let queue = [];
    let currentQueueIndex = -1;

    const queueContainer = document.getElementById('queue-container');
    const queueListContainer = document.getElementById('queue-list');
    const clearQueueBtn = document.getElementById('clear-queue-btn');
    const loadingIcon = document.getElementById('loading-icon');

    if (clearQueueBtn) clearQueueBtn.addEventListener('click', clearQueue);

    // Initialize application
    function init() {
        initVolume();
        renderTrackList();
        loadTrack(currentTrackIndex);
        updateRepeatState();
    }

    // Render list of tracks
    function renderTrackList() {
        trackListContainer.innerHTML = '';
        tracks.forEach((track, index) => {
            const trackEl = document.createElement('div');
            trackEl.className = 'track-item';
            trackEl.dataset.index = index;

            trackEl.innerHTML = `
                <div class="track-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div class="track-details">
                    <div class="track-title"><span class="title-text">${track.name}</span></div>
                    <div class="track-status">Audio Recording</div>
                </div>
                <div class="track-actions">
                    <button class="action-btn play-next-btn" title="Play Next" aria-label="Play Next">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line></svg>
                    </button>
                    <button class="action-btn add-queue-btn" title="Add to Queue" aria-label="Add to Queue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
                <div class="equalizer">
                    <div class="equalizer-bar"></div>
                    <div class="equalizer-bar"></div>
                    <div class="equalizer-bar"></div>
                    <div class="equalizer-bar"></div>
                </div>
            `;

            trackEl.addEventListener('click', () => {
                const isCurrentTrack = (currentTrackIndex === index && currentQueueIndex === -1);
                if (isCurrentTrack) {
                    togglePlayPause();
                } else {
                    currentQueueIndex = -1; // Switch to normal playback
                    currentTrackIndex = index;
                    loadTrack(currentTrackIndex);
                    playTrack();
                }
            });

            const playNextBtn = trackEl.querySelector('.play-next-btn');
            const addQueueBtn = trackEl.querySelector('.add-queue-btn');

            playNextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                playNext(index);
            });

            addQueueBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                addToQueue(index);
            });

            trackListContainer.appendChild(trackEl);
        });
    }

    // Load track by index
    function loadTrack(index) {
        const track = tracks[index];
        if (!track) return;

        audioElement.src = track.src;

        const headerTitleText = document.getElementById('header-title-text');
        if (headerTitleText) {
            headerTitleText.textContent = track.name;
        } else {
            currentTrackName.textContent = track.name;
        }

        // Update active styling in the list
        updateActiveListStyles();

        // Reset progress visually
        progressBar.style.width = '0%';
        timeCurrent.textContent = '0:00';

        if (isPlaying) {
            updateMarquees();
        }
    }

    function togglePlayPause() {
        if (isPlaying) {
            pauseTrack();
        } else {
            playTrack();
        }
    }

    function playTrack() {
        // Attempt play (may be blocked by browser policy until interaction)
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise.then(_ => {
                isPlaying = true;
                    playIcon.classList.add('hidden');
                    pauseIcon.classList.remove('hidden');
                    loadingIcon.classList.add('hidden');
                    updateMarquees();
                }).catch(error => {
                    console.warn("Playback interrupted or buffering:", error.name);
                    // Network stalls and interrupts are normal on mobile. Do not throw aggressive alerts.
                    isPlaying = false;
                    playIcon.classList.remove('hidden');
                    pauseIcon.classList.add('hidden');
                    loadingIcon.classList.add('hidden');
                    updateMarquees();
                });
            }
        }
    
        function pauseTrack() {
            audioElement.pause();
            isPlaying = false;
            playIcon.classList.remove('hidden');
            pauseIcon.classList.add('hidden');
            loadingIcon.classList.add('hidden');
            updateMarquees();
        }

    function nextTrack() {
        if (queue.length > 0) {
            currentQueueIndex++;
            if (currentQueueIndex >= queue.length) currentQueueIndex = 0;
            currentTrackIndex = queue[currentQueueIndex];
        } else {
            currentTrackIndex++;
            if (currentTrackIndex > tracks.length - 1) currentTrackIndex = 0;
        }
        loadTrack(currentTrackIndex);
        if (isPlaying) playTrack();
    }

    function prevTrack() {
        if (queue.length > 0) {
            currentQueueIndex--;
            if (currentQueueIndex < 0) currentQueueIndex = queue.length - 1;
            currentTrackIndex = queue[currentQueueIndex];
        } else {
            currentTrackIndex--;
            if (currentTrackIndex < 0) currentTrackIndex = tracks.length - 1;
        }
        loadTrack(currentTrackIndex);
        if (isPlaying) playTrack();
    }

    function toggleRepeat() {
        isRepeating = !isRepeating;
        updateRepeatState();
    }

    function updateRepeatState() {
        if (isRepeating) {
            repeatBtn.classList.add('active');
        } else {
            repeatBtn.classList.remove('active');
        }
    }

    // Progress bar and Time formatting
    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function updateProgress(e) {
        const { duration, currentTime } = e.srcElement;

        if (!isNaN(duration)) {
            const progressPercent = (currentTime / duration) * 100;
            progressBar.style.width = `${progressPercent}%`;

            timeCurrent.textContent = formatTime(currentTime);
            timeTotal.textContent = formatTime(duration);
        }
    }

    function setProgress(e) {
        const width = this.clientWidth;
        const clickX = e.offsetX;
        const duration = audioElement.duration;

        if (!isNaN(duration)) {
            audioElement.currentTime = (clickX / width) * duration;
        }
    }

    // Queue Logic Methods
    function playNext(index) {
        if (queue.length === 0) {
            queue.push(index);
            currentQueueIndex = -1;
        } else {
            const insertAt = currentQueueIndex === -1 ? 0 : currentQueueIndex + 1;
            queue.splice(insertAt, 0, index);
        }
        renderQueue();
    }

    function addToQueue(index) {
        queue.push(index);
        renderQueue();
    }

    function removeFromQueue(qIndex) {
        queue.splice(qIndex, 1);
        if (currentQueueIndex === qIndex) {
            if (queue.length > 0) {
                if (currentQueueIndex >= queue.length) currentQueueIndex = 0;
                currentTrackIndex = queue[currentQueueIndex];
                loadTrack(currentTrackIndex);
                if (isPlaying) playTrack();
            } else {
                currentQueueIndex = -1;
                // fallback to something or pause? 
                pauseTrack();
            }
        } else if (currentQueueIndex > qIndex) {
            currentQueueIndex--;
        }
        renderQueue();
    }

    function clearQueue() {
        queue = [];
        currentQueueIndex = -1;
        renderQueue();
        updateActiveListStyles();
    }

    function renderQueue() {
        if (queue.length === 0) {
            queueContainer.classList.add('hidden');
            return;
        }
        queueContainer.classList.remove('hidden');
        queueListContainer.innerHTML = '';

        queue.forEach((trackIndex, qIndex) => {
            const track = tracks[trackIndex];
            const qEl = document.createElement('div');
            qEl.className = 'track-item'; 

            qEl.innerHTML = `
                <div class="track-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                </div>
                <div class="track-details">
                    <div class="track-title"><span class="title-text">${track.name}</span></div>
                    <div class="track-status">${qIndex === currentQueueIndex ? 'Playing from Queue' : 'In Queue'}</div>
                </div>
                <div class="track-actions">
                    <button class="action-btn remove-queue-btn" title="Remove" aria-label="Remove">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
                <div class="equalizer">
                    <div class="equalizer-bar"></div>
                    <div class="equalizer-bar"></div>
                    <div class="equalizer-bar"></div>
                    <div class="equalizer-bar"></div>
                </div>
            `;

            qEl.addEventListener('click', () => {
                currentQueueIndex = qIndex;
                currentTrackIndex = queue[currentQueueIndex];
                loadTrack(currentTrackIndex);
                if (!isPlaying) playTrack();
                else updateActiveListStyles();
            });

            const removeBtn = qEl.querySelector('.remove-queue-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFromQueue(qIndex);
            });

            queueListContainer.appendChild(qEl);
        });

        updateActiveListStyles();
        updateMarquees();
    }

    function updateActiveListStyles() {
        const mainTrackItems = trackListContainer.querySelectorAll('.track-item');
        mainTrackItems.forEach((el, i) => {
            if (i === currentTrackIndex && currentQueueIndex === -1) el.classList.add('playing');
            else el.classList.remove('playing');
        });
        
        const qTrackItems = queueListContainer.querySelectorAll('.track-item');
        qTrackItems.forEach((el, index) => {
            if (index === currentQueueIndex) el.classList.add('playing');
            else el.classList.remove('playing');
        });
    }

    // Marquee Logic for overflowing text
    function updateMarquees() {
        // Reset all
        document.querySelectorAll('.title-text.marquee').forEach(el => {
            el.classList.remove('marquee');
            el.style.animation = 'none';
            if (el.parentElement) el.parentElement.classList.remove('is-overflowing');
        });

        if (!isPlaying) return;

        // Wait a frame to ensure active classes are applied for width calculations
        requestAnimationFrame(() => {
            const checkMarquee = (textElement) => {
                if (!textElement) return;
                const container = textElement.parentElement;

                textElement.style.display = 'inline-block'; // force layout measurement

                if (textElement.scrollWidth > container.clientWidth) {
                    const overflow = textElement.scrollWidth - container.clientWidth;
                    // Add some buffer so it scrolls smoothly out of view
                    textElement.style.setProperty('--overflow-amount', `-${overflow + 24}px`);
                    textElement.style.setProperty('--duration', `${Math.max(4, overflow * 0.04)}s`);
                    textElement.classList.add('marquee');
                    container.classList.add('is-overflowing');
                } else {
                    textElement.style.display = ''; // reset to block/default
                }
            };

            checkMarquee(document.getElementById('header-title-text'));
            checkMarquee(document.querySelector('.track-item.playing .title-text'));
        });
    }

    // Volume Logic
    function initVolume() {
        const savedVolume = localStorage.getItem('rs_volume');
        const savedMuted = localStorage.getItem('rs_muted');
        
        let vol = savedVolume !== null ? parseFloat(savedVolume) : 1;
        let isMuted = savedMuted === 'true';
        
        audioElement.volume = vol;
        audioElement.muted = isMuted;
        volumeSlider.value = vol;
        updateVolumeUI(vol, isMuted);
    }

    function updateVolumeUI(vol, isMuted) {
        // Update slider progress visually
        volumeProgress.style.width = `${vol * 100}%`;
        
        // Hide all icons
        volumeIconHigh.classList.add('hidden');
        volumeIconLow.classList.add('hidden');
        volumeIconMute.classList.add('hidden');
        
        // Determine which to show
        if (isMuted || vol === 0) {
            volumeIconMute.classList.remove('hidden');
        } else if (vol < 0.5) {
            volumeIconLow.classList.remove('hidden');
        } else {
            volumeIconHigh.classList.remove('hidden');
        }
    }

    function handleVolumeChange(e) {
        const vol = parseFloat(e.target.value);
        audioElement.volume = vol;
        
        // If slider dragged from 0 and it was muted, unmute
        if (vol > 0 && audioElement.muted) {
            audioElement.muted = false;
            localStorage.setItem('rs_muted', 'false');
        }
        
        // Update UI and save
        updateVolumeUI(vol, audioElement.muted);
        localStorage.setItem('rs_volume', vol);
    }

    function toggleMute() {
        audioElement.muted = !audioElement.muted;
        localStorage.setItem('rs_muted', audioElement.muted.toString());
        
        // If we un-mute but volume is 0, bump it to 0.5 for UX
        if (!audioElement.muted && audioElement.volume === 0) {
            audioElement.volume = 0.5;
            volumeSlider.value = 0.5;
            localStorage.setItem('rs_volume', '0.5');
        }
        
        updateVolumeUI(audioElement.volume, audioElement.muted);
    }

    // Event Listeners
    playPauseBtn.addEventListener('click', togglePlayPause);
    prevBtn.addEventListener('click', prevTrack);
    nextBtn.addEventListener('click', nextTrack);
    repeatBtn.addEventListener('click', toggleRepeat);
    volumeBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', handleVolumeChange);

    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('loadedmetadata', updateProgress);
    progressWrapper.addEventListener('click', setProgress);
    window.addEventListener('resize', updateMarquees);

    // Audio Streaming Events
    audioElement.addEventListener('waiting', () => {
        if (isPlaying) {
            playIcon.classList.add('hidden');
            pauseIcon.classList.add('hidden');
            loadingIcon.classList.remove('hidden');
        }
    });

    audioElement.addEventListener('playing', () => {
        isPlaying = true;
        loadingIcon.classList.add('hidden');
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');
    });

    audioElement.addEventListener('error', (e) => {
        const err = audioElement.error;
        if (err) {
            console.error("Audio Player Error Code:", err.code);
            if (err.code === MediaError.MEDIA_ERR_NETWORK) {
                alert("Network error: Stream lost. Please check your connection.");
            } else if (err.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
                alert(`Cannot play this file. It might be missing or unsupported: ${tracks[currentTrackIndex]?.name || 'Unknown'}`);
            }
        }
        isPlaying = false;
        loadingIcon.classList.add('hidden');
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
    });

    // Auto-play next if not repeating (or handle end behavior)
    audioElement.addEventListener('ended', () => {
        if (queue.length > 0) {
            currentQueueIndex++;
            if (currentQueueIndex >= queue.length) currentQueueIndex = 0; // Loop queue natively
            currentTrackIndex = queue[currentQueueIndex];
            loadTrack(currentTrackIndex);
            playTrack();
        } else {
            if (isRepeating) {
                // Manually loop single track
                audioElement.currentTime = 0;
                playTrack();
            } else {
                nextTrack();
            }
        }
    });

    // Start
    init();
});
