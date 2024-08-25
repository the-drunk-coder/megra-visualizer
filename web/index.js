var edges = {};
var nodes = {};
var graphs = {};
var node_ids = {};
var last_active = {}; // last active (selected) node for each graph
var node_counter = 0;
var edge_counter = 0;

var oscPort = new osc.WebSocketPort({
    url: "ws://localhost:8081", // URL to your Web Socket server.
    metadata: true
});

oscPort.open();

oscPort.on("message", function (msg) {

    switch(msg.address) {
    case "/graph/add": {
	var name = msg.args[0].value;
	graphs[name] = Viva.Graph.graph();
		
	break;
    }
    case "/node/add": {
	var name = msg.args[0].value;
	var node_id = name + '-n' + msg.args[1].value;

	//var node_label = msg.args[2].value.trim();

	node_ids[node_id] = node_counter;
	graphs[name].addNode(node_counter);
	node_counter += 1;
	console.log("ADD NODE");
	break;
    }
    case "/node/active": {
	var name = msg.args[0].value;	  	  


	
	break;
    }
    case "/edge/add": {
	var name = msg.args[0].value;
	var src = msg.args[1].value;
	var dest = msg.args[2].value;
	var label = msg.args[3].value;
	var prob = msg.args[4].value;

	var source_id = name + '-n' + src;
	var target_id =  name + '-n' + dest;

	var target_num = node_ids[target_id];
	var source_num = node_ids[source_id];
	
	graphs[name].addLink(target_num, source_num);
	
	edge_counter += 1;
	console.log("ADD EDGE");
	
	break;
    }
    case "/render": {
	console.log("RENDER");
	var name = msg.args[0].value;
	console.log("render " + node_counter + " nodes");
	console.log("render " + edge_counter + " edges");
	var renderer = Viva.Graph.View.renderer(graphs[name]);
	
	renderer.run();
		
	break;
    }
    case "/clear": {	  	  
	var name = msg.args[0].value;

	
	break;
    }
    }            
});
