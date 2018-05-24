//Slider JS

//Formatting the dates
var formatDateIntoYear = d3.timeFormat("%Y");
var formatDate = d3.timeFormat("%b %Y");
var searchDate = d3.timeFormat("%Y-%m");

var startDate = new Date("2001-01-01"),
    endDate = new Date("2015-12-01");

var margin = { top: 0, right: 50, bottom: 0, left: 50 },
    width = 960 - margin.left - margin.right,
    height = 100 - margin.top - margin.bottom;

var svg = d3.select("#slider")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height);

var x = d3.scaleTime()
    .domain([startDate, endDate])
    .range([0, width])
    .clamp(true);

var slider = svg.append("g")
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
        .on("start drag", function () { hue(x.invert(d3.event.x)); }));

slider.insert("g", ".track-overlay")
    .attr("class", "ticks")
    .attr("transform", "translate(0," + 18 + ")")
    .selectAll("text")
    .data(x.ticks(10))
    .enter()
    .append("text")
    .attr("x", x)
    .attr("y", 10)
    .attr("text-anchor", "middle")
    .text(function (d) { return formatDateIntoYear(d); });

var label = slider.append("text")
    .attr("class", "label")
    .attr("text-anchor", "middle")
    .text(formatDate(startDate))
    .attr("transform", "translate(0," + (-25) + ")")

var handle = slider.insert("circle", ".track-overlay")
    .attr("class", "handle")
    .attr("r", 9);

function hue(h) {
    handle.attr("cx", x(h));
    label
        .attr("x", x(h))
        .text(formatDate(h));
    renderSpots(searchDate(h));
}

//Map JS

//Width and height
var w = 1000;
var h = 800;
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
var svg = d3.select("body")
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
    svg.selectAll("path")
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

    renderSpots("2001-01");
    

});
  
function renderSpots(date) {
    //Load in hotspots data
    d3.csv("data" + date + ".csv").then(function (data) {

        //dataset = data;
        svg.selectAll("circle")
            .remove();

        svg.selectAll("circle")
            .data(data.filter(function(d){return reformatDate(d.acq_date) == date;}))
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return projection([d.longitude, d.latitude])[0];
            })
            .attr("cy", function (d) {
                return projection([d.longitude, d.latitude])[1];
            })
            .attr("r", 5)
            .style("fill", "yellow")
            .style("stroke", "gray")
            .style("stroke-width", 0.25)
            .style("opacity", 0.75)
            .append("title")			//Simple tooltip
            .text(function (d) {
                return d.acq_date + ": Time " + d.acq_time;
            });

    });
}

function reformatDate(d) {
    var newD = new Date(d)
    return newD.toISOString().substring(0, 7);
}