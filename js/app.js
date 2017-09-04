var map;
var markers = [];

function initMap() {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 32.7889440000, lng: -79.9469090000},
    zoom: 14,
    mapTypeControl: true,
    mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_CENTER
    }
  });

  var largeInfowindow = new google.maps.InfoWindow();
  var bounds = new google.maps.LatLngBounds();

  // The following group uses the location array to create an array
  // of markers on initialize.
  for (var i = 0; i < locations.length; i++) {
    // Get the position from the location array.
    var position = locations[i].location;
    var title = locations[i].title;
    var id = locations[i].id;
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      id: id
    });
    // Push the marker to our array of markers.
    markers.push(marker);
    // Create an onclick event to open an infowindow at each marker.
    marker.addListener('click', handler_InfoWindow);

    bounds.extend(markers[i].position);
  }
  // next 3 function handles Error:W083 Don't make functions within a loop.
  function handler_InfoWindow() {
     populateInfoWindow(this, largeInfowindow);
	 
	 for (var i = 0; i < markers.length; i++) {
	     if (this != markers[i]) {
	          markers[i].setAnimation(null);
		 }
	 }
	 
	 if (this.getAnimation() !== null) {
         this.setAnimation(null);
     }
     else {
          this.setAnimation(google.maps.Animation.BOUNCE);
     }
  }

  // Extend the boundaries of the map for each marker
  //map.fitBounds(bounds);

  //Resize Function
  google.maps.event.addDomListener(window, "resize", function() {
	var center = map.getCenter();
	google.maps.event.trigger(map, "resize");
	map.setCenter(center);
   });
}

// This function populates the infowindow when the marker is clicked.
function populateInfoWindow(marker, infowindow) {

   // Check to make sure the infowindow is not already opened on this marker.
  if (infowindow.marker != marker) {
    // Clear the infowindow content to give the streetview time to load.
   infowindow.setContent('');
   infowindow.marker = marker;
   // Make sure the marker property is cleared if the infowindow is closed.
   infowindow.addListener('closeclick', function() {
    infowindow.marker = null;
   });
   // set default
   infowindow.setContent('<div>' + marker.title +'</div>'+
                         '<div> searching ... </div>');
   var urlzomato = "https://developers.zomato.com/api/v2.1/restaurant?res_id="+marker.id;
   // Using jQuery
   var zomatoRequestTimeout = setTimeout(function(){
     infowindow.setContent('<div>' + marker.title +'</div>'+
                           '<div> Zomato timeout.</div>');
   }, 8000 ); // after 8 sec change the text

   // call Zomato to get info about this restaurant
   $.ajax({
      url: urlzomato,
      headers: {
          'user-key': "cf646db519cb2afbe5e5218c576f44a1",
      },
	  }).done(function (data) {
         // successful
		 console.log(data);
		 address = data.location.address || 'No location available';
		 rating  = data.user_rating.aggregate_rating  || 'No rating available';
		 url = data.menu_url || 'No menu available';
		 
        infowindow.setContent('<div>'+ marker.title + '</div>'+
                              '<div>'+ address +'</div>'+
                              '<div>Rating '+ rating +'</div>'+
                              '<div id="menu"> <a href="'+ url +'">menu</a></div>'
                              );

       clearTimeout(zomatoRequestTimeout);
      }).fail(function (jqXHR, textStatus) {
        // error handling
        infowindow.setContent('<div>' + marker.title +'</div>'+
                              '<div> Zomato failed to loaded.</div>');
    });
   infowindow.open(map, marker);
 }
}


// This function will toggle the clicked marker
function toggleBounce(clickedMarker) {
  marker = null;
  for (var i = 0; i < markers.length; i++) {

	 if(clickedMarker.id == markers[i].id) {
	    // found clicked restaurant
        marker = markers[i];
      }
	  else {
	     // make sure only one marker is animated at the time
		 markers[i].setAnimation(null);
	  }
  }
  if(marker !== null ){
     // do something with found restaurant
     if (marker.getAnimation() !== null) {
         marker.setAnimation(null);
     }
     else {
          google.maps.event.trigger(marker, 'click');
     }
  }
}


// This function will loop through the listings and hide them all.
function hideMarkers() {
  for (var i = 0; i < markers.length; i++) {
    markers[i].setMap(null);
  }
}

// This function will loop through the listings and display them all.
function displayMarkers(locationlist) {
  hideMarkers();
  locationlist().forEach(function(location){
    //console.log(location['title'])
    for (var i = 0; i < markers.length; i++) {
      if(markers[i].id == location.id){
        markers[i].setMap(map);
      }
    }
  });
}

// Asynchronous Data Usage fallback error handling method.
function myonError() {
  alert("Sorry google maps could not be loaded.");
}

var ViewModel = function() {
    // self maps to the view-model
    var self = this;
    self.navtitle = ko.observable("Hide Navegation");
    self.shownav = ko.observable(true);
    self.restaurant = ko.observable("");
    self.locationlist = ko.observableArray([]);
    self.newslist = ko.observableArray([]);

    locations.forEach(function(location){
      self.locationlist.push(location);
    });

  // this function toggle the nav bar ON/OFF
  self.togglenav = function() {
    self.shownav(!self.shownav());
    if(self.shownav()){
      self.navtitle("Hide Navegation");
    }
    else {
      self.navtitle("Show Navegation");
    }
  };

  // this function toggle marker upon clicked
  self.toggleMarker = function(clickedMarker) {
       toggleBounce(clickedMarker);
  };

  // this function filter the list of restaurants
  self.filterRest = function(){
    self.locationlist([]);
    locations.forEach(function(location){
	ltlower = location.title.toLowerCase();
	rlower =  self.restaurant().toLowerCase();
    if(ltlower.indexOf(rlower) !== -1 ){
        self.locationlist.push(location);
    }
    });
       displayMarkers(self.locationlist);
  };

};

ko.applyBindings(new ViewModel());
