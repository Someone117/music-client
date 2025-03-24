// Show playlist
function showPlaylist(playlistName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.getElementById('playlist-tab').classList.add('active');
    document.getElementById('playlist-name').textContent = playlistName;

    // Generate playlist songs (would normally come from an API)
    const playlistSongs = document.getElementById('playlist-songs');
    playlistSongs.innerHTML = '';

    const songCount = 10;

    for (let i = 1; i <= songCount; i++) {
        const songItem = document.createElement('div');
        songItem.className = 'song-item';
        songItem.onclick = function () {
            playSong(`${playlistName} Song ${i}`, `Artist ${Math.floor(Math.random() * 10) + 1}`);
        };

        songItem.innerHTML = `
        <img src="/api/placeholder/100/100" alt="Song" class="song-img" />
        <div class="song-details">
            <div class="song-title">${playlistName} Song ${i}</div>
            <div class="song-artist">Artist ${Math.floor(Math.random() * 10) + 1}</div>
        </div>
        <div class="song-options">⋮</div>
        `;

        playlistSongs.appendChild(songItem);
    }
}

// Go back to home
function goHome() {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById('home-tab').classList.add('active');
}

// Play song and show mini player
function playSong(title, artist) {
    document.getElementById('mini-title').textContent = title;
    document.getElementById('mini-artist').textContent = artist;
    document.getElementById('full-title').textContent = title;
    document.getElementById('full-artist').textContent = artist;
    document.getElementById('mini-player').classList.remove('hidden');
}

// Show full player
function showFullPlayer() {
    document.getElementById('full-player').classList.add('active');
}

// Hide full player
function hideFullPlayer() {
    document.getElementById('full-player').classList.remove('active');
}

// Show Next Songs
function nextSongs() {
    const nextSongsElement = document.getElementById('next-songs');
    nextSongsElement.style.display = 'block';
    nextSongsElement.style.position = 'fixed';
    nextSongsElement.style.bottom = '-100%';
    nextSongsElement.style.left = '0';
    nextSongsElement.style.width = '100%';
    nextSongsElement.style.height = '100%';
    nextSongsElement.style.backgroundColor = '#121212';
    nextSongsElement.style.color = 'white';
    nextSongsElement.style.overflowY = 'scroll';
    nextSongsElement.style.zIndex = '1000';
    nextSongsElement.style.padding = '20px';
    nextSongsElement.style.boxShadow = '0 -4px 10px rgba(0, 0, 0, 0.5)';
    nextSongsElement.style.transition = 'bottom 0.3s ease-in-out';
    setTimeout(() => {
        nextSongsElement.style.bottom = '0';
    }, 0);
}

// Hide Next Songs
function hideNextSongs() {
    const nextSongsElement = document.getElementById('next-songs');
    nextSongsElement.style.bottom = '-100%';
    setTimeout(() => {
        nextSongsElement.style.display = 'none';
    }, 300);
}

let startX = 0;
let isSwipingHorizontally = false;

function startSwipe(event) {
    startX = event.touches ? event.touches[0].clientX : event.clientX;
    startY = event.touches ? event.touches[0].clientY : event.clientY;
    isSwiping = true;
    isSwipingHorizontally = false;
}

function trackSwipe(event) {
    if (!isSwiping) return;
    const currentX = event.touches ? event.touches[0].clientX : event.clientX;
    const currentY = event.touches ? event.touches[0].clientY : event.clientY;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        isSwipingHorizontally = true;
        if (deltaX > 0) {
            skipToPreviousSong();
        } else {
            skipToNextSong();
        }
        isSwiping = false;
    } else if (deltaY > 50) {
        hideFullPlayer();
        isSwiping = false;
    }
}

function endSwipe() {
    isSwiping = false;
    isSwipingHorizontally = false;
}

function skipToNextSong() {
    console.log("Skipping to next song");
    // Add logic to skip to the next song
}

function skipToPreviousSong() {
    console.log("Skipping to previous song");
    // Add logic to skip to the previous song
}

let startY = 0;
let isSwiping = false;

function startSwipe(event) {
    startY = event.touches ? event.touches[0].clientY : event.clientY;
    isSwiping = true;
}

