// Global Variables
let ytPlayer;
const historyArr = JSON.parse(localStorage.getItem("movie")) || [];

//#region Youtube API
// Create the iframe element
function renderYouTubePlayer() {
  ytPlayer = new YT.Player("youtubePlayer", {
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
  console.log("YouTube player loaded");
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

// function to render the search history
function renderSearchHistory() {
  const searchHistoryEL = document.querySelector("#searchHistory");
  searchHistoryEL.innerHTML = "";

  for (let i = 0; i < historyArr.length; i++) {
    const movie = historyArr[i];
    const htmlStr = `<li id="history-${i}"><img src="https://image.tmdb.org/t/p/w92${movie.poster_path}"></li>`;

    // Insert newest first
    searchHistoryEL.insertAdjacentHTML("afterbegin", htmlStr);

    // event listener for each history in the list
    document.querySelector(`#history-${i}`).addEventListener("click", () => {
      fetchTmdbMovieDetail(movie.id);
    });
  }
}

//#region TMDB API
// Function to load the offical trailer on the youtube player
function loadTrailer(videosArr) {
  /* Need to add a validation for the correct video in the array */
  ytPlayer.cueVideoById(videosArr[0].key);
}

// Function to render the movie poster on the page
function renderPoster(posterQueryParam) {
  document.querySelector(
    "#posterImg"
  ).src = `https://image.tmdb.org/t/p/w780${posterQueryParam}`;
}

function renderCastList(cast) {
  const castListEl = document.querySelector("#castList");
  castListEl.innerHTML = "";

  for (let i = 0; i < 10; i++) {
    const htmlStr = `<li><a>${cast[i].name} as ${cast[i].character}</a></li>`;

    castListEl.insertAdjacentHTML("beforeend", htmlStr);
  }
}

function renderMovieDetail(movieDetails) {
  const movieDetailEL = document.querySelector("#movieDetail");
  movieDetailEL.innerHTML = "";

  const htmlStr = `<h2>${movieDetails.title}</h2>
    <div class="display-flex-column-maybe??">
      <div id="plotSumContainer">
        <h3>Plot Summary</h3>
        <p>${movieDetails.overview}</p>
      </div>
      <div id="additionalData">
        <p>Release Date: <span>${movieDetails.release_date}</span></p>
        <p>Rating: <span id="rating"></span></p>
        <p>Reviews: <span id="reviews"></span></p>
        <p>Director: <span id="director"></span></p>
        <ul id="castList">Cast: </ul>
      </div>
    </div>`;

  movieDetailEL.insertAdjacentHTML("beforeend", htmlStr);

  renderCastList(movieDetails.credits.cast);
}

// Function to fetch the movie detail using the movieId that was retrieved from TMDB
async function fetchTmdbMovieDetail(movieId) {
  // DOM selectors
  const resultDisplayEl = document.querySelector("#searchResultsContainer");
  const landingPageEl = document.querySelector("#landingPage");

  // Create an url for API call
  const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=a3a4488d24de37de13b91ee3283244ec&append_to_response=videos,images,credits,reviews`;

  try {
    let response = await fetch(url);
    let movieDetails = await response.json();
    console.log("movie details: ", movieDetails);

    // Function calls
    loadTrailer(movieDetails.videos.results);
    renderPoster(movieDetails.poster_path);
    renderMovieDetail(movieDetails);

    landingPageEl.classList.add("display-none");
    resultDisplayEl.classList.remove("display-none");
  } catch (error) {
    console.error(error);
  }
}

// function to display top 5 results of search - allow user to select specific one
function displayTop5(results) {
  const ulEl = document.getElementById("thumbList");
  ulEl.innerHTML = "";

  // create and append 5 possible matches to user query
  for (let i = 0; i < 5; i++) {
    let thumbnail = document.createElement("li");
    let thumbContainer = document.createElement("div");
    thumbContainer.setAttribute("class", "card");
    let thumbTitle = document.createElement("h3");
    let thumbPoster = document.createElement("img");
    let thumbRelease = document.createElement("p");

    thumbTitle.textContent = results[i].original_title;
    thumbPoster.setAttribute(
      "src",
      "https://image.tmdb.org/t/p/w92" + results[i].poster_path
    );
    thumbRelease.textContent = "Release Date: " + results[i].release_date;

    thumbContainer.appendChild(thumbTitle);
    thumbContainer.appendChild(thumbPoster);
    thumbContainer.appendChild(thumbRelease);
    thumbnail.appendChild(thumbContainer);

    ulEl.appendChild(thumbnail);

    // add eventlistener to each li item for user to select then pass that specific movie id to fetchTmdbMovieDetail function
    thumbnail.addEventListener("click", (ev) => {
      let selectedMovieId = results[i].id;
      // Reset the modal list
      ulEl.innerHTML = "";

      // Save the move to local storage
      historyArr.push(results[i]);
      if (historyArr.length > 10) {
        historyArr.shift();
      }
      localStorage.setItem("movie", JSON.stringify(historyArr));
      renderSearchHistory();

      // fetch the movidDetail
      fetchTmdbMovieDetail(selectedMovieId);
    });
  }
}

// Function to fetch the movieId using the search string from the user
async function fetchTmdbMovieId(userInput) {
  // Create an url for an API call
  const url = `https://api.themoviedb.org/3/search/movie?query=${userInput}&page=1&api_key=a3a4488d24de37de13b91ee3283244ec`;

  try {
    const response = await fetch(url);
    const movieData = await response.json();
    console.log("movie search: ", movieData);

    // Display top 5 results for user to select the right movie
    displayTop5(movieData.results);
  } catch (error) {
    console.error(error);
  }
}
//#endregion TMDB API

// Init on DOM ready
addEventListener("DOMContentLoaded", () => {
  // DOM selections
  const searchFormEL = document.querySelector("#searchForm");
  const searchInputEl = document.querySelector("#searchInput");

  // Render history list from localStorage
  renderSearchHistory();

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
});

addEventListener("load", () => {
  renderYouTubePlayer();
});
