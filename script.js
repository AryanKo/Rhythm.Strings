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

    let currentTrackIndex = 0;
    let isPlaying = false;
    let isRepeating = true; // Default to repeat active

    // Initialize application
    function init() {
        renderTrackList();
        loadTrack(currentTrackIndex);
        audioElement.loop = isRepeating;
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
                <div class="equalizer">
                    <div class="equalizer-bar"></div>
                    <div class="equalizer-bar"></div>
                    <div class="equalizer-bar"></div>
                    <div class="equalizer-bar"></div>
                </div>
            `;

            trackEl.addEventListener('click', () => {
                const isCurrentTrack = currentTrackIndex === index;
                if (isCurrentTrack) {
                    togglePlayPause();
                } else {
                    currentTrackIndex = index;
                    loadTrack(currentTrackIndex);
                    playTrack();
                }
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
        document.querySelectorAll('.track-item').forEach((el, i) => {
            if (i === index) {
                el.classList.add('playing');
            } else {
                el.classList.remove('playing');
            }
        });

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
                updateMarquees();
            }).catch(error => {
                console.error("Playback failed (likely due to missing file or browser policy):", error);
                // Revert state if play fails
                isPlaying = false;
                playIcon.classList.remove('hidden');
                pauseIcon.classList.add('hidden');
                alert(`Could not play ${tracks[currentTrackIndex].name}. Please ensure the file is at ${tracks[currentTrackIndex].src}`);
            });
        }
    }

    function pauseTrack() {
        audioElement.pause();
        isPlaying = false;
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        updateMarquees();
    }

    function nextTrack() {
        currentTrackIndex++;
        if (currentTrackIndex > tracks.length - 1) {
            currentTrackIndex = 0;
        }
        loadTrack(currentTrackIndex);
        if (isPlaying) playTrack();
    }

    function prevTrack() {
        currentTrackIndex--;
        if (currentTrackIndex < 0) {
            currentTrackIndex = tracks.length - 1;
        }
        loadTrack(currentTrackIndex);
        if (isPlaying) playTrack();
    }

    function toggleRepeat() {
        isRepeating = !isRepeating;
        audioElement.loop = isRepeating;
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

    // Event Listeners
    playPauseBtn.addEventListener('click', togglePlayPause);
    prevBtn.addEventListener('click', prevTrack);
    nextBtn.addEventListener('click', nextTrack);
    repeatBtn.addEventListener('click', toggleRepeat);

    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('loadedmetadata', updateProgress);
    progressWrapper.addEventListener('click', setProgress);
    window.addEventListener('resize', updateMarquees);

    // Auto-play next if not repeating (or handle end behavior)
    audioElement.addEventListener('ended', () => {
        if (!isRepeating) {
            nextTrack();
        }
        // If repeating, audioElement.loop = true handles it natively
    });

    // Start
    init();
});
