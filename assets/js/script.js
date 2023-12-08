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

// function called on form submission
async function sumbitHandler(event) {
  event.preventDefault();

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
//#endregion Functions

// Event Listeners
searchFormEL.addEventListener("submit", sumbitHandler);
