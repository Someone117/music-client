// todo: virtual scrolling so it does not lag to hell

var url = "http://localhost:8080";

var userPlaylists = new Map();
var currentlyPlaying = null;
var currentTrack = null;
var currentPlaylistId = -1;
var playlistSongIndex = -1;
var upNext = [];

goHome();



// Show playlist
async function showPlaylist(playlistId) {
    let searchBar = document.getElementById('search-bar');
    searchBar.value = '';
    searchBar.classList.remove('active');


    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    const playlist = userPlaylists.get(playlistId);
    const playlistName = playlist.title;
    const playlistTracks = playlist.tracks.split(",");


    document.getElementById('playlist-tab').classList.add('active');
    document.getElementById('playlist-name').textContent = playlistName;

    // Generate playlist songs (would normally come from an API)
    const playlistSongs = document.getElementById('playlist-songs');

    for (let i = 0; i < playlistTracks.length; i++) {
        if (playlistTracks[i] != "-1") {
            await getTrack(playlistTracks[i]).then(function (data) {
                makeItemCard(playlistTracks[i], i).then(function (data) {
                    playlistSongs.appendChild(data);
                });
            });
        }
    }
}

// Settings
function settings() {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById('settings-tab').classList.add('active');
}

// Search
async function search() {
    //TODO: if a playlist is pulled up, search the playlist

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });


    let searchTab = document.getElementById('search-tab');
    searchTab.innerHTML = "";

    document.getElementById('search-tab').classList.add('active');
}

document.getElementById('search-bar').value = '';

// Go back to home
async function goHome() {
    let searchBar = document.getElementById('search-bar');
    searchBar.value = '';
    searchBar.classList.remove('active');

    searchContainer = document.getElementById('search-container');
    searchContainer.classList.remove('active');

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById('home-tab').classList.add('active');

    // show playlists
    getPlaylists().then(function () {
        const playlistGrid = document.getElementById('playlist-grid');
        playlistGrid.innerHTML = ''; // Clear previous playlists
        for (const [key, value] of userPlaylists) {
            // add to div
            const playlistItem = document.createElement('div');
            playlistItem.className = 'playlist-card';
            playlistItem.appendChild(getPlaylistImage(key));
            let title = document.createElement('div');
            title.className = 'playlist-title';
            title.textContent = value.title;
            let username = document.createElement('div');
            username.className = 'playlist-username';
            username.textContent = value.username;
            playlistItem.appendChild(title);
            playlistItem.appendChild(username);
            playlistItem.onclick = function () {
                showPlaylist(value.id);
            }
            playlistGrid.appendChild(playlistItem);
        }
    });
}

