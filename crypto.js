function toggleBTC(){
  var button = document.getElementById("BTC");
  console.log("COUCOU");
  button.color = "#FFC857";
  button.background = "#5A7D7C";
}

function getPercentage(oldPrice, newPrice){
  let percentage = 0
  //If 0, means the money didn't exist so we consider there is no augmentation
  if(oldPrice != 0.0) {
    percentage = 100 * (newPrice - oldPrice) / oldPrice;
  }
  return percentage;
}

var svg = d3.select("svg"),
    margin = {top: 20, right: 20, bottom: 110, left: 40},
    margin2 = {top: 430, right: 20, bottom: 30, left: 40},
    width = +svg.attr("width") - margin.left - margin.right,
    height = +svg.attr("height") - margin.top - margin.bottom,
    height2 = +svg.attr("height") - margin2.top - margin2.bottom;

var parseDate = d3.timeParse("%b %Y");

var x = d3.scaleBand().range([0, width]).padding(0.1),
    x2 = d3.scaleTime().range([0, width]),
    y = d3.scaleLinear().range([height, 0]);

var xAxis = d3.axisBottom(x),
    xAxis2 = d3.axisBottom(x2),
    yAxis = d3.axisLeft(y).tickSize(0)
    .tickPadding(6);

var brush = d3.brushX()
    .extent([[0, 0], [width, height2]])
    .on("brush end", brushed);

var focus = svg.append("g") //Focus is the svg for the graph
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg.append("g") //Context is the svg for the brush
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

//Read csv file only once and keep the day prices of all currencies in a JS object
var day_prices = {};
//List to keep name of currencies
var currencies = [];

//Function that fill the day_prices object with the csv data
function fillPrices(data){
  data.forEach(function(d){
    day_prices[d.Date] = [d.BTC, d.ETH, d.NEO, d.XRP, d.BCH, d.DASH, d.BCC, d.ETC, d.MIOTA, d.LTC, d.XMR, d.XEM, d.NMR, d.STRAT, d.WAVES];
  });
}

//Function that fill the currencies list names given the corresponding row of the csv file
function fillCurrencies(row){
  for (let prop in row) {
    if (row.hasOwnProperty(prop)) {
      if (prop != 'Date') {
        currencies.push(prop);
      }
    }
  };
}

d3.csv("cleaning/crypto_prices.csv", function(error, data) {
  if (error) throw error;
  fillPrices(data);
  fillCurrencies(data[0]);
  updateGraph("Apr 28 2013", "Nov 07 2017");
  x.domain(currencies);
});

x2.domain([parseDate("Apr 2013"), parseDate("Nov 2017")]);

//Function that updates the graph when brushing
function updateGraph(beginDate, endDate){

    let percentages = [];
    let oldPrice = day_prices[beginDate];
    let newPrice = day_prices[endDate];
    console.log(oldPrice);
    let currenciesCount = currencies.length;
    for(let i = 0; i < currenciesCount; i++) {
      let percentage = getPercentage(oldPrice[i], newPrice[i]);
      percentages.push(percentage);
    }

    let maxPercentage = d3.max(percentages);
    let minPercentage = d3.min(percentages);

    y.domain([minPercentage, maxPercentage]);

    focus.selectAll(".bar") //Compute, place and draw every bar
        .data(percentages)
      .enter().append("rect")
        .attr("class", function(d) { return "bar bar--" + (d < 0 ? "negative" : "positive"); })
        .attr("y", function(d) { return y(Math.max(0, d)); })
        .attr("x", function(d, i) { return x(currencies[i]); })
        .attr("height", function(d) { return Math.abs(y(d) - y(0)); })
        .attr("width", x.bandwidth());
}

focus.append("g") //Append x axis of graph
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0,"+ y(0) + ")") //height/2 + margin.top
    .call(xAxis);

focus.append("g") //Append y axis of graph
    .attr("class", "axis axis--y")
    .call(yAxis);

context.append("g") //Axis for brush
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height2/2 + ")")
    .call(xAxis2);

context.append("g") //Selecting area on brush
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, x.range());

function brushed() {
  var s = d3.event.selection || x2.range();
  var time_interval = s.map(x2.invert, x2);
  //Display somewhere the exact time interval
  //Compute new values for each currency and display new bars
  var split_begin = time_interval[0].toString().split(" ");
  var split_end = time_interval[1].toString().split(" ");
  var begin_date = split_begin[1] + " " + split_begin[2] + " " + split_begin[3];
  var end_date = split_end[1] + " " + split_end[2] + " " + split_end[3];
  updateGraph(begin_date, end_date);
}

function type(d) { //Function that parses the data on read
  //d.name = parseDate(d.name);
  d.value = +d.value;
  return d;
}