function trackSwipe(event) {
    if (!isSwiping) return;
    const currentY = event.touches ? event.touches[0].clientY : event.clientY;
    const deltaY = currentY - startY;

    if (deltaY > 50) { // Adjust threshold as needed
        hideFullPlayer();
        isSwiping = false;
    }
}

function endSwipe() {
    isSwiping = false;
}

var liked = false;
var shuffled = false;
var looped = false;
var played = false;
function like() {
    const likeButton = document.getElementById('like-button');
    liked = !liked;
    if (liked) {
        likeButton.innerHTML = '<title>unlike</title><path d="M23,10C23,8.89 22.1,8 21,8H14.68L15.64,3.43C15.66,3.33 15.67,3.22 15.67,3.11C15.67,2.7 15.5,2.32 15.23,2.05L14.17,1L7.59,7.58C7.22,7.95 7,8.45 7,9V19A2,2 0 0,0 9,21H18C18.83,21 19.54,20.5 19.84,19.78L22.86,12.73C22.95,12.5 23,12.26 23,12V10M1,21H5V9H1V21Z" />';
    } else {
        likeButton.innerHTML = '<title>like</title><path d="M5,9V21H1V9H5M9,21A2,2 0 0,1 7,19V9C7,8.45 7.22,7.95 7.59,7.59L14.17,1L15.23,2.06C15.5,2.33 15.67,2.7 15.67,3.11L15.64,3.43L14.69,8H21C22.11,8 23,8.9 23,10V12C23,12.26 22.95,12.5 22.86,12.73L19.84,19.78C19.54,20.5 18.83,21 18,21H9M9,19H18.03L21,12V10H12.21L13.34,4.68L9,9.03V19Z" />';
    }
}

function shuffle() {
    const shuffleButton = document.getElementById('shuffle-button');
    shuffled = !shuffled;
    if (shuffled) {
        shuffleButton.innerHTML = '<title>shuffle</title><path d="M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z" />';
    } else {
        shuffleButton.innerHTML = '<title>shuffle-disabled</title><path d="M16,4.5V7H5V9H16V11.5L19.5,8M16,12.5V15H5V17H16V19.5L19.5,16" />';
    }
}

function loop() {
    const loopButton = document.getElementById('loop-button');
    looped = !looped;
    if (looped) {
        loopButton.innerHTML = '<title>repeat</title><path d="M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z" />';
    } else {
        loopButton.innerHTML = '<title>repeat-off</title><path d="M2,5.27L3.28,4L20,20.72L18.73,22L15.73,19H7V22L3,18L7,14V17H13.73L7,10.27V11H5V8.27L2,5.27M17,13H19V17.18L17,15.18V13M17,5V2L21,6L17,10V7H8.82L6.82,5H17Z" />';
    }
}

function play() {
    const playButton = document.getElementsByClassName('play-button');
    played = !played;
    if (played) {
        Array.from(playButton).forEach(element => {
            element.innerHTML = '<title>play</title><path d="M10,16.5V7.5L16,12M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />';
        });
    } else {
        Array.from(playButton).forEach(element => {
            element.innerHTML = '<title>pause</title><path d="M13,16V8H15V16H13M9,16V8H11V16H9M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z" />';
        });
    }
}




const sliderThumb = document.getElementById('slider-thumb');
const sliderProgress = document.getElementById('slider-progress');
const progressBar = document.getElementById('time-slider');
const currentTimeDisplay = document.getElementById('current-time');
const totalTimeDisplay = document.getElementById('total-time');

let isDragging = false;

sliderThumb.addEventListener('mousedown', (e) => {
    isDragging = true;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', stopDrag);
});

sliderThumb.addEventListener('touchstart', (e) => {
    isDragging = true;
    document.addEventListener('touchmove', onDrag);
    document.addEventListener('touchend', stopDrag);
});

function onDrag(e) {
    if (!isDragging) return;
    const rect = progressBar.getBoundingClientRect();
    const offsetX = e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, offsetX / rect.width));

    sliderProgress.style.width = `${percentage * 100}%`;
    sliderThumb.style.left = `${percentage * 100}%`;

    const totalSeconds = parseTime(totalTimeDisplay.textContent);
    const currentSeconds = Math.round(totalSeconds * percentage);
    currentTimeDisplay.textContent = formatTime(currentSeconds);
}

function stopDrag() {
    isDragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('touchend', stopDrag);
}

function parseTime(timeString) {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}