// Play song and show mini player
function playSong(title, artist) {
    document.getElementById('mini-title').textContent = title;
    document.getElementById('mini-artist').textContent = artist;
    document.getElementById('full-title').textContent = title;
    document.getElementById('full-artist').textContent = artist;
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

function skipToNextSong() {
    // Add logic to skip to the next song
}

function skipToPreviousSong() {
    // Add logic to skip to the previous song
}

let liked = false;
let shuffled = false;
let looped = false;
let played = false;

let playListShuffle = false;
let playlistLoop = false;
let playlistPublic = false;

function setPlaylistControls(shuffle, loop, public) {
    // I know this may not be conventional, but it saves code duplication
    // if we need to switch it, then do it
    if (shuffle != playListShuffle) {
        shufflePlaylist();
    }
    if (loop != playlistLoop) {
        loopPlaylist();
    }
    if (public != playlistPublic) {
        publicPlaylist();
    }


}

function shufflePlaylist() {
    const shuffleButton = document.getElementById('playlist-shuffle-button');
    playListShuffle = !playListShuffle;
    if (playListShuffle) {
        shuffleButton.innerHTML = '<title>shuffle</title><path d="M14.83,13.41L13.42,14.82L16.55,17.95L14.5,20H20V14.5L17.96,16.54L14.83,13.41M14.5,4L16.54,6.04L4,18.59L5.41,20L17.96,7.46L20,9.5V4M10.59,9.17L5.41,4L4,5.41L9.17,10.58L10.59,9.17Z" />';
    } else {
        shuffleButton.innerHTML = '<title>shuffle-disabled</title><path d="M16,4.5V7H5V9H16V11.5L19.5,8M16,12.5V15H5V17H16V19.5L19.5,16" />';
    }
}

function loopPlaylist() {
    const loopButton = document.getElementById('playlist-loop-button');
    playlistLoop = !playlistLoop;
    if (playlistLoop) {
        loopButton.innerHTML = '<title>repeat</title><path d="M17,17H7V14L3,18L7,22V19H19V13H17M7,7H17V10L21,6L17,2V5H5V11H7V7Z" />';
    } else {
        loopButton.innerHTML = '<title>repeat-off</title><path d="M2,5.27L3.28,4L20,20.72L18.73,22L15.73,19H7V22L3,18L7,14V17H13.73L7,10.27V11H5V8.27L2,5.27M17,13H19V17.18L17,15.18V13M17,5V2L21,6L17,10V7H8.82L6.82,5H17Z" />';
    }
}

function publicPlaylist() {
    const publicButton = document.getElementById('playlist-public-button');
    playlistPublic = !playlistPublic;
    if (playlistPublic) {
        publicButton.innerHTML = '<title>public</title><path d="M17.9,17.39C17.64,16.59 16.89,16 16,16H15V13A1,1 0 0,0 14,12H8V10H10A1,1 0 0,0 11,9V7H13A2,2 0 0,0 15,5V4.59C17.93,5.77 20,8.64 20,12C20,14.08 19.2,15.97 17.9,17.39M11,19.93C7.05,19.44 4,16.08 4,12C4,11.38 4.08,10.78 4.21,10.21L9,15V16A2,2 0 0,0 11,18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>';
    } else {
        publicButton.innerHTML = '<title>public-disabled</title><path d="M22,5.27L20.5,6.75C21.46,8.28 22,10.07 22,12A10,10 0 0,1 12,22C10.08,22 8.28,21.46 6.75,20.5L5.27,22L4,20.72L20.72,4L22,5.27M17.9,17.39C19.2,15.97 20,14.08 20,12C20,10.63 19.66,9.34 19.05,8.22L14.83,12.44C14.94,12.6 15,12.79 15,13V16H16C16.89,16 17.64,16.59 17.9,17.39M11,19.93V18C10.5,18 10.07,17.83 9.73,17.54L8.22,19.05C9.07,19.5 10,19.8 11,19.93M15,4.59V5A2,2 0 0,1 13,7H11V9A1,1 0 0,1 10,10H8V12H10.18L8.09,14.09L4.21,10.21C4.08,10.78 4,11.38 4,12C4,13.74 4.56,15.36 5.5,16.67L4.08,18.1C2.77,16.41 2,14.3 2,12A10,10 0 0,1 12,2C14.3,2 16.41,2.77 18.1,4.08L16.67,5.5C16.16,5.14 15.6,4.83 15,4.59Z"/>';
    }
}


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
    playPauseSound();
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
let wasPaused = true;


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

// aduio[0] = last, audio[1] = current, audio[2] = next...
const aduios = [null, null, null, null];

function playPauseSound() {
    if (played) {
        audio[1].pause();
        audio[1].play();
    }
    else {
        audio[1].pause();
    }
}

function back() {
    if (currentTime > 5) {
        audio[1].pause();
        audio[1].currentTime = 0;
        audio[1].play();
    } else {
        if (aduios[0] != null) {
            audio[1].pause();
            audio[1].currentTime = 0;
            audio[1].play();
            // shift the audio array back
            aduios[1] = aduios[0];
            aduios[2] = aduios[1];
            aduios[3] = aduios[2];
            aduios[0] = null;
            // load before queue

        } else {
            audio[1].pause();
            audio[1].currentTime = 0;
        }
    }
}

function forward() {
    aduios[1].stop();
    aduios[1].currentTime = 0;

    // shift the audio array
    aduios[0] = aduios[1];
    aduios[1] = aduios[2];
    aduios[2] = aduios[3];
    aduios[3] = null;


    if (aduios[1] != null) {
        audio[1].pause();
        audio[1].currentTime = 0;
        audio[1].play();
    }
    // load queue
    let queue = getQueue(true);
    if (queue.length > 0) {
        audio[3].src = getAudioSrc(queue[0]);
    }
    // check if the song that is currently playing is in Upnext or in the playlist
    if (upNext[0] == queue[0]) {
        upNext.remove(0);
    } else if (playlistIndex != -1) {
        playlistIndex++;
        if (playlistIndex >= playlists[currentPlaylistId].length) {
            playlistIndex = 0;
        }
    }
}




async function makeRequest(url, parameters, method = 'GET') {
    // Build the query string
    const query = new URLSearchParams(parameters).toString();
    const fullUrl = `${url}?${query}`;

    try {
        const response = await fetch(fullUrl, {
            method: method,
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json(); // or response.text(), etc.
        return data;
    } catch (error) {
        console.error("Fetch error:", error);
        throw error;
    }
}


class AlbumArtist {
    constructor(artistId, albumId, rowId) {
        this.artistId = artistId;
        this.albumId = albumId;
        this.rowId = rowId;
    }
}

class Artist {
    constructor(id, name, image) {
        this.id = id;
        this.name = name;
        this.image = image;
    }
}

class Album {
    constructor(id, title, image, smallimage, releasedate) {
        this.id = id;
        this.title = title;
        this.image = image;
        this.smallimage = smallimage;
        this.releasedate = releasedate;
    }
}

class Track {
    constructor(id, title, album, isDownloaded, image, smallimage) {
        this.id = id;
        this.title = title;
        this.album = album;
        this.isDownloaded = isDownloaded;
        this.image = image;
        this.smallimage = smallimage;
    }
}

class Playlist {
    constructor(id, title, username, tracks, flags) {
        this.id = id;
        this.title = title;
        this.username = username;
        this.tracks = tracks;
        this.flags = flags;
    }
}

class CurrentlyPlaying {
    constructor(version, data) {
        this.version = version;
        this.data = data;
    }
}



async function getPlaylists() {
    const parameters = {};

    const data = await makeRequest(url + "/getPlaylists", parameters);
    const item = data["playlists"];

    userPlaylists = new Map();
    item.forEach(p => {
        userPlaylists.set(p["ID"], new Playlist(p["ID"], p["Title"], p["Username"], p["Tracks"], p["Flags"]));
    });
}

async function getArtistAlbums(artistId) {
    const parameters = {
        "id": artistId
    };

    const data = await makeRequest(url + "/getArtistAlbums", parameters);
    const item = data["albums"];

    const albumsList = item.map(a =>
        new Album(a["ID"], a["Title"], a["Image"], a["SmallImage"], a["ReleaseDate"])
    );

    return albumsList;
}


async function getAlbumTracks(albumId) {
    const parameters = {
        "id": albumId
    };

    const data = await makeRequest(url + "/getAlbumTracks", parameters);
    const item = data["tracks"];

    let albumTracks = item.map(t =>
        new Track(t["ID"], t["Title"], t["Album"], t["IsDownloaded"], t["Image"], t["SmallImage"])
    );

    return albumTracks;
}

async function getAlbumArtists(albumId) {
    const parameters = {
        "id": albumId,
    };

    const data = await makeRequest(url + "/getAlbumArtist", parameters);
    return data["artistsNames"]; // list of strings
}

async function getAlbumArtistIDs(albumId) {
    const parameters = {
        "id": albumId,
    };

    const data = await makeRequest(url + "/getAlbumArtist", parameters);
    return [...new Set(data["artistIDs"])]; // list of strings
}



async function getAlbum(albumId) {
    let parameters = {
        "id": albumId,
    };

    let data = await makeRequest(url + "/getAlbum", parameters);
    let item = data["album"];
    return new Album(item["ID"], item["Title"], item["Image"], item["SmallImage"], item["ReleaseDate"]);
}

async function getTrack(trackId, download = false) {
    const parameters = {
        "id": trackId,
        "download": "" + download
    };

    const data = await makeRequest(url + "/getTrack", parameters);
    const item = data["track"];
    return new Track(item["ID"], item["Title"], item["Album"], item["IsDownloaded"], item["Image"], item["SmallImage"]);
}


function getPlaylistImage(playlistId) {
    // Get first 4 tracks and make a collage
    const playlist = userPlaylists.get(playlistId);
    if (!playlist) {
        let img = document.createElement("img");
        img.src = "./testimage.png";
        img.alt = "Song image";
        img.classList.add("song-img");
        img.onclick = () => showPlaylist(playlistId);
        return img;
    }
    let playlistTracks = playlist.tracks; // Comma-separated list of track IDs
    if (playlistTracks === null || playlistTracks === undefined) {
        let img = document.createElement("img");
        img.src = "./testimage.png";
        img.alt = "Song image";
        img.classList.add("song-img");
        img.onclick = () => showPlaylist(playlistId);
        return img;
    }
    let tracksList = playlistTracks.split(",");
    if (tracksList.length > 4) {
        tracksList = tracksList.slice(0, 4);
    } else if (tracksList.length === 0) {
        let img = document.createElement("img");
        img.src = "./testimage.png";
        img.alt = "Song image";
        img.classList.add("song-img");
        img.onclick = () => showPlaylist(playlistId);
        return img;
    } else {
        // Use the first image
        if (tracksList[0] === "-1") {
            let img = document.createElement("img");
            img.src = "./testimage.png";
            img.alt = "Song image";
            img.classList.add("song-img");
            img.onclick = () => showPlaylist(playlistId);
            return img;
        }
        let track = getTrack(tracksList[0]);
        if (track != null) {
            let img = document.createElement("img");
            img.src = track.album.image;
            img.alt = "Song image";
            img.classList.add("song-img");
            img.onclick = () => showPlaylist(playlistId);
            return img;
        } else {
            let img = document.createElement("img");
            img.src = "./testimage.png";
            img.alt = "Song image";
            img.classList.add("song-img");
            img.onclick = () => showPlaylist(playlistId);
            return img;
        }
    }

    // Create a 2x2 grid for the images
    let container = document.createElement("div");
    container.classList.add("song-img", "imageGrid");
    container.onclick = () => play(playlistId, null);

    tracksList.forEach(trackId => {
        let track = getTrack(trackId);
        if (track != null) {
            let img = document.createElement("img");
            img.src = track.album.image;
            img.alt = "Track image";
            container.appendChild(img);
        }
    });

    return container;
}

async function searchDB(onlydb = false, onlySpotify = false) {
    // get query from document
    let query = document.getElementById("search-bar").value; //TODO get the search bar name
    if (query == "") {
        return;
    }
    let parameters = {
        "query": query,
        "albums": "true",
        "artists": "true",
        "tracks": "true",
        "playlists": "true",
    };
    let searchResults = [];
    let searchTab = document.getElementById("search-tab");
    if (!onlySpotify) {
        searchTab.innerHTML = "";
        makeRequest(url + "/search", parameters).then(async function (data) {
            // tracks
            item = data["tracks"];
            if (item != null) {
                item.forEach(function (item) {
                    searchResults.push(new Track(item["ID"], item["Title"], item["Album"], item["IsDownloaded"], item["Image"], item["SmallImage"]));
                });
            }
            // albums
            item = data["albums"];
            if (item != null) {
                item.forEach(function (item) {
                    searchResults.push(new Album(item["ID"], item["Title"], item["Image"], item["SmallImage"], item["ReleaseDate"]));
                });
            }
            // artists
            item = data["artists"];
            if (item != null) {
                item.forEach(function (item) {
                    searchResults.push(new Artist(item["ID"], item["Name"], item["Image"]));
                });
            }
            // playlists
            item = data["playlists"];
            if (item != null) {
                item.forEach(function (item) {
                    searchResults.push(new Playlist(item["ID"], item["Title"], item["Username"], item["Tracks"], item["Flags"]));
                });
            }

            // preload all the artist albums etc for tracks and albums
            let albumIds = [];
            for (let i = 0; i < searchResults.length; i++) {
                if (searchResults[i] instanceof Track) {
                    let track = searchResults[i];
                    if (track.album != null) {
                        albumIds.push(track.album);
                    }
                } else if (searchResults[i] instanceof Album) {
                    let album = searchResults[i];
                    if (album.id != null) {
                        albumIds.push(album.id);
                    }
                }
            }
            // turn into a list of strings, comma separated
            let albumIdsString = albumIds.join(",");
            // get the albums
            let parameters = {
                "ids": albumIdsString,
            };
            let artistNames = [];
            try {
                const data = await makeRequest(url + "/getAlbumArtists", parameters);
                let item = data["artistsNames"];
                if (item != null) {
                    artistNames = item;
                }
            } catch (error) {
                console.error("Error fetching album artists:", error);
            }

            let index = 0;
            for (const item of searchResults) {
                if (item instanceof Track) {
                    searchTab.appendChild(await makeItemCard(item, null, artistNames[index]));
                    index++;
                } else if (item instanceof Album) {
                    searchTab.appendChild(await makeItemCard(item, null, artistNames[index]));
                    index++;
                } else if (item instanceof Artist) {
                    searchTab.appendChild(await makeItemCard(item));
                } else if (item instanceof Playlist) {
                    searchTab.appendChild(await makeItemCard(item));
                }
            }
        });
    }

    parameters["db"] = "false";
    if (onlydb) {
        return;
    }
    parameters["spotify"] = "true";
    let spotifyResults = [];
    makeRequest(url + "/search", parameters).then(async function (data) {
        // tracks
        item = data["spotify_tracks"];
        if (item != null) {
            item.forEach(function (item) {
                spotifyResults.push(new Track(item["ID"], item["Title"], item["Album"], item["IsDownloaded"], item["Image"], item["SmallImage"]));
            });
        }
        // albums
        item = data["spotify_albums"];
        if (item != null) {
            item.forEach(function (item) {
                spotifyResults.push(new Album(item["ID"], item["Title"], item["Image"], item["SmallImage"], item["ReleaseDate"]));
            });
        }
        // artists
        item = data["spotify_artists"];
        if (item != null) {
            item.forEach(function (item) {
                spotifyResults.push(new Artist(item["ID"], item["Name"], item["Image"]));
            });
        }
        // playlists
        item = data["spotify_playlists"];
        if (item != null) {
            item.forEach(function (item) {
                spotifyResults.push(new Playlist(item["ID"], item["Title"], item["Username"], item["Tracks"], item["Flags"]));
            });
        }
        // look through the items in searchTab and get their ids and their types
        // loop over children of searchTab
        searchTab.childNodes.forEach(function (item) {
            if (item.classList.contains("track-item")) {
                let id = item.getAttribute("data-id");
                spotifyResults = spotifyResults.filter(function (item) {
                    if (item instanceof Track) {
                        return item.id != id;
                    }
                });
            }
            if (item.classList.contains("album-item")) {
                let id = item.getAttribute("data-id");
                spotifyResults = spotifyResults.filter(function (item) {
                    if (item instanceof Album) {
                        return item.id != id;
                    }
                });
            }
            if (item.classList.contains("artist-item")) {
                let id = item.getAttribute("data-id");
                spotifyResults = spotifyResults.filter(function (item) {
                    if (item instanceof Artist) {
                        return item.id != id;
                    }
                });
            }
            if (item.classList.contains("playlist-item")) {
                let id = item.getAttribute("data-id");
                spotifyResults = spotifyResults.filter(function (item) {
                    if (item instanceof Playlist) {
                        return item.id != id;
                    }
                });
            }
        });

        // preload all the artist albums etc for tracks and albums
        let albumIds = [];
        for (let i = 0; i < spotifyResults.length; i++) {
            if (spotifyResults[i] instanceof Track) {
                let track = spotifyResults[i];
                if (track.album != null) {
                    albumIds.push(track.album);
                }
            } else if (spotifyResults[i] instanceof Album) {
                let album = spotifyResults[i];
                if (album.id != null) {
                    albumIds.push(album.id);
                }
            }
        }
        // turn into a list of strings, comma separated
        let albumIdsString = albumIds.join(",");
        // get the albums
        let parameters = {
            "ids": albumIdsString,
        };
        let artistNames = [];
        try {
            const data = await makeRequest(url + "/getAlbumArtists", parameters);
            let item = data["artistsNames"];
            if (item != null) {
                artistNames = item;
            }
        } catch (error) {
            console.error("Error fetching album artists:", error);
        }

        let index = 0;
        for (const item of spotifyResults) {
            if (item instanceof Track) {
                searchTab.appendChild(await makeItemCard(item, null, artistNames[index]));
                index++;
            } else if (item instanceof Album) {
                searchTab.appendChild(await makeItemCard(item, null, artistNames[index]));
                index++;
            } else if (item instanceof Artist) {
                searchTab.appendChild(await makeItemCard(item));
            }
        }
    });
}

async function makeItemCard(item, playlistId = null, artistName = null, showTyppe = true) {
    if (item instanceof Track) {
        let top = document.createElement("div");
        top.classList.add("song-item", "track-item");
        top.setAttribute("data-id", item.id);

        let image = document.createElement("img");
        image.src = item.smallimage || './testimage.png';
        image.alt = "Song image";
        image.classList.add("song-img");
        image.onclick = () => play(playlistId, item.id);

        let title = document.createElement("div");
        title.classList.add("song-title");
        title.textContent = item.title;

        let artist = document.createElement("div");
        artist.classList.add("song-artist");
        if (showTyppe) {
            artist.textContent = `${artistName}: Track`;
        } else {
            artist.textContent = `${artistName}`;
        }
        let details = document.createElement("div");
        details.classList.add("song-details");
        details.appendChild(title);
        details.appendChild(artist);

        let options = document.createElement("div");
        options.classList.add("song-options");
        options.textContent = "⋮";
        options.onclick = () => songOptions(item, artistName);

        top.appendChild(image);
        top.appendChild(details);
        top.appendChild(options);

        return top;

    } else if (item instanceof Album) {
        let top = document.createElement("div");
        top.classList.add("song-item", "album-item");
        top.setAttribute("data-id", item.id);


        let image = document.createElement("img");
        image.src = item.smallimage || './testimage.png';
        image.alt = "Album image";
        image.classList.add("song-img");
        image.onclick = () => goToAlbum(item.id);

        let title = document.createElement("div");
        title.classList.add("song-title");
        title.textContent = item.title;

        let artist = document.createElement("div");
        artist.classList.add("song-artist");
        if (showTyppe) {
            artist.textContent = `${artistName}: Track`;
        } else {
            artist.textContent = `${artistName}`;
        }
        let details = document.createElement("div");
        details.classList.add("song-details");
        details.appendChild(title);
        details.appendChild(artist);

        let options = document.createElement("div");
        options.classList.add("song-options");
        options.textContent = "⋮";
        options.onclick = () => albumOptions(item, artistName);

        top.appendChild(image);
        top.appendChild(details);
        top.appendChild(options);

        return top;

    } else if (item instanceof Artist) {
        let top = document.createElement("div");
        top.classList.add("song-item", "artist-item");
        top.setAttribute("data-id", item.id);

        let image = document.createElement("img");
        if (item.image && item.image.trim() !== "") {
            image.src = item.image;
        } else {
            try {
                const img = await getArtistImage(item.id);
                image.src = img || './testimage.png';
            } catch (error) {
                image.src = './testimage.png';
            }
        }

        image.alt = "Artist image";
        image.classList.add("song-img");
        image.onclick = () => goToArtist(item.id);

        let title = document.createElement("div");
        title.classList.add("song-title");
        title.textContent = item.name;
        title.onclick = () => goToArtist(item.id);

        let artist = document.createElement("div");
        artist.classList.add("song-artist");
        artist.textContent = "Artist";
        artist.onclick = () => goToArtist(item.id);

        let details = document.createElement("div");
        details.classList.add("song-details");
        details.appendChild(title);
        details.appendChild(artist);

        let options = document.createElement("div");
        options.classList.add("song-options");
        options.textContent = "⋮";
        options.onclick = () => artistOptions(item);

        top.appendChild(image);
        top.appendChild(details);
        top.appendChild(options);

        return top;

    } else if (item instanceof Playlist) {
        const image = getPlaylistImage(item.id);
        image.onclick = () => showPlaylist(item.id);

        let top = document.createElement("div");
        top.classList.add("song-item", "playlist-item");
        top.setAttribute("data-id", item.id);

        let title = document.createElement("div");
        title.classList = ["song-title"];
        title.innerHTML = item.title;

        let artist = document.createElement("div");
        artist.classList = ["song-artist"];
        artist.innerHTML = item.username + ": Playlist";

        let details = document.createElement("div");
        details.classList = ["song-details"];
        details.appendChild(title);
        details.appendChild(artist);

        let options = document.createElement("div");
        options.classList = ["song-options"];
        options.innerHTML = "⋮";

        options.onclick = () => playlistOptions(item);
        top.appendChild(image);
        top.appendChild(details);
        top.appendChild(options);
        return top;
    }
}


async function fillPlaylistPage(playlistId) {
    let playlist = userPlaylists[playlistId];
    let flagsList = playlist.flags.split(",");
    let container = document.getElementById("playlist-songs");
    let shuffleInternal = false;
    let repeatInternal = false;
    let publicInternal = false;
    let mixArtists = [];
    document.getElementById("playlist-play-button").onclick = `play(${playlistId}, null)`;
    container.innerHTML = "";
    // read version number
    let version = flagsList[0];
    shuffleInternal = flagsList[1] == "1";
    repeatInternal = flagsList[2] == "1";
    publicInternal = flagsList[3] == "1"
    if (version == "002") {
        // rest of them are a list of artist ids for the mix
        for (let i = 3; i < flagsList.length; i++) {
            mixArtists = flagsList[i];
        }
    } else {
        alert("Unknown Playlist Format: " + version);
    }
    if (mixArtists.length > 0) {
        // display the artists in a list like the others
        // then make it so that when you play the playlist, it plays random tracks from the artists
        // get the albums of the artists
        mixArtists.forEach(async function (id) {
            container.innerHTML += await makeItemCard(id, null, null);
        });
        setplaylisFlags(shuffleInternal, repeatInternal, publicInternal);

    } else {
        // make request to get all the artists
        let artists = [];
        makeRequest(url + "/getAlbumArtists", {
            "ids": playlist.tracks
        }.then(async function (data) {
            let item = data["artistsNames"];
            if (item != null) {
                item.forEach(function (item) {
                    artists.push(item);
                });
            }
        }));
        playlistSongs = playlist.tracks.split[","];
        playlistSongs.forEach(async function (id, i) {
            if (id != "-1") {
                container.innerHTML += await makeItemCard(id, playlistId, artists[i]);
            }
        });
        setplaylisFlags(shuffleInternal, repeatInternal, publicInternal);
    }

}

function getQueue(download = false, playlistIncrement = false) {
    let queue = [];
    if (upNext.length > 0) {
        // push the upNext tracks to the queue
        queue = upNext;
    }

    if (currentPlaylistId == -1) {
        return queue;
    }

    if (playlistIncrement) {
        playlistSongIndex++;
        if (playlistSongIndex >= userPlaylists[currentPlaylistId].tracks.split(",").length) {
            if (userPlaylists[currentPlaylistId].flags.split(",")[2] == "1") {
                playlistSongIndex = 0;
            } else {
                return queue;
            }
        }
    }
    let playlistTracks = userPlaylists.get(currentPlaylistId).tracks.split(",");
    // get tracks starting at playlistSongIndex
    if (playlistSongIndex == -1) {
        playlistSongIndex = 0;
    }
    for (let i = playlistSongIndex; i < (playlistTracks.length > 10 ? playlistSongIndex + 10 : playlistTracks.length); i++) {
        let track = getTrack(playlistTracks[i], download);
        if (track != null) {
            queue.push(track.id);
        }
    }


}

function setCurrentlyPlaying(item) {
    // set the currently playing track
    currentlyPlaying = item;
    // make a request to the server to set the currently playing track
    let parameters = {
        "version": item.version,
        "data": item.data
    };
    makeRequest(url + "/setCurrentlyPlaying", parameters);

    // set the currently playing track in the UI
    let artist = getTrack(currentTrack).album.artists.join(", ");
    let image = getTrack(currentTrack).album.image;
    let title = getTrack(currentTrack).title;

    // set in mini player
    let miniImage = document.getElementById("mini-player-img");
    miniImage.src = image;
    let miniTitle = document.getElementById("mini-title");
    miniTitle.innerHTML = title;
    let miniArtist = document.getElementById("mini-artist");
    miniArtist.innerHTML = artist

    // big player
    let bigImage = document.getElementById("full-img");
    bigImage.src = image
    let bigTitle = document.getElementById("full-title");
    bigTitle.innerHTML = title;
    let bigArtist = document.getElementById("full-artist");
    bigArtist.innerHTML = artist;

    // set the current time
    let currentTime = document.getElementById("current-time");

}


// condense the code so we have an item to play (playlist album or track)
function play(playlistId, trackId) {
    // setup the other stuff, like the playlist currently playing etc. and queue etc

    currentPlaylistId = playlistId;
    playSong(trackId, false);

    // start downloading queue
    getQueue(true);
    // set currently playing
    setCurrentlyPlaying(CurrentlyPlaying(version = "002", data = `${trackId},0,${playlists[playlistIndex]},${getQueue(true).join(",")}`));
    currentPlaylistId = playlistIndex;
    // which song in the playlist
    playlistSongIndex = userPlaylists[playlistId].tracks.split(",").indexOf(trackId);
}


function playSong(trackId, setCurrentlyPlaying = true) {
    if (setCurrentlyPlaying) {
        setCurrentlyPlaying(CurrentlyPlaying(version = "001", data = `${trackId},0,${getQueue(true).join(",")}`)); // format: trackId,position,playlistId,
        currentPlaylistId = -1;
        playlistSongIndex = -1;
    }

    // get the track with the download option
    // set buttons

    // play the track

    // set currently playing
}


async function songOptions(track, artistNames) {
    getAlbum(track.album).then(async function (album) {

        // show the song options
        popupOverlay.classList.add('active');
        let top = document.createElement("div");
        top.classList.add("song-item", "track-item");

        let image = document.createElement("img");
        image.src = track.smallimage || './testimage.png';
        image.alt = "Song image";
        image.classList.add("song-img");

        let title = document.createElement("div");
        title.classList.add("song-title");
        title.textContent = track.title;

        let artist = document.createElement("div");
        artist.classList.add("song-artist");
        artist.textContent = `${artistNames} : ${album.title}`;

        let details = document.createElement("div");
        details.classList.add("song-details");
        details.appendChild(title);
        details.appendChild(artist);


        top.appendChild(image);
        top.appendChild(details);

        let songinfo = document.getElementById("popupSongInfo");
        songinfo.innerHTML = "";
        songinfo.appendChild(top);
        // set data of the buttons
        let goToAlbumButton = document.getElementById("popup-button-album");
        goToAlbumButton.onclick = () => goToAlbum(track.album);
        goToAlbumButton.classList.remove("disabled");

    });
    let goToArtistButton = document.getElementById("popup-button-artist");
    // get track artists
    const artistIds = await getAlbumArtistIDs(track.album);
    goToArtistButton.onclick = () => goToArtist(artistIds[0]);
    goToArtistButton.classList.remove("disabled");
    let addToPlaylistButton = document.getElementById("popup-button-playlist");
    addToPlaylistButton.onclick = () => addToPlaylist(track.id);
    addToPlaylistButton.classList.remove("disabled");
    let addToQueue = document.getElementById("popup-button-queue");
    addToQueue.onclick = () => addToQueue(track.id);
    addToQueue.classList.remove("disabled");

    let shareSpotifyButton = document.getElementById("popup-button-share-spotify");
    shareSpotifyButton.onclick = () => shareSpotify(track.id);
    shareSpotifyButton.classList.remove("disabled");
    let shareYtButton = document.getElementById("popup-button-link");
    shareYtButton.onclick = () => shareYT(track.id);
    shareYtButton.classList.remove("disabled");
}

function albumOptions(album, artistNames) {
    let items = document.getElementsByClassName("popup-button");
    Array.from(items).forEach(item => {
        item.classList.remove("disabled");
    });
    let goToAlbum = document.getElementById("popup-button-album");
    goToAlbum.classList.add("disabled");

    // show the album options
    popupOverlay.classList.add('active');
    let top = document.createElement("div");
    top.classList.add("song-item", "track-item");

    let image = document.createElement("img");
    image.src = album.smallimage || './testimage.png';
    image.alt = "Song image";
    image.classList.add("song-img");

    let title = document.createElement("div");
    title.classList.add("song-title");
    title.textContent = album.title;

    let artist = document.createElement("div");
    artist.classList.add("song-artist");
    artist.textContent = `${artistNames}`;

    let details = document.createElement("div");
    details.classList.add("song-details");
    details.appendChild(title);
    details.appendChild(artist);


    top.appendChild(image);
    top.appendChild(details);

    let songinfo = document.getElementById("popupSongInfo");
    songinfo.innerHTML = "";
    songinfo.appendChild(top);
}

function artistOptions(artist) {
    // show the artist options
    let items = document.getElementsByClassName("popup-button");
    Array.from(items).forEach(item => {
        item.classList.remove("disabled");
    });
    let goToAlbum = document.getElementById("popup-button-album");
    goToAlbum.classList.add("disabled");
    let goToArtist = document.getElementById("popup-button-artist");
    goToArtist.classList.add("disabled");

    // show the artist options
    popupOverlay.classList.add('active');
    let top = document.createElement("div");
    top.classList.add("song-item", "track-item");

    let image = document.createElement("img");
    image.src = artist.image || './testimage.png';
    image.alt = "Song image";
    image.classList.add("song-img");

    let title = document.createElement("div");
    title.classList.add("song-title");
    title.textContent = artist.name;

    let details = document.createElement("div");
    details.classList.add("song-details");
    details.appendChild(title);

    top.appendChild(image);
    top.appendChild(details);


    let songinfo = document.getElementById("popupSongInfo");
    songinfo.innerHTML = "";
    songinfo.appendChild(top);
}

const popupOverlay = document.getElementById('popupOverlay');

// Close popup when clicking outside the popup container
popupOverlay.addEventListener('click', (e) => {
    if (e.target === popupOverlay) {
        popupOverlay.classList.remove('active');
    }
});

const playlistOverlay = document.getElementById('playlistOverlay');
// Close playlist popup when clicking outside the playlist container
playlistOverlay.addEventListener('click', (e) => {
    if (e.target === playlistOverlay) {
        playlistOverlay.classList.remove('active');
    }
});

// Add click effects for all action buttons
const popupButtons = document.querySelectorAll('.popup-button');
popupButtons.forEach(button => {
    button.addEventListener('click', function () {
        // Flash effect
        this.style.backgroundColor = 'rgba(29, 185, 84, 0.3)';
        setTimeout(() => {
            this.style.backgroundColor = '';
        }, 200);
    });
});

let searchBar = document.getElementById("search-bar");
searchBar.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        searchDB();
    }
});

