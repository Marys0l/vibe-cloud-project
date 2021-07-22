var zipCodeInput;
var zipCodeValid;
var userLat;
var userLong;
var userLocation;
var reviewtextblock;
var infoWindow;
var currentInfoWindow;
var bounds;
var time;
var service;
var geocoder;
var placeResult;


$("#search-button").on("click", function() //search button pressed
  {
    zipCodeInput = $("#zip-code-text").val(); //variable for zipcode text box input
    validateZipCode(); //calls  validateZipCode function
    geocodeZip();
  })

function validateZipCode() {
  var zipCodePattern = /^\d{5}$/;
  zipCodeValid = zipCodePattern.test(zipCodeInput);
  console.log("zipcodeValid ", zipCodeValid);

  if (zipCodeValid) //True zip code is valid
  {
    // console.log("valid");
  } else // False zip code is invalid
  {
    //console.log("invalid/not 5 numbers");
  }
}

function geocodeZip() {
  geocoder = new google.maps.Geocoder();
  geocoder
    .geocode({
      address: zipCodeInput
    })
    .then(({
      results
    }) => {
      userLat = results[0].geometry.location.lat();
      userLong = results[0].geometry.location.lng();
      userLocation = {
        lat: userLat,
        lng: userLong
      };
      initMap();
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
    zoom: 14,
    mapId: "8d193001f940fde3",
    mapTypeControl: false,
  });
  service = new google.maps.places.PlacesService(map);

  service.nearbySearch( // Perform a nearby search using google Places Library
    {
      location: userLocation,
      radius: 2250,
      type: "restaurant"
    },
    (results, status, pagination) => {
      if (status !== "OK" || !results) return;
      console.log("nearbySearch call results", results);
      //console.log("pagination", pagination);
      console.log("pagination.hasNextPage", pagination.hasNextPage);
      if (pagination.hasNextPage) {
        //sleep(2000); docs say wait 2 seconds it seems to auto wait 2 seconds on its own.
        pagination.nextPage();
      }
      addPlaces(results, map);
    }
  );
}

function addPlaces(places, map) { // add markers to map, listeners for clicks
  //console.log("aPplaces",places);
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
        map.setCenter(place.geometry.location);
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
  let request = {
    placeId: place.place_id,
    fields: ['name', 'formatted_address', "place_id", 'geometry', 'reviews', 'photos']
  };
  service.getDetails(request, (placeResult, status) => {
    //console.log("place", place);
    console.log("placeDetails call response", placeResult);
    //carousel(placeResult);                  // populate carousel with place images
    reviewtextblock = "";
    for (var x = 0; x < 5; x++) {
      console.log("placeResult.review ", x, " ", placeResult.reviews[x].text);
      reviewtextblock = reviewtextblock + " " + placeResult.reviews[x].text;
    }
    //console.log(reviewtextblock.length, "reviews block before strip", reviewtextblock);
    reviewtextblock = reviewtextblock.replace(/[0-9]/g, '') // remove any numbers
    reviewtextblock = reviewtextblock.split('.').join(""); // remove periods.
    //console.log(reviewtextblock.length, "review block stripped", reviewtextblock);
    wordCloud(); // call word cloud api
  });
}

function showDetails(place, marker) { //info window popup on marker clicks
  var placeInfowindow = new google.maps.InfoWindow();
  let rating = "None";
  console.log("place", place);
  if (place.rating) rating = place.rating;
  placeInfowindow.setContent('<div><strong>' + place.name + '<br>' + place.vicinity +
    '</strong><br>' + 'Rating: ' + rating + '</div>');
  placeInfowindow.open(marker.map, marker);
  currentInfoWindow.close();
  currentInfoWindow = placeInfowindow;
}

function carousel(placeResult) {
  var carousel = document.querySelector(".carousel");

  for (var i = 0; i < placeResult.photos.length; i++) {
    var carouselItemContainer = document.createElement("a");
    carouselItemContainer.classList.add('carousel-item');
    carouselItemContainer.id = i;
    carouselItemContainer.href = ("#" + i);
    //console.log("carouselItemContainer", carouselItemContainer);
    var carouselItemImage = document.createElement("img");
    carouselItemImage.src = placeResult.photos[i].getUrl({
      'maxWidth': 500,
      'maxHeight': 500
    });
    //console.log("carouselItemImage", carouselItemImage);
    carouselItemContainer.append(carouselItemImage);
    carousel.append(carouselItemContainer);
    //console.log("carousel", carousel);
  }
  M.Carousel.init(carousel, {});
}

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
        colors: ["#375E97", "#FB6542", "#FFBB00", "#3F681C"],
        font: "Tahoma",
        use_stopwords: true,
        language: "en",
        uppercase: false
      })
    })
    .then(response => {
      console.log("wordcloud call response ", response);
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
