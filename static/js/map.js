var Location = function(data) {
    this.zipcode = data["zipcode"];
    this.lat = data["lat"];
    this.lng = data["lng"];
}

// Knockout JS custom handler definition
ko.bindingHandlers.anothermap = {
    init: function (element, valueAccessor, allBindings, viewModel) {
        var value = valueAccessor();
        var zipcode = value.zipcode;
        var lat = value.centerLat;
        var lng = value.centerLng;
        console.log("init: " + zipcode + ", "+ lat + ", " + lng);
        var mapObj = ko.unwrap(value.mapState);
        mapObj.current(new Location({"zipcode": zipcode, "lat": lat, "lng": lng}));
        zipcodeData(mapObj);
        $("#" + element.getAttribute("id")).data("mapObj",mapObj);
    },
    update: function (element, valueAccessor, allBindings, viewModel) {
        var value = valueAccessor();
        var mapObj = ko.unwrap(value.mapState);
        var latLng = new google.maps.LatLng(value.centerLat,
                                            value.centerLng);
        var mapOptions = { center: latLng,
                           zoom: 10, 
                           mapTypeId: google.maps.MapTypeId.ROADMAP};
        mapObj.googleMap = new google.maps.Map(element, mapOptions);

        mapObj.onZipcodeLoad = function(data) {
            console.log("onZipcodeLoad");
            console.log(mapObj.current());
            mapObj.locations().forEach(function(loc) {
                var marker = new google.maps.Marker({
                    map: mapObj.googleMap,
                    position: new google.maps.LatLng(loc.lat,
                                                     loc.lng),
                    title: "Click for details",
                    animation: google.maps.Animation.DROP,
                    info: new google.maps.InfoWindow({
                        content: "zipcode: " + loc.zipcode
                    })
                });
                marker.addListener("click", function() {
                    marker.info.open(mapObj.googleMap, marker);
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                });
                // add listener function when infowindow is closed.
                marker.info.addListener("closeclick", function() {
                    marker.setAnimation(null);
                });
                mapObj.locMarkers().push(marker);
            });
        }
        mapObj.locationLoaded.subscribe(mapObj.onZipcodeLoad);

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
        }
        mapObj.currentMarker.subscribe(mapObj.onCurrentChange);
    }
};

var zipcodeData = function(mapObj) {
    url = "/api/zipcode/JSON?";
    $.getJSON(url, function(data) {
        $.each(data, function(i, entry) {
            //console.log(i + ": " + entry);
            var loc = new Location(entry);
            mapObj.locations().push(loc);
        });
        console.log(mapObj.current().lat);
        console.log(mapObj.current().lng);
        mapObj.locationLoaded(true);
    });
};


/**
* @description View model definition
*/
var mapModel = function() {
    var self = this;
    self.mapState = ko.observable({
        locations: ko.observableArray([]),
        locationLoaded: ko.observable(false),
        current: ko.observable(),
        locMarkers: ko.observableArray([]),
        previousMarker: ko.observable(),
        currentMarker: ko.observable()
    });

    this.setCurrent = function(index, lat, lng) {
        console.log(index + ", " + lat + ", " + lng);
        self.mapState().previousMarker(self.mapState().currentMarker());
        self.mapState().currentMarker(self.mapState().locMarkers()[parseInt(index)-1]);
    };
}

$(document).ready(function () {
   ko.applyBindings(new mapModel);
});
