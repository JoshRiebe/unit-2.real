//declare map var in global scope
var myLeafletMap;
var dataStats = {};

//function to instantiate the Leaflet map
function createMap(){
    //creates map and initial map display
    myLeafletMap = L.map('mapid', {
        center: [15, 0],
        zoom: 2,
        //constrain zoom and pan
        maxZoom: 8,
        minZoom: 2,
        maxBounds: [
            [65, -140],
            [-45, 160]
        ] 
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(myLeafletMap);

    //call getData function
    getData(myLeafletMap);
};

//function to calculate the minimum population value for later use
function calcStats(data){
    //create empty array to store all data values
    var allValues = [];
    //array to store string text of months
    var attrname = ["19-Oct", "19-Nov", "19-Dec", "20-Jan", "20-Feb", "20-Mar", "20-Apr", "20-May", "20-Jun"];
    //loop through each city
    for(var airport of data.features){
        //loop through each year
        for(var i = 0; i <= 8; i+=1){
            //get population for current year
            var value = Number(airport.properties[attrname[i]]);
            
            //add value to array
            allValues.push(value);
        }
    };
    //get min, max, mean stats for array
    dataStats.min = Math.min(...allValues)
    dataStats.max = Math.max(...allValues);
    //calculate meanValue
    var sum = allValues.reduce(function(a, b){return a+b});
    dataStats.mean = sum/allValues.length;
    //minMin value to help proportional symbols not be too small
    dataStats.minMin = 100000;
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 3;
    //if statement to keep airports with traffic less than 250,000 to the same size
    if (attValue < 250000) {
        attValue = 250000
    }; 
    //Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/dataStats.minMin,0.5715) * minRadius;
    //returns radius for future use
    return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    //determine attribute to visualize with proportional symbol
    var attribute = attributes[0];
    //create marker options
    var options = {
        fillColor: "#ede545",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.9,
    };
    //determine value for selected attribute for each feature and strip stringed numbers of their commas and convert them to numbers
    var attValue = Number(feature.properties[attribute]);
    
    //give each feature's circle marker a radius based on attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //popup content gets value from createPopupContent
    var popupContent = createPopupContent(feature.properties, attribute);

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(-1,-options.radius) 
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer; 
};

//function to create popup content
function createPopupContent(properties, attribute){
    //build popup content string
    var popupContent = "<p><b>Airport:</b> " + properties.Airport + "</p>";
    popupContent += "<p><b>City:</b> " + properties.City + "</p>";
    popupContent += "<p><b>Passenger Traffic in " + attribute + ":</b> " + properties[attribute] + "</p>";

    return popupContent;
};

//add circle markers for point features to map
function createPropSymbols(data, attributes){
    //create Leadlet GeoJSON layer and add it to map
    L.geoJson(data, {          
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(myLeafletMap);

};

//function to create new sequence controls
function createSequenceControls(attributes){
    var SequenceControl = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        
        onAdd: function () {
            var container = L.DomUtil.create('div', 'sequence-control-container');
            
            //create range input element, slider and arrows
            $(container).append('<input class="range-slider" type="range">');
            $(container).append('<button class="step" id="reverse">Reverse</button>');
            $(container).append('<button class="step" id="forward">Forward</button>');

            //disable any mouse event listeners for the container
            L.DomEvent.disableClickPropagation(container);
            return container;
        }
    });
    //adding sequence control to the map and giving it controls
    myLeafletMap.addControl(new SequenceControl());

    //set slider attributes
    $('.range-slider').attr({
        max: 8,
        min: 0,
        value: 0,
        step: 1
    });
    
    //input listener for slider and call for updatePropSymbols function
    $('.range-slider').on('input', function(){
        var index = $(this).val();        
        updatePropSymbols(attributes[index]);
    });
    
    //block of code that synchronizes the arrows with the sequencing
    $('#reverse').html('<img src="img/planeLeft.png">');
    $('#forward').html('<img src="img/planeRight.png">');
    
    //function to allow the clicking of the arrows to move through the years
    $('.step').click(function(){
        var index = $('.range-slider').val();
        //index increases when forward arrow is clicked
        if ($(this).attr('id') == 'forward'){
            index++;
            index = index > 8 ? 0 : index;
        
        //index decreases when reverse arrow is clicked
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            index = index < 0 ? 8 : index;
        };

        //update slider through updatePropSymbols function
        $('.range-slider').val(index);
        updatePropSymbols(attributes[index]);
    });
};

//Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    //syncs createLegend to updatePropSymbols
    $("span.month").html(attribute);
    myLeafletMap.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            //access feature properties
            var props = layer.feature.properties;
            var propsTwo = Number(props[attribute]);
            
            //update each feature's radius based on new attribute values
            var radius = (calcPropRadius(propsTwo));
            layer.setRadius(radius);

            //add city to popup content string
            var popupContent = createPopupContent(props, attribute);

            //update popup content            
            popup = layer.getPopup();            
            popup.setContent(popupContent).update();
        };
    });
}; 
//function to create the legend
function createLegend(attributes){
    var LegendControl = L.Control.extend({
        options: {
            position: 'bottomright'
        },
        onAdd: function () {
            // create the control container with a particular class name
            var container = L.DomUtil.create('div', 'legend-control-container');
            
            //add temporal legend div to container
            $(container).append('<div class="temporal-legend">Passenger Traffic in <span class="month">19-Oct</span></div>');
            
            //start attribute legend svg string
            var svg = '<svg id="attribute-legend" width="200px" height="95px">';
            
            //array for the circles
            var circles = ["max", "mean", "min"];

            //loop to add each circle and text to svg string
            for (var i=0; i<circles.length; i++){
                //assign the radius and cy attributes  
                var radius = calcPropRadius(dataStats[circles[i]]);  
                var cy = 90 - radius;  

                //circle string to define circles
                svg += '<circle class="legend-circle" id="' + circles[i] + '" r="' + radius + '"cy="' + cy + '" fill="#ede545" fill-opacity="0.8" stroke="#000000" cx="45"/>';  

                //evenly space out labels next to circles            
                var textY = i * 24 + 39;            

                //text string for the labels of circles
                svg += '<text id="' + circles[i] + '-text" x="90" y="' + textY + '">' + Math.round(Math.round(dataStats[circles[i]]*100)/100) + " Passengers" + '</text>';
            };

            //close svg string
            svg += "</svg>";

            //add attribute legend svg to container
            $(container).append(svg);
            
            //disables mouse functions of the map on top of the legend
            L.DomEvent.disableClickPropagation(container);
            return container;
        }
    });
    //adding legend to the map and giving it controls
    myLeafletMap.addControl(new LegendControl()); 
};

//function to build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //takes attributes that don't have header "City"
        if (attribute != "Airport" && attribute != "City"){
            attributes.push(attribute);
        }
    };
    //returns attributes for future use
    return attributes;
};


//function to import GeoJSON data
function getData(){
    $.ajax("data/AirportDataMinus3.geojson", {
        dataType: "json",
        success: function(response){
            //calls processData function to build array from data
            var attributes = processData(response);
                //calls function to calculate min, mean and max values of the passenger traffic
                calcStats(response);
        //call function to create proportional symbols, UI elements and the legend
            createPropSymbols(response, attributes);        
            createSequenceControls(attributes);
            createLegend(attributes); 
        }
    });
};

//opens document once it has loaded
$(document).ready(createMap);