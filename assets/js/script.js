var zipCodeInput;
var zipCodeValid;
var userLat;
var userLong;
var userLocation;
var reviewtextblock;
let infoWindow;
let currentInfoWindow;
let bounds;
var time;
let service;
var geocoder;
let placeResult;


$("#search-button").on("click", function() //search button pressed
  {
    zipCodeInput = $("#zip-code-text").val(); //variable for zipcode text box input

    validateZipCode(zipCodeInput, zipCodeValid); //calls  validateZipCode function
    geocodeZip(zipCodeInput, map);

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
 
function geocodeZip(zipCodeInput, map) {
  geocoder = new google.maps.Geocoder();
  geocoder
    .geocode({ address: zipCodeInput })
    .then(({ results }) => {
      userLat = results[0].geometry.location.lat();
      userLong = results[0].geometry.location.lng();
      userLocation = {
        lat: userLat,
        lng: userLong
      };
      initMap(userLocation);
    })
    .catch((e) =>
      alert("Geocode was not successful for the following reason: " + e)
    );
}

function initMap() { //normaly the call back function 
 bounds = new google.maps.LatLngBounds();
  infoWindow = new google.maps.InfoWindow;
  currentInfoWindow = infoWindow;

  const map = new google.maps.Map(document.getElementById("map"), {
    center: userLocation,
    zoom: 16,
    mapId: "8d193001f940fde3",
    mapTypeControl: false,
  });
  bounds.extend(userLocation);
  service = new google.maps.places.PlacesService(map);

  service.nearbySearch( // Perform a nearby search using google Places Library
    {
      location: userLocation,
      radius: 1000,
      type: "restaurant"
    },
    (results, status, pagination) => {
      if (status !== "OK" || !results) return;

      addPlaces(results, map);
      console.log("results", results);
    }

  );
}

function addPlaces(places, map) {   // add markers to map, listeners for clicks
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

      marker.addListener("click", () => {
        bounds.extend(place.geometry.location);
        showDetails(place, marker);
        //console.log("clicked marker", place);
        //console.time();
        placeDetails(place, map);
      });

    }
  }
}

function placeDetails(place, map) { // getDetails from google library 
  service = new google.maps.places.PlacesService(map);
  const request = {
    placeId: place.place_id,
    fields: ['name', 'formatted_address', "place_id", 'geometry', 'reviews', 'photos']
  };
  service.getDetails(request, (placeResult, status) => {
    console.log("place", place);
    console.log("placeResult", placeResult);
    //carousel(placeResult, place);
    reviewtextblock = "";
    for (var x = 0; x < 100; x++) {
      console.log("placeResult.reviews", placeResult.reviews[x].text);
      reviewtextblock = reviewtextblock + " " + placeResult.reviews[x].text;
    }
    console.log(reviewtextblock.length, "reviews block before strip", reviewtextblock);
    reviewtextblock = reviewtextblock.replace(/[0-9]/g, '') // remove any numbers
    reviewtextblock = reviewtextblock.split('.').join(""); // remove periods.
    console.log(reviewtextblock.length, "review block stripped", reviewtextblock);
    wordCloud(reviewtextblock);   // call word cloud api
  });
}

function showDetails(place, marker) { //info window popup on marker clicks
  let placeInfowindow = new google.maps.InfoWindow();
  let rating = "None";
  console.log("place", place);
  if (place.rating) rating = place.rating;    
  placeInfowindow.setContent('<div><strong>' + place.name + '<br>' + place.vicinity +
    '</strong><br>' + 'Rating: ' + rating + '</div>');
  placeInfowindow.open(marker.map, marker);
  currentInfoWindow.close();
  currentInfoWindow = placeInfowindow;
}
/*
function carousel(placeResult, place) {
  var carouselItems = document.querySelectorAll(".carousel-item");
  console.log("carouselItems", carouselItems)
  for (var i = 0; i < carouselItems.length; i++) {
      console.log("carouselItem", i , carouselItems[i]);
      console.log("placeResult.photos[i]", placeResult.photos[i])
      carouselItems[i].src = placeResult.photos[i].getUrl({'maxWidth': 250, 'maxHeight': 250});
      $('.carousel-item').attr('src', placeResult.photos[i].getUrl({'maxWidth': 250, 'maxHeight': 250}));
      console.log("placeResult.photos[i].getUrl({'maxWidth': 250, 'maxHeight': 250});", placeResult.photos[i].getUrl({'maxWidth': 250, 'maxHeight': 250}));
    }

  var carousel = document.querySelector(".carousel");
  var hotDogContainer = document.createElement("a");
  hotDogContainer.classList.add("carousel-item");
  hotDogContainer.href = "#";
  var hotDogImage = document.createElement("img");
  hotDogImage.src = place.photos[0].getUrl({'maxWidth': 250, 'maxHeight': 250});
  hotDogContainer.append(hotDogImage);
  carousel.append(hotDogContainer);
  M.Carousel.init(carousel, {});

  
}
*/

function wordCloud() { // word cloud api call
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
        scale: 1,
        width: 640,
        height: 640,
        colors: ["#d71b3b","#031163","#05716c","#1e2761","#8a307f","#b85042","#500472","#fe3a9e"],
        font: ["Montserrat"],
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
      var img = document.getElementById("wordcloudImg");
      img.src = wordCloud;
      //img.height = 800;
      //img.width = 800;
      //console.timeEnd();
    })
    .catch(err => {
      console.log(err);
    });
}

/* alternative function for word cloud api, fetch seemed slighty faster.
function wordCloud(reviewtextblock)
  {
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


  /*  geocodezip function with a working? promise.
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
        initMap(userLocation);
      } else {
        reject(status);
      }
    });
  });
}
  */
