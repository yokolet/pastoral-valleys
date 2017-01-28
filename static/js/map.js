var Location = function(data) {
    this.areaname = data["name"];
    this.lat = data["lat"];
    this.lng = data["lng"];
}

// Knockout JS custom handler definition
ko.bindingHandlers.anothermap = {
    init: function (element, valueAccessor, allBindings, viewModel) {
        var value = valueAccessor();
        var areaname = value.areaname;
        var lat = value.centerLat;
        var lng = value.centerLng;
        console.log("init: " + areaname + ", "+ lat + ", " + lng);
        var mapObj = ko.unwrap(value.mapState);
        mapObj.current(new Location({"areaname": areaname, "lat": lat, "lng": lng}));
        areanameData(mapObj);
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

        mapObj.onAreanameLoad = function(data) {
            console.log("onAreanameLoad");
            console.log(mapObj.current());
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
                marker.addListener("click", function() {
                    updateData(mapObj, marker);
                });
                // add listener function when infowindow is closed.
                marker.info.addListener("closeclick", function() {
                    marker.setAnimation(null);
                });
                mapObj.locMarkers().push(marker);
            });
        }
        mapObj.locationLoaded.subscribe(mapObj.onAreanameLoad);

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

        // a callback function when the filter is changed
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
        mapObj.category.subscribe(mapObj.onChangedFilter);
    }
};

var areanameData = function(mapObj) {
    url = "/api/location/JSON?";
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

var updateData = function(mapObj, marker) {
    // clear all markers in the old place
    while(mapObj.crimeMarkers().length > 0) {
        m = mapObj.crimeMarkers().shift()
        m.setMap(null);
    }
    var lat = marker.position.lat();
    var lng = marker.position.lng();
    console.log("updateData: " + lat + ", " + lng);
    // make a request to API endpoint
    url = "/api/JSON?lat=" + lat + "&lng=" + lng;
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
                mapObj.crimeMarkers().push(marker);
            }
        });
        mapObj.googleMap.setCenter(marker.position);
        mapObj.googleMap.setZoom(16);
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
        currentMarker: ko.observable(),
        crimeMarkers: ko.observableArray([]),
        category: ko.observable("al"),
    });

    this.setCurrent = function(index, lat, lng) {
        console.log(index + ", " + lat + ", " + lng);
        self.mapState().previousMarker(self.mapState().currentMarker());
        self.mapState().currentMarker(self.mapState().locMarkers()[parseInt(index)-1]);
    };

    // a function called when filter button is clicked
    this.setCategory = function(data) {
        self.mapState().category(data);
    };

}

$(document).ready(function () {
   ko.applyBindings(new mapModel);
});
