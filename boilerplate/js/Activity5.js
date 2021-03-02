//declare map var in global scope
var myMap2;
//function to instantiate the Leaflet map
function createMap(){
    //creates map and initial map display
    myMap2 = L.map('mapid', {
        center: [0, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(myMap2);

    //call getData function
    getData();
};

//function to loop through properties to be placed into popups
function onEachFeature(feature, layer) {
    //create html string with all properties
    var popupContent = "";
    if (feature.properties) {
        //loop to add feature property names and values to html string
        for (var property in feature.properties){
            popupContent += "<p>" + property + ": " + feature.properties[property] + "</p>";
        }
        layer.bindPopup(popupContent);
    };
};

//function to retrieve data and place it on map with popups
function getData(){
    //load data of cities and their populations
    $.getJSON("data/activity5.geojson", function(response){            
    //creates marker options for the cities
        var geojsonMarkerOptions = {
            radius: 8,
            fillColor: "#ff7800",
            color: "#000",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        };
        //places circle markers on their respective cities, with the respective popups of the populations and city names
        L.geoJson(response, {
            pointToLayer: function (feature, latlng){
                return L.circleMarker(latlng, geojsonMarkerOptions);
            },
            onEachFeature: onEachFeature
        }).addTo(myMap2);
});
};
//opens document once it has loaded
$(document).ready(createMap);