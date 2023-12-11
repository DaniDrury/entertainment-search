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

//#region Misc Functions
// Save data to array and localStorage
function saveResponse(tmdbData, userCategory) {
  // Save the move to local storage
  historyArr.push({ tmdbData, userCategory });
  if (historyArr.length > 10) {
    historyArr.shift();
  }
  localStorage.setItem("movie", JSON.stringify(historyArr));
  renderSearchHistory();
}

// function to render the search history
function renderSearchHistory() {
  const searchHistoryEL = document.querySelector("#searchHistory");
  searchHistoryEL.innerHTML = "";

  for (let i = 0; i < historyArr.length; i++) {
    // current saved data in the history array
    const historyData = historyArr[i];

    const htmlStr = `<li id="history-${i}"><img src="https://image.tmdb.org/t/p/w92${
      historyData.tmdbData.poster_path || historyData.tmdbData.profile_path
    }"></li>`;

    // Insert newest first
    searchHistoryEL.insertAdjacentHTML("afterbegin", htmlStr);

    // event listener for each history in the list
    document.querySelector(`#history-${i}`).addEventListener("click", () => {
      const selectedId = historyData.tmdbData.id;

      //fetch selected detail
      fetchTmdbSelectedDetail(selectedId, historyData.userCategory);
    });
  }
}

// Function to load the offical trailer on the youtube player
function loadTrailer(videosArr) {
  // Default to the 1st video in the array
  let trailerKey = videosArr[0].key;

  for (let i = 0; i < videosArr.length; i++) {
    // Destructuring video object
    const { name, key } = videosArr[i];

    // Check if video name have "trailer" and doesn't have "teaser" in it.
    if (
      name.toUpperCase().includes("TRAILER") &&
      !name.toUpperCase().includes("TEASER")
    ) {
      trailerKey = key;
      // If the video name have trailer and official in it, use it and break the loop
      if (name.toUpperCase().includes("OFFICIAL")) {
        trailerKey = key;
        // Exit the for loop if a trailer was found
        break;
      }
    }
  }

  // Cue up the trailer video in the YouTube player
  ytPlayer.cueVideoById(trailerKey);
}

// Function to render the movie poster on the page
function renderPoster(posterQueryParam) {
  document.querySelector(
    "#posterImg"
  ).src = `https://image.tmdb.org/t/p/w780${posterQueryParam}`;
}

// Function to render the rating of Movie/Tv show
function renderRating(ratings) {
  const ratingEl = document.querySelector("#rating");

  for (let i = 0; i < ratings.length; i++) {
    // Destructuring ratings object
    let { rating, iso_3166_1, release_dates } = ratings[i];

    // Check for US rating
    if (iso_3166_1 === "US") {
      // If rating doesn't exist, ie. this is a call from a movie selection
      // Loop through the release_dates array for the rating
      if (!rating) {
        release_dates.forEach((obj) => {
          rating = obj.certification;
        });
      }
      // Render the rating on the page and quit the function
      ratingEl.textContent = rating;
      return;
    }
  }
  // Default rating value if nothing was found
  ratingEl.textContent = "N/A";
}

// Function to render the cast list and listen to click on their name to give more detail on them.
function renderCastList(cast) {
  const castListEl = document.querySelector("#castList");
  castListEl.innerHTML = "Cast: ";

  // Display only 10 cast members
  for (let i = 0; i < 10 && i < cast.length; i++) {
    const htmlStr = `<li id="cast-${i}"><a>${cast[i].name} as ${cast[i].character}</a></li>`;
    castListEl.insertAdjacentHTML("beforeend", htmlStr);

    // Event listener to fetch the detail of the cast
    document.querySelector(`#cast-${i}`).addEventListener("click", () => {
      console.log(cast[i].name);
      // fetchTmdbPersonDetail(cast[i].id);
    });
  }
}

