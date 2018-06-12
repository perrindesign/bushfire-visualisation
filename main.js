//Bushfire and Climate Change Information Visualisation 


//
//
//Slider 
//
//


//Formatting the dates
var formatDateIntoYear = d3.timeFormat("%Y");
var formatDate = d3.timeFormat("%B %Y");
var searchDate = d3.timeFormat("%Y-%m");

//Number formatting for population values
var formatAsThousands = d3.format(",");  //e.g. converts 123456 to "123,456"
var formatAsDecimals = d3.format(".1f");

var startDate = new Date("2000-12-31"),
    endDate = new Date("2016-12-01");

var playButton = d3.select("#play-button");
var dateStat = d3.select("#date-stat");
var hotspotStat = d3.select("#hotspot-stat");
var tempStat = d3.select("#temp-stat");
var tempChangeStat = d3.select("#temp-change-stat");
var percipStat = d3.select("#percip-stat");
var percipChangeStat = d3.select("#percip-change-stat");
var storyStat = d3.select("#story-stat");
var maxHotspots = d3.select("#max-hotspots");

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

var xSlide = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, width])
    .clamp(true);

var slider = svgSlider.append("g")
    .attr("class", "slider")
    .attr("transform", "translate(" + margin.left + "," + height / 2 + ")");

slider.append("line")
    .attr("class", "track")
    .attr("x1", xSlide.range()[0])
    .attr("x2", xSlide.range()[1])
    .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-inset")
    .select(function () { return this.parentNode.appendChild(this.cloneNode(true)); })
    .attr("class", "track-overlay")
    .call(d3.drag()
        .on("start.interrupt", function () { slider.interrupt(); })
        .on("start drag", function () { 
            currentValue = d3.event.x;
            update(xSlide.invert(d3.event.x)); 
        }));

slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
    .data(xSlide.ticks(16))
    .enter()
    .append("text")
    .attr("x", xSlide)
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
    update(xSlide.invert(currentValue));
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
    if(formatDate(h) == "December 2000") {
        h = new Date(h.getFullYear(), h.getMonth()+1, 1);
    }

    handle.attr("cx", xSlide(h));
    //label
    //    .attr("x", xSlide(h))
    //    .text(formatDate(h));
    renderSpots(searchDate(h));
    renderChangeStats(formatDate(h));
    // filter data set and redraw plot
}
//
//
//Statistics 
//
//
function renderChangeStats(date) {
    d3.csv("Change.csv").then(function(changeStats) {
        var index;
        for (var i=0; i<changeStats.length; i++) {
            var test = changeStats[i]["Date"];
            if (test === date){
                index = i;
                break;
            } 
        }  
        dateStat.text(date);
        hotspotStat.text(formatAsThousands(changeStats[index]["Hotspots"]));
        tempStat.text("Average Temp: " + formatAsDecimals(changeStats[index]["Temperature"]) + "℃");
        tempChangeStat.text("Percent Change: " + changeStats[index]["ChangeTemperature"]);
        percipStat.text("Average Rainfall: " + formatAsDecimals(changeStats[index]["Precipitation"]) + "mm");
        percipChangeStat.text("Percent Change: " + changeStats[index]["ChangePrecipitation"]);
        storyStat.text("Notable Event: " + changeStats[index]["Story"]);
    });
}


//
//
//Map 
//
//


var map = L.map('map', {zoomControl: false}).setView([-28.85, 133.417], 4);

//Move zoom to a better spot data wise
L.control.zoom({
     position:'topright'
}).addTo(map);

var tiles = L.tileLayer("https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png").addTo(map);
    
playButton
    .on("click", function() {
    var button = d3.select(this);
    if (button.text() == "Pause") {
        moving = false;
        clearInterval(timer);
        button.text("Play");
    } else {
        moving = true;
        timer = setInterval(step, 500);
        button.text("Pause");
    }
    //console.log("Slider moving: " + moving);
})

renderSpots("2001-01");
renderChangeStats("January 2001")

var heat = 0;

