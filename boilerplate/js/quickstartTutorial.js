//.map intializes the div given, with the setView method, which determines the center
var myMap = L.map('mapid').setView([51.505, -.09], 13);

//.tileLayer defines the map "picture" of the website, which is added to the website and map by the .addTo method
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(myMap);

//.marker helps display icons on the map that can be clicked and dragged
var marker = L.marker([51.5, -0.09]).addTo(myMap);

//.circle draws circle overlays on the map at a specified location, with parameters for color and other features
var circle = L.circle([51.508, -0.11], {
    color: 'red',
    fillColor: '#f03',
    fillOpacity: 0.5,
    radius: 500
}).addTo(myMap);

//.polygon draws polygon overlays on the map at a specified location, with parameters for color and other features
var polygon = L.polygon([
    [51.509, -0.08],
    [51.503, -0.06],
    [51.51, -0.047]
]).addTo(myMap);

//.openPopup opens up popups one at a time, while .bindPopup binds a popup and layers together at once
marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
circle.bindPopup("I am a circle.");
polygon.bindPopup("I am a polygon.");

//.setLatLng sets the lat and long of an object in the map, like a popup; .setContent defines the content of a popup; .openOn opens a popup on the map, while closing the previous one
var popup = L.popup()
    .setLatLng([51.5, -0.09])
    .setContent("I am a standalone popup.")
    .openOn(myMap);

var popup = L.popup();

//.toString is used for debugging, by returning a string representation of the point; .latlng defines lat and long of a point
function onMapClick(e) {
    popup
        .setLatLng(e.latlng)
        .setContent("You clicked the map at " + e.latlng.toString())
        .openOn(myMap);
}

//.on defines event listeners
myMap.on('click', onMapClick);