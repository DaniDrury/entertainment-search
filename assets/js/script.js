// DOM selectors
const resultDisplayEl = document.querySelector("#searchResultsContainer");
const landingPageEl = document.querySelector("#landingPage");
const myModal = new bootstrap.Modal(document.getElementById("staticBackdrop"));
const myModalEl = document.getElementById('staticBackdrop');
const modalContentEl = document.querySelector('.modal-content');
const modalh3El = document.querySelector(".modal-header h3");
const modalpEl = document.querySelector(".modal-body p");
const resultListEl = document.getElementById("thumbList");

// Global Variables
let ytPlayer, ytPlayerEl;
const historyArr = JSON.parse(localStorage.getItem("movie")) || [];

//#region Youtube API
// Create the iframe element
function renderYouTubePlayer() {
  ytPlayer = new YT.Player("youtubePlayer", {
    height: "720",
    width: "1280",
    videoId: "",
    playerVars: {
      playsinline: 1,
    },
    events: {
      onReady: () => {
        console.log("YouTube player loaded");
        ytPlayerEl = document.getElementById('youtubePlayer');
        // Hide the video after iframe creation
        ytPlayerEl.setAttribute('hidden', '');
      },
      // 'onStateChange': onPlayerStateChange
    },
  });
}
// Fetch the youtube trailer and display on the iframe
/* async function fetchYoutubeTrailer(userInput) {
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
} */
//#endregion Youtube API

//#region Misc Functions
// Save data to array and localStorage
function saveSearchHistory(selectedData, userCategory) {
  // Save the move to local storage
  historyArr.push({ selectedData, userCategory });
  if (historyArr.length > 6) {
    historyArr.shift();
  }
  localStorage.setItem("movie", JSON.stringify(historyArr));
  renderSearchHistory();
}

// function to render the search history
function renderSearchHistory() {
  const searchHistoryEL = document.querySelector("#searchHistory ul");
  searchHistoryEL.innerHTML = "";

  console.log("search history: ", historyArr);

  if (historyArr.length !== 0) {
    document.querySelector("#searchHistory p").textContent = "Previous Searches:";
  }

  for (let i = 0; i < historyArr.length; i++) {
    // current saved data in the history array
    const { selectedData, userCategory } = historyArr[i];
    const { poster_path, profile_path } = selectedData;

    // Check if the image exist, if not render a placeholder
    let imgUrl =
      poster_path || profile_path
        ? `https://image.tmdb.org/t/p/w92${poster_path || profile_path}`
        : "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe957375e70239d6abdd549fd7568c89281b2179b5f4470e2e12895792dfa5.svg";

    // Create the Li element with nested img
    const htmlStr = `<li id="history-${i}"><img src="${imgUrl}"></li>`;

    // Insert newest first
    searchHistoryEL.insertAdjacentHTML("afterbegin", htmlStr);

    // event listener for each history in the list
    document.querySelector(`#history-${i}`).addEventListener("click", () => {
      //fetch selected detail
      addHistory(selectedData, userCategory);
    });
  }
}

// Function to load the offical trailer on the youtube player
function loadTrailer(videosArr) {
  // DOM Selectors
  const trailerModalBtnEl = document.getElementById('trailerModalBtn');

  // Show the play trailer button if trailer exist ie. function was called
  trailerModalBtnEl.removeAttribute('hidden');

  // Default to the 1st video in the array
  let trailerKey = videosArr[0].key;

  // Loop through the array for an offical trailer video if exist
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

  // Event listener for play trailer button
  trailerModalBtnEl.addEventListener('click', () => {
    // Check if a video response doesn't exist, hide the player if doesn't
    // Redundancy because the button shouldn't render if no trailer.
    if (videosArr.length === 0) {
      ytPlayerEl.setAttribute("hidden", "");
      return;
    }

    // reset the modal and show the youtube player
    resultListEl.textContent = '';
    ytPlayerEl.removeAttribute("hidden");

    modalContentEl.style = 'background-color: black; width: min-content; transform: translate(-30%,0);'
    myModal.show();

    ytPlayer.playVideo();
  });
}

