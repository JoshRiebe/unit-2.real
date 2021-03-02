//declare map var in global scope
var myMap3;
var minValue;
//function to instantiate the Leaflet map
function createMap(){
    //creates map and initial map display
    myMap3 = L.map('mapid', {
        center: [0, 0],
        zoom: 2
    });

    //add OSM base tilelayer
    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
    }).addTo(myMap3);

    //call getData function
    getData(myMap3);
};

function calculateMinValue(data){
    //create empty array to store all data values
    var allValues = [];
    //loop through each city
    for(var city of data.features){
        //loop through each year
        for(var year = 1950; year <= 2010; year+=10){
            //get population for current year
            var value = Number(city.properties[String(year)].replace(/,/g, ""));
            
            //add value to array
            allValues.push(value);
        }
    };
    console.log(Math.min(...allValues));
    //get minimum value of our array
    var minValue = Math.min(...allValues);
    
    return minValue;
};

//calculate the radius of each proportional symbol
function calcPropRadius(attValue) {
    //constant factor adjusts symbol sizes evenly
    var minRadius = 5;
    /* minValue = 63000; */
    //Flannery Apperance Compensation formula
    var radius = 1.0083 * Math.pow(attValue/minValue,0.5715) * minRadius;
    
    return radius;
};

//function to convert markers to circle markers
function pointToLayer(feature, latlng, attributes){
    ////STEP #4: determine attribute to visualize with proportional symbol
    var attribute = attributes[0];
    

    //create marker options
    var options = {
        fillColor: "#ff7800",
        color: "#000",
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
    };
    //determine value for selected attribute for each feature
    var attValue = Number(feature.properties[attribute].replace(/,/g, ""));
    
    //give each feature's circle marker a radius based on attribute value
    options.radius = calcPropRadius(attValue);

    //create circle marker layer
    var layer = L.circleMarker(latlng, options);

    //build popup content string
    var popupContent = "<p><b>City:</b> " + feature.properties.City + "</p>"
    popupContent += "<p><b>Population in " + attribute + ":</b> " + feature.properties[attribute] + "</p>";

    //bind the popup to the circle marker
    layer.bindPopup(popupContent, {
        offset: new L.Point(1,-options.radius) 
    });

    //return the circle marker to the L.geoJson pointToLayer option
    return layer; 
};

//add circle markers for point features to map
function createPropSymbols(data, attributes){
    //create Leadlet GeoJSON layer and add it to map
    L.geoJson(data, {          
        pointToLayer: function(feature, latlng){
            return pointToLayer(feature, latlng, attributes);
        }
    }).addTo(myMap3);

};

////Step 1: Create new sequence controls
function createSequenceControls(attributes){
    //create range input element (slider)
    $('#panel').append('<input class="range-slider" type="range">');

    //set slider attributes
    $('.range-slider').attr({
        max: 6,
        min: 0,
        value: 0,
        step: 1
    });
    
    //Step 5: input listener for slider
    $('.range-slider').on('input', function(){
        var index = $(this).val();        
        console.log(index);
        updatePropSymbols(attributes[index]);
    });

    $('#panel').append('<button class="step" id="reverse">Reverse</button>');
    $('#panel').append('<button class="step" id="forward">Forward</button>');
    //replace button content with images
    $('#reverse').html('<img src="img/noun_leftarrow.png">');
    $('#forward').html('<img src="img/noun_rightarrow.png">');
    

    $('.step').click(function(){
        var index = $('.range-slider').val();

        if ($(this).attr('id') == 'forward'){
            index++;
            //Step 7: if past the last attribute, wrap around to first attribute
            index = index > 6 ? 0 : index;
        } else if ($(this).attr('id') == 'reverse'){
            index--;
            //Step 7: if past the first attribute, wrap around to last attribute
            index = index < 0 ? 6 : index;
        };

        //Step 8: update slider
        $('.range-slider').val(index);
        console.log(attributes[index]);
        updatePropSymbols(attributes[index]);
    });

    
};

//Step 10: Resize proportional symbols according to new attribute values
function updatePropSymbols(attribute){
    myMap3.eachLayer(function(layer){
        if (layer.feature && layer.feature.properties[attribute]){
            if (layer.feature && layer.feature.properties[attribute]){
                //access feature properties
                var props = layer.feature.properties;
                var propsTwo = Number(props[attribute].replace(/,/g, ""));
                //update each feature's radius based on new attribute values
                var radius = (calcPropRadius(propsTwo));
                console.log(radius);
                layer.setRadius(radius);
    
                //add city to popup content string
                var popupContent = "<p><b>City:</b> " + props.City + "</p>";
    
                //add formatted attribute to panel content string
                var year = attribute;
                popupContent += "<p><b>Population in " + year + ":</b> " + props[attribute] + "</p>";
    
                //update popup content            
                popup = layer.getPopup();            
                popup.setContent(popupContent).update();
            };
        };
    });
}; 

//Above Example 3.10...Step 3: build an attributes array from the data
function processData(data){
    //empty array to hold attributes
    var attributes = [];

    //properties of the first feature in the dataset
    var properties = data.features[0].properties;

    //push each attribute name into attributes array
    for (var attribute in properties){
        //only take attributes with population values
        if (attribute != "City"){
            attributes.push(attribute);
        }
    };
    
    return attributes;
};


//import GeoJSON data
function getData(){
    $.ajax("data/activity5.geojson", {
        dataType: "json",
        success: function(response){
            var attributes = processData(response);
                minValue = calculateMinValue(response);
        //call function to create proportional symbols and UI elements
            createPropSymbols(response, attributes);         
            createSequenceControls(attributes);
        }
    });
};

//opens document once it has loaded
$(document).ready(createMap);