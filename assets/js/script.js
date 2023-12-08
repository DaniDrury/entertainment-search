// DOM selections
const searchFormEL = document.querySelector("#searchForm");
const searchInputEl = document.querySelector("#searchInput");

// Global Variables
let ytPlayer;

//#region Functions
// Create the iframe element
function onYouTubeIframeAPIReady() {
  ytPlayer = new YT.Player("trailerContainer", {
    height: "390",
    width: "640",
    videoId: "",
    playerVars: {
      playsinline: 1,
    },
    events: {
      // onReady: onPlayerReady,
      // 'onStateChange': onPlayerStateChange
    },
  });
}
// Fetch the youtube trailer and display on the iframe
async function fetchYoutubeTrailer() {
  const userInput = searchInputEl.value.trim();

  const url = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${userInput}%201%20offical%20trailer&key=AIzaSyAUg-lxn3GSY-w58E4EFURM6w-gOrZmbOw`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    // Get the trailer id
    const videoId = data.items[0].id.videoId;

    // Cue up the trailer video, but doesn't start
    ytPlayer.cueVideoById(videoId);
  } catch (error) {
    alert(error.name);
    console.log(error);
  }
}
/* ---------------------------------------------------------- */

function renderTrailer(data) {
  ytPlayer.cueVideoById(data.videos.results[2].key);
}

function renderPoster(data) {
  const POSTER_PATH = data.poster_path;

  document.querySelector(
    "#posterImg"
  ).src = `https://image.tmdb.org/t/p/w780${POSTER_PATH}`;
}

async function fetchTmdbMovieDetail(movieId) {
  // Create an url for API call
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=a3a4488d24de37de13b91ee3283244ec&append_to_response=videos,images,credits,reviews`;

  try {
    let response = await fetch(url);
    let data = await response.json();
    console.log(data);

    // Function calls
    renderTrailer(data);
    renderPoster(data);
  } catch (error) {
    console.error(error);
  }
}

async function fetchTmdbMovieId() {
  // Get movie name from the user
  const userInput = searchInputEl.value.trim();

  // Change this to modal, can't use alert
  if (!userInput) {
    alert("please enter a valid movie name");
  }
  // Reset the form
  searchInputEl.value = "";

  // Create an url for an API call
  const url = `https://api.themoviedb.org/3/search/movie?query=${userInput}&api_key=a3a4488d24de37de13b91ee3283244ec`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);

    // get the movidId
    const movieId = data.results[0].id;
    console.log(movieId);

    // fetch the movidDetail
    fetchTmdbMovieDetail(movieId);
  } catch (error) {
    console.error(error);
  }
}

// function called on form submission
function sumbitHandler(event) {
  event.preventDefault();

  // fetchYoutubeTrailer();
  fetchTmdbMovieId();
}
//#endregion Functions

// Event Listeners
searchFormEL.addEventListener("submit", sumbitHandler);
