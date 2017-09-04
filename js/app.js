var map, infowindow, bounds;

/**
 * Location data modal, it contains location info & marker object
 * @class
 * @property {string} name Location title
 * @property {number} lat Geo latitude value
 * @property {number} lng Geo longtitude value
 * @property {object} marker GMap marker object
 */
class Location {
  constructor(loc) {
    this.name = loc.restaurant.name || 'No name available';
    this.lat = loc.restaurant.location.latitude || 'No lat available';
    this.lng = loc.restaurant.location.longitude || 'No lng available';
	this.rating  = loc.restaurant.user_rating.aggregate_rating || 'No rating available';
	this.address = loc.restaurant.location.address || 'No location available';
	this.id = loc.restaurant.id || 'ID not available';
	this.url = loc.restaurant.menu_url || 'No menu available'
	this.cuisines = loc.restaurant.cuisines || 'No cuisines available'
    this.marker = this.createMarker();
  }

  createMarker() {
    let latLng = new google.maps.LatLng(this.lat, this.lng);
    let marker = new google.maps.Marker({
      map: map,
      title: this.name,
      position: latLng,
      animation: google.maps.Animation.DROP
    });

    google.maps.event.addListener(marker, 'click', () => {
      marker.setAnimation(google.maps.Animation.BOUNCE);
      setTimeout(() => {
        marker.setAnimation(null);
      }, 1400);
      
	  infowindow.setContent('<div>'+ this.name + '</div>'+
                            '<div>'+ this.address +'</div>'+
                            '<div>Rating '+ this.rating +'</div>'+
							'<div>Cuisines '+ this.cuisines +'</div>'+
                            '<div id="menu"> <a href="'+ this.url +'">menu</a></div>'
                            );						   
         
	   infowindow.open(map, marker); 
	  
    }); //.event
    
    // extend map bound object to cover the marker
    bounds.extend(latLng);
    
    return marker;
  }; //.createMarker

  triggerMarker(loc) {
    google.maps.event.trigger(loc.marker, 'click');
  }
}; //.Location

class ViewModel {
  constructor() {
    this.filterKeyword = ko.observable('');
    this.locations = ko.observableArray();
    this.shownav = ko.observable(true);	
    this.navtitle = ko.observable("Hide Navegation");	
    // Create Location objects
    //mockLocationData.forEach((loc) => {
    //  this.locations.push(new Location(loc));
    //});
	
	let zomatoRequestTimeout = setTimeout(function(){
        alert("Zomato timeout.")
       }, 60000 ); // after 8 sec change the text
	
	// call Zomato to get info about this restaurant
    $.ajax({
      url: "https://developers.zomato.com/api/v2.1/search?entity_id=1105&entity_type=city&count=20&sort=rating",      
	  headers: {
		  'user-key': "cf646db519cb2afbe5e5218c576f44a1",
       },
	  }).done((data) => {
         // successful
         // Create Location objects
		
         for(var i=0; i < data.restaurants.length; i++ ){
           this.locations.push(new Location(data.restaurants[i]));
         };

       clearTimeout(zomatoRequestTimeout);
      }).fail((jqXHR, textStatus) => {
        // error handling

      });
	
	
	// set map view to cover all markers
    map.fitBounds(bounds);

    /**
      * Filter function, return filtered list by
      * matching with user's keyword and 
      * show / hide markers accordingly
      */
    this.filterLocations = ko.computed(() => {
      if (!this.filterKeyword() || this.filterKeyword().trim() === '') {
        // No input found, return all locations
        this.locations().forEach((loc) => {
          loc.marker.setVisible(true);
        })
        map.fitBounds(bounds);

        return this.locations();
      } else {
        // input found, match keyword to filter
        return ko.utils.arrayFilter(this.locations(), (loc) => {
          let isMatch = loc.name.toLowerCase().indexOf(this.filterKeyword().toLowerCase()) !== -1;
          // show or hide the marker
          loc.marker.setVisible(isMatch);        
          return isMatch;
        });
      } //.conditional
    }); //.filterLocations
	
  }//.constructor

  // this function toggle the nav bar ON/OFF
  togglenav() {
    this.shownav(!this.shownav());
    if(this.shownav()){
      this.navtitle("Hide Navegation");
    }
    else {
      this.navtitle("Show Navegation");
    }
  };  //.togglenav
  
  
};

initMap = () => {
  // Constructor creates a new map - only center and zoom are required.
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 32.7889440000, lng: -79.9469090000},
    zoom: 14,
    mapTypeControl: true,
    mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_CENTER
    },
	zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.RIGHT_TOP,
    },
    scaleControl: true,
    streetViewControl: true,
    streetViewControlOptions: {
    position: google.maps.ControlPosition.RIGHT_TOP
    },
    fullscreenControl: true
  });
  
  infowindow = new google.maps.InfoWindow();
  bounds = new google.maps.LatLngBounds();
  ko.applyBindings(new ViewModel());
}
