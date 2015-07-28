'use strict';

var poppingSounds;

// the iPhone specifically seems to have problems playing these sounds
if(/^((?!chrome).)*safari/i.test(navigator.userAgent) || navigator.standalone || /Mobile\/12A4265u/i.test(navigator.userAgent)) {
  $('body').addClass('ios');
  poppingSounds = ['pop.wav', 
                      'pop1.wav', 
                      'pop2.wav' ].map(function(path){return 'audio/' + path;});
} else {
  poppingSounds = [ 'classic cartoon pop sound 2.wav', 
                        'object1-1-6.wav', 
                        'pop.wav', 
                        'pop1.wav', 
                        'pop2.wav' ].map(function(path){return 'audio/' + path;});
}

var width = window.outerWidth || window.innerWidth || 960,
    height = window.innerHeight;

var color = d3.scale.category20();

var stableBondLength = 25;

var bondColor = d3.scale.linear()
                  .domain([0.25,0.85])
                  .interpolate(d3.interpolateRgb)
                  .range(['#000', '#f00'])
                  .clamp(true);

var bondStrength = d3.scale.linear()
                    .domain([1,4])
                    .range([0.1,0.4]);

var radius = d3.scale.sqrt()
    .range([3, 6]);

var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height);

var force = d3.layout.force()
    .size([width, height])
    .charge(function(d){ return d.energy || -400; })
    .linkDistance(function(d) { return 2*radius(d.source.size) + 2*radius(d.target.size) + stableBondLength; })
    .linkStrength(function(d) { return bondStrength(d.bond); });


