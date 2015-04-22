'use strict';

var width = window.outerWidth || window.innerWidth || 960,
    height = window.innerHeight;

var color = d3.scale.category20();

var radius = d3.scale.sqrt()
    .range([0, 6]);

var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

var force = d3.layout.force()
    .size([width, height])
    .charge(-400)
    .linkDistance(function(d) { return radius(d.source.size) + radius(d.target.size) + 30; });
var graph;
d3.json("data/graph.json", function(json) {
  graph = json;
  
  force
      .nodes(graph.nodes)
      .links(graph.links)
      .on("tick", tick)
      .start();

  var link = svg.selectAll(".link")
      .data(graph.links)
    .enter().append("g")
      .attr("class", "link");

  link.append("line")
      .style("stroke-width", function(d) { return (d.bond * 2 - 1) * 2 + "px"; });

  link.filter(function(d) { return d.bond > 1; }).append("line")
      .attr("class", "separator");

  var node = svg.selectAll(".node")
      .data(graph.nodes)
    .enter().append("g")
      .attr("class", "node")
      .call(force.drag);

  node.append("circle")
      .attr("r", function(d) { return radius(d.size); })
      .style("fill", function(d) { return color(d.atom); });

  node.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.atom; });
  
  function nodeDistance(n1, n2){
    return Math.sqrt((n2.y-n1.y)*(n2.y-n1.y) + (n2.x-n1.x)*(n2.x-n1.x));
  }

  var startTime = +new Date,
      startChecking = false;
  console.log(link);
  console.log(graph.links);
  
  function tick() {
    if(startChecking || new Date - startTime > 5000){
      startChecking = true;
      // Break bonds when their length exceeds their energy
      
      
      var linkCount = graph.links.length;
      graph.links = graph.links.filter(function(d) { return d.energy > nodeDistance(d.source, d.target); });
      
      if(graph.links.length < linkCount){
        force.links(graph.links);

        link.remove();
        
        link = svg.selectAll(".link")
          .data(graph.links)
          .enter().append("g")
            .attr("class", "link");
        
        link.append("line")
            .style("stroke-width", function(d) { return (d.bond * 2 - 1) * 2 + "px"; });

        link.filter(function(d) { return d.bond > 1; }).append("line")
            .attr("class", "separator");
        
        node.remove();
        
        node = svg.selectAll(".node")
      .data(graph.nodes)
    .enter().append("g")
      .attr("class", "node")
      .call(force.drag);

  node.append("circle")
      .attr("r", function(d) { return radius(d.size); })
      .style("fill", function(d) { return color(d.atom); });

  node.append("text")
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.atom; });
      }
    }
    
    link.selectAll("line")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  }
});