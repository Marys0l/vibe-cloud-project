var zipCodeInput;
var zipCodeValid;
var userLat;
var userLong;
var userLocation;
var reviewtextblock;


$("#search-button").on("click", function() //search button pressed
  {
    const zipCodeInput = $("#zip-code-text").val(); //variable for zipcode text box input
    console.log("zipCodeInput", zipCodeInput);

    validateZipCode(zipCodeInput, zipCodeValid); //calls  validateZipCode function
    console.log("returned zipcodevalid", zipCodeValid);

    geocodeZip(zipCodeInput)
    console.log("userlocation after geocodezip function", userLocation)

    initMap(userLocation);
  })

function validateZipCode(zipCodeInput) {
  var zipCodePattern = /^\d{5}$/;
  zipCodeValid = zipCodePattern.test(zipCodeInput);
  //console.log("zipcodeValid", zipCodeValid);

  if (zipCodeValid) //True zip code is valid
  {
    // console.log("valid");
  } else // False zip code is invalid
  {
    //console.log("invalid/not 5 numbers");
  }
  //return zipCodeValid;
}

function geocodeZip(zipCodeInput) {
  const geocoder = new google.maps.Geocoder();
  return new Promise(function(resolve, reject) {
    geocoder.geocode({
      address: zipCodeInput
    }, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        resolve(results);
        console.log("results in function", results);
        userLat = results[0].geometry.location.lat();
        userLong = results[0].geometry.location.lng();
        userLocation = {
          lat: userLat,
          lng: userLong
        };
        console.log("lat in geocodeZip  ", userLat);
        console.log("longit in geocodeZip ", userLong);
        console.log("userlocation in geocodeZip ", userLocation)
        initMap(userLocation);
      } else {
        reject(status);
      }
    });
  });
}

function initMap() {
  console.log("userLat in initmap)", userLat)
  console.log("userLong in initmap)", userLong)
  console.log("userlocation in initmap", userLocation)
  //document.querySelectorAll("#placeholder-image").attr('')

  const map = new google.maps.Map(document.getElementById("map"), {
    center: userLocation,
    zoom: 16,
    mapId: "8d193001f940fde3",
  });
  console.log("map", map);
  const service = new google.maps.places.PlacesService(map);
  let getNextPage;
  const moreButton = document.getElementById("more");

  moreButton.onclick = function() {
    moreButton.disabled = true;

    if (getNextPage) {
      getNextPage();
    }


  };

  service.nearbySearch( // Perform a nearby search.
    {
      location: userLocation,
      radius: 500,
      type: "restaurant"
    },
    (results, status, pagination) => {
      if (status !== "OK" || !results) return;

      addPlaces(results, map);
      console.log("results", results);
      moreButton.disabled = !pagination || !pagination.hasNextPage;

      if (pagination && pagination.hasNextPage) {
        getNextPage = () => {
          // Note: nextPage will call the same handler function as the initial call
          pagination.nextPage();
        };
      }
    }

  );
}

function addPlaces(places, map) {
  const placesList = document.getElementById("places");
  const infowindow = new google.maps.InfoWindow();
  for (const place of places) {
    if (place.geometry && place.geometry.location) {
      const image = {
        url: place.icon,
        size: new google.maps.Size(71, 71),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(17, 34),
        scaledSize: new google.maps.Size(25, 25),
      };
      const marker = new google.maps.Marker({
        map,
        icon: image,
        title: place.name,
        position: place.geometry.location,
      });
      //console.log("place", place);

      const li = document.createElement("li");
      li.textContent = place.name;
      placesList.appendChild(li);

      li.addEventListener("click", () => {
        map.setCenter(place.geometry.location);
        console.log("clicked place", place);
        placeDetails(place, map);
      });

      marker.addListener("click", () => {
        //map.setCenter(place.geometry.location);
        console.log("clicked marker", place);
        console.time("time");
        placeDetails(place, map);
      });

    }
  }
}


function placeDetails(place, map) {
  console.log("place detials function", place);
  service = new google.maps.places.PlacesService(map);
  const request = {
    placeId: place.place_id,
    fields: ['name', 'formatted_address', "place_id", 'geometry', 'reviews']
  };
  service.getDetails(request, (placeResult, status) => {
    console.log("status", status)
    console.log("place", place);
    console.log("placeResult", placeResult);
    //var reviewsArray = [];
    reviewtextblock = "";
    for (var x = 0; x < 5; x++) {
      console.log("placeResult.reviews", placeResult.reviews[x].text);
      reviewtextblock = reviewtextblock + " " + placeResult.reviews[x].text;
      //reviewsArray.push(placeResult.reviews[x].text);
    }
    wordCloud(reviewtextblock);
    console.log("reviewtextblock ", reviewtextblock);
    // console.log("reviewsArray ", reviewsArray);
  });
}


/*
function wordCloud(reviewtextblock)
  {
    console.log("wordcloud called");

    const data = JSON.stringify({
      "text": reviewtextblock,
      "scale": .5,
      "width": 1600,
      "height": 900,
      "colors": [
        "#375E97",
        "#FB6542",
        "#FFBB00",
        "#3F681C"
      ],
      "font": "Tahoma",
      "use_stopwords": true,
      "language": "en",
      "uppercase": false
    });

    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function() {
      if (this.readyState === this.DONE) {
        console.log(this.responseText);
        $('.placeholder-image').attr( "src", this.responseText  );
        console.timeEnd("test");
      }
    });

    xhr.open("POST", "https://textvis-word-cloud-v1.p.rapidapi.com/v1/textToCloud");
    xhr.setRequestHeader("content-type", "application/json");
    xhr.setRequestHeader("x-rapidapi-key", "6246c0395bmshc418a25ff40d214p13b822jsnd3aa107312bc");
    xhr.setRequestHeader("x-rapidapi-host", "textvis-word-cloud-v1.p.rapidapi.com");

    xhr.send(data);
  }
  */



function wordCloud(reviewtextblock) {
  console.log("wordcloud called");
  fetch("https://textvis-word-cloud-v1.p.rapidapi.com/v1/textToCloud", {
      method: "POST",
      headers: {
        "x-rapidapi-host": "textvis-word-cloud-v1.p.rapidapi.com",
        "x-rapidapi-key": "6246c0395bmshc418a25ff40d214p13b822jsnd3aa107312bc",
        "content-type": "application/json",
        accept: "application/json"
      },
      body: JSON.stringify({
        text: reviewtextblock,
        scale: .5,
        width: 1200,
        height: 800,
        colors: ["#375E97", "#FB6542", "#FFBB00", "#3F681C"],
        font: "Tahoma",
        use_stopwords: true,
        language: "en",
        uppercase: false
      })
    })
    .then(response => {
      console.log("wordcloud responce", response);
      return response.text();
    })
    .then(wordCloud => {
      console.log("$('#wordcloudImg')", $('#wordcloudImg'));
      //var img = document.getElementById("wordCloud");
      //img.src = wordCloud;
      $('#wordcloudImg').attr("src", wordCloud);
      //$('.placeholder-image').attr( "src", this.responseText  );
      //img.height = 800;
      //img.width = 800;
      console.log("wordcloud finished");
      console.timeEnd("time");
    })
    .catch(err => {
      console.log(err);
    });
  console.log("map at end", map);
}
