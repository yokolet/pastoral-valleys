/**
* Location object definition
* @param {Object} data - location data
*/
var Location = function(data) {
    this.areaname = data["name"];
    this.lat = data["lat"];
    this.lng = data["lng"];
}

// Knockout JS custom handler definition
ko.bindingHandlers.anothermap = {
    init: function (element, valueAccessor, allBindings, viewModel) {
        // values come from html data-binding
        var value = valueAccessor();
        var areaname = value.areaname;
        var lat = value.centerLat;
        var lng = value.centerLng;
        console.log("init: " + areaname + ", "+ lat + ", " + lng);
        var mapObj = ko.unwrap(value.mapState);
        // Set initial center position
        mapObj.initialLoc(new Location({"areaname": areaname, "lat": lat, "lng": lng}));
        // Load all area name data
        areanameData(mapObj);
        $("#" + element.getAttribute("id")).data("mapObj",mapObj);
    },
    update: function (element, valueAccessor, allBindings, viewModel) {
        var value = valueAccessor();
        var mapObj = ko.unwrap(value.mapState);
        console.log("update:" + mapObj.initialLoc().lat + ", " + value.centerLat);
        var latLng = new google.maps.LatLng(mapObj.initialLoc().lat,
                                            mapObj.initialLoc().lng);
        var mapOptions = { center: latLng,
                           zoom: 12,
                           mapTypeId: google.maps.MapTypeId.ROADMAP};
        // Render a map
        mapObj.googleMap = new google.maps.Map(element, mapOptions);

        // Render location markers
        mapObj.onAreanameLoad = function(data) {
            console.log("onAreanameLoad");
            console.log(mapObj.initialLoc());
            mapObj.locations().forEach(function(loc) {
                console.log("onAreanameLoad: " + loc.lat + ", " + loc.lng);
                var content_string = "Area Name: <b>" + loc.areaname + "</b>";
                content_string += "<br/>Click this pin for crime data"
                var marker = new google.maps.Marker({
                    map: mapObj.googleMap,
                    position: new google.maps.LatLng(loc.lat,
                                                     loc.lng),
                    title: loc.areaname,
                    animation: google.maps.Animation.DROP,
                    info: new google.maps.InfoWindow({
                        content: content_string
                    })
                });
                // Load crime data when a location marker is clicked,
                marker.addListener("click", function() {
                    updateData(mapObj, marker);
                });
                // Add listener function when infowindow is closed.
                marker.info.addListener("closeclick", function() {
                    marker.setAnimation(null);
                });
                // Save a marker
                mapObj.locMarkers().push(marker);
            });
        }
        // Watches location data loading completion
        mapObj.locationLoaded.subscribe(mapObj.onAreanameLoad);

        // Deselect old location marker when another location is clicked
        mapObj.onCurrentChange = function(data) {
            console.log("current: " + mapObj.currentMarker().title);
            var previous = mapObj.previousMarker();
            if (previous) {
                previous.info.close();
                previous.setAnimation(null);
            }
            var marker = mapObj.currentMarker();
            marker.info.open(mapObj.googleMap, marker);
            marker.setAnimation(google.maps.Animation.BOUNCE);
            mapObj.googleMap.setCenter(marker.position);
        }
        // Watches a currentMarker state change
        mapObj.currentMarker.subscribe(mapObj.onCurrentChange);

        // Re-render crime markers looking at a current category state
        mapObj.onChangedFilter = function(data) {
            var size = mapObj.crimeMarkers().length;
            var markers = mapObj.crimeMarkers();
            for(var i=0; i<markers.length; i++) {
                var m = markers[i];
                if ("all" == mapObj.category() || m.category == mapObj.category()) {
                    m.setVisible(true);
                } else {
                    m.setVisible(false);
                }
            }
        }
        // Watches a category(filter) state change
        mapObj.category.subscribe(mapObj.onChangedFilter);
    }
};