searchBar.addEventListener("focus", function (event) {
    search();
});

searchBar.addEventListener("input", function (event) {
    const searchDelayDB = 100;
    const searchDelaySpotify = 1000; // Timeout duration for Spotify search in milliseconds

    if (this.value.length > 2) {
        clearTimeout(this.searchTimeoutDB);
        clearTimeout(this.searchTimeoutSpotify);

        this.searchTimeoutDB = setTimeout(() => {
            searchDB(true);
        }, searchDelayDB);

        this.searchTimeoutSpotify = setTimeout(() => {
            searchDB(false, true);
        }, searchDelaySpotify);
    } else if (this.value.length == 0) {
        // clear the search results
        let searchTab = document.getElementById("search-tab");
        searchTab.innerHTML = "";
    }
});

async function getArtist(artistId) {
    const parameters = {
        "id": artistId
    };

    const data = await makeRequest(url + "/getArtist", parameters);
    const item = data["artist"];
    return new Artist(item["ID"], item["Name"], item["Image"]);
}

async function getArtistImage(artistId) {
    const data = await makeRequest(url + "/getArtistImage", {
        "spotify": "true",
        "id": artistId
    });

    let item = data["image"];
    if (item != null) {
        if (item == "") {
            return "./testimage.png";
        } else {
            return item;
        }
    } else {
        return item;
    }
}