// Function to render the movie poster on the page
function renderPoster(posterQueryParam) {
  // Check if the image exist, if not render a placeholder
  document.querySelector("#posterImg").src = posterQueryParam
    ? `https://image.tmdb.org/t/p/w342${posterQueryParam}`
    : `https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe957375e70239d6abdd549fd7568c89281b2179b5f4470e2e12895792dfa5.svg`;
}

// Function to render the rating of Movie/Tv show
function renderRating(ratingsArr) {
  // DOM selectors
  const ratingEl = document.querySelector("#rating");


  for (let i = 0; i < ratingsArr.length; i++) {
    // Destructuring ratings object
    let { rating, iso_3166_1, release_dates } = ratingsArr[i];

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

// Function to render cast & crew credits for Person searches
function renderPersonCredits(creditsObj) {
  // DOM selectors
  const castUl = document.getElementById("castList");
  const crewUl = document.getElementById("crewList");

  // deconstruct credits into cast & crew
  let { cast, crew } = creditsObj;

  // Sort the cast and crew by newest releases
  cast.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
  crew.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));

  // hiding either cast or crew UL element if no associated responses
  if (cast.length === 0) {
    castUl.setAttribute("hidden", "");
  }
  if (crew.length === 0) {
    crewUl.setAttribute("hidden", "");
  }

  // limiting responses to 10
  let limit = 10;

  // Rendering cast credits
  castUl.insertAdjacentHTML("beforeBegin", "<h3>Cast Credits: </h3>");
  for (let i = 0; i < cast.length && i < limit; i++) {
    // deconstruct cast object & create Li elements
    const { character, id, media_type, title, release_date, poster_path } =
      cast[i];
    const imgUrl = `https://image.tmdb.org/t/p/w92${poster_path}`;

    // skip responses where there's no poster
    if (!poster_path) {
      limit++;
      continue;
    }

    // create list item for each cast credit
    const htmlStr = `<li id="cast-${id}">
      <img src="${imgUrl}" alt="${title} Movie Poster">
      <p>${title}</p>
      <p>Character: ${character}</p>
    </li>`;
    castUl.insertAdjacentHTML("beforeend", htmlStr);

    document.getElementById(`cast-${id}`).addEventListener("click", () => {
      // Save the move to local storage
      //fetch selected detail
      fetchTmdbSelectedDetail(id, media_type);
    });
  }

  // reset limit to 10 before crew credits
  limit = 10;

  // create crewArray for purposes of looking for duplicate credits
  let crewArray = crew[0] ? [crew[0]] : [];

  // deconstruct crew object & get 10 crew credits - combining duplicates into one listing with multiple jobs
  for (let i = 1; i < crew.length && i < limit; i++) {
    const { job, title, poster_path } = crew[i];
    let skip = false;

    // look for duplicate title credits - combine job data to first title credit
    crewArray.forEach((el) => {
      if (el.title === title) {
        el.job += ", " + job;
        skip = true;
      }
    });

    // skips adding duplicate credits to crewArray or skips if no poster
    if (!poster_path || skip) {
      limit++;
      continue;
    }
    // add crew credit to crewArray if not a duplicate
    crewArray.push(crew[i]);
  }

  crewUl.insertAdjacentHTML("beforeBegin", "<h3>Crew Credits: </h3>");
  // deconstruct crewArray objects and create li items for each
  crewArray.forEach((el) => {
    const { job, title, release_date, id, media_type, poster_path } = el;
    const imgUrl = `https://image.tmdb.org/t/p/w92${poster_path}`;

    const htmlStr = `<li id="crew-${id}">
      <img src="${imgUrl}" alt="${title} Movie Poster">
      <p>${title}</p>
      <p>Job: ${job}</p>
    </li>`;

    crewUl.insertAdjacentHTML("beforeend", htmlStr);

    document.getElementById(`crew-${id}`).addEventListener("click", () => {
      // Save the move to local storage
      //fetch selected detail
      fetchTmdbSelectedDetail(id, media_type);
    });
  });
}

