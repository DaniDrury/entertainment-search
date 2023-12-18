// Global DOM selectors
const DOM_SELECTORS = {
  resultDisplayEl: document.getElementById("searchResultsContainer"),
  landingPageEl: document.getElementById("landingPage"), 

  ytPlayerEl : document.getElementById('youtubePlayer'),
  
  myModalEl : document.getElementById('staticBackdrop'),
  modalContentEl : document.querySelector('.modal-content'),
  modalHeaderEl : document.querySelector(".modal-header h2"),
  modalTextEl : document.querySelector(".modal-body > p"),
  modalListEl: document.getElementById("thumbList"),
};

// Global Variables
const historyArr = JSON.parse(localStorage.getItem("movie")) || [];
const myModal = new bootstrap.Modal(DOM_SELECTORS.myModalEl);
let ytPlayer;
const MODAL_MAX_WIDTH = '60vw';

// Change this to true when debugging / testing
const IS_DEBUGGING = false;


//#region Youtube API

// Create the iframe element
function renderYouTubePlayer() {
  // Function to resize the YouTube player
  const playerResize = () => {
    DOM_SELECTORS.ytPlayerEl.style.height = `min(${(window.innerWidth * .9) * 9 / 16}px, 720px)`;
    DOM_SELECTORS.ytPlayerEl.style.width = `min(${window.innerWidth * .9}px, 1280px)`;
  };

  ytPlayer = new YT.Player("youtubePlayer", {
    height: `480`,
    width: `640`,
    videoId: "",
    playerVars: {
      playsinline: 1,
    },
    events: {
      onReady: () => {
        // Log out that the YouTube player load correctly
        console.log("YouTube player loaded");

        // Add youtube element selector to the global DOM_SELECTORS object
        DOM_SELECTORS.ytPlayerEl = document.getElementById('youtubePlayer');
        // Hide the video after iframe creation
        DOM_SELECTORS.ytPlayerEl.setAttribute('hidden', '');

        // resize youtube player size on window resize
        addEventListener("resize", () => {
          playerResize();
        });
      },
      'onStateChange': playerResize()
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
  // Save user selection objects into history array
  historyArr.push({ selectedData, userCategory });

  // Limit to showing 9 search history
  if (historyArr.length > 9) {
    historyArr.shift();
  }
  // Save search history to local storage and render it on the page
  localStorage.setItem("movie", JSON.stringify(historyArr));
  renderSearchHistory();
}

// function to render the search history
function renderSearchHistory() {
  // DOM selectors
  const searchHistoryListEl = document.querySelector("#searchHistory ul");
  searchHistoryListEl.innerHTML = "";

  // Hide the text Previous Searches if no search history
  if (historyArr.length !== 0) {
    document.querySelector("#searchHistory p").textContent = "Previous Searches:";
  }

  for (let i = 0; i < historyArr.length; i++) {
    // Deconstruct the objects
    const { selectedData, userCategory } = historyArr[i];
    const { poster_path, profile_path, still_path } = selectedData;

    // Check if the image exist, if not render a placeholder
    let imgUrl =
      poster_path || profile_path || still_path
        ? `https://image.tmdb.org/t/p/w92${poster_path || profile_path || still_path}`
        : "https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe957375e70239d6abdd549fd7568c89281b2179b5f4470e2e12895792dfa5.svg";

    // Create the Li element with nested img
    const htmlStr = `
      <li id="history-${i}">
        <img src="${imgUrl}" class='historyItem'>
      </li>`;

    // Insert newest first
    searchHistoryListEl.insertAdjacentHTML("afterbegin", htmlStr);

    // event listener for each history in the list
    document.getElementById(`history-${i}`).addEventListener("click", () => {
      //fetch selected detail
      addHistory(selectedData, userCategory);
      if (IS_DEBUGGING) {
        console.log(`Search history: selected ${userCategory} details: `, selectedData);
      }
    });
  }
}

// Main rendering function
function renderDetails(selectedData, userCategory, seriesData) {
  // DOM selectors
  const selectedDetailEL = document.getElementById("selectedDetail");
  const playerAndStreamEl = document.getElementById("playerAndStream");
  const posterImgEl = document.getElementById("posterImg");
  const collectionEl = document.querySelector('#collection');

  //#region Local Functions

  // Function to load the offical trailer on the youtube player
  const loadTrailer = (videosArr) => {
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
      // Show the youtube player
      DOM_SELECTORS.ytPlayerEl.removeAttribute("hidden");
  
      // Style the modal for the player
      DOM_SELECTORS.modalContentEl.style = 'background-color: black; width: min-content;'
      DOM_SELECTORS.modalContentEl.parentElement.style.maxWidth = 'min-content';
  
      // Start the video when modal open
      myModal.show();
      ytPlayer.playVideo();
    });
  }

  // Function to render the rating of Movie/Tv show
  const renderRating = (ratingsArr) => {
    // DOM selectors
    const ratingEl = document.querySelector("#rating");

    // Loop through the rating array for the correct rating
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
        ratingEl.textContent = `${rating}`;
      }
    }
  }
 
  // Function to render the seasons list
  const renderTvSeasonList = () => {
    // DOM selectors
    const tvSeasonsEl = document.querySelector("#seasonsList");

    // Create a season information heading before the list
    tvSeasonsEl.insertAdjacentHTML("beforeBegin", "<h3>Seasons information</h3>");
    for (let i = 1; i < seasons.length; i++) {
      // Deconstruct season object
      const { name, poster_path, episode_count, season_number } = seasons[i];

      const seasonDetailHtml =
        `<li class='col align-center'>
          <p>${name}</p>
          <img id="seasonListItem-${i}" src="https://image.tmdb.org/t/p/w92${poster_path}">
          <p>Episode Count: ${episode_count}</p>
        </li>`;
      tvSeasonsEl.insertAdjacentHTML("beforeend", seasonDetailHtml);

      // Event listener for click on the poster
      document.querySelector(`#seasonListItem-${i}`).addEventListener('click', () => {
        fetchTmdbSeasonDetail(selectedId, season_number)
      });
    }
  }

  // Function to render the director list and listen to click on their image to give more detail on them.
  const renderMovieDirector = (crewsArr) => {
    // DOM selector
    const directorEl = document.querySelector("#directorsList");
  
    // Filter to only the crew member with job director
    const resultArr = crewsArr.filter((crewMember) => crewMember.job === 'Director');

    // Create a director information heading before the list
    directorEl.insertAdjacentHTML("beforebegin","<h3>Director:</h3>");
    for (let i = 0; i < resultArr.length; i++){
      // Destructure the director obj inside the array
      const { id, name, profile_path } = resultArr[i];
  
      const imgUrl = profile_path
        ? `https://image.tmdb.org/t/p/w92${profile_path}`
        : PLACEHOLDER_URL;
      
      const directorHtmlStr = 
        `<li>
          <img id="director-${i}" src="${imgUrl}">
          <p>${name}</p>
        </li>`;
      
      directorEl.insertAdjacentHTML("beforeend", directorHtmlStr);
      
      // Event Listener for click on the director img
      document.querySelector(`#director-${i}`).addEventListener('click', () => {
        fetchTmdbSelectedDetail(id, 'person');
      })
    }
  }

  // Function to render list of streaming websites
  const renderStreamingOption = (providersObj, searchName) => {
    // DOM selectors
    const streamingListEl = document.getElementById('streamingList');
    const streamingContainerEl = document.getElementById('streamingContainer')

    // Function to return li elements to be inserted
    const insertLi = streamingSiteArr => {
      let liHtmlStr = "";
      for (let i = 0; i < streamingSiteArr.length; i++){ 
        const imgUrl = `https://image.tmdb.org/t/p/w45${streamingSiteArr[i].logo_path}`;
        liHtmlStr += 
        `<li>
          <a href="https://www.google.com/search?q=watch ${searchName}" target="_blank">
          <img src="${imgUrl}" alt="icon of streaming service"></a>
        </li>`;
      } 
      return liHtmlStr;
    }
  
    // Show the h3 with Streaming Options and reset the list
    streamingContainerEl.removeAttribute('hidden');
    streamingListEl.textContent = '';
  
    for (key in providersObj) {
      // Skip link in the object providers
      if (key === "link") {
        continue;
      }

      // Html code to be insert and display
      const ulHtmlStr = `
        <h4>${key}</h4>
        <ul>${insertLi(providersObj[key])}</ul>`
      streamingListEl.insertAdjacentHTML("beforeend", ulHtmlStr);
    }
  }

  const renderCollectionOrSeason = () => {
    if (userCategory === 'movie') {
      // Destructure the collection object
      const {
        id: collectionId,
        name,
        poster_path,
      } = belongs_to_collection;

      const imgUrl = `https://image.tmdb.org/t/p/w185${poster_path}`

      const collectionHtmlStr = `
        <figcaption>Part of the ${name}</figcaption>
        <img id="collectionImg" class="clickable" src="${imgUrl}">`
      collectionEl.insertAdjacentHTML('beforeend', collectionHtmlStr);

      // Event listener on click of collection img
      document.getElementById('collectionImg').addEventListener('click', () => {
        fetchCollectionDetail(collectionId);
      });
    } else if (userCategory === 'episode') {
      // Destructre the seasonDataObj
      const { seriesId, seasonDataObj } = seriesData;
      const { name, poster_path, season_number } = seasonDataObj;

      const imgUrl = `https://image.tmdb.org/t/p/w185${poster_path}`

      const collectionHtmlStr = `
        <figcaption>${name}</figcaption>
        <img id="collectionImg" class="clickable" src="${imgUrl}">`
      collectionEl.insertAdjacentHTML('beforeend', collectionHtmlStr);

      // Event listener on click of season img
      document.getElementById('collectionImg').addEventListener('click', () => {
        displaySeasonModal(seriesId, season_number, seasonDataObj)
      });
    }
  };

  // Function to render the cast list and listen to click on their image to give more detail on them.
  const renderMovieTvCastList = (castArr) => {
    // DOM selectors
    const castListEl = document.querySelector("#castList");

    // Create a cast information heading before the list
    castListEl.insertAdjacentHTML("beforeBegin", "<h3>Cast: </h3>");
    // Display only 10 cast members
    for (let i = 0; i < 10 && i < castArr.length; i++) {
      const imgUrl = castArr[i].profile_path
        ? `https://image.tmdb.org/t/p/w92${castArr[i].profile_path}`
        : PLACEHOLDER_URL;
      
      const htmlStr =
        `<li class="col align-center" >
          <img id="cast-${i}" src="${imgUrl}">
          <p>${castArr[i].name}</p>
          <p>${castArr[i].character}</p>
        </li>`;
      castListEl.insertAdjacentHTML("beforeend", htmlStr);

      // Event listener to fetch the detail of the cast
      document.querySelector(`#cast-${i}`).addEventListener("click", () => {
        //fetch selected detail
        fetchTmdbSelectedDetail(castArr[i].id, "person");
      });
    }
  }

  // Function to render cast credits for Person searches
  const renderPersonCastCredits= (castsArr) => {
    // DOM selectors
    const castUlEl = document.getElementById("castList");

    // Sort the cast by newest releases
    castsArr.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));

    // hiding cast UL element if none exist and exit function
    if (castsArr.length === 0) {
      castUlEl.setAttribute("hidden", "");
      return;
    }

    // Limit the list to 10 cast members
    let castLimit = 10;

    // Create a cast information heading before the list
    castUlEl.insertAdjacentHTML("beforeBegin", "<h3>Cast Credits: </h3>");

    // Loop through the castArr to create the list
    for (let i = 0; i < castsArr.length && i < castLimit; i++) {
      // Deconstruct cast object & create Li elements
      const { character, id, media_type, title, poster_path } = castsArr[i];

      const imgUrl = poster_path
        ? `https://image.tmdb.org/t/p/w92${poster_path}`
        : PLACEHOLDER_URL;

      // skip cast with no poster image
      if (!poster_path) {
        castLimit++;
        continue;
      }

      // HTML code to be insert to the page
      const htmlStr = `
        <li>
          <img id="cast-${id}" src="${imgUrl}" alt="${title} Movie Poster">
          <h4>${title}</h4>
          <p>Character: <strong>${character || 'Self'}</strong></p>
        </li>`;
      castUlEl.insertAdjacentHTML("beforeend", htmlStr);

      // Event listener on click on cast image
      document.getElementById(`cast-${id}`).addEventListener("click", () => {
        //fetch selected detail
        fetchTmdbSelectedDetail(id, media_type);
      });
    }
  }

  // Function to render crew credits for Person searches
  const renderPersonCrewCredits = (crewsArr) => {
    // DOM selectors
    const crewUl = document.getElementById("crewList");
  
    // Sort the crew by newest releases
    crewsArr.sort((a, b) => new Date(b.release_date) - new Date(a.release_date));
  
    // hiding crew UL element if none exist and exit function
    if (crewsArr.length === 0) {
      crewUl.setAttribute("hidden", "");
      return;
    }
  
    // Limit the list to 10 crew members
    let crewLimit = 10;
  
    // create crewArray for purposes of looking for duplicate credits
    let pickedCrewArr = [];
  
    // deconstruct crew object & get 10 crew credits - combining duplicates into one listing with multiple jobs
    for (let i = 0; i < crewsArr.length && i < crewLimit; i++) {
      // Destructure the crew member object
      const { job, title, poster_path } = crewsArr[i];
      let duplicate = false;
  
      // Look for duplicate crew member, if found combine their job credit
      pickedCrewArr.forEach((pickedCrew) => {
        if (pickedCrew.title === title) {
          pickedCrew.job += ", " + job;
          duplicate = true;
        }
      });
  
      // If no profile picture or duplicate, skip
      if (!poster_path || duplicate) {
        crewLimit++;
        continue;
      }

      // add crew credit to crewArray if not a duplicate
      pickedCrewArr.push(crewsArr[i]);
    }
  
    // Create a crew information heading before the list
    crewUl.insertAdjacentHTML("beforeBegin", "<h3>Crew Credits: </h3>");

    pickedCrewArr.forEach((crew) => {
      // deconstruct crewArray objects and create li items for each
      const { job, title, id, media_type, poster_path } = crew;
      const imgUrl = poster_path
      ? `https://image.tmdb.org/t/p/w92${poster_path}`
      : PLACEHOLDER_URL;
  
      // HTML code to be insert to the page
      const htmlStr =`
        <li>
          <img id="crew-${id}" src="${imgUrl}" alt="${title} Movie Poster">
          <p>${title}</p>
          <p>Job: ${job}</p>
        </li>`;
      crewUl.insertAdjacentHTML("beforeend", htmlStr);
  
      // Event listener for click on the profile image
      document.getElementById(`crew-${id}`).addEventListener("click", () => {
        //fetch selected detail
        fetchTmdbSelectedDetail(id, media_type);
      });
    });
  }

  //#endregion Local Functions

  // Reset the element
  selectedDetailEL.innerHTML = "";

  // Destructure the selectedData object
  const { 
    title,
    name,
    poster_path,
    profile_path,
    still_path,
    release_date,
    first_air_date,
    air_date,
    birthday, 
    place_of_birth,
    overview, 
    biography,
    content_ratings, 
    release_dates,
    credits, 
    runtime,
    seasons,
    belongs_to_collection,
    videos,
    id: selectedId,
    ["watch/providers"]: streamingProviders
  } = selectedData;

  const PLACEHOLDER_URL = 'https://www.themoviedb.org/assets/2/v4/glyphicons/basic/glyphicons-basic-4-user-grey-d8fe957375e70239d6abdd549fd7568c89281b2179b5f4470e2e12895792dfa5.svg';

  // Render the profile/poster for user selected choice
  posterImgEl.src = poster_path || profile_path || still_path
    ? `https://image.tmdb.org/t/p/w342${poster_path || profile_path|| still_path}`
    : PLACEHOLDER_URL;

  // render different details depending on search category (movie, tv or person)
  // render Movie/TV details
  if (userCategory !== "person") {
    // resets visibility of video & streaming options elements (if display set to none due to previous person search)
    playerAndStreamEl.removeAttribute("hidden");

    // insert HTML creating Movie/TV Detail elements
    const videoHtmlStr =
      `<h2>${title || name}</h2>
      <h3>Plot Summary</h3>
      <p>${overview}</p>
      <h3>Release Date: <span>${release_date || first_air_date || air_date}</span></h3>
      <h3>Rating: <span id="rating">N/A</span></h3>
      <h3>Runtime: <span id="runtime"> ${runtime} mins</span></h3>
      <ul id="directorsList" class="row gap"></ul>
      <ul id="castList" class="row gap"></ul>
      <ul id="seasonsList" class="row gap"></ul>`;

    // Append the detail onto the page
    selectedDetailEL.insertAdjacentHTML("beforeend", videoHtmlStr);

    // load a YT trailer for the selected tv/movie if exist
    // hide the button if doesn't
    videos.results.length !== 0
      ? loadTrailer(videos.results)
      : playerAndStreamEl.firstElementChild.setAttribute('hidden', '');

    // Get the right response data for the rating
    if (userCategory !== 'episode') {
      const ratings = userCategory === "movie"
        ? release_dates.results
        : content_ratings.results;
      renderRating(ratings);
    }

    // If seasons exist, ie. a tv show with multiple seasons
    if (seasons) {
      renderTvSeasonList();
    }

    // Render Movie && episode Director
    if (userCategory !== "tv"){
      renderMovieDirector(credits.crew);                   
    }
    // Render cast list for Move, Tv, and episode
    renderMovieTvCastList(credits.cast);

    // If selected movie / tv is available to stream online
    // else hide the streaming option section
    if (userCategory !== 'episode') {
      streamingProviders.results.US
        ? renderStreamingOption(streamingProviders.results.US, name || title)
        : document.getElementById('streamingContainer').setAttribute('hidden', '');
    } else {
      document.getElementById('streamingContainer').setAttribute('hidden', '');
    }


    collectionEl.textContent = '';
    if (belongs_to_collection || seriesData) {
      renderCollectionOrSeason();
    }
    
  // render Person details
  } else {  // render Person details
    // sets visibility of trailer and streaming options elements to none
    playerAndStreamEl.setAttribute("hidden", "");

    // insert HTML creating Person Detail elements
    const personHtmlStr = `
      <h2>${name}</h2>
      <h3>Biography</h3>
      <p>${biography}</p>
      <h3>Birthday: <span>${birthday}</span></h3>
      <h3>Place of Birth: <span>${place_of_birth}</span></h3>
      <ul id="castList" class="row"></ul>
      <ul id="crewList" class="row"></ul>`;

    // Append the detail onto the page
    selectedDetailEL.insertAdjacentHTML("beforeend", personHtmlStr);

    // Destructure the object combined_credits
    const { cast, crew } = selectedData.combined_credits;

    // Display the cast and crew credits for selected person
    renderPersonCastCredits(cast);
    renderPersonCrewCredits(crew);
  }

  // Hide landing page and show result page
  DOM_SELECTORS.landingPageEl.setAttribute("hidden", "");
  DOM_SELECTORS.resultDisplayEl.removeAttribute("hidden");

  // Scroll to the top of the poster
  posterImgEl.scrollIntoView({behavior: "smooth"});
}

