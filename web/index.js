var edges = [];
var nodes = [];

// calculate edge thickness from probablity
function thickness(prob) {
    return 0.2 + (3.0 * (prob / 100.0));
}

var oscPort = new osc.WebSocketPort({
    url: "ws://localhost:8081", // URL to your Web Socket server.
    metadata: true
});

oscPort.open();

oscPort.on("message", function (msg) {

    switch(msg.address) {
    case "/graph/add": {
	var name = msg.args[0].value;

	nodes = [];
	edges = [];
	
	break;
    }
    case "/node/add": {
	var name = msg.args[0].value;
	var node_id = name + '-n' + msg.args[1].value;
	var node_label = msg.args[2].value.trim();
	
	nodes.push({
	    id: node_id,
	    group: name,
	    radius: 2,
	});

	console.log("added node");
	
	break;
    }
    case "/node/active": {
	var name = msg.args[0].value;	  	  

	
	
	break;
    }
    case "/edge/add": {
	var name = msg.args[0].value;
	var src = name + '-n' + msg.args[1].value;
	var dest = name + '-n' + msg.args[2].value;
	var label = msg.args[3].value;
	var prob = msg.args[4].value;
	//var edge_id = name + '-edge-n' + src + '-n' + dest;	  

	console.log("source " + src + " dest " + dest);

	edges.push({
	    source: src,
	    target: dest,	    
	});

	console.log("added edge");
	
	
	break;
    }
    case "/render": {
	console.log("pre-start render");
	var name = msg.args[0].value;
	var layout = msg.args[1].value.toLowerCase();

	console.log(nodes);
	console.log(edges);
	
	console.log("start render");
	
	
	// Specify the dimensions of the chart.
	const width = 928;
	const height = 680;

	// Specify the color scale.
	const color = d3.scaleOrdinal(d3.schemeCategory10);

	// The force simulation mutates links and nodes, so create a copy
	// so that re-evaluating this cell produces the same result.
	const links = edges.map(d => ({...d}));
	const verts = nodes.map(d => ({...d}));
		
	// Create a simulation with several forces.
	const simulation = d3.forceSimulation(verts)
	      .force("link", d3.forceLink(links).id(d => d.id))
	      .force("charge", d3.forceManyBody())
	      .force("x", d3.forceX())
	      .force("y", d3.forceY());

	// Create the SVG container.
	const svg = d3.create("svg")
	      .attr("width", width)
	      .attr("height", height)
	      .attr("viewBox", [-width / 2, -height / 2, width, height])
	      .attr("style", "max-width: 100%; height: auto;");

	// Add a line for each link, and a circle for each node.
	const link = svg.append("g")
	      .attr("stroke", "#999")
	      .attr("stroke-opacity", 0.6)
	      .selectAll("line")
	      .data(links)
	      .join("line")
	      .attr("stroke-width", d => Math.sqrt(d.value));

	const node = svg.append("g")
	      .attr("stroke", "#fff")
	      .attr("stroke-width", 1.5)
	      .selectAll("circle")
	      .data(verts)
	      .join("circle")
	      .attr("r", 5)
	      .attr("fill", d => color(d.group));

	node.append("title")
	    .text(d => d.id);
	
	// Set the position attributes of links and nodes each time the simulation ticks.
	simulation.on("tick", () => {
	    link
		.attr("x1", d => d.source.x)
		.attr("y1", d => d.source.y)
		.attr("x2", d => d.target.x)
		.attr("y2", d => d.target.y);

	    node
		.attr("cx", d => d.x)
		.attr("cy", d => d.y);
	});


	// When this cell is re-run, stop the previous simulation. (This doesn’t
	// really matter since the target alpha is zero and the simulation will
	// stop naturally, but it’s a good practice.)
	// invalidation.then(() => simulation.stop());

	document.getElementById("container").append(svg.node());
	
	break;
    }
    case "/clear": {	  	  
	var name = msg.args[0].value;

	

	break;
    }
    }            
});