// Function to render the cast list and listen to click on their name to give more detail on them.
function renderMovieTvCastList(cast) {
  const castListEl = document.querySelector("#castList");
  castListEl.insertAdjacentHTML("beforeBegin", "<h3>Cast: </h3>");
  // Display only 10 cast members
  for (let i = 0; i < 10 && i < cast.length; i++) {
    const imgUrl = cast[i].profile_path ? `https://image.tmdb.org/t/p/w92${cast[i].profile_path}`
    : `https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe957375e70239d6abdd549fd7568c89281b2179b5f4470e2e12895792dfa5.svg`;
    
    const htmlStr =
      `<li class="col align-center" id="cast-${i}">
        <img src="${imgUrl}">
        <p>${cast[i].name}</p>
        <p>${cast[i].character}</p>
      </li>`;
    castListEl.insertAdjacentHTML("beforeend", htmlStr);

    // Event listener to fetch the detail of the cast
    document.querySelector(`#cast-${i}`).addEventListener("click", () => {
      // Save the move to local storage
      //fetch selected detail
      fetchTmdbSelectedDetail(cast[i].id, "person");
    });
  }
}

// Function to render the seasons list
function renderTvSeasonList(seasons) {
  const tvSeasonsEl = document.querySelector("#directorsOrSeasons");

  tvSeasonsEl.insertAdjacentHTML("beforeBegin", "<h3>Seasons information</h3>");
  for (let i = 1; i < seasons.length; i++) {
    const season = seasons[i];
    const seasonDetailHtml =
      `<li class='col align-center'>
        <p>${season.name}</p>
        <img src="https://image.tmdb.org/t/p/w92${season.poster_path}">
        <p>Episode Count: ${season.episode_count}</p>
      </li>`;
    tvSeasonsEl.insertAdjacentHTML("beforeend", seasonDetailHtml);
  }
}

function renderStreamingOption(providers){
  const insertLi = watchOptions => {
    let liHtmlStr = "";
    for (let i = 0; i<watchOptions.length; i++){ 
      const imgUrl =
      `https://image.tmdb.org/t/p/w45${watchOptions[i].logo_path}`;
      
      liHtmlStr += 
      `<li>
      <img src="${imgUrl}">
      </li>`;

    } 
    return liHtmlStr;

  }

  const streamingListEl = document.querySelector("#streamingList");
  console.log(providers);

  for (key in providers) {
    if( key==="link"){
      continue;
    }
    const watchOptions = providers[key];
    console.log(key, watchOptions);
    const ulHtmlStr = 
      `<h4>${key}</h4>
      <ul>${insertLi(watchOptions)}</ul>
    `
    streamingListEl.insertAdjacentHTML("beforeend", ulHtmlStr);
  }
}
 
function renderMovieDirector(crews){
  const directorEl = document.querySelector("#directorsOrSeasons");

  const result = crews.filter((crew) => crew.job ==='Director');
 
  directorEl.insertAdjacentHTML("beforebegin","<h3>Director:</h3>");

  for(let i=0; i<result.length ;i++){
    const imgUrl =`https://image.tmdb.org/t/p/w92${result[i].profile_path}`;
    const htmlStr = 
    `<li>
     <img src="${imgUrl}">
     <p>${result[i].name}</p>
    </li>`;
    
    directorEl.insertAdjacentHTML("beforeend",htmlStr);
  }
}