async function goToAlbum(albumId) {
    const album = await getAlbum(albumId);
    const albumTracks = await getAlbumTracks(albumId);
    const albumArtists = await getAlbumArtists(albumId);

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    let searchBar = document.getElementById('search-bar');
    searchBar.value = '';
    searchBar.classList.remove('active');

    searchContainer = document.getElementById('search-container');
    searchContainer.classList.remove('active');
    popupOverlay.classList.remove('active');
    let albumTab = document.getElementById("album-tab");
    albumTab.setAttribute("data-id", albumId);
    albumTab.classList.add('active');
    let albumTitle = document.getElementById("album-title");
    albumTitle.innerHTML = album.title;
    let albumSubtitle = document.getElementById("album-subtitle");
    albumSubtitle.innerHTML = parseReleaseDate(album.releasedate);
    let albumImage = document.getElementById("album-image");
    albumImage.src = album.image;

    // get all tracks and make track cards
    let albumTracksContainer = document.getElementById("album-songs");
    albumTracksContainer.innerHTML = "";
    albumTracks.forEach(async function (track) {
        let artistNames = albumArtists.join(", ");
        let trackCard = await makeItemCard(track, null, artistNames, false);
        albumTracksContainer.appendChild(trackCard);
    });
}

function parseReleaseDate(releaseDate) {
    // turn releaseDate into a string
    let strreleaseDate = releaseDate.toString();

    console.log(strreleaseDate);
    let year = strreleaseDate.substring(0, 4);
    if (year == "0000") {
        return "Unknown";
    }
    let month = strreleaseDate.substring(4, 6);
    if (month == "00") {
        return `${year}`;
    }
    switch (month) {
        case "01":
            month = "Jan";
            break;
        case "02":
            month = "Feb";
            break;
        case "03":
            month = "Mar";
            break;
        case "04":
            month = "Apr";
            break;
        case "05":
            month = "May";
            break;
        case "06":
            month = "Jun";
            break;
        case "07":
            month = "Jul";
            break;
        case "08":
            month = "Aug";
            break;
        case "09":
            month = "Sep";
            break;
        case "10":
            month = "Oct";
            break;
        case "11":
            month = "Nov";
            break;
        case "12":
            month = "Dec";
            break;
        default:
            month = "Unknown";
            break;
    }
    let day = strreleaseDate.substring(6, 8);
    if (day.charAt(0) == "0") {
        day = day.substring(1);
    }
    if (day == "0") {
        return `${month} ${year}`;
    }
    return `${month} ${day} ${year}`;
}