// Function to add to the browser history list and call renderDetails
function addHistory(selectedData, userCategory, seriesData) {
  // Set the parameters for the page history to come back to
  const stateHistory = {
    page: history.state.page + 1,
    selectedData,
    userCategory,
  };

  // Add popstate history
  history.pushState(stateHistory, "", "");
  if (IS_DEBUGGING) {
    console.log("pushState: ", stateHistory);
  }

  // Fetch the selection detail if Id was pass into the function
  if (selectedData) {
    renderDetails(selectedData, userCategory, seriesData);
    if (IS_DEBUGGING) {
      console.log(`Added to browser history: `, selectedData);
    }
  }
}
//#endregion Misc Functions


//#region TMDB API
async function fetchCollectionDetail(collectionId) {
  const displayCollectionModal = (collectionObj) => {
    const { name, overview, parts } = collectionObj;

    // Set the modal header to the name and oveview of the collection
    DOM_SELECTORS.modalHeaderEl.textContent = name;
    if (overview) {
      DOM_SELECTORS.modalHeaderEl.insertAdjacentHTML('beforeend', `<h4 style="font-size: .8em;">Collection Overview: <p style="font-weight: 400; font-size: 16px;">${overview}</p></h4>`)
    }

    // Loop through the collection and display the list in modal body
    parts.forEach( movieObj => {
      // Destructure the movieObj
      const {
        id: movieId,
        title,
        overview,
        poster_path,
        media_type,
        release_date
      } = movieObj;

      // Skip the list item if no release date
      if (!release_date) {
        return;
      }

      const imgUrl = `https://image.tmdb.org/t/p/w92${poster_path}`;

      // HTML code to be insert onto modal list
      const moiveHtmlStr = `
        <li id="thumbnail-${movieId}" class="clickable">
          <div class="pure-g">
            <div class="pure-u-1-3"><img src="${imgUrl}"></div>
            <div class="pure-u-2-3 col justify-around">
              <h3>${title}</h3>
              <p>Release Date: ${release_date}</p>
              <p>Plot Summary: ${overview}</p>
            </div>
          </div>
        </li>`;
      DOM_SELECTORS.modalListEl.insertAdjacentHTML('beforeend', moiveHtmlStr);

      // Event listener on click of modal list item
      document.getElementById(`thumbnail-${movieId}`).addEventListener('click', () => {
        fetchTmdbSelectedDetail(movieId, media_type);
        myModal.hide();
      });
    });
    DOM_SELECTORS.modalContentEl.parentElement.style.maxWidth = MODAL_MAX_WIDTH;
    myModal.show();
  }

  const collectionUrl = `https://api.themoviedb.org/3/collection/${collectionId}?api_key=a3a4488d24de37de13b91ee3283244ec&language=en-US`

  try {
    const response = await fetch(collectionUrl);
    const collectionData = await response.json();
    if (IS_DEBUGGING) {
      console.log(`Fetched: selected Collection details: `, collectionData);
    }

    displayCollectionModal(collectionData);

  } catch (error) {
    console.error(error);
  }
}

