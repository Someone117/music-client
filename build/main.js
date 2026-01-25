var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// todo: virtual scrolling so it does not lag to hell
let url = window.location.origin;
let userPlaylists = new Map();
var currentlyPlaying = null;
var currentTrack = null;
var currentPlaylistId = "-1";
var playlistSongIndex = -1;
var queue = [];
let queueIndex = 0;
var testImage = "static/res/testimage.png";
var tracksToRemove = 50;
var maxTracks = 1000;
let trackMap = new Map();
function addToTrackMap(track) {
    if (trackMap.has(track.ID))
        return;
    trackMap.set(track.ID, track);
    const excess = trackMap.size - maxTracks;
    if (excess <= 0)
        return;
    // Remove at least `tracksToRemove` items when cleaning up,
    // but if we've exceeded by more than that, remove the excess too.
    const toRemove = Math.min(trackMap.size, Math.max(tracksToRemove, excess));
    for (let i = 0; i < toRemove; i++) {
        const oldestKey = trackMap.keys().next().value;
        if (oldestKey === undefined)
            break;
        trackMap.delete(oldestKey);
    }
}
function getFromTrackMap(track_id) {
    return trackMap.get(track_id);
}
const audio1 = new Audio();
// const audio2 = document.getElementById('audio2');
// const audio3 = document.getElementById('audio3');
let currentAudio = audio1;
// let nextAudio = audio2;
// let lastAudio = audio3;
const currentTime = document.getElementById('currentTime');
const duration = document.getElementById('duration');
let playInterval;
let searchTimer;
let liked = false;
let shuffled = false;
let looped = false;
let isPlaying = false;
let playlistPublic = false;
const popupOverlay = document.getElementById('popupOverlay');
var accessToken = null;
var refreshToken = null;
var searchBar;
document.addEventListener('DOMContentLoaded', function () {
    accessToken = localStorage.getItem("access_token");
    refreshToken = localStorage.getItem("refresh_token");
    searchBar = document.getElementById('search-bar');
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
    searchBar.value = '';
    searchBar.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            let searchTab = document.getElementById("search-tab");
            searchTab.innerHTML = "";
            searchDB(false, false);
        }
    });
    searchBar.addEventListener("focus", function () {
        search();
    });
    searchBar.addEventListener("input", function () {
        // if after 1000 ms there is no input, do the search
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            let searchTab = document.getElementById("search-tab");
            searchTab.innerHTML = "";
            searchDB(false, false);
        }, 1000);
    });
    const playlistInput = document.getElementById("playlist-name-input");
    playlistInput.value = "";
    const createPlaylistButton = document.getElementById("create-playlist-btn");
    createPlaylistButton.addEventListener("click", function () {
        return __awaiter(this, void 0, void 0, function* () {
            const playlistName = playlistInput.value.trim();
            if (!playlistName || playlistName.length > 50)
                return;
            createPlaylist(playlistName);
        });
    });
    const downloadPlaylist = document.getElementById("download-playlist");
    downloadPlaylist.addEventListener("click", function () {
        return __awaiter(this, void 0, void 0, function* () {
            let playlistId = document.getElementById("playlist-tab").getAttribute("data-id");
            if (!playlistId)
                return;
            let playlist = userPlaylists.get(playlistId);
            if (!playlist)
                return;
            let tracks = yield getTracks(playlist.Tracks, false);
            if (!tracks)
                return;
            const zip = new JSZip();
            const CONCURRENCY_LIMIT = 8;
            // one track, given an index to download
            const downloadTrack = (track) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const blob = yield makeRequestForAudio(url + "/play", {
                        "id": track.ID,
                        "download": true,
                    });
                    if (!blob)
                        return;
                    const filename = track.Title.replace(/[^\w\d\-_.]/g, "_") + "-" + track.ID.replace(/[^\w\d\-_.]/g, "_");
                    zip.file(`${filename}.mp3`, blob);
                }
                catch (err) {
                    console.error(`Failed to download audio for ${track.Title}:`, err);
                }
            });
            // Execute in batches of 4
            for (let i = 0; i < tracks.length; i += CONCURRENCY_LIMIT) {
                const batch = tracks.slice(i, i + CONCURRENCY_LIMIT).map((track) => downloadTrack(track));
                // Wait for the current batch of 4 to finish before starting the next 4
                yield Promise.all(batch);
                console.log(`Finished batch starting at index ${i}`);
            }
            console.log("zipping…");
            const zipBlob = yield zip.generateAsync({ type: "blob" });
            const zipUrl = URL.createObjectURL(zipBlob);
            const a = document.createElement("a");
            a.href = zipUrl;
            a.download = `${playlist.Title}.zip`;
            a.click();
            URL.revokeObjectURL(zipUrl);
        });
    });
    goHome();
});
function getArtist(artist_id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (artist_id == null || artist_id == undefined || artist_id == "" || artist_id == "-1") {
            return null;
        }
        const parameters = new URLSearchParams({
            'ids': artist_id
        });
        const data = yield makeRequest(url + "/getArtists", parameters);
        return data.artists;
    });
}
function makeRequest(newurl_1, parameters_1) {
    return __awaiter(this, arguments, void 0, function* (newurl, parameters, method = 'GET') {
        // Build the query string
        const query = new URLSearchParams(parameters).toString();
        const fullUrl = `${newurl}?${query}`;
        try {
            for (let attempt = 0; attempt < 2; attempt++) {
                const response = yield fetch(fullUrl, {
                    method: method,
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                if (response.status === 401 && attempt === 0) {
                    // Token might be expired, try to refresh
                    const refreshResponse = yield fetch(url + "/refreshToken", {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${refreshToken}`
                        }
                    });
                    if (refreshResponse.ok) {
                        const new_data = yield refreshResponse.json();
                        accessToken = new_data["access_token"];
                        refreshToken = new_data["refresh_token"];
                        localStorage.setItem("access_token", accessToken);
                        localStorage.setItem("refresh_token", refreshToken);
                        continue; // Retry the original request
                    }
                    else {
                        // go to login page
                        window.location.href = "/loginPage";
                    }
                }
                else {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    const data = yield response.json();
                    return data;
                }
            }
            throw new Error("Failed to make request after token refresh");
        }
        catch (error) {
            console.trace("Fetch error:", error);
            throw error;
        }
    });
}
function getPlaylists() {
    return __awaiter(this, void 0, void 0, function* () {
        const parameters = new URLSearchParams({});
        const data = yield makeRequest(url + "/getPlaylists", parameters);
        userPlaylists = new Map();
        if (!data) {
            return;
        }
        let items = data.playlists;
        items.forEach(p => {
            userPlaylists.set(p.ID, p);
        });
    });
}
function getArtistAlbums(artistId) {
    return __awaiter(this, void 0, void 0, function* () {
        const parameters = new URLSearchParams({
            "id": artistId
        });
        const data = yield makeRequest(url + "/getArtistAlbums", parameters);
        return data.albums;
    });
}
function getAlbumTracks(album) {
    return __awaiter(this, void 0, void 0, function* () {
        const parameters = new URLSearchParams({
            "id": album
        });
        const data = yield makeRequest(url + "/getAlbumTracks", parameters);
        return data.tracks;
    });
}
function getAlbum(albumId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (albumId == null || albumId == undefined || albumId == "" || albumId == "-1") {
            return null;
        }
        let parameters = new URLSearchParams({
            "ids": albumId,
        });
        let data = yield makeRequest(url + "/getAlbums", parameters);
        return data.albums;
    });
}
// note that this does not care about order, input or output
function getTracks(trackIds_1) {
    return __awaiter(this, arguments, void 0, function* (trackIds, download = false) {
        if (trackIds == null || trackIds == undefined) {
            return [];
        }
        let parameters = new URLSearchParams({});
        let trackWeHave = [];
        let tracksToGet = [];
        if (!download) {
            for (let i = 0; i < trackIds.length; i++) {
                let cachedTrack = getFromTrackMap(trackIds[i]);
                if (!cachedTrack) {
                    tracksToGet.push(trackIds[i]);
                }
                else {
                    trackWeHave.push(cachedTrack);
                }
            }
            if (tracksToGet.length === 0) {
                return trackWeHave;
            }
            parameters = new URLSearchParams({
                "ids": tracksToGet.join(","),
                "download": "" + false
            });
        }
        else {
            parameters = new URLSearchParams({
                "ids": trackIds.join(","),
                "download": "" + true
            });
        }
        const data = yield makeRequest(url + "/getTracks", parameters);
        for (const track of data.tracks) {
            addToTrackMap(track);
        }
        return [...trackWeHave, ...data.tracks];
    });
}
function getPlaylistImage(playlistId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Get first 4 tracks and make a collage
        const playlist = userPlaylists.get(playlistId);
        if (!playlist) {
            let img = document.createElement("img");
            img.src = testImage;
            img.alt = "Song image";
            img.classList.add("song-img");
            img.onclick = () => showPlaylist(playlistId);
            return img;
        }
        if (playlist.Tracks === null || playlist.Tracks === undefined) {
            let img = document.createElement("img");
            img.src = testImage;
            img.alt = "Song image";
            img.classList.add("song-img");
            img.onclick = () => showPlaylist(playlistId);
            return img;
        }
        let tracksList = playlist.Tracks;
        if (playlist.Tracks.length > 4) {
            tracksList = playlist.Tracks.slice(0, 4);
        }
        else if (tracksList.length === 0) {
            let img = document.createElement("img");
            img.src = testImage;
            img.alt = "Song image";
            img.classList.add("song-img");
            img.onclick = () => showPlaylist(playlistId);
            return img;
        }
        else {
            // Use the first image
            if (tracksList[0] == "" || tracksList[0] == "-1") {
                // use no image
                let img = document.createElement("img");
                img.src = testImage;
                img.alt = "Song image";
                img.classList.add("song-img");
                img.onclick = () => showPlaylist(playlistId);
                return img;
            }
            // use the first image
            let track = yield getTracks([tracksList[0]])[0];
            if (track != null) {
                let img = document.createElement("img");
                img.src = track.SmallImage;
                img.alt = "Song image";
                img.classList.add("song-img");
                img.onclick = () => showPlaylist(playlistId);
                return img;
            }
            else {
                let img = document.createElement("img");
                img.src = testImage;
                img.alt = "Song image";
                img.classList.add("song-img");
                img.onclick = () => showPlaylist(playlistId);
                return img;
            }
        }
        // Create a 2x2 grid for the images
        let container = document.createElement("div");
        container.classList.add("song-img", "imageGrid");
        container.onclick = () => playPlaylist(playlistId, null);
        let tracks = yield getTracks(tracksList);
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i] != null) {
                let img = document.createElement("img");
                img.src = tracks[i].SmallImage;
                img.alt = "Track image";
                container.appendChild(img);
            }
        }
        return container;
    });
}
function makeItemCard(item_1) {
    return __awaiter(this, arguments, void 0, function* (item, playlistId = null, showType = true, isqueue = false, isalbum = false) {
        if ('IsDownloaded' in item) { // track
            let top = document.createElement("div");
            top.classList.add("song-item", "track-item");
            top.setAttribute("data-id", item.ID);
            let image = document.createElement("img");
            image.src = item.SmallImage || testImage;
            image.alt = "Song image";
            image.classList.add("song-img");
            if (isqueue) {
                image.onclick = () => playSongInQueue(item.ID);
            }
            else if (isalbum) {
                image.onclick = () => playSongInAlbum(item.ID, playlistId);
            }
            else {
                image.onclick = () => playSongInPlaylist(playlistId, item.ID);
            }
            let title = document.createElement("div");
            title.classList.add("song-title");
            title.textContent = item.Title;
            let artist = document.createElement("div");
            artist.classList.add("song-artist");
            if (showType) {
                artist.textContent = `${item.ArtistsNames.join(", ")}: Track`;
            }
            else {
                artist.textContent = `${item.ArtistsNames.join(", ")}`;
            }
            let details = document.createElement("div");
            details.classList.add("song-details");
            details.appendChild(title);
            details.appendChild(artist);
            let options = document.createElement("div");
            options.classList.add("song-options");
            options.textContent = "⋮";
            options.onclick = () => songOptions(item);
            top.appendChild(image);
            top.appendChild(details);
            top.appendChild(options);
            return top;
        }
        else if ('ReleaseDate' in item) { // tlbum
            let top = document.createElement("div");
            top.classList.add("song-item", "album-item");
            top.setAttribute("data-id", item.ID);
            let image = document.createElement("img");
            image.src = item.SmallImage || testImage;
            image.alt = "Album image";
            image.classList.add("song-img");
            image.onclick = () => goToAlbum(item.ID);
            let title = document.createElement("div");
            title.classList.add("song-title");
            title.textContent = item.Title;
            let artist = document.createElement("div");
            artist.classList.add("song-artist");
            if (showType) {
                artist.textContent = `${item.ArtistsNames.join(", ")}: Track`;
            }
            else {
                artist.textContent = `${item.ArtistsNames.join(", ")}`;
            }
            let details = document.createElement("div");
            details.classList.add("song-details");
            details.appendChild(title);
            details.appendChild(artist);
            let options = document.createElement("div");
            options.classList.add("song-options");
            options.textContent = "⋮";
            options.onclick = () => albumOptions(item);
            top.appendChild(image);
            top.appendChild(details);
            top.appendChild(options);
            return top;
        }
        else if ('LastUpdated' in item) { // artist
            let top = document.createElement("div");
            top.classList.add("song-item", "artist-item");
            top.setAttribute("data-id", item.ID);
            let image = document.createElement("img");
            if (item.Image && item.Image.trim() !== "") {
                image.src = item.Image;
            }
            else {
                image.src = item.SmallImage || testImage;
            }
            image.alt = "Artist image";
            image.classList.add("song-img");
            image.onclick = () => goToArtist(item.ID);
            let title = document.createElement("div");
            title.classList.add("song-title");
            title.textContent = item.Name;
            title.onclick = () => goToArtist(item.ID);
            let artist = document.createElement("div");
            artist.classList.add("song-artist");
            artist.textContent = "Artist";
            artist.onclick = () => goToArtist(item.ID);
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
        }
        else if ('Flags' in item) { // playlist
            const image = yield getPlaylistImage(item.ID);
            image.onclick = () => showPlaylist(item.ID);
            let top = document.createElement("div");
            top.classList.add("song-item", "playlist-item");
            top.setAttribute("data-id", item.ID);
            let title = document.createElement("div");
            title.classList = "song-title";
            title.innerHTML = item.Title;
            let artist = document.createElement("div");
            artist.classList = "song-artist";
            artist.innerHTML = item.Username + ": Playlist";
            let details = document.createElement("div");
            details.classList = "song-details";
            details.appendChild(title);
            details.appendChild(artist);
            let options = document.createElement("div");
            options.classList = "song-options";
            options.innerHTML = "⋮";
            // options.onclick = () => playlistOptions(item);
            top.appendChild(image);
            top.appendChild(details);
            top.appendChild(options);
            return top;
        }
    });
}
// Show playlist
function showPlaylist(playlistId) {
    return __awaiter(this, void 0, void 0, function* () {
        searchBar.value = '';
        searchBar.classList.remove('active');
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        const playlist = userPlaylists.get(playlistId);
        const playlistName = playlist.Title;
        document.getElementById('playlist-tab').classList.add('active');
        document.getElementById('playlist-name').textContent = playlistName;
        document.getElementById('playlist-tab').setAttribute('data-id', playlistId);
        fillPlaylistPage(playlist);
    });
}
// Settings
function settings() {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById('settings-tab').classList.add('active');
}
// Search
function search() {
    return __awaiter(this, void 0, void 0, function* () {
        //TODO: if a playlist is pulled up, search the playlist
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        let searchTab = document.getElementById('search-tab');
        searchTab.innerHTML = "";
        document.getElementById('search-tab').classList.add('active');
    });
}
// Go back to home
function goHome() {
    return __awaiter(this, void 0, void 0, function* () {
        searchBar.value = '';
        searchBar.classList.remove('active');
        let searchContainer = document.getElementById('search-container');
        searchContainer.classList.remove('active');
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.getElementById('home-tab').classList.add('active');
        // show playlists
        getPlaylists().then(function (response) {
            const playlistGrid = document.getElementById('playlist-grid');
            playlistGrid.innerHTML = ''; // Clear previous playlists
            for (const [key, value] of userPlaylists) {
                // add to div
                const playlistItem = document.createElement('div');
                playlistItem.className = 'playlist-card';
                const imgWrapper = document.createElement('div');
                getPlaylistImage(key).then(imgNode => {
                    imgWrapper.appendChild(imgNode);
                });
                let title = document.createElement('div');
                title.className = 'playlist-title';
                title.textContent = value.Title;
                let username = document.createElement('div');
                username.className = 'playlist-username';
                username.textContent = value.Username;
                playlistItem.appendChild(imgWrapper);
                playlistItem.appendChild(title);
                playlistItem.appendChild(username);
                playlistItem.onclick = function () {
                    showPlaylist(value.ID);
                };
                playlistGrid.appendChild(playlistItem);
            }
        });
    });
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
    return __awaiter(this, void 0, void 0, function* () {
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
        // fill song list with the queue after the currently playing song
        const songList = document.getElementById('upnext-songs');
        songList.innerHTML = ''; // Clear previous songs
        const partofqueue = queue.slice(queueIndex); // from current song to end
        const tracks = yield getTracks(partofqueue);
        const trackMap = new Map(tracks.map(obj => [obj.ID, obj])); // okay so basically getTracks does not have an order, so we make it a map
        // then we just go through our ordered list, and we get the value from our tracks.
        for (const trackID of partofqueue) {
            songList.appendChild(yield makeItemCard(trackMap.get(trackID), null, false, true, false));
        }
    });
}
// Hide Next Songs
function hideNextSongs() {
    const nextSongsElement = document.getElementById('next-songs');
    nextSongsElement.style.bottom = '-100%';
    setTimeout(() => {
        nextSongsElement.style.display = 'none';
    }, 300);
}
function searchDB() {
    return __awaiter(this, arguments, void 0, function* (onlydb = false, onlySpotify = false) {
        // check the scrolling of the search area, if we need to scroll more, load more
        let searchTab = document.getElementById("search-tab");
        // get query from document
        let query = document.getElementById("search-bar").value;
        if (query == "") {
            return;
        }
        let parameters = new URLSearchParams({
            "query": query,
            "db": "true",
            "spotify": "true",
            "albums": "true",
            "artists": "true",
            "tracks": "true",
            "playlists": "true",
        });
        let data = yield makeRequest(url + "/search", parameters);
        let index = 0;
        if (data.tracks) {
            for (const item of data.tracks) {
                searchTab.appendChild(yield makeItemCard(item));
            }
        }
        if (data.artists) {
            for (const item of data.artists) {
                searchTab.appendChild(yield makeItemCard(item));
            }
        }
        if (data.albums) {
            for (const item of data.albums) {
                searchTab.appendChild(yield makeItemCard(item));
            }
        }
        if (data.playlists) {
            for (const item of data.playlists) {
                searchTab.appendChild(yield makeItemCard(item));
            }
        }
        if (data.spotify_tracks) {
            for (const item of data.spotify_tracks) {
                searchTab.appendChild(yield makeItemCard(item));
            }
        }
        if (data.spotify_artists) {
            for (const item of data.spotify_artists) {
                searchTab.appendChild(yield makeItemCard(item));
            }
        }
        if (data.spotify_albums) {
            for (const item of data.spotify_albums) {
                searchTab.appendChild(yield makeItemCard(item));
            }
        }
    });
}
function fillPlaylistPage(playlist) {
    return __awaiter(this, void 0, void 0, function* () {
        let flagsList = playlist.Flags.split(",");
        let shuffleInternal = false;
        let repeatInternal = false;
        let publicInternal = false;
        let mixArtists = [];
        let container = document.getElementById("playlist-songs");
        document.getElementById("playlist-play-button").onclick = () => playPlaylist(playlist.ID);
        container.innerHTML = "";
        // read version number
        let version = flagsList[0];
        shuffleInternal = flagsList[1] == "1";
        repeatInternal = flagsList[2] == "1";
        publicInternal = flagsList[3] == "1";
        if (version == "001") {
            // make request to get all the artists
            getTracks(playlist.Tracks).then(function (tracks) {
                return __awaiter(this, void 0, void 0, function* () {
                    container.appendChild(yield makeItemCard(tracks[0], playlist.ID, false));
                });
            });
            // setplaylistFlags(shuffleInternal, repeatInternal, publicInternal); ToDo: this
            // } else if (version == "002") {
            //     // rest of them are a list of artist ids for the mix
            //     for (let i = 3; i < flagsList.length; i++) {
            //         mixArtists = flagsList[i];
            //     }
            //     // Todo: get the artists
            //     // display the artists in a list like the others
            //     // then make it so that when you play the playlist, it plays random tracks from the artists
            //     // get the albums of the artists
            //     mixArtists.forEach(async function (id) {
            //         container.innerHTML += await makeItemCard(item, null, null);
            //     });
            //     // setplaylistFlags(shuffleInternal, repeatInternal, publicInternal); ToDo: this
        }
        else {
            getTracks(playlist.Tracks).then(function (tracks) {
                return __awaiter(this, void 0, void 0, function* () {
                    for (let i = 0; i < tracks.length; i++) {
                        container.appendChild(yield makeItemCard(tracks[i], playlist.ID, false));
                    }
                });
            });
        }
    });
}
function setCurrentlyPlaying(item) {
    // set the currently playing track
    // set tab title to song title - artist names
    document.title = item.Title;
    // make request to set the currently playing track on the server
    // let current: CurrentlyPlaying = {};
    // set icon to album art
    // let link = document.querySelector("link[rel~='icon']");
    // if (!link) {
    //     link = document.createElement('link');
    //     link.rel = 'icon';
    //     document.getElementsByTagName('head')[0].appendChild(link);
    // }
    // link.href = item.SmallImage || testImage;
    // make a request to the server to set the currently playing track
    // let parameters = {
    //     "version": item.version,
    //     "data": item.data
    // };
    // makeRequest(url + "/setCurrentlyPlaying", parameters);
    // set the currently playing track in the UI
    let playlistAddButton = document.getElementById("playlist-add-button");
    playlistAddButton.onclick = () => addToPlaylist(item.ID);
    // get the artists of the album
    // set in mini player
    let miniImage = document.getElementById("mini-img");
    miniImage.src = item.Image || testImage;
    let miniTitle = document.getElementById("mini-title");
    miniTitle.innerHTML = item.Title;
    let miniArtist = document.getElementById("mini-artist");
    miniArtist.innerHTML = item.ArtistsNames.join(", ");
    // big player
    let bigImage = document.getElementById("full-img");
    bigImage.src = item.Image;
    let bigTitle = document.getElementById("full-title");
    bigTitle.innerHTML = item.Title;
    let bigArtist = document.getElementById("full-artist");
    bigArtist.innerHTML = item.ArtistsNames.join(", ");
    // set the current time
    let currentTime = document.getElementById("current-time");
    // ToDo: do this
}
function songOptions(track) {
    return __awaiter(this, void 0, void 0, function* () {
        // show the song options
        popupOverlay.classList.add('active');
        let top = document.createElement("div");
        top.classList.add("song-item", "track-item");
        let image = document.createElement("img");
        image.src = track.SmallImage || testImage;
        image.alt = "Song image";
        image.classList.add("song-img");
        let title = document.createElement("div");
        title.classList.add("song-title");
        title.textContent = track.Title;
        let artist = document.createElement("div");
        artist.classList.add("song-artist");
        artist.textContent = `${track.ArtistsNames} : ${track.AlbumName}`;
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
        goToAlbumButton.onclick = () => goToAlbum(track.AlbumID);
        goToAlbumButton.classList.remove("disabled");
        let goToArtistButton = document.getElementById("popup-button-artist");
        // get track artists
        goToArtistButton.onclick = () => goToArtist(track.ArtistsIDs[0]);
        goToArtistButton.classList.remove("disabled");
        let addToPlaylistButton = document.getElementById("popup-button-playlist");
        addToPlaylistButton.onclick = () => addToPlaylist(track.ID);
        addToPlaylistButton.classList.remove("disabled");
        let addToQueueBtn = document.getElementById("popup-button-queue");
        addToQueueBtn.onclick = () => {
            // add to right after this song, if there is overflow, add it to the beginning  
            queue.splice(queueIndex + 1 >= queue.length ? 0 : queueIndex + 1, 0, track.ID);
            // close popup
            popupOverlay.classList.remove('active');
        };
        addToQueueBtn.classList.remove("disabled");
        let shareSpotifyButton = document.getElementById("popup-button-share-spotify");
        shareSpotifyButton.onclick = () => shareSpotify(track.ID);
        shareSpotifyButton.classList.remove("disabled");
        let shareYtButton = document.getElementById("popup-button-link");
        // shareYtButton.onclick = () => shareYT(track.ID);
        shareYtButton.classList.remove("disabled");
    });
}
function shareYT(trackId) {
    alert("NOT IMPLEMENTED YET"); // ToDo: implement
}
function shareSpotify(trackId) {
    alert("NOT IMPLEMENTED YET"); // ToDo: implement
}
function albumOptions(album) {
    let items = document.getElementsByClassName("popup-button");
    for (let i = 0; i < items.length; i++) {
        items.item(i).classList.remove("disabled");
    }
    let goToAlbum = document.getElementById("popup-button-album");
    goToAlbum.classList.add("disabled");
    // show the album options
    popupOverlay.classList.add('active');
    let top = document.createElement("div");
    top.classList.add("song-item", "track-item");
    let image = document.createElement("img");
    image.src = album.SmallImage || testImage;
    image.alt = "Song image";
    image.classList.add("song-img");
    let title = document.createElement("div");
    title.classList.add("song-title");
    title.textContent = album.Title;
    let artist = document.createElement("div");
    artist.classList.add("song-artist");
    artist.textContent = `${album.ArtistsNames}`;
    let details = document.createElement("div");
    details.classList.add("song-details");
    details.appendChild(title);
    details.appendChild(artist);
    top.appendChild(image);
    top.appendChild(details);
    let addToPlaylistButton = document.getElementById("popup-button-playlist");
    addToPlaylistButton.onclick = () => addToPlaylist(album.ID, "album");
    let songinfo = document.getElementById("popupSongInfo");
    songinfo.innerHTML = "";
    songinfo.appendChild(top);
}
function artistOptions(artist) {
    // show the artist options
    let items = document.getElementsByClassName("popup-button");
    for (let i = 0; i < items.length; i++) {
        items.item(i).classList.remove("disabled");
    }
    let goToAlbum = document.getElementById("popup-button-album");
    goToAlbum.classList.add("disabled");
    let goToArtist = document.getElementById("popup-button-artist");
    goToArtist.classList.add("disabled");
    let addToPlaylistButton = document.getElementById("popup-button-playlist");
    addToPlaylistButton.onclick = () => addToPlaylist(artist.ID, "artist");
    // show the artist options
    popupOverlay.classList.add('active');
    let top = document.createElement("div");
    top.classList.add("song-item", "track-item");
    let image = document.createElement("img");
    image.src = artist.Image || testImage;
    image.alt = "Song image";
    image.classList.add("song-img");
    let title = document.createElement("div");
    title.classList.add("song-title");
    title.textContent = artist.Name;
    let details = document.createElement("div");
    details.classList.add("song-details");
    details.appendChild(title);
    top.appendChild(image);
    top.appendChild(details);
    let songinfo = document.getElementById("popupSongInfo");
    songinfo.innerHTML = "";
    songinfo.appendChild(top);
}
function goToAlbum(albumId) {
    return __awaiter(this, void 0, void 0, function* () {
        const albumTracks = yield getAlbumTracks(albumId);
        yield getAlbum(albumId).then(function (album) {
            return __awaiter(this, void 0, void 0, function* () {
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });
                searchBar.value = '';
                searchBar.classList.remove('active');
                let searchTab = document.getElementById('search-container');
                searchTab.classList.remove('active');
                popupOverlay.classList.remove('active');
                let albumTab = document.getElementById("album-tab");
                albumTab.setAttribute("data-id", albumId);
                albumTab.classList.add('active');
                let albumTitle = document.getElementById("album-title");
                albumTitle.innerHTML = album[0].Title;
                let albumSubtitle = document.getElementById("album-subtitle");
                albumSubtitle.innerHTML = parseReleaseDate(album[0].ReleaseDate);
                let albumImage = document.getElementById("album-image");
                albumImage.src = album[0].Image;
                // get all tracks and make track cards
                let albumTracksContainer = document.getElementById("album-songs");
                albumTracksContainer.innerHTML = "";
                for (const track of albumTracks) {
                    let trackCard = yield makeItemCard(track, albumId, false, false, true);
                    albumTracksContainer.appendChild(trackCard);
                }
            });
        });
    });
}
function parseReleaseDate(releaseDate) {
    // turn releaseDate into a string
    let strreleaseDate = releaseDate.toString();
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
function goToArtist(artistId) {
    return __awaiter(this, void 0, void 0, function* () {
        getArtist(artistId).then(function (artist) {
            getArtistAlbums(artistId).then(function (artistAlbums) {
                document.querySelectorAll('.tab-content').forEach(tab => {
                    tab.classList.remove('active');
                });
                searchBar.value = '';
                searchBar.classList.remove('active');
                let searchContainer = document.getElementById('search-container');
                searchContainer.classList.remove('active');
                popupOverlay.classList.remove('active');
                let artistTab = document.getElementById("artist-tab");
                artistTab.setAttribute("data-id", artistId);
                artistTab.classList.add('active');
                let artistName = document.getElementById("artist-name");
                artistName.innerHTML = artist[0].Name;
                let artistImageDiv = document.getElementById("artist-image");
                artistImageDiv.src = artist[0].Image || artist[0].SmallImage || testImage;
                artistTab.setAttribute("data-id", artistId);
                // get all tracks and make track cards
                let artistAlbumsContainer = document.getElementById("artist-albums");
                artistAlbumsContainer.innerHTML = "";
                // sort by release date
                artistAlbums.sort((a, b) => new Date(b.ReleaseDate).getTime() - new Date(a.ReleaseDate).getTime());
                artistAlbums.forEach(function (album) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let albumCard = yield makeItemCard(album, null, false);
                        artistAlbumsContainer.appendChild(albumCard);
                    });
                });
            });
        });
    });
}
function addToPlaylist(trackId, type = "track") {
    if (!trackId) {
        console.error("Adding null to playlist");
        return;
    }
    const playlistOverlay = document.getElementById("playlistOverlay");
    playlistOverlay.classList.add('active');
    // remove the previous overlay
    popupOverlay.classList.remove('active');
    // clear the input field
    const playlistInput = document.getElementById("playlist-name-input");
    playlistInput.value = "";
    const playlistContainer = document.getElementById("playlist-container");
    playlistContainer.innerHTML = ""; // clear the container
    playlistContainer.setAttribute("data-track-id", trackId);
    playlistContainer.setAttribute("data-type", type);
    // get playlists
    getPlaylists().then(function () {
        return __awaiter(this, void 0, void 0, function* () {
            // loop through userPlaylists and create cards for each playlist
            for (const value of userPlaylists.values()) {
                let top = document.createElement("div");
                top.classList.add("song-item", "playlist-item", "max-width");
                let image = yield getPlaylistImage(value.ID);
                let title = document.createElement("div");
                title.classList.add("song-title");
                title.textContent = value.Title;
                let username = document.createElement("div");
                username.classList.add("song-artist");
                username.textContent = `Owner: ${value.Username}`;
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
                        if (type === "artist") {
                            // add all tracks from artist to playlist
                            getArtistAlbums(trackId).then(function (albums) {
                                for (const album of albums) {
                                    getAlbumTracks(album.ID).then(function (tracks) {
                                        return __awaiter(this, void 0, void 0, function* () {
                                            for (const track of tracks) {
                                                addTrackToPlaylist(value.ID, track.ID);
                                            }
                                        });
                                    });
                                }
                            });
                        }
                        else if (type === "album") {
                            // add all tracks from album to playlist
                            getAlbumTracks(trackId).then(function (tracks) {
                                return __awaiter(this, void 0, void 0, function* () {
                                    for (const track of tracks) {
                                        addTrackToPlaylist(value.ID, track.ID);
                                    }
                                });
                            });
                        }
                        else {
                            // add single track to playlist
                            addTrackToPlaylist(value.ID, trackId);
                        }
                    }
                    else {
                        // remove track from playlist
                        console.log(`Removing track ${trackId} from playlist ${value.ID}`);
                    }
                });
                let details = document.createElement("div");
                details.classList.add("song-details");
                details.appendChild(title);
                details.appendChild(username);
                top.appendChild(image);
                top.appendChild(details);
                top.appendChild(checkbox);
                top.setAttribute("data-id", value.ID);
                playlistContainer.appendChild(top);
            }
        });
    });
}
function addTrackToPlaylist(playlistId, trackId) {
    const parameters = new URLSearchParams({
        "playlistID": playlistId,
        "trackIDs": trackId
    });
    makeRequest(url + "/addTrack", parameters, 'POST')
        .then(function () {
        let playlist = userPlaylists.get(playlistId);
        // Ensure playlist.tracks is an array
        if (!Array.isArray(playlist.Tracks)) {
            playlist.Tracks = [];
        }
        // support adding multiple comma-separated IDs
        const idsToAdd = String(trackId).split(',').map(id => id.trim()).filter(id => id !== '');
        // Add ids if not already present
        for (const id of idsToAdd) {
            if (!playlist.Tracks.includes(id)) {
                playlist.Tracks.push(id);
            }
        }
        userPlaylists.set(playlistId, playlist);
    });
}
function createPlaylist(playlistName) {
    return __awaiter(this, void 0, void 0, function* () {
        let parameters = new URLSearchParams({
            "playlistName": playlistName,
        });
        makeRequest(url + "/createPlaylist", parameters, 'POST').then(function (data) {
            if (data["Error"] == null) {
                let playlistId = data["playlistID"];
                const playlistContainer = document.getElementById("playlist-container");
                let trackId = playlistContainer.getAttribute("data-track-id");
                getPlaylists().then(function () {
                    return __awaiter(this, void 0, void 0, function* () {
                        const value = userPlaylists.get(playlistId);
                        // create a new card for the playlist
                        let top = document.createElement("div");
                        top.classList.add("song-item", "playlist-item", "max-width");
                        let image = yield getPlaylistImage(value.ID);
                        let title = document.createElement("div");
                        title.classList.add("song-title");
                        title.textContent = value.Title;
                        let username = document.createElement("div");
                        username.classList.add("song-artist");
                        username.textContent = `Owner: ${value.Username}`;
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
                                addTrackToPlaylist(value.ID, trackId);
                            }
                            else {
                                // remove track from playlist
                                console.log(`Removing track ${trackId} from playlist ${value.ID}`);
                            }
                        });
                        let details = document.createElement("div");
                        details.classList.add("song-details");
                        details.appendChild(title);
                        details.appendChild(username);
                        top.appendChild(image);
                        top.appendChild(details);
                        top.appendChild(checkbox);
                        top.setAttribute("data-id", value.ID);
                        playlistContainer.appendChild(top);
                    });
                });
            }
            else {
                alert("Error creating playlist: " + data["message"]);
            }
        });
        const playlistInput = document.getElementById("playlist-name-input");
        playlistInput.value = ""; // clear the input field
    });
}
function preloadSongs(trackIds) {
    // Preload the audio track
    if (trackIds == null || trackIds.length === 0) {
        return;
    }
    try {
        makeRequest(url + "/loadTracks", new URLSearchParams({
            "id": trackIds.join(","),
        }));
    }
    catch (_a) {
        // This won't catch async errors from makeRequest
        return;
    }
}
function makeRequestForAudio(url_1, parameters_1) {
    return __awaiter(this, arguments, void 0, function* (url, parameters, method = 'GET') {
        // Build the query string
        const query = new URLSearchParams(parameters).toString();
        const fullUrl = `${url}?${query}`;
        const token = localStorage.getItem("access_token");
        try {
            const response = yield fetch(fullUrl, {
                method: method,
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.blob(); // convert the response to a Blob
        }
        catch (error) {
            console.trace("Fetch error:", error);
            throw error;
        }
    });
}
function loadAudio(trackId, audioElement) {
    makeRequestForAudio(url + "/play", {
        "id": trackId,
        "download": true,
    }).then(blob => {
        const audioURL = URL.createObjectURL(blob); // create a blob URL
        audioElement.src = audioURL; // set the audio element's source to the blob URL
    }).catch(err => {
        console.error("Failed to load audio:", err);
    });
}
function shuffleArray(array) {
    let currentIndex = array.length;
    // While there remain elements to shuffle...
    while (currentIndex != 0) {
        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]
        ];
    }
}
function publicPlaylist() {
    const publicButton = document.getElementById('playlist-public-button');
    playlistPublic = !playlistPublic;
    if (playlistPublic) {
        publicButton.innerHTML = '<title>public</title><path d="M17.9,17.39C17.64,16.59 16.89,16 16,16H15V13A1,1 0 0,0 14,12H8V10H10A1,1 0 0,0 11,9V7H13A2,2 0 0,0 15,5V4.59C17.93,5.77 20,8.64 20,12C20,14.08 19.2,15.97 17.9,17.39M11,19.93C7.05,19.44 4,16.08 4,12C4,11.38 4.08,10.78 4.21,10.21L9,15V16A2,2 0 0,0 11,18M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>';
    }
    else {
        publicButton.innerHTML = '<title>public-disabled</title><path d="M22,5.27L20.5,6.75C21.46,8.28 22,10.07 22,12A10,10 0 0,1 12,22C10.08,22 8.28,21.46 6.75,20.5L5.27,22L4,20.72L20.72,4L22,5.27M17.9,17.39C19.2,15.97 20,14.08 20,12C20,10.63 19.66,9.34 19.05,8.22L14.83,12.44C14.94,12.6 15,12.79 15,13V16H16C16.89,16 17.64,16.59 17.9,17.39M11,19.93V18C10.5,18 10.07,17.83 9.73,17.54L8.22,19.05C9.07,19.5 10,19.8 11,19.93M15,4.59V5A2,2 0 0,1 13,7H11V9A1,1 0 0,1 10,10H8V12H10.18L8.09,14.09L4.21,10.21C4.08,10.78 4,11.38 4,12C4,13.74 4.56,15.36 5.5,16.67L4.08,18.1C2.77,16.41 2,14.3 2,12A10,10 0 0,1 12,2C14.3,2 16.41,2.77 18.1,4.08L16.67,5.5C16.16,5.14 15.6,4.83 15,4.59Z"/>';
    }
}
function skipToNextSong() {
    if (queue.length == 0) {
        return;
    }
    // clear current handlers
    // currentAudio.onended = null;
    // currentAudio.onloadedmetadata = null;
    currentAudio.currentTime = 0;
    queueIndex = (queueIndex + 1) % queue.length;
    // swap the audio elements
    // let temp = lastAudio;
    // lastAudio = currentAudio;
    // currentAudio = nextAudio;
    // nextAudio = temp;
    // lastAudio.pause();
    // load the next audio
    // loadAudio(queue[queueIndex + 1 >= queue.length ? 0 : queueIndex + 1],
    // nextAudio);
    loadAudio(queue[queueIndex], currentAudio);
    playQueue();
}
function skipToPreviousSong() {
    if (queue.length == 0) {
        return;
    }
    if (currentAudio.currentTime > 3) {
        // restart the current song
        currentAudio.currentTime = 0;
        currentTime.textContent = formatTime(0);
    }
    else {
        // currentAudio.onended = null;
        // currentAudio.onloadedmetadata = null;
        // swap the audio elements
        // let temp = nextAudio;
        // nextAudio = currentAudio;
        // currentAudio = lastAudio;
        // lastAudio = temp;
        // nextAudio.pause();
        // load the last audio
        // loadAudio(queue[queueIndex - 1 < 0 ? queue.length - 1 : queueIndex - 1], lastAudio);
        queueIndex = (queueIndex - 1 + queue.length) % queue.length;
        loadAudio(queue[queueIndex], currentAudio);
        // go to the previous song
        playQueue();
    }
}
function play(override = null) {
    const playButton = document.getElementsByClassName('play-button');
    if (override != null) {
        isPlaying = override;
    }
    else {
        isPlaying = !isPlaying;
    }
    if (isPlaying) {
        Array.from(playButton).forEach(element => {
            element.innerHTML = '<title>pause</title><path d="M13,16V8H15V16H13M9,16V8H11V16H9M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z" />';
        });
        playInterval = setInterval(updateRunningTime, 500);
        // play the current audio
        if (!currentAudio.ended) {
            if (currentAudio.paused) {
                currentAudio.play();
            }
        }
    }
    else {
        Array.from(playButton).forEach(element => {
            element.innerHTML = '<title>play</title><path d="M10,16.5V7.5L16,12M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />';
        });
        clearInterval(playInterval);
        // pause the current audio
        if (!currentAudio.paused) {
            currentAudio.pause();
        }
    }
}
function playPlaylist(playlistId = null, itemToPlay = null, shuffle = false) {
    if (playlistId == null) {
        playlistId = document.getElementById("playlist-tab").getAttribute("data-id");
    }
    let playlist = userPlaylists.get(playlistId);
    if (playlist == null) {
        return;
    }
    if (playlist.Tracks.length == 0) {
        return;
    }
    currentPlaylistId = playlistId;
    queue = playlist.Tracks.slice();
    if (itemToPlay != null) {
        queueIndex = queue.indexOf(itemToPlay.ID);
    }
    else {
        queueIndex = 0;
    }
    if (shuffle) {
        shuffleArray(queue);
        queueIndex = 0;
    }
    let lastQueueIndex = queueIndex - 1 < 0 ? queue.length - 1 : queueIndex - 1;
    // loadAudio(queue[lastQueueIndex], lastAudio);
    loadAudio(queue[queueIndex], currentAudio);
    // loadAudio(queue[queueIndex + 1], nextAudio);
    playQueue();
}
function playQueue() {
    if (queue.length == 0) {
        return;
    }
    let trackId = queue[queueIndex];
    // preload 4 next songs
    if (queueIndex + 4 >= queue.length) {
        if (queueIndex + 1 < queue.length) {
            preloadSongs(queue.slice(queueIndex + 1, queue.length));
        }
    }
    else {
        preloadSongs(queue.slice(queueIndex + 1, queueIndex + 4));
    }
    playSong(trackId);
}
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
function playSongInQueue(trackId) {
    if (queue.length == 0) {
        return;
    }
    let index = queue.indexOf(trackId);
    if (index === -1) {
        return;
    }
    queueIndex = index;
    let lastQueueIndex = queueIndex - 1 < 0 ? queue.length - 1 : queueIndex - 1;
    // loadAudio(queue[lastQueueIndex], lastAudio);
    loadAudio(queue[queueIndex], currentAudio);
    // loadAudio(queue[queueIndex + 1], nextAudio);
    playQueue();
}
function playAlbum() {
    let albumId = document.getElementById("album-tab").getAttribute("data-id");
    getAlbumTracks(albumId).then(function (tracks) {
        let trackIds = tracks.map(track => track.ID);
        if (trackIds.length == 0) {
            return;
        }
        currentPlaylistId = null;
        queue = trackIds;
        queueIndex = 0;
        let lastQueueIndex = queueIndex - 1 < 0 ? queue.length - 1 : queueIndex - 1;
        // loadAudio(queue[lastQueueIndex], lastAudio);
        loadAudio(queue[queueIndex], currentAudio);
        // loadAudio(queue[queueIndex + 1], nextAudio);
        playQueue();
    });
}
function playSongInAlbum(trackId, albumId) {
    if (albumId == null) {
        albumId = document.getElementById("album-tab").getAttribute("data-id");
    }
    if (albumId == null) {
        return;
    }
    getAlbumTracks(albumId).then(function (tracks) {
        if (tracks.length == 0) {
            return;
        }
        let trackIds = tracks.map(track => track.ID);
        if (trackIds.length == 0) {
            return;
        }
        currentPlaylistId = null;
        queue = trackIds;
        queueIndex = trackIds.indexOf(trackId);
        let lastQueueIndex = queueIndex - 1 < 0 ? queue.length - 1 : queueIndex - 1;
        // loadAudio(queue[lastQueueIndex], lastAudio);
        loadAudio(queue[queueIndex], currentAudio);
        // loadAudio(queue[queueIndex + 1], nextAudio);
        playQueue();
    });
}
function playSongInPlaylist(playlistId, trackId) {
    if (playlistId == null) {
        playlistId = document.getElementById("playlist-tab").getAttribute("data-id");
    }
    let playlist = userPlaylists.get(playlistId);
    if (playlist == null) {
        return;
    }
    if (playlist.Tracks.length == 0) {
        return;
    }
    currentPlaylistId = playlistId;
    if (trackId != null) {
        queueIndex = playlist.Tracks.indexOf(trackId);
    }
    else {
        queueIndex = 0;
    }
    queue = playlist.Tracks.slice(queueIndex, playlist.Tracks.length).concat(playlist.Tracks.slice(0, queueIndex));
    playSongInQueue(trackId);
}
function playSong(trackId) {
    // set the duration etc.
    currentAudio.onended = skipToNextSong;
    currentAudio.pause();
    currentAudio.onloadedmetadata = updateDuration;
    // get track info
    getTracks([trackId]).then(function (track) {
        return __awaiter(this, void 0, void 0, function* () {
            setCurrentlyPlaying(track[0]);
            setCurrentlyPlayingInDevice(track[0]);
        });
    });
    // wait for load
    currentAudio.oncanplaythrough = () => {
        currentAudio.play().catch(error => { console.error("Play error:", error); });
        play(true);
    };
}
function playArtist(artistId) {
    if (artistId == null) {
        artistId = document.getElementById("artist-tab").getAttribute("data-id");
    }
    // get all tracks 
    getArtistAlbums(artistId).then(function (albums) {
        return __awaiter(this, void 0, void 0, function* () {
            // for each album, get the tracks
            let trackIds = [];
            for (const album of albums) {
                const albumTracks = yield getAlbumTracks(album.ID);
                for (const track of albumTracks) {
                    trackIds.push(track.ID);
                }
            }
            if (trackIds.length == 0) {
                return;
            }
            // shuffle the tracks
            shuffleArray(trackIds);
            queue = trackIds;
            queueIndex = 0;
            let lastQueueIndex = queueIndex - 1 < 0 ? queue.length - 1 : queueIndex - 1;
            // loadAudio(queue[lastQueueIndex], lastAudio);
            loadAudio(queue[queueIndex], currentAudio);
            // loadAudio(queue[queueIndex + 1], nextAudio);
            playQueue();
        });
    });
}
function setCurrentlyPlayingInDevice(track) {
    if (track == null) {
        return;
    }
    if (track.ArtistsNames.join(',') == "") {
        track.ArtistsNames.push("Unknown Artist");
    }
    if ('mediaSession' in navigator) {
        const imageUrl = (track.Image && track.Image.trim()) ? track.Image : (track.SmallImage && track.SmallImage.trim()) ? track.SmallImage : testImage;
        navigator.mediaSession.metadata = new MediaMetadata({
            title: track.Title,
            artist: track.ArtistsNames.join(", "),
            album: track.AlbumName,
            artwork: [
                { src: imageUrl, sizes: '96x96', type: 'image/png' },
                { src: imageUrl, sizes: '128x128', type: 'image/png' },
                { src: imageUrl, sizes: '192x192', type: 'image/png' },
                { src: imageUrl, sizes: '256x256', type: 'image/png' },
                { src: imageUrl, sizes: '384x384', type: 'image/png' },
                { src: imageUrl, sizes: '512x512', type: 'image/png' },
            ]
        });
        navigator.mediaSession.setActionHandler('stop', () => { play(false); });
        navigator.mediaSession.setActionHandler('play', () => { play(true); });
        navigator.mediaSession.setActionHandler('pause', () => { play(false); });
        navigator.mediaSession.setActionHandler('previoustrack', () => { skipToPreviousSong(); });
        navigator.mediaSession.setActionHandler('nexttrack', () => { skipToNextSong(); });
    }
}
// From https://github.com/codewithsadee/music-player/blob/master/assets/js/script.js
const playerDuration = document.querySelector("[data-duration]");
const playerSeekRange = document.querySelector("[data-seek]");
const getTimecode = function (duration) {
    const minutes = Math.floor(duration / 60);
    const seconds = Math.ceil(duration - (minutes * 60));
    const timecode = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    return timecode;
};
const updateDuration = function () {
    playerSeekRange.max = Math.ceil(currentAudio.duration).toString();
    playerDuration.textContent = getTimecode(Number(playerSeekRange.max));
};
const playerRunningTime = document.querySelector("[data-running-time");
const updateRunningTime = function () {
    playerSeekRange.valueAsNumber = currentAudio.currentTime;
    playerRunningTime.textContent = getTimecode(currentAudio.currentTime);
    updateRangeFill();
};
// 1. Cast the NodeList to the correct element type
const ranges = document.querySelectorAll("[data-range]");
const rangeFill = document.querySelector("[data-range-fill]");
const updateRangeFill = function () {
    const element = (this instanceof HTMLInputElement ? this : ranges[0]);
    if (element) {
        const value = parseFloat(element.value);
        const max = parseFloat(element.max) || 100;
        const rangeValue = (value / max) * 100;
        if (rangeFill) {
            rangeFill.style.width = `${rangeValue}%`;
        }
    }
};
for (const range of ranges) {
    range.addEventListener("input", updateRangeFill);
}
updateRangeFill();
const seek = function () {
    currentAudio.currentTime = playerSeekRange.valueAsNumber;
    playerRunningTime.textContent = getTimecode(playerSeekRange.valueAsNumber);
};
playerSeekRange.addEventListener("input", seek);
