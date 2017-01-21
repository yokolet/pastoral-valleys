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

        url = "/api/JSON?lat=" +
            ko.utils.unwrapObservable(mapObj.lat) +
            "&lng=" +
            ko.utils.unwrapObservable(mapObj.lng);
        // TODO: center is draggable
        // but, other marker is not
        // when center is dragged, it should call api
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
                    google.maps.event.addListener(marker, 'dragend', mapObj.onMarkerMoved);
                }
            });
        });

        mapObj.onChangedCoord = function(newValue) {
            var latLng = new google.maps.LatLng(
                ko.utils.unwrapObservable(mapObj.lat),
                ko.utils.unwrapObservable(mapObj.lng));
            mapObj.googleMap.setCenter(latLng);
        };

        mapObj.onMarkerMoved = function(dragEnd) {
            var latLng = mapObj.marker.getPosition();
            mapObj.lat(latLng.lat());
            mapObj.lng(latLng.lng());
        };

        mapObj.lat.subscribe(mapObj.onChangedCoord);
        mapObj.lng.subscribe(mapObj.onChangedCoord);
        google.maps.event.addListener(mapObj.marker, 'dragend', mapObj.onMarkerMoved);

        $("#" + element.getAttribute("id")).data("mapObj",mapObj);
    }
};

var myMapViewModel = function() {
    var self = this;
    self.myMap = ko.observable({
        lat: ko.observable(35.8572),
        lng: ko.observable(-78.7147)
    });
}

$(document).ready(function () {
   ko.applyBindings(new myMapViewModel);
});