async function goToArtist(artistId) {
    const artist = await getArtist(artistId);
    const artistAlbums = await getArtistAlbums(artistId);
    const artistImage = await getArtistImage(artistId);

    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    let searchBar = document.getElementById('search-bar');
    searchBar.value = '';
    searchBar.classList.remove('active');

    searchContainer = document.getElementById('search-container');
    searchContainer.classList.remove('active');
    popupOverlay.classList.remove('active');
    let artistTab = document.getElementById("artist-tab");
    artistTab.setAttribute("data-id", artistId);
    artistTab.classList.add('active');
    let artistName = document.getElementById("artist-name");
    artistName.innerHTML = artist.name;
    let artistImageDiv = document.getElementById("artist-image");
    artistImageDiv.src = artistImage;

    // get all tracks and make track cards
    let artistAlbumsContainer = document.getElementById("artist-albums");
    artistAlbumsContainer.innerHTML = "";
    // sort by release date
    artistAlbums.sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
    artistAlbums.forEach(async function (album) {
        // get the artist names
        const artistNames = await getAlbumArtists(album.id);
        let artistNamesString = artistNames.join(", ");
        let albumCard = await makeItemCard(album, null, artistNamesString, false);
        artistAlbumsContainer.appendChild(albumCard);
    });

}

