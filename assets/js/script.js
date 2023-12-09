// Global Variables
let ytPlayer;

//#region Youtube API
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
async function fetchYoutubeTrailer(userInput) {
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
//#endregion Youtube API

//#region TMDB API
// Function to load the offical trailer on the youtube player
function loadTrailer(videosArr) {
  /* Need to add a validation for the correct video in the array */
  ytPlayer.cueVideoById(videosArr[2].key);
}

// Function to render the movie poster on the page
function renderPoster(posterQueryParam) {
  document.querySelector(
    "#posterImg"
  ).src = `https://image.tmdb.org/t/p/w780${posterQueryParam}`;
}

// Function to fetch the movie detail using the movieId that was retrieved from TMDB
async function fetchTmdbMovieDetail(movieId) {
  // Create an url for API call
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=a3a4488d24de37de13b91ee3283244ec&append_to_response=videos,images,credits,reviews`;

  try {
    let response = await fetch(url);
    let movieDetails = await response.json();
    console.log("movie details: ", movieDetails);

    // Function calls
    loadTrailer(movieDetails.videos.results);
    renderPoster(movieDetails.poster_path);
  } catch (error) {
    console.error(error);
  }
}

// Function to fetch the movieId using the search string from the user
async function fetchTmdbMovieId(userInput) {
  // Create an url for an API call
  const url = `https://api.themoviedb.org/3/search/movie?query=${userInput}&api_key=a3a4488d24de37de13b91ee3283244ec`;

  try {
    const response = await fetch(url);
    const movieData = await response.json();
    console.log("movie search: ", movieData);

    // get the movidId
    /* Might have to add validation for the correct result to use */
    const movieId = movieData.results[0].id;
    console.log("movieId: ", movieId);

    // fetch the movidDetail
    fetchTmdbMovieDetail(movieId);
  } catch (error) {
    console.error(error);
  }
}
//#endregion TMDB API

// Init on DOM ready
(onDOMContentLoaded = () => {
  // DOM selections
  const searchFormEL = document.querySelector("#searchForm");
  const searchInputEl = document.querySelector("#searchInput");

  // Event listener for the search form's submit event
  searchFormEL.addEventListener("submit", (evt) => {
    evt.preventDefault();

    // Get movie name from the user
    const userInput = searchInputEl.value.trim();

    // Change this to modal, can't use alert
    if (!userInput) {
      alert("please enter a valid movie name");
    }
    // Reset the form
    searchInputEl.value = "";

    // fetchYoutubeTrailer(userInput);
    fetchTmdbMovieId(userInput);
  });
})();