// Main rendering function
function renderDetails(selectedData, userCategory) {
  // DOM selectors
  const selectedDetailEL = document.querySelector("#selectedDetail");
  const playerAndStreamEl = document.querySelector("#playerAndStream");
 
  // Reset the element
  selectedDetailEL.innerHTML = "";

  // Destructure the selectedData object
  const { 
    ["watch/providers"] :providers,
    poster_path,
    profile_path,
    title,
    name,
    overview,
    release_date,
    first_air_date,
    credits,
    videos,
    release_dates,
    content_ratings,
    seasons
  } = selectedData;

  // Render the profile/poster for user selected choice
  renderPoster(poster_path || profile_path);

  // render different details depending on search category (movie, tv or person)
  // render Movie/TV details
  if (userCategory !== "person") {
    // resets visibility of video & streaming options elements (if display set to none due to previous person search)
    playerAndStreamEl.removeAttribute("hidden");

    // insert HTML creating Movie/TV Detail elements
    const htmlStr = `<h2>${title || name}</h2>
        <h3>Plot Summary</h3>
        <p>${overview}</p>
        <h3>Release Date: <span>${release_date || first_air_date}</span></h3>
        <h3>Rating: <span id="rating"></span></h3>
        <ul id="castList" class="row"></ul>
        <ul id="directorsOrSeasons" class="row"></ul>`;

    // Append the detail onto the page
    selectedDetailEL.insertAdjacentHTML("beforeend", htmlStr);

    renderMovieTvCastList(credits.cast);
    loadTrailer(videos.results);
    if (userCategory==="movie"){
      renderMovieDirector(credits.crew);                   
    }
    // Render either the seasons list or directors list
    // depending on TV or Movie
    if (userCategory === "tv") {
      // renderSeasonList(selectedData.seasons);
    } else {
      // renderDirectorList();
    }

    // Get the right response data for the rating
    const ratings =
      userCategory === "movie"
        ? release_dates.results
        : content_ratings.results;
    renderRating(ratings, userCategory);

    if (seasons) {
      renderTvSeasonList(seasons);
    }

    //console.log("Providers", providers);
    if(providers.results.US){
      renderStreamingOption(providers.results.US)
    }
    // render Person details
  } else {
    // sets visibility of video and streaming options elements to none
    playerAndStreamEl.setAttribute("hidden", "");

    // insert HTML creating Person Detail elements
    const htmlStr = `<h2>${selectedData.name}</h2>
        <h3>Biography</h3>
        <p>${selectedData.biography}</p>
        <h3>Birthday: <span>${selectedData.birthday}</span></h3>
        <h3>Place of Birth: <span>${selectedData.place_of_birth}</span></h3>
        <ul id="castList" class="row"></ul>
        <ul id="crewList" class="row"></ul>`;

    // Append the detail onto the page
    selectedDetailEL.insertAdjacentHTML("beforeend", htmlStr);

    renderPersonCredits(selectedData.combined_credits);
  }

  // Hide landing page and show result page
  landingPageEl.setAttribute("hidden", "");
  resultDisplayEl.removeAttribute("hidden");
}

//#endregion Misc Functions

//#region TMDB API
// Function to fetch the movie detail using the movieId that was retrieved from TMDB
function addHistory(selectedData, userCategory) {
  // Set the parameters for the page history to come back to
  const stateHistory = {
    page: history.state.page + 1,
    selectedData,
    userCategory,
  };

  // Add popstate history
  history.pushState(stateHistory, "", "");
  // console.log("pushState: ", stateHistory);

  // Fetch the selection detail if Id was pass into the function
  if (selectedData) {
    renderDetails(selectedData, userCategory);

    console.log(selectedData);
  }
}

async function fetchTmdbSelectedDetail(selectedId, userCategory) {
  console.log("Fetch selected data");
  // Create an url for API call
  const url = `https://api.themoviedb.org/3/${userCategory}/${selectedId}?api_key=a3a4488d24de37de13b91ee3283244ec&append_to_response=videos,images,credits,content_ratings,combined_credits,external_ids,watch/providers,release_dates`;

  try {
    const response = await fetch(url);
    const selectedData = await response.json();
    console.log(`${userCategory} details: `, selectedData);

    // Save reponse data to localStorage and add to history
    saveSearchHistory(selectedData, userCategory);
    addHistory(selectedData, userCategory);
  } catch (error) {
    console.error(error);
  }
}