// Create DOM elements to show error message
var error_message = function(text) {
    var message = '';
    message += '<div class="callout alert" data-closable>\n';
    message += text + '\n';
    message += '  <button class="close-button callout-alert-button" aria-label="Dismiss alert" type="button" data-close>\n';
    message += '    <span aria-hidden="true">&times;</span>\n';
    message += '  </button>\n'
    message += '</div>';
    return $(message)
}

// Load location data
var areanameData = function(mapObj) {
    url = "/api/location/JSON?";
    $.getJSON(url, function(data) {
        $.each(data, function(i, entry) {
            //console.log(i + ": " + entry);
            var loc = new Location(entry);
            mapObj.locations().push(loc);
        });
        console.log(mapObj.initialLoc().lat);
        console.log(mapObj.initialLoc().lng);
        mapObj.locationLoaded(true);
    })
        .fail(function(jqxhr, textStatus, error) {
            var $message = error_message("Failed to get area info from server");
            $("#error-area").prepend($message);
        });
};

// Checks whether the crime marker should be visible or not
var isVisible = function(mapObj, entry) {
    if ("all" == mapObj.category()) {
        return true;
    } else if (mapObj.category() == entry.category) {
        return true;
    } else {
        return false;
    }
};

// Load crime data
var updateData = function(mapObj, marker) {
    // Clear all markers in the old place
    while(mapObj.crimeMarkers().length > 0) {
        m = mapObj.crimeMarkers().shift()
        m.setMap(null);
    }
    var lat = marker.position.lat();
    var lng = marker.position.lng();
    console.log("updateData: " + lat + ", " + lng);
    // Make a request to API endpoint
    url = "/api/JSON?lat=" + lat + "&lng=" + lng;
    $.getJSON(url, function(data) {
        $.each(data, function(i, entry) {
            if (entry.position) {
                // Create each marker
                var marker = new google.maps.Marker({
                    map: mapObj.googleMap,
                    position: new google.maps.LatLng(entry.position.lat,
                                                     entry.position.lng),
                    visible: isVisible(mapObj, entry),
                    category: entry.category,
                    title: entry.title,
                    icon: entry.icon,
                });
                // Create an infowindow of this marker
                var infoObj = new google.maps.InfoWindow({
                    content: entry.content
                });
                // Add lister function when infowindow is opened.
                marker.addListener("click", function() {
                    infoObj.open(mapObj.googleMap, marker);
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                });
                // Add listener function when infowindow is closed.
                infoObj.addListener("closeclick", function() {
                    marker.setAnimation(null);
                });
                // Save a marker
                mapObj.crimeMarkers().push(marker);
            }
        });
        mapObj.googleMap.setCenter(marker.position);
        mapObj.googleMap.setZoom(16);
    })
        .fail(function(jqxhr, textStatus, error) {
            var $message = error_message("Failed to get crime data from server");
            $("#error-area").prepend($message);
        });
};


/**
* @description View model definition
*/
var mapModel = function() {
    var self = this;
    self.mapState = ko.observable({
        // location (area) data
        locations: ko.observableArray([]),
        // flag to signal location data loading completion
        locationLoaded: ko.observable(false),
        // initial center location
        initialLoc: ko.observable(),
        // all location markers
        locMarkers: ko.observableArray([]),
        // previous location marker
        previousMarker: ko.observable(),
        // current location marker
        currentMarker: ko.observable(),
        // all crime markers of the current location
        crimeMarkers: ko.observableArray([]),
        // current category (filter)
        category: ko.observable("all"),
    });

    // Change a current location
    this.setCurrent = function(index, lat, lng) {
        console.log(index + ", " + lat + ", " + lng);
        self.mapState().previousMarker(self.mapState().currentMarker());
        self.mapState().currentMarker(self.mapState().locMarkers()[parseInt(index)-1]);
    };

    // Change a current category (filter)
    this.setCategory = function(data) {
        self.mapState().category(data);
    };

}

$(document).ready(function () {
   ko.applyBindings(new mapModel);
});
