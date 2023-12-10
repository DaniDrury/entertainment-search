// Global Variables
let ytPlayer;

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

  for (let i = 0; i < 10; i++) {
    const htmlStr = `<li><a>${cast[i].name} as ${cast[i].character}</a></li>`;

    castListEl.insertAdjacentHTML("beforeend", htmlStr);
  }
}

function renderMovieDetail(movieDetails) {
  const movieDetailEL = document.querySelector("#movieDetail");

  // create if / else statement to handle different category data?
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

// Fetch person details
async function fetchTmdbPersonDetail(personId) {
  // DOM selectors
  const resultDisplayEl = document.querySelector("#searchResultsContainer");
  const landingPageEl = document.querySelector("#landingPage");

  // Create an url for API call
  const url = `https://api.themoviedb.org/3/person/${personId}?api_key=a3a4488d24de37de13b91ee3283244ec&append_to_response=images,combined_credits,external_ids`;

  try {
    let response = await fetch(url);
    let personDetails = await response.json();
    console.log("Person details: ", personDetails);

    // Function calls
    // loadTrailer(movieDetails.videos.results);   NO TRAILER FOR PEOPLE Consider replacing with external_id calls to link to IMDb, Facebook, Instagram, TikTok, Twitter, Wikidata, Youtube, etc.
    renderPoster(personDetails.profile_path);
    renderMovieDetail(personDetails);  // again - can we use render Movie Detail or need to make new one? render PERSON detail?

    landingPageEl.classList.add("display-none");
    resultDisplayEl.classList.remove("display-none");
  } catch (error) {
    console.error(error);
  }
}

// Fetch TV Show details
async function fetchTmdbTvDetail(tvId) {
  // DOM selectors
  const resultDisplayEl = document.querySelector("#searchResultsContainer");
  const landingPageEl = document.querySelector("#landingPage");

  // Create an url for API call
  const url = `https://api.themoviedb.org/3/tv/${tvId}?api_key=a3a4488d24de37de13b91ee3283244ec&append_to_response=videos,images,credits,reviews,content_ratings`;

  try {
    let response = await fetch(url);
    let tvDetails = await response.json();
    console.log("TV details: ", tvDetails);

    // Function calls
    loadTrailer(tvDetails.videos.results);
    renderPoster(tvDetails.poster_path);
    renderMovieDetail(tvDetails); // can we use renderMovieDetail function or need to make new renderTvDetail function?

    landingPageEl.classList.add("display-none");
    resultDisplayEl.classList.remove("display-none");
  } catch (error) {
    console.error(error);
  }
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
function displayTop5(userCategory, results) {
  const ulEl = document.getElementById("thumbList");
  ulEl.innerHTML = "";

  // create and append 5 possible matches to user query
  for (let i = 0; i < 5; i++) {
    const name = results[i].name || results[i].original_title;
    const image = results[i].profile_path || results[i].poster_path;
    const date = results[i].release_date || results[i].first_air_date;
    const thumbnail = document.createElement("li");
    const thumbContainer = document.createElement("div");
    thumbContainer.setAttribute("class", "card");
    const thumbTitle = document.createElement("h3");
    const thumbPoster = document.createElement("img");
    const thumbRelease = document.createElement("p");

    thumbTitle.textContent = name;
    thumbPoster.setAttribute(
      "src",
      "https://image.tmdb.org/t/p/w92" + image
    );
    
    if (date) {
      thumbRelease.textContent = "Release Date: " + date;
    } else {
      // or something else?  what do we want to do?
      thumbRelease.setAttribute('display','none')
    }

    thumbContainer.appendChild(thumbTitle);
    thumbContainer.appendChild(thumbPoster);
    thumbContainer.appendChild(thumbRelease);
    thumbnail.appendChild(thumbContainer);

    ulEl.appendChild(thumbnail);

    // add eventlistener to each li item for user to select then pass that specific movie id to fetchTmdbMovieDetail function
    thumbnail.addEventListener("click", (ev) => {
      let selectedId = results[i].id;
      // Reset the modal list
      ulEl.innerHTML = "";

      // fetch the movidDetail
      if (userCategory === 'movie') {
        fetchTmdbMovieDetail(selectedId);
      } else if (userCategory === 'tv') {
        fetchTmdbTvDetail(selectedId);
      } else if (userCategory === 'person') {
        fetchTmdbPersonDetail(selectedId);
      }
    });
  }
}

// Function to fetch the movieId using the search string from the user
async function fetchTmdbId(userCategory, userInput) {
  // Create an url for an API call
  const url = `https://api.themoviedb.org/3/search/${userCategory}?query=${userInput}&page=1&api_key=a3a4488d24de37de13b91ee3283244ec`;

  try {
    const response = await fetch(url);
    const responseData = await response.json();
    console.log(`${userCategory} search: `, responseData);

    // Display top 5 results for user to select the right movie
    displayTop5(userCategory, responseData.results);
  } catch (error) {
    console.error(error);
  }
}
//#endregion TMDB API

// Init on DOM ready
addEventListener("DOMContentLoaded", () => {
  // DOM selections
  const searchFormEL = document.querySelector("#searchForm");
  const searchSelectEl = document.querySelector('#mediaSelect');
  const searchInputEl = document.querySelector("#searchInput");

  // Event listener for the search form's submit event
  searchFormEL.addEventListener("submit", (evt) => {
    evt.preventDefault();

    // Get movie name from the user
    const userCategory = searchSelectEl.value;
    const userInput = searchInputEl.value.trim();

    // Change this to modal, can't use alert
    if (!userInput || !userCategory) {
      alert("Please enter a Search Category AND input a valid title or person name");
    }
    // Reset the form
    searchSelectEl.value = "";
    searchInputEl.value = "";

    // fetchYoutubeTrailer(userInput);
    fetchTmdbId(userCategory, userInput);
  });
});

addEventListener("load", () => {
  renderYouTubePlayer();
});