// function to display top 5 results of search - allow user to select specific one
function displayTop5(results, userCategory) {
  // reset modal
  resultListEl.innerHTML = "";
  modalpEl.textContent = "";

  modalh3El.textContent = `Choose the Specific ${userCategory.toUpperCase()}`;
  console.log(results);

  // create and append 5 possible matches to user query
  for (let i = 0; i < 5 && i < results.length; i++) {
    // Deconstruct result object
    const {
      name,
      original_title,
      profile_path,
      poster_path,
      release_date,
      first_air_date,
    } = results[i];

    // Result datas
    const nameData = name || original_title;
    const imageUrl = profile_path || poster_path;
    const date = release_date || first_air_date || "N/A";

    // Create the html string to append to the Ul element
    const top5Str = `<li id="thumbnail-${i}">
      <div class="card">
        <h3>${nameData}</h3>
        <img src="https://image.tmdb.org/t/p/w92${imageUrl}">
        <p>Release Date: ${date}</p>
      </div>
    </li>`;
    // Append the html string to the end of the Ul element
    resultListEl.insertAdjacentHTML("beforeend", top5Str);

    // add eventlistener to each li item for user to select then pass that specific movie id to fetchTmdbMovieDetail function
    document.querySelector(`#thumbnail-${i}`).addEventListener("click", () => {
      let selectedId = results[i].id;
      // Reset the modal list
      resultListEl.innerHTML = "";

      //fetch selected detail
      fetchTmdbSelectedDetail(selectedId, userCategory);

      // Hide the modal after user picked a movie from 5 results
      myModal.hide();
    });
  }
  // Display the modal to the user
  myModal.show();
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

      // If there's only one result
    } else if (responseData.results.length === 0) {
        // reset modal
        resultListEl.innerHTML = "";
  
        modalh3El.textContent = "Warning";
        modalpEl.innerHTML =
          "Could not find any exact matches - please check your spelling!";
        myModal.show();
        return;
    }
    else {
      //fetch selected detail
      fetchTmdbSelectedDetail(responseData.results[0].id, userCategory);
    }
  } catch (error) {
    console.error(error);
  }
}
//#endregion TMDB API

//#region Inits
// Init on DOM ready
addEventListener("DOMContentLoaded", () => {
  // DOM selections
  const searchFormEL = document.querySelector("#searchForm");
  const searchSelectEl = document.querySelector("#mediaSelect");
  const searchInputEl = document.querySelector("#searchInput");

  // Render history list from localStorage
  renderSearchHistory();

  // Start page history on load
  // 2 history states for landind page to be use in conditional
  history.pushState({ page: 0 }, "", "");
  addHistory();

  // Event listener for the search form's submit event
  searchFormEL.addEventListener("submit", (evt) => {
    evt.preventDefault();

    // Get movie name from the user
    const userCategory = searchSelectEl.value;
    const userInput = searchInputEl.value.trim();

    // Reset the form
    searchSelectEl.value = "";
    searchInputEl.value = "";

    // Change this to modal, can't use alert
    if (!userInput || !userCategory) {
      // reset the modal
      resultListEl.innerHTML = "";

      // Set the modal for warning
      modalh3El.textContent = "Warning";
      modalpEl.innerHTML =
        "Please enter a <strong>Search Category</strong> AND a valid <strong>Title</strong> or <strong>Person Name</strong>";
      myModal.show();
      return;
    }

    // fetchYoutubeTrailer(userInput);
    fetchTmdbId(userCategory, userInput);
  });

  // Reset the modal when it closes
  myModalEl.addEventListener('hide.bs.modal', () => {
    ytPlayer.pauseVideo();
    ytPlayerEl.setAttribute('hidden', '');
    modalContentEl.style.removeProperty("background-color");
    modalContentEl.style.removeProperty("width");
    modalContentEl.style.removeProperty("transform");
    modalpEl.textContent = '';
    modalh3El.textContent = '';
    resultListEl.textContent = '';
  });
});

// Init onLoad
addEventListener("load", () => {
  // Load the youtube player
  renderYouTubePlayer();

  // history doesn't remember scoll location
  history.scrollRestoration = "manual";
});

// Event listener on history state change
addEventListener("popstate", () => {
  // debug log
  // console.log("Back to: ", history.state);

  // Deconstruct history.state object
  const { selectedData, userCategory } = history.state;

  // If went to the landing page, display the landing page
  if (history.state.page === 1) {
    landingPageEl.removeAttribute("hidden");
    resultDisplayEl.setAttribute("hidden", "");

    // If you went back passed the 2nd state for landing page go forward
  } else if (history.state.page < 1) {
    setTimeout(() => {
      history.forward();
    }, 20);

    // Fetch the selected data of current history page
  } else {
    renderDetails(selectedData, userCategory);
  }
});
//#endregion Inits
