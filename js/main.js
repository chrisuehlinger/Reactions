'use strict';

var width = window.outerWidth || window.innerWidth || 960,
    height = window.innerHeight;

var color = d3.scale.category20();

var radius = d3.scale.sqrt()
    .range([3, 6]);

var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

var force = d3.layout.force()
    .size([width, height])
    .charge(function(d){ return d.energy*100 || -300; })
    .linkDistance(function(d) { return 2*radius(d.source.size) + 2*radius(d.target.size) + 50; });
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
      .attr("r", function(d) { return 2*radius(d.size); })
      .attr("mydata:energy", function(d){ return d.energy; })
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
  console.log(graph.nodes);
  
  function tick() {
    if(startChecking || new Date - startTime > 2000){
      startChecking = true;
      var hasChanged = false;
      // Break bonds when their length exceeds their energy
      graph.links = graph.links.filter(function(d) { 
        if(d.energy < nodeDistance(d.source, d.target)){
          d.source.energy++;
          d.target.energy++;
          hasChanged = true;
          return false;
        } else {
          return true;
        }
      });
      
      
      // Form bonds between eligible elements
      if(!hasChanged && new Date % 10 === 0){
        var i, j;
        for(i = 0; i < graph.nodes.length-1 && !hasChanged; i++)
          for(j = i+1; j < graph.nodes.length && !hasChanged; j++){
            //console.log('heyo',graph.nodes[i], graph.nodes[j]);
            if(graph.nodes[i].energy > 0 && graph.nodes[j].energy > 0 
               && nodeDistance(graph.nodes[i], graph.nodes[j]) < 100){
              hasChanged = true;
              graph.nodes[i].energy--;
              graph.nodes[j].energy--;
              graph.links.push({
                source:graph.nodes[i],
                target: graph.nodes[j],
                bond: 1,
                energy: 300
              });
            }
          }
      }
      
      if(hasChanged){
        force.links(graph.links);

        link.remove();
        
        link = svg.selectAll(".link")
          .data(graph.links)
          .enter().append("g")
            .attr("class", "link");
        
        link.append("line")
            .style("stroke-width", function(d) { return (d.bond * 2 - 1) * 2 + "px"; });

        link.filter(function(d) { return d.bond > 1; })
            .append("line")
            .attr("class", "separator");
        
        node.remove();
        
        node = svg.selectAll(".node")
            .data(graph.nodes)
          .enter().append("g")
            .attr("class", "node")
            .call(force.drag);

        node.append("circle")
            .attr("r", function(d) { return 2*radius(d.size); })
            .attr("mydata:energy", function(d){ return d.energy; })
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