var graph, brokenBonds;
var score = 0;
d3.json("data/graph1.json", function(json) {
  graph = json;
  brokenBonds = [];
  
  force
      .nodes(graph.nodes)
      .links(graph.links)
      .on("tick", tick)
      .start();
  
  var node = svg.selectAll(".node")
    , link = svg.selectAll(".link")
    , indicator = svg.selectAll(".indicator")
    , brokenIndicator = svg.selectAll(".bro");
  
  render();
  
  function render(){
    $('.score-number').text(score);
    
    force
      .nodes(graph.nodes)
      .links(graph.links)
      .start();
    
    link.remove();
    indicator.remove();
    node.remove();
    
    link = svg.selectAll(".link")
        .data(graph.links)
      .enter().append("g")
        .attr("class", "link");

    link.append("line")
        .style("stroke-width", function(d) { return (d.bond * 2 - 1) * 2 + "px"; });

    link.filter(function(d) { return d.bond > 1; })
        .append("line")
        .attr("class", "separator")
        .style("stroke-width", function(d) { return ((d.bond - 1) * 2 - 1) * 2 + "px"; });
    
    link.filter(function(d) { return d.bond > 2; })
        .append("line")
        .style("stroke-width", function(d) { return ((d.bond - 2) * 2 - 1) * 2 + "px"; });
    
    indicator = svg.selectAll(".indicator")
        .data(graph.links)
      .enter().append("g")
        .attr("class", "indicator");
    
    indicator.append('circle')
            .attr('r', '20px');
    
    indicator.append('text')
        .attr("dy", ".35em")
        .attr("text-anchor", "middle");
    
    brokenIndicator = svg.selectAll(".bro")
        .data(brokenBonds)
      .enter().append("g")
        .attr("class", "broken-indicator");
    
    brokenIndicator.append('circle')
            .attr('r', '20px');
    
    brokenIndicator.append('text')
        .attr("dy", ".35em")
        .attr("text-anchor", "middle");

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
  
  d3.selectAll('.console a')
    .on('click', function(){
      console.log(d3.event.target.id);
      var newNode;
      switch(d3.event.target.id){
        case 'add-hydrogen':
          newNode = {"atom": "H", "size": 1,  "energy":1};
          break;
        case 'add-carbon':
          newNode = {"atom": "C", "size": 12,  "energy":4};
          break;
        case 'add-nitrogen':
          newNode = {"atom": "N", "size": 14,  "energy":3};
          break;
        case 'add-oxygen':
          newNode = {"atom": "O", "size": 16,  "energy":2};
          break;
      }
    
      if(newNode){
        graph.nodes.push(newNode);
        render();
      }
    });
  
  function nodeDistance(n1, n2){
    return Math.sqrt((n2.y-n1.y)*(n2.y-n1.y) + (n2.x-n1.x)*(n2.x-n1.x));
  }
  
  function getLink(n1, n2){
    var match, i;
    for(i = 0; !match && i < graph.links.length; i++)
      if(graph.links[i].source === n1 && graph.links[i].target === n2
          || graph.links[i].source === n2 && graph.links[i].target === n1)
        match = graph.links[i];
    
    return match;
        
  }

  var startTime = +new Date,
      startChecking = false;
  console.log(link);
  console.log(graph.links);
  console.log(graph.nodes);
  
  function tick() {
    var hasChanged = false;
    if(startChecking || new Date - startTime > 2000){
      startChecking = true;
      // Break bonds when their length exceeds their energy
      graph.links = graph.links.filter(function(d) { 
        if(d.energy < nodeDistance(d.source, d.target)){
          d.source.energy += d.bond;
          d.target.energy += d.bond;
          
          var fileThisTime = poppingSounds[Math.floor(Math.random() * poppingSounds.length)];
          var soundThisTime = new Audio(fileThisTime);
          soundThisTime.play();
          
          svg.attr('class','BREAK');
          setTimeout(function(){
            svg.attr('class','');
          }, 100);
          
          brokenBonds.push({
            x: d.source.x + (d.target.x - d.source.x)/2,
            y: d.source.y + (d.target.y - d.source.y)/2,
            energy: d.energy
          });
          
          setTimeout(function(){
            brokenBonds.pop(0);
          }, 300);
          
          score += d.energy;
          
          hasChanged = true;
          return false;
        } else {
          return true;
        }
      });
      
      
      // Form bonds between eligible elements
      if(!hasChanged && new Date % 2 === 0){
        var i, j;
        for(i = 0; i < graph.nodes.length-1 && !hasChanged; i++)
          for(j = i+1; j < graph.nodes.length && !hasChanged; j++){
            //console.log('heyo',graph.nodes[i], graph.nodes[j]);
            if(graph.nodes[i].energy > 0 && graph.nodes[j].energy > 0 
               && nodeDistance(graph.nodes[i], graph.nodes[j]) < 100){
              var match = getLink(graph.nodes[i],graph.nodes[j]);
              if(!match || match.bond < 3) {
                if(!match){
                  match = {
                    source:graph.nodes[i],
                    target: graph.nodes[j],
                    bond: 0
                  };
                  graph.links.push(match);
                }
                hasChanged = true;
                var energyChange = Math.min(graph.nodes[i].energy, graph.nodes[j].energy, 3);
                graph.nodes[i].energy -= energyChange;
                graph.nodes[j].energy -= energyChange;
                match.bond += energyChange;
                match.energy = (match.bond + 1) * 100 + Math.floor(Math.random()*50);
              }
            }
          }
      }
      
      if(hasChanged){
        render();
      }
    }
    
    link.selectAll("line")
        .attr("x1", function(d) { return d.source.x; })
        .attr("y1", function(d) { return d.source.y; })
        .attr("x2", function(d) { return d.target.x; })
        .attr("y2", function(d) { return d.target.y; })
        .style("stroke", function(d) { return bondColor(nodeDistance(d.source, d.target)/d.energy);});
    
    indicator
      .attr('class', function(d){ 
        var isStretched = nodeDistance(d.source, d.target)/d.energy > 0.55;
        return 'indicator ' + (isStretched ? 'stretched' : '');
      })
      .attr("transform", function(d) { 
        var midX = d.source.x + (d.target.x - d.source.x)/2;
        var midY = d.source.y + (d.target.y - d.source.y)/2;
        return "translate(" + midX + "," + midY + ")"; 
      })
      .selectAll('text')
      .text(function(d) { return Math.round(nodeDistance(d.source, d.target)) + ' J'; });
    
    brokenIndicator
      .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
      .selectAll('text')
      .text(function(d) { return d.energy + ' J'; });

    node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
  }
});