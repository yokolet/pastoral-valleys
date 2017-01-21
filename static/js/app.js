ko.bindingHandlers.map = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var mapObj = ko.utils.unwrapObservable(valueAccessor());
        var latLng = new google.maps.LatLng(
            ko.utils.unwrapObservable(mapObj.lat),
            ko.utils.unwrapObservable(mapObj.lng));
        var mapOptions = { center: latLng,
                           zoom: 16,
                           mapTypeId: google.maps.MapTypeId.ROADMAP};

        mapObj.googleMap = new google.maps.Map(element, mapOptions);
        mapObj.marker = new google.maps.Marker({
            map: mapObj.googleMap,
            position: latLng,
            title: "Center",
            draggable: true
        });
        updateData(mapObj);

        mapObj.onChangedCoord = function(newValue) {
            console.log('onchangecoord');
            var latLng = new google.maps.LatLng(
                ko.utils.unwrapObservable(mapObj.lat),
                ko.utils.unwrapObservable(mapObj.lng));
            mapObj.googleMap.setCenter(latLng);
        };

        mapObj.onMarkerMoved = function(dragEnd) {
            console.log('onmarkmoved');
            var latLng = mapObj.marker.getPosition();
            mapObj.lat(latLng.lat());
            mapObj.lng(latLng.lng());
            console.log('on fn: ' + mapObj.markers().length);
            updateData(mapObj);
        };

        mapObj.lat.subscribe(mapObj.onChangedCoord);
        mapObj.lng.subscribe(mapObj.onChangedCoord);
        google.maps.event.addListener(mapObj.marker, 'dragend', mapObj.onMarkerMoved);

        $("#" + element.getAttribute("id")).data("mapObj",mapObj);
    }
};

var updateData = function(mapObj) {
    console.log('in updatedata: ' + mapObj.markers().length);
    console.log('0 ' + mapObj.markers()[0]);
    for(i=0; i<mapObj.markers().length; i++) {
         m = mapObj.markers().shift();
         m.setMap(null);
    }
    console.log('after shifted: ' + mapObj.markers().length);
    url = "/api/JSON?lat=" +
        ko.utils.unwrapObservable(mapObj.lat) +
        "&lng=" +
        ko.utils.unwrapObservable(mapObj.lng);
    $.getJSON(url, function(data) {
        console.log("data should be here")
        $.each(data, function(i, entry) {
            if (entry.position) {
                var marker = new google.maps.Marker({
                    map: mapObj.googleMap,
                    position: new google.maps.LatLng(entry.position.lat,
                                                     entry.position.lng),
                    title: entry.title,
                    icon: entry.icon,
                });
                var infoObj = new google.maps.InfoWindow({
                    content: entry.content
                });
                marker.addListener('click', function() {
                    infoObj.open(mapObj.googleMap, marker);
                });
                mapObj.markers().push(marker);
            }
        });
    });
};

var myMapViewModel = function() {
    var self = this;
    self.myMap = ko.observable({
        lat: ko.observable(35.8572),
        lng: ko.observable(-78.7147),
        markers: ko.observableArray()
    });
}

$(document).ready(function () {
   ko.applyBindings(new myMapViewModel);
});
