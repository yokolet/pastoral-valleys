ko.bindingHandlers.map = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        console.log('init function');
        var mapObj = ko.unwrap(valueAccessor());
        console.log(mapObj);
        var latLng = new google.maps.LatLng(
            ko.unwrap(mapObj.lat),
            ko.unwrap(mapObj.lng));
        var mapOptions = { center: latLng,
                           zoom: 16,
                           mapTypeId: google.maps.MapTypeId.ROADMAP};

        mapObj.googleMap = new google.maps.Map(element, mapOptions);
        mapObj.marker = new google.maps.Marker({
            map: mapObj.googleMap,
            position: latLng,
            title: "Drag to other areas",
            draggable: true,
            animation: google.maps.Animation.DROP
        });
        updateData(mapObj);

        mapObj.onChangedCoord = function(newValue) {
            console.log('onchangecoord');
            var latLng = new google.maps.LatLng(
                ko.unwrap(mapObj.lat),
                ko.unwrap(mapObj.lng));
            mapObj.googleMap.setCenter(latLng);
        };

        mapObj.onChangedFilter = function(newValue) {
            console.log('onchangedfileter');
            var size = mapObj.markers().length;
            console.log(size);
            console.log(mapObj.markers()[0].category);
            console.log(mapObj.category());
            for(var i=0; i<mapObj.markers().length; i++) {
                var m = mapObj.markers()[i];
                if ('all' == mapObj.category() || m.category == mapObj.category()) {
                    m.setVisible(true);
                } else {
                    m.setVisible(false);
                }
            }
        }

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
        mapObj.category.subscribe(mapObj.onChangedFilter);
        google.maps.event.addListener(mapObj.marker, 'dragend', mapObj.onMarkerMoved);

        $("#" + element.getAttribute("id")).data("mapObj",mapObj);
    },

    update: function(element, valueAccessor, allBinsings, viewModel) {
        console.log('update function');
        var mapObj = ko.unwrap(valueAccessor());
        console.log(mapObj);
    }
};

var updateData = function(mapObj) {
    console.log('in updatedata: ' + mapObj.markers().length);
    console.log('0 ' + mapObj.markers()[0]);
    while(mapObj.markers().length > 0) {
        m = mapObj.markers().shift()
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
                    category: entry.category,
                    title: entry.title,
                    icon: entry.icon,
                });
                var infoObj = new google.maps.InfoWindow({
                    content: entry.content
                });
                marker.addListener('click', function() {
                    infoObj.open(mapObj.googleMap, marker);
                    marker.setAnimation(google.maps.Animation.BOUNCE);
                });
                infoObj.addListener('closeclick', function() {
                    marker.setAnimation(null);
                });
                mapObj.markers().push(marker);
            }
        });
    });
};

var myMapViewModel = function() {
    var self = this;
    self.myMap = ko.observable({
        lat: ko.observable(35.8356),
        lng: ko.observable(-78.6395),
        markers: ko.observableArray([]),
        category: ko.observable('all')
    });

    this.setCategory = function(data) {
        console.log('data ' + data);
        self.myMap().category(data);
        console.log(self.myMap());
    };

}

$(document).ready(function () {
   ko.applyBindings(new myMapViewModel);
});