function renderSpots(date) {
    //Load in hotspots data
    var data;

    d3.csv("Data/" + date + ".csv").then(function (data) {
        data = data.map(function (p) { return [p["latitude"], p['longitude']]; });

        if (heat != 0) {
            map.removeLayer(heat);
        }
        //map.removeLayer(heat);

        heat = L.heatLayer(data, {
            radius: 5, 
            blur: 5, 
            max: .1,
            minOpacity: .1,
            maxZoom: 15,
            gradient: {
                0.0: 'orange',
                1.0: 'red'
            }    
        });//.addTo(map);
        
        map.addLayer(heat);
        
    });
}


//
//
//Parallel Coordinates
//
//


var margin = {top: 30, right: 10, bottom: 10, left: 10},
    width = 1200 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var x = d3.scaleBand().rangeRound([0, width]).padding(1),
    y = {},
    dragging = {};


var line = d3.line(),
    background,
    foreground,
    extents;

var svgParCoor = d3.select("#par-coor").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

renderParCoor();

function renderParCoor() {
    d3.csv("climateData.csv").then(function(climate) {
    // Extract the list of dimensions and create a scale for each.
        //climate[0] contains the header elements, then for all elements in the header
        //different than "name" it creates and y axis in a dictionary by variable name
    x.domain(dimensions = d3.keys(climate[0]).filter(function(d) {
        if(d == "Year") {
            return y[d] = d3.scaleLinear()
            .domain(d3.extent(climate, function(p) { 
                return +p[d]; }))
            .range([height, 0]);
        }
        return y[d] = d3.scaleLinear()
            .domain(d3.extent(climate, function(p) { 
                return +p[d]; }))
            .range([height, 0]);
    }));

    extents = dimensions.map(function(p) { return [0,0]; });

    // Add grey background lines for context.
    background = svgParCoor.append("g")
        .attr("class", "background")
        .selectAll("path")
        .data(climate)
        .enter().append("path")
        .attr("d", path);

    // Add blue foreground lines for focus.
    foreground = svgParCoor.append("g")
        .attr("class", "foreground")
        .selectAll("path")
        .data(climate)
        .enter().append("path")
        .attr("d", path);

    // Add a group element for each dimension.
    var g = svgParCoor.selectAll(".dimension")
        .data(dimensions)
        .enter().append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) {  return "translate(" + x(d) + ")"; })
        .call(d3.drag()
            .subject(function(d) { return {x: x(d)}; })
            .on("start", function(d) {
            dragging[d] = x(d);
            background.attr("visibility", "hidden");
            })
            .on("drag", function(d) {
            dragging[d] = Math.min(width, Math.max(0, d3.event.x));
            foreground.attr("d", path);
            dimensions.sort(function(a, b) { return position(a) - position(b); });
            x.domain(dimensions);
            g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
            })
            .on("end", function(d) {
            delete dragging[d];
            transition(d3.select(this)).attr("transform", "translate(" + x(d) + ")");
            transition(foreground).attr("d", path);
            background
                .attr("d", path)
                .transition()
                .delay(500)
                .duration(0)
                .attr("visibility", null);
            }));
    // Add an axis and title.
    g.append("g")
        .attr("class", "axis")
        .each(function(d) {  d3.select(this).call(   
                getAxis(d)
            );})
        .append("text")
        .style("text-anchor", "middle")
        .attr("y", -9) 
        .text(function(d) { return d; });

    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function(d) {
            d3.select(this).call(y[d].brush = d3.brushY().extent([[-8, 0], [8,height]]).on("brush start", brushstart).on("brush", brush_parallel_chart));
        })
        .selectAll("rect")
        .attr("x", -8)
        .attr("width", 16);
    });
}

function getAxis(d) {
    if(d=="Year") {
        return d3.axisLeft(y[d]).tickArguments([15, "d"]);
    } else {
        return d3.axisLeft(y[d]);
    }
}

function position(d) {
  var v = dragging[d];
  return v == null ? x(d) : v;
}

function transition(g) {
  return g.transition().duration(500);
}