// This function is called when user click on the episode list inside the modal
async function fetchTmdbEpisodeDetail(seriesId, seasonNumber, episode_number, seasonDataObj) {
  const fetchUrl =
  `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}/episode/${episode_number}?api_key=a3a4488d24de37de13b91ee3283244ec&language=en-US&append_to_response=credits,videos`;

  try {
    const response = await fetch(fetchUrl);
    const episodeData = await response.json();

    if (IS_DEBUGGING) {
      console.log(seriesId, seasonNumber, episode_number);
      console.log(`Fetched selected episode data`, episodeData);
    }

    // Save reponse data to localStorage and add to history
    saveSearchHistory(episodeData, 'episode');
    addHistory(episodeData, 'episode', {seriesId, seasonDataObj});

  } catch (error) {
    console.error(error);
  }
};

// This function is called after fetching the data about the selected season
function displaySeasonModal(seriesId, seasonNumber, seasonDataObj) {
  // Destructuring season object
  const { episodes, name, overview } = seasonDataObj;

  // Set the title of the modal
  DOM_SELECTORS.modalHeaderEl.textContent = `${name}`;
  if (overview) {
    DOM_SELECTORS.modalHeaderEl.insertAdjacentHTML('beforeend', `<h4 style="font-size: .8em;">Season Overview: <p style="font-weight: 400; font-size: 16px;">${overview}</p></h4>`)
  }

  // Display the episodes for selected season
  DOM_SELECTORS.modalListEl.insertAdjacentHTML('beforeend', `<h3>Episodes:</h3><br>`);

  episodes.forEach((episodeOjb, i) => {
    // Destructure episode object
    const { air_date, name, overview, still_path, episode_number } = episodeOjb;

    const imgUrl = still_path ? `https://image.tmdb.org/t/p/w185${still_path}` : ``;

    // Insert html string into the modal list
    const episodeHtmlStr = `
      <li id="episode-${i}" class="clickable">
        <div class="pure-g">
          <div class="pure-u-1-1 pure-u-md-1-3"><img class="pure-img" src="${imgUrl}"></div>
          <div class="pure-u-1-1 pure-u-md-2-3 col justify-around align-start gap">
            <h4>${episode_number}.${name}</h4>
            <h5>Release Date: <span>${air_date}</span></h5>
            <h5>Episode Overview:</h5>
            <p class="text-left">${overview}</p><br>
          </div>
        </div>
      </li>`;
    DOM_SELECTORS.modalListEl.insertAdjacentHTML('beforeend', episodeHtmlStr);

    // Event listener on click of an episode on the modal
    document.querySelector(`#episode-${i}`).addEventListener('click', () => {
      // Fetch the selected episode data and hide the modal
      fetchTmdbEpisodeDetail(seriesId, seasonNumber, episode_number, seasonDataObj);
      myModal.hide();
    });
  });

  // Style the modal and show
  DOM_SELECTORS.modalContentEl.parentElement.style.maxWidth = MODAL_MAX_WIDTH;
  myModal.show();
};

