// Knockout JS custom handler definition
ko.bindingHandlers.map = {
    /**
     * @description Creates a map and all features of the map
     * @param {object} element - DOM element to be bound
     * @param {function} valueAccessor - function to get the current model
     * @param {object} allBindingsAccessor - all model values
     * @param {object} viewModel - view model object
     */
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        // get an observable model object
        var mapObj = ko.unwrap(valueAccessor());
        // create LatLng object for the initial center
        var latLng = new google.maps.LatLng(
            ko.unwrap(mapObj.lat),
            ko.unwrap(mapObj.lng));
        // creates map options object
        var mapOptions = { center: latLng,
                           zoom: 16,
                           mapTypeId: google.maps.MapTypeId.ROADMAP};

        // creates gogole map object
        mapObj.googleMap = new google.maps.Map(element, mapOptions);
        // creates a center pin
        mapObj.marker = new google.maps.Marker({
            map: mapObj.googleMap,
            position: latLng,
            title: "Drag to another location",
            draggable: true,
            animation: google.maps.Animation.DROP
        });
        // draws markers of crimes
        updateData(mapObj);

        // a callback function when the center pin is moved
        mapObj.onChangedCoord = function(newValue) {
             var latLng = new google.maps.LatLng(
                ko.unwrap(mapObj.lat),
                ko.unwrap(mapObj.lng));
            mapObj.googleMap.setCenter(latLng);
        };

        // a callback function when the filter is changed
        mapObj.onChangedFilter = function(newValue) {
            var size = mapObj.markers().length;
            for(var i=0; i<mapObj.markers().length; i++) {
                var m = mapObj.markers()[i];
                if ("all" == mapObj.category() || m.category == mapObj.category()) {
                    m.setVisible(true);
                } else {
                    m.setVisible(false);
                }
            }
        }

        // a callback function when the center pin is located in
        // the new place.
        mapObj.onMarkerMoved = function(dragEnd) {
            var latLng = mapObj.marker.getPosition();
            mapObj.lat(latLng.lat());
            mapObj.lng(latLng.lng());
            updateData(mapObj);
        };

        mapObj.onCenterChanged = function(newValue) {
            var latLng = new google.maps.LatLng(
                ko.unwrap(mapObj.lat),
                ko.unwrap(mapObj.lng));
            mapObj.marker.setPosition(latLng);
            updateData(mapObj);
        }

        // set callback functions to the objects
        mapObj.lat.subscribe(mapObj.onChangedCoord);
        mapObj.lng.subscribe(mapObj.onChangedCoord);
        mapObj.category.subscribe(mapObj.onChangedFilter);
        google.maps.event.addListener(mapObj.marker, "dragend", mapObj.onMarkerMoved);
        google.maps.event.addListener(mapObj.googleMap, "center_changed", mapObj.onCenterChanged);

        // bind this hander to the DOM element
        $("#" + element.getAttribute("id")).data("mapObj",mapObj);
    },
};

/**
* @description Renders crime markers
* @param {object} mapObj - observable view model for a map and markers
*/
var updateData = function(mapObj) {
    // clear all markers in the old place
    while(mapObj.markers().length > 0) {
        m = mapObj.markers().shift()
        m.setMap(null);
    }
    // make a request to API endpoint
    url = "/api/JSON?lat=" +
        ko.utils.unwrapObservable(mapObj.lat) +
        "&lng=" +
        ko.utils.unwrapObservable(mapObj.lng);
    $.getJSON(url, function(data) {
        $.each(data, function(i, entry) {
            if (entry.position) {
                // create each marker
                var marker = new google.maps.Marker({
                    map: mapObj.googleMap,
                    position: new google.maps.LatLng(entry.position.lat,
                                                     entry.position.lng),
                    category: entry.category,
                    title: entry.title,
                    icon: entry.icon,
                });
                // create an infowindow of this marker
                var infoObj = new google.maps.InfoWindow({
                    content: entry.content
                });
                // add lister function when infowindow is opened.
                marker.addListener("click", function() {
                    infoObj.open(mapObj.googleMap, marker);
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                });
                // add listener function when infowindow is closed.
                infoObj.addListener("closeclick", function() {
                    marker.setAnimation(null);
                });
                // saves markers
                mapObj.markers().push(marker);
            }
        });
    });
};

/**
* @description View model definition
*/
var myMapViewModel = function() {
    var self = this;
    // obervable models
    self.myMap = ko.observable({
        // Brier Creek lat and lng
        lat: ko.observable(35.912697),
        lng: ko.observable(-78.781792),
        markers: ko.observableArray([]),
        category: ko.observable("all")
    });

    // a function called when filter button is clicked
    this.setCategory = function(data) {
        self.myMap().category(data);
    };

    this.setCenter = function(lat, lng) {
        console.log(lat + ", " + lng);
        self.myMap().lat(lat);
        self.myMap().lng(lng);
    };
}

$(document).ready(function () {
   ko.applyBindings(new myMapViewModel);
});