// Returns the path for a given data point.
function path(d) {
  return line(dimensions.map(function(p) { return [position(p), y[p](d[p])]; }));
}

function brushstart() {
  d3.event.sourceEvent.stopPropagation();
}

 
// Handles a brush event, toggling the display of foreground lines.
function brush_parallel_chart() {    
    for(var i=0;i<dimensions.length;++i){
        if(d3.event.target==y[dimensions[i]].brush) {
            extents[i]=d3.event.selection.map(y[dimensions[i]].invert,y[dimensions[i]]);

        }
    }

      foreground.style("display", function(d) {
        return dimensions.every(function(p, i) {
            if(extents[i][0]==0 && extents[i][0]==0) {
                return true;
            }
          return extents[i][1] <= d[p] && d[p] <= extents[i][0];
        }) ? null : "none";
      });
}

function clearFilter() {
    svgParCoor.selectAll("*").remove();
    renderParCoor();
}


//
//
//Calendar
//
//


function daysInYear(date){
    return (Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(date.getFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
}

var widthCal = 1500,
    heightCal = 40,
    cellSize = 5;

function renderCalendar(selection) {
    
    //var t = d3.transition()
    //        .duration(2000)
    //        .ease(d3.easeCubic);

    var svgCal = d3.select('#calendar').selectAll("svg").remove();
    
    svgCal = d3.select("#calendar")
    .selectAll("svg")
    .data(d3.range(2001, 2016))
    .enter().append("svg")
        .attr("width", widthCal)
        .attr("height", heightCal)
    .append("g")
        .attr("transform", "translate(" + ((width - cellSize * 53) / 4) + "," + (heightCal - cellSize * 7 - 1) + ")");

    svgCal.append("text")
        .attr("transform", "translate(-20," + cellSize * 3 + ")")
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
        //.attr("opacity", 0)
        .datum(d3.timeFormat("%Y-%m-%d"));
    
    d3.csv("dailyResultsFormatted.csv").then(function(csv) {
        var max = d3.max(csv, function(d) { return parseInt(d[selection]); });
        
        maxHotspots.text(formatAsThousands(max) + " Hotspots");

        var color = d3.scaleSequential()
            .domain([1, max])
            .interpolator(d3.interpolateYlOrRd)

        var data = d3.nest()
            .key(function(d) { return d.Date; })
            .rollup(function(d) { return d[0][selection]; })
            .object(csv);
        
        rect.filter(function(d) { return d in data; })
            .attr("fill", function(d) { return color(data[d]); })
            .append("title")
            .text(function(d) { return d + ": " + data[d] + " Hotspots"; });
        });

        //rect.transition(t).attr("opacity", 1);
}

renderCalendar('All')

function select(selection) {
    renderCalendar(selection);
}

//make the svg container 
var calendarScale = d3.select("#calendar-scale-svg").append("svg")
    .attr("width", 300)
    .attr("height", 10);

//make the rectangle 
var rectangle = calendarScale.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 300)
    .attr("height", 10)
    .attr("fill", "url(#grad)");//"linear-gradient(-90deg, red, yellow)");

//make defs and add the linear gradient
var linGrad = calendarScale.append("defs").append("linearGradient")
    .attr("id", "grad")
    .attr("x1", "0%")
    .attr("x2", "100%")
    .attr("y1", "0%")
    .attr("y2", "0%");

linGrad.append("stop")
    .attr("offset", "0%")
    .style("stop-color", "#FEFED0")
    .style("stop-opacity", 1)

linGrad.append("stop")
    .attr("offset", "25%")
    .style("stop-color", "#F6D07B")
    .style("stop-opacity", 1)    

linGrad.append("stop")
    .attr("offset", "50%")
    .style("stop-color", "#EE9A51")
    .style("stop-opacity", 1)

linGrad.append("stop")
    .attr("offset", "75%")
    .style("stop-color", "#CE362D")
    .style("stop-opacity", 1)

linGrad.append("stop")
    .attr("offset", "100%")
    .style("stop-color", "#751528")
    .style("stop-opacity", 1)