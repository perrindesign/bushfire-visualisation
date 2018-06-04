//
//
//Slider 
//
//

//Formatting the dates
var formatDateIntoYear = d3.timeFormat("%Y");
var formatDate = d3.timeFormat("%B %Y");
var searchDate = d3.timeFormat("%Y-%m");

var startDate = new Date("2000-12-31"),
    endDate = new Date("2016-12-01");

var playButton = d3.select("#play-button");
var dateStat = d3.select("#date-stat");

var margin = { top: 0, right: 50, bottom: 0, left: 50 },
    width = 900 - margin.left - margin.right,
    height = 70 - margin.top - margin.bottom;

var moving = false;
var currentValue = 0;
var targetValue = width;

var svgSlider = d3.select("#slider")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height);

var x = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, width])
    .clamp(true);

var slider = svgSlider.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + margin.left + "," + height / 2 + ")");

slider.append("line")
    .attr("class", "track")
    .attr("x1", x.range()[0])
    .attr("x2", x.range()[1])
    .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
    .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function () { slider.interrupt(); })
        .on("start drag", function () { update(x.invert(d3.event.x)); }));

slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
    .data(x.ticks(16))
    .enter()
    .append("text")
    .attr("x", x)
    .attr("y", -40)
    .attr("text-anchor", "middle")
    .text(function (d) { return formatDateIntoYear(d); });

//var label = slider.append("text")
//    .attr("class", "label")
//    .attr("text-anchor", "middle")
//    .text(formatDate(startDate))
//    .attr("transform", "translate(0," + (-25) + ")")

dateStat.text("January 2001");

var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);

function step() {
    update(x.invert(currentValue));
    currentValue = currentValue + (targetValue/181);
    if (currentValue > targetValue) {
      moving = false;
      currentValue = 0;
      clearInterval(timer);
      playButton.text("Play");
      // console.log("Slider moving: " + moving);
    }
}

function update(h) {
    // update position and text of label according to slider scale
    handle.attr("cx", x(h));
    //label
    //    .attr("x", x(h))
    //    .text(formatDate(h));
    dateStat.text(formatDate(h));
    // filter data set and redraw plot
    renderSpots(searchDate(h));
}

//
//
//Map 
//
//

//Width and height
var w = 1000;
var h = 700;
var areas = [];

//Define path generator, using the geoMercator projection

var projection = d3.geoMercator()
    .center([134, -25])
    .scale(800)
    .translate([w / 2, h / 2]);

var path = d3.geoPath()
    .projection(projection);

//Define quantize scale to sort data values into buckets of color
var color = d3.scaleQuantize()
    .range(["rgb(0,0,0)",
        "rgb(50,50,50)",
        "rgb(75,75,75)",
        "rgb(105,105,105)",
        "rgb(128,128,128)",
        "rgb(140,140,140)",
        "rgb(169,169,169)",
        "rgb(192,192,192)",
        "rgb(211,211,211)",
        "rgb(220,220,220)",
        "rgb(245,245,245)",
        "rgb(255,255,255)"]);

//Number formatting for population values
var formatAsThousands = d3.format(",");  //e.g. converts 123456 to "123,456"

//Create SVG element
var svgMap = d3.select("#map")
    .append("svg")
    .attr("width", w)
    .attr("height", h);

//Load in GeoJSON data
d3.json("australia.json").then(function (data) {



    for (var i = 0; i < data.features.length; i++) {
        //var n = data.features[i].properties.SA2_NAME16; 
        var a = data.features[i].properties.AREASQKM16;
        //names.push(n);
        areas.push(a);
    }

    //Set input domain for color scale
    color.domain([
        d3.min(areas),
        d3.max(areas)
    ]);

    //Bind data and create one path per GeoJSON feature
    svgMap.selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr("d", path)
        .style("fill", function (d) {
            var value = d.properties.AREASQKM16;
            //return color(value);
            return "rgb(75,75,75)"
        })
        .style("stroke", "rgba(128,128,128,0.5)")
        .style("stroke-width", "1");
    
    playButton
        .on("click", function() {
        var button = d3.select(this);
        if (button.text() == "Pause") {
          moving = false;
          clearInterval(timer);
          // timer = 0;
          button.text("Play");
        } else {
          moving = true;
          timer = setInterval(step, 1000);
          button.text("Pause");
        }
        console.log("Slider moving: " + moving);
    })

    renderSpots("2001-01");
    

});
  
function renderSpots(date) {
    //Load in hotspots data
    d3.csv("data/" + date + ".csv").then(function (data) {
        var t = d3.transition()
            .duration(300)
            .ease(d3.easeCubic);
        
        
        svgMap.selectAll("circle").transition(t)
            .style("opacity",0);

        //dataset = data;
        svgMap.selectAll("circle")
            .remove();

        svgMap.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return projection([d.longitude, d.latitude])[0];
            })
            .attr("cy", function (d) {
                return projection([d.longitude, d.latitude])[1];
            })
            .attr("r", 3)
            .style("fill", "orange")
            .style("stroke", "gray")
            .style("stroke-width", .1)
            .style("opacity", 0)
            .append("title")			//Simple tooltip
            .text(function (d) {
                return "Location: " + d.longitude + ", " + d.latitude;
            });

        svgMap.selectAll("circle").transition(t)
            .style("opacity",0.1);
    });
}

//
//
//Parallel Coordinates
//
//



//
//
//Calendar
//
//

function daysInYear(date){
    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
}

var width = 1500,
    height = 40,
    cellSize = 5;

//var formatPercent = d3.format(".1%");

function renderCalendar(selection) {
    

    var svgCal = d3.select('#calendar').selectAll("svg").remove();
    
    svgCal = d3.select("#calendar")
    .selectAll("svg")
    .data(d3.range(2001, 2016))
    .enter().append("svg")
        .attr("width", width)
        .attr("height", height)
    .append("g")
        .attr("transform", "translate(" + ((width - cellSize * 53) / 8) + "," + (height - cellSize * 7 - 1) + ")");

    svgCal.append("text")
        .attr("transform", "translate(-20," + cellSize * 3 + ")")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("text-anchor", "middle")
        .text(function(d) { return d; });

    

    var rect = svgCal.append("g")
        .attr("fill", "none")
        //.attr("stroke", "#ccc")
        .selectAll("rect")
        .data(function(d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
        .enter().append("rect")
        .attr("width", cellSize-3)
        .attr("height", cellSize+5)
        .attr("x", function(d) { return daysInYear(d) * (cellSize-3); })
        .attr("y", function(d) { return 6; })
        .datum(d3.timeFormat("%Y-%m-%d"));
    
    d3.csv("dailyResultsFormatted.csv").then(function(csv) {
        var max = d3.max(csv, function(d) { return parseInt(d[selection]); });

        var color = d3.scaleLinear()
            .domain([1, max])
            .range(["#f2f2f2", "#ff4000"]);

        var data = d3.nest()
            .key(function(d) { return d.Date; })
            .rollup(function(d) { return d[0][selection]; })
            .object(csv);
        
        rect.filter(function(d) { return d in data; })
            .attr("fill", function(d) { return color(data[d]); })
            .append("title")
            .text(function(d) { return d + ": " + data[d] + " Hotspots"; });
        });
}

renderCalendar('All')
//renderCalendar('NSW')

function select(selection) {
    renderCalendar(selection);
}