// Function to fetch the season detail using the seriesId that was retrieved from TMDB
async function fetchTmdbSeasonDetail(seriesId, seasonNumber) {
  // Fetch the selected season detail
  const fetchUrl =
    `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}?api_key=a3a4488d24de37de13b91ee3283244ec&language=en-US&append_to_response=images`;

  try {
    const response = await fetch(fetchUrl);
    const seasonData = await response.json();

    if (IS_DEBUGGING) {
      console.log(seriesId, seasonNumber);
      console.log(`Fetched selected season data`, seasonData);
    }

    // Display a modal with the selected season information
    displaySeasonModal(seriesId, seasonNumber, seasonData);

  } catch (error) {
    console.error(error);
  }
}

// Function to fetch the movie detail using the movieId that was retrieved from TMDB
async function fetchTmdbSelectedDetail(selectedId, userCategory) {
  // Create an url for API call
  const url = `https://api.themoviedb.org/3/${userCategory}/${selectedId}?api_key=a3a4488d24de37de13b91ee3283244ec&append_to_response=videos,images,credits,content_ratings,combined_credits,external_ids,watch/providers,release_dates`;

  try {
    const response = await fetch(url);
    const selectedData = await response.json();
    if (IS_DEBUGGING) {
      console.log(`Fetched: selected ${userCategory} details: `, selectedData);
    }

    // Save reponse data to localStorage and add to history
    saveSearchHistory(selectedData, userCategory);
    addHistory(selectedData, userCategory);
  } catch (error) {
    console.error(error);
  }
}