function addToPlaylist(trackId) {
    playlistOverlay.classList.add('active');
    playlistInput.value = "";
    const playlistContainer = document.getElementById("playlist-container");
    playlistContainer.innerHTML = ""; // clear the container
    playlistContainer.setAttribute("data-track-id", trackId);

    // get playlists
    getPlaylists().then(function () {
        // loop through userPlaylists and create cards for each playlist
        for (const value of userPlaylists.values()) {
            let top = document.createElement("div");
            top.classList.add("song-item", "playlist-item", "max-width");

            let image = getPlaylistImage(value.id) || './testimage.png';

            let title = document.createElement("div");
            title.classList.add("song-title");
            title.textContent = value.title;

            let username = document.createElement("div");
            username.classList.add("song-artist");
            username.textContent = `Owner: ${value.username}`;


            const checkbox = document.createElement("div");
            checkbox.className = "playlist-checkbox";


            // SVG checkmark
            const svgNS = "http://www.w3.org/2000/svg";
            const svg = document.createElementNS(svgNS, "svg");
            svg.setAttribute("viewBox", "0 0 24 24");
            svg.setAttribute("width", "24");
            svg.setAttribute("height", "24");
            svg.setAttribute("fill", "white");

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", "M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z");

            svg.appendChild(path);
            checkbox.appendChild(svg);


            checkbox.addEventListener("click", () => {
                checkbox.classList.toggle("checked");
                if (checkbox.classList.contains("checked")) {
                    addTrackToPlaylist(value.id, trackId);
                } else {
                    // remove track from playlist
                    console.log(`Removing track ${trackId} from playlist ${value.id}`);
                }
            });


            let details = document.createElement("div");
            details.classList.add("song-details");
            details.appendChild(title);
            details.appendChild(username);

            top.appendChild(image);
            top.appendChild(details);
            top.appendChild(checkbox);

            top.setAttribute("data-id", value.id);
            playlistContainer.appendChild(top);
        }

    });
}


