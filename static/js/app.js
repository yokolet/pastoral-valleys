var initialCats = [
    {
        clickCount: 0,
        name: 'Tabby',
        imgSrc: '/image/434164568_fea0ad4013_z.jpg',
        imgAttribution: 'https://www.flickr.com/photos/bigtallguy/434164568',
        nickNames: ['T', 'TeeBee', 'T-Bone' ,'Tab']
    },
    {
        clickCount: 0,
        name: 'Tiger',
        imgSrc: '/image/4154543904_6e2428c421_z.jpg',
        imgAttribution: 'https://www.flickr.com/photos/bigtallguy/434164568',
        nickNames: ['Tig']
    },
    {
        clickCount: 0,
        name: 'Scaredy',
        imgSrc: '/image/22252709_010df3379e_z.jpg',
        imgAttribution: 'https://www.flickr.com/photos/bigtallguy/434164568',
        nickNames: ['S']
    },
    {
        clickCount: 0,
        name: 'Shadow',
        imgSrc: '/image/1413379559_412a540d29_z.jpg',
        imgAttribution: 'https://www.flickr.com/photos/bigtallguy/434164568',
        nickNames: ['Shay']
    },
    {
        clickCount: 0,
        name: 'Sleepy',
        imgSrc: '/image/9648464288_2516b35537_z.jpg',
        imgAttribution: 'https://www.flickr.com/photos/bigtallguy/434164568',
        nickNames: ['Zzzz']
    }
];

var Cat = function(data) {
    this.clickCount = ko.observable(data.clickCount);
    this.name = ko.observable(data.name);
    this.imgSrc = ko.observable(data.imgSrc);
    this.imgAttribution = ko.observable(data.imgAttribution);
    this.nickNames = ko.observableArray(data.nickNames);
    this.title = ko.computed(function() {
        var title;
        var clicks = this.clickCount();
        if (clicks < 5) {
            title = 'Newborn';
        } else if (clicks < 10) {
            title = 'Infant';
        } else if (clicks < 15) {
            title = 'Child';
        } else if (clicks < 20) {
            title = 'Teen';
        } else if (clicks < 25) {
            title = 'Adult';
        } else {
            title = 'Ninja';
        }
        return title;
    }, this);
};

var ViewModel = function() {
    var self = this;

    this.catList = ko.observableArray([]);
    initialCats.forEach(function(catItem) {
        self.catList.push(new Cat(catItem));  // see 'self' here.
    });
    this.currentCat = ko.observable(this.catList()[0]);

    this.incrementCounter = function() {
        this.clickCount(this.clickCount() + 1);
    };

    this.changeCat = function(data, index) {
        console.log('index = ' + index());
        console.log('name = ' + data());
        console.log(self.catList()[index()]);
        self.currentCat(self.catList()[index()]);
    };

    this.setCat = function(clickedCat) {
        self.currentCat(clickedCat);
    };
}

//ko.applyBindings(new ViewModel());

ko.bindingHandlers.map = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var mapObj = ko.utils.unwrapObservable(valueAccessor());
        var latLng = new google.maps.LatLng(
            ko.utils.unwrapObservable(mapObj.lat),
            ko.utils.unwrapObservable(mapObj.lng));
        var mapOptions = { center: latLng,
                           zoom: 6,
                           mapTypeId: google.maps.MapTypeId.ROADMAP};

        mapObj.googleMap = new google.maps.Map(element, mapOptions);

        mapObj.marker = new google.maps.Marker({
            map: mapObj.googleMap,
            position: latLng,
            title: "You Are Here",
            draggable: true
        });

        var infoObj = new google.maps.InfoWindow({
            content: '<b>Here we are!</b>'
        });

        mapObj.marker.addListener('click', function() {
            infoObj.open(mapObj.googleMap, mapObj.marker);
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
        lat: ko.observable(40.76),
        lng: ko.observable(-73.98)
    });
}

$(document).ready(function () {
   ko.applyBindings(new myMapViewModel);
});