// Function to fetch the movieId using the search string from the user
async function fetchTmdbId(userCategory, userInput) {
  // function to display top 5 results of search - allow user to select specific one
  const displayTop5 = (resultsArr, userCategory) => {
    DOM_SELECTORS.modalHeaderEl.textContent = `Choose the Specific ${userCategory.toUpperCase()}`;

    if (IS_DEBUGGING) {
      console.log(resultsArr);
    }

    // Limit the result being display on the modal
    let displayLimit = 5;

    // create and append possible matches to user query
    for (let i = 0; i < displayLimit && i < resultsArr.length; i++) {
      // Deconstruct result object
      const {
        name,
        original_title,
        profile_path,
        poster_path,
        release_date,
        first_air_date,
      } = resultsArr[i];

      // Result datas
      const nameData = name || original_title;
      const imageUrl = profile_path || poster_path;
      const date = release_date || first_air_date || "N/A";

      // Create the html string to append to the Ul element
      const top5Str = `
        <li id="thumbnail-${i}" class="clickable">
          <div class="pure-g">
            <div class="pure-u-1-3"><img src="https://image.tmdb.org/t/p/w92${imageUrl}"></div>
            <div class="pure-u-2-3 col justify-around">
              <h3>${nameData}</h3>
              <p>Release Date: ${date}</p>
            </div>
          </div>
        </li>`;
      // Append the html string to the end of the Ul element
      DOM_SELECTORS.modalListEl.insertAdjacentHTML("beforeend", top5Str);

      // add eventlistener to each li item for user to select then pass that specific movie id to fetchTmdbMovieDetail function
      document.querySelector(`#thumbnail-${i}`).addEventListener("click", () => {
        const { id: selectedId } = resultsArr[i];

        //fetch selected detail
        fetchTmdbSelectedDetail(selectedId, userCategory);

        // Hide the modal after user picked a movie from 5 results
        myModal.hide();
      });
    }
  // Display the modal to the user
  myModal.show();
  };

  // Create an url for an API call
  const url = `https://api.themoviedb.org/3/search/${userCategory}?query=${userInput}&page=1&api_key=a3a4488d24de37de13b91ee3283244ec`;

  try {
    const response = await fetch(url);
    const responseData = await response.json();

    if (IS_DEBUGGING) {
      console.log(`Fetched: ${userCategory} search result: `, responseData);
    }

    // Display top 5 results for user to select the right movie
    if (responseData.results.length > 1) {
      displayTop5(responseData.results, userCategory);

    // If no result found
    } else if (responseData.results.length === 0) {
      DOM_SELECTORS.modalHeaderEl.textContent = "Warning";
      DOM_SELECTORS.modalTextEl.textContent ="Could not find any exact matches - please check your spelling!";
      myModal.show();
      return;
      
    // If there's only one result
    } else {
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
  const searchFormEL = document.getElementById("searchForm");
  const searchSelectEl = document.getElementById("mediaSelect");
  const searchInputEl = document.getElementById("searchInput");

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

    // If one of the input is empty, alert the user to redo their selections
    // stop the function
    if (!userInput || !userCategory) {
      // Set the modal for warning
      DOM_SELECTORS.modalHeaderEl.textContent = "Warning";
      DOM_SELECTORS.modalTextEl.innerHTML = "Please enter a <strong>Search Category</strong> AND a valid <strong>Title</strong> or <strong>Person Name</strong>";
      myModal.show();
      return;
    }

    // Reset the form
    searchSelectEl.value = "";
    searchInputEl.value = "";

    // fetchYoutubeTrailer(userInput);
    fetchTmdbId(userCategory, userInput);
  });

  // Event listener on modal closing, reset modal to default
  DOM_SELECTORS.myModalEl.addEventListener('hide.bs.modal', () => {
    ytPlayer.pauseVideo();
    DOM_SELECTORS.ytPlayerEl.setAttribute('hidden', '');

    DOM_SELECTORS.modalContentEl.style.removeProperty("background-color");
    DOM_SELECTORS.modalContentEl.style.removeProperty("width");
    DOM_SELECTORS.modalContentEl.parentElement.style.maxWidth = '500px';

    DOM_SELECTORS.modalHeaderEl.textContent = '';
    DOM_SELECTORS.modalTextEl.textContent = '';
    DOM_SELECTORS.modalListEl.textContent = '';
  });
});

// Init onLoad
addEventListener("load", () => {
  // Load the youtube player
  renderYouTubePlayer();
});

// Event listener on history state change
addEventListener("popstate", () => {
  // Deconstruct history.state object
  const { selectedData, userCategory } = history.state;

  // If went to the landing page, display the landing page
  if (history.state.page === 1) {
    DOM_SELECTORS.landingPageEl.removeAttribute("hidden");
    DOM_SELECTORS.resultDisplayEl.setAttribute("hidden", "");

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