function renderDetails(details, userCategory) {
  const selectedDetailEL = document.querySelector("#selectedDetail");
  const playerAndStreamEl = document.querySelector("#playerAndStream");
  // Reset the element
  selectedDetailEL.innerHTML = "";

  // render different details depending on search category (movie, tv or person)
  let htmlStr = "";

  // render Movie/TV details
  if (userCategory !== "person") {
    // resets visibility of video & streaming options elements (if display set to none due to previous person search)
    playerAndStreamEl.classList.remove("display-none");

    // insert HTML creating Movie/TV Detail elements
    htmlStr = `<h2>${details.title || details.name}</h2>
    <div class="display-flex-column-maybe??">
      <div id="plotSumContainer">
        <h3>Plot Summary</h3>
        <p>${details.overview}</p>
      </div>
      <div id="additionalData">
        <p>Release Date: <span>${
          details.release_date || details.first_air_date
        }</span></p>
        <p>Rating: <span id="rating"></span></p>
        <ul id="directorsOrSeasons"></ul>
        <ul id="castList">Cast: </ul>
      </div>
    </div>`;

    // render Person details
  } else {
    // sets visibility of video and streaming options elements to none
    playerAndStreamEl.classList.add("display-none");

    // insert HTML creating Person Detail elements
    htmlStr = `<h2>${details.name}</h2>
    <div class="display-flex-column-maybe??">
      <div id="personSumContainer">
        <h3>Biography</h3>
        <p>${details.biography}</p>
      </div>
      <div id="additionalData">
        <p>Birthday: <span>${details.birthday}</span></p>
        <p>Place of Birth: <span>${details.place_of_birth}</span></p>
        <ul id="credits">Other Credits: </ul>
      </div>
    </div>`;
  }

  // Append the detail onto the page
  selectedDetailEL.insertAdjacentHTML("beforeend", htmlStr);

  // call renderCastList and renderRating only if movie or tv search category
  if (userCategory !== "person") {
    renderCastList(details.credits.cast);

    // Get the right response data for the rating
    const ratings =
      userCategory === "movie"
        ? details.release_dates.results
        : details.content_ratings.results;
    renderRating(ratings, userCategory);
  }
}
//#endregion Misc Functions

//#region TMDB API
// Function to fetch the movie detail using the movieId that was retrieved from TMDB
async function fetchTmdbSelectedDetail(selectedId, userCategory) {
  // DOM selectors
  const resultDisplayEl = document.querySelector("#searchResultsContainer");
  const landingPageEl = document.querySelector("#landingPage");

  // Create an url for API call
  const url = `https://api.themoviedb.org/3/${userCategory}/${selectedId}?api_key=a3a4488d24de37de13b91ee3283244ec&append_to_response=videos,images,credits,content_ratings,combined_credits,external_ids,watch/providers,release_dates`;

  try {
    const response = await fetch(url);
    const selectedData = await response.json();
    console.log(`${userCategory} details: `, selectedData);

    // Function calls
    renderPoster(selectedData.poster_path || selectedData.profile_path);
    renderDetails(selectedData, userCategory);

    // Load a trailer video from youtube if the category isn't person
    if (userCategory !== "person") {
      loadTrailer(selectedData.videos.results);
    }

    landingPageEl.classList.add("display-none");
    resultDisplayEl.classList.remove("display-none");
  } catch (error) {
    console.error(error);
  }
}

// function to display top 5 results of search - allow user to select specific one
function displayTop5(results, userCategory) {
  const ulEl = document.getElementById("thumbList");
  ulEl.innerHTML = "";

  // create and append 5 possible matches to user query
  for (let i = 0; i < 5 && i < results.length; i++) {
    // Result datas
    const name = results[i].name || results[i].original_title;
    const image = results[i].profile_path || results[i].poster_path;
    const date = results[i].release_date || results[i].first_air_date;

    // Created Elements
    const thumbnail = document.createElement("li");
    const thumbContainer = document.createElement("div");
    thumbContainer.setAttribute("class", "card");
    const thumbTitle = document.createElement("h3");
    const thumbPoster = document.createElement("img");
    const thumbRelease = document.createElement("p");

    thumbTitle.textContent = name;
    thumbPoster.setAttribute("src", "https://image.tmdb.org/t/p/w92" + image);

    if (date) {
      thumbRelease.textContent = "Release Date: " + date;
    } else {
      // or something else?  what do we want to do?
      thumbRelease.setAttribute("display", "none");
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

      // Save the move to local storage
      saveResponse(results[i], userCategory);
      //fetch selected detail
      fetchTmdbSelectedDetail(selectedId, userCategory);
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
    if (responseData.results.length > 1) {
      displayTop5(responseData.results, userCategory);
    } else {
      // Save the move to local storage
      saveResponse(responseData.results[0], userCategory);
      //fetch selected detail
      fetchTmdbSelectedDetail(responseData.results[0].id, userCategory);
    }
  } catch (error) {
    console.error(error);
  }
}
//#endregion TMDB API

// Init on DOM ready
addEventListener("DOMContentLoaded", () => {
  // DOM selections
  const searchFormEL = document.querySelector("#searchForm");
  const searchSelectEl = document.querySelector("#mediaSelect");
  const searchInputEl = document.querySelector("#searchInput");

  // Render history list from localStorage
  renderSearchHistory();

  // Event listener for the search form's submit event
  searchFormEL.addEventListener("submit", (evt) => {
    evt.preventDefault();

    // Get movie name from the user
    const userCategory = searchSelectEl.value;
    const userInput = searchInputEl.value.trim();

    // Change this to modal, can't use alert
    if (!userInput || !userCategory) {
      alert(
        "Please enter a Search Category AND input a valid title or person name"
      );
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