function addTrackToPlaylist(playlistId, trackId) {
    console.log(`Adding track ${trackId} to playlist ${playlistId}`);
}


const playlistInput = document.getElementById("playlist-name-input");
playlistInput.value = "";

const createPlaylistButton = document.getElementById("create-playlist-btn");

createPlaylistButton.addEventListener("click", async function () {
    const playlistName = playlistInput.value.trim();
    if (!playlistName || playlistName.length > 50) return;

    createPlaylist(playlistName)
});

function createPlaylist(playlistName) {
    parameters = {
        "playlistName": playlistName,
    };

    makeRequest(url + "/createPlaylist", parameters, 'POST').then(function (data) {
        if (data["Error"] == null) {
            let playlistId = data["playlistID"];
            const playlistContainer = document.getElementById("playlist-container");
            let trackId = playlistContainer.getAttribute("data-track-id");


            getPlaylists().then(function () {
                const value = userPlaylists.get(playlistId);
                // create a new card for the playlist

                let top = document.createElement("div");
                top.classList.add("song-item", "playlist-item", "max-width");

                let image = getPlaylistImage(value.id) || './testimage.png';

                let title = document.createElement("div");
                title.classList.add("song-title");
                title.textContent = value.title;

                let username = document.createElement("div");
                username.classList.add("song-artist");
                username.textContent = `Owner: ${value.username}`;


                const checkbox = document.createElement("div");
                checkbox.className = "playlist-checkbox";


                // SVG checkmark
                const svgNS = "http://www.w3.org/2000/svg";
                const svg = document.createElementNS(svgNS, "svg");
                svg.setAttribute("viewBox", "0 0 24 24");
                svg.setAttribute("width", "24");
                svg.setAttribute("height", "24");
                svg.setAttribute("fill", "white");

                const path = document.createElementNS(svgNS, "path");
                path.setAttribute("d", "M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z");

                svg.appendChild(path);
                checkbox.appendChild(svg);


                checkbox.addEventListener("click", () => {
                    checkbox.classList.toggle("checked");
                    if (checkbox.classList.contains("checked")) {
                        addTrackToPlaylist(value.id, trackId);
                    } else {
                        // remove track from playlist
                        console.log(`Removing track ${trackId} from playlist ${value.id}`);
                    }
                });


                let details = document.createElement("div");
                details.classList.add("song-details");
                details.appendChild(title);
                details.appendChild(username);

                top.appendChild(image);
                top.appendChild(details);
                top.appendChild(checkbox);

                top.setAttribute("data-id", value.id);
                playlistContainer.appendChild(top);


            });


        } else {
            alert("Error creating playlist: " + data["message"]);
        }
    });
    playlistInput.value = ""; // clear the input field

}