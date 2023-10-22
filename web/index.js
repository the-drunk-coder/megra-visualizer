var layouts = {};
var edges = {};
var nodes = {};
var new_edges = {};
var new_nodes = {};
var last_active = {}; // last active (selected) node for each graph
var num_changed = false; // set to true if the number of graphs has changed 

// calculate edge thickness from probablity
function thickness(prob) {
    return 0.2 + (3.0 * (prob / 100.0));
}

// resize containers if necessary
function resizeAll() {
    
    var objKeys = Object.keys(layouts);
    var numLayouts = objKeys.length;
    var rows = Math.floor((numLayouts + 1) / 2);

    if(numLayouts > 1) {
	var height = (100 / rows) - 0.01;
	var curTop = 0;
	
	var i;
	
	for (i = 0; i < numLayouts; i++) {
	    var el = document.getElementById('div-' + objKeys[i]);
	    
	    el.style.top = `${curTop}%`;    
	    el.style.height = `${height}%`;
	    el.style.width = "49.9%";
	    
	    if(i % 2 == 0) {
		el.style.left = "0";
	    } else {
		el.style.left = "50%";
	    }
	    	    
	    if(i % 2 === 1){
		curTop += height;
	    }
	}
    }
}

function nodes_diff(a, b) {
    return a.filter(node_a => !b.some(node_b => node_b.data.id === node_a.data.id && node_b.data.name === node_a.data.name));
};

function edges_diff(a, b) {
    return a.filter(edge_a => !b.some(edge_b =>
	edge_b.data.id === edge_a.data.id
	    && edge_b.data.source === edge_a.data.source
	    && edge_b.data.target === edge_a.data.target
	    && edge_b.data.label === edge_a.data.label
    ));
};

var oscPort = new osc.WebSocketPort({
    url: "ws://localhost:8081", // URL to your Web Socket server.
    metadata: true
});

oscPort.open();

oscPort.on("message", function (msg) {

    switch(msg.address) {
    case "/graph/add": {
	var name = msg.args[0].value;

	new_edges[name] = [];	  
	new_nodes[name] = [];
	
	if(!layouts.hasOwnProperty(name)) {
	    var divkey = 'div-' + name;
	    
	    let newCytoscapeInstanceContainer = document.createElement('div');
	    newCytoscapeInstanceContainer.id = divkey;
	    newCytoscapeInstanceContainer.style.cssText = `position: absolute; left: 0; top: 0; width: 100%; height: 100%; z-index: 999;`;
	    document.body.appendChild(newCytoscapeInstanceContainer);
	    
	    layouts[name] = cytoscape({
		container: document.getElementById(divkey),
		style: [
		    {
			selector: 'node',
			style: {
			    'background-color': '#afa',
			    'color' : '#111',
			    'font-family' : 'mononoki, monospace',
			    'font-size' : '11px',
			    "text-valign": "center",
			    "text-halign": "center",
			    "text-outline-color": "#fff",
			    'content': 'data(name)'
			}
		    },
		    {
			selector: ':selected',
			style: {
			    'background-color': '#f77',
			    'color' : '#fff',			      
			}
		    },
		    {
			selector: 'edge',
			style: {
			    'curve-style': 'bezier',
			    'target-arrow-shape': 'triangle',
			    'width' : 'data(width)',
			    'content' : 'data(label)',
			    'font-family' : 'mononoki, monospace',
			    'color' : '#000',
			    'font-size' : '7px',
			    "text-outline-color": "#fff",
			    "text-outline-width": "1px",
			}
		    },
		]
	    });

	    resizeAll();
	    num_changed = true;
	};
		
	break;
    }
    case "/node/add": {
	var name = msg.args[0].value;
	var node_id = name + '-n' + msg.args[1].value;
	var node_label = msg.args[2].value.trim();
	
	new_nodes[name].push({
	    group: "nodes",
	    data: {
		id: node_id,
		name: node_label
	    }
	});
	
	break;
    }
    case "/node/active": {
	var name = msg.args[0].value;	  	  

	if(layouts.hasOwnProperty(name)) {
	    var src = msg.args[1].value;
	    layouts[name].$(last_active[name]).unselect();
	    layouts[name].$(`#${name}-n` + src).select();
	    last_active[name] = `#${name}-n` + src;
	}
	
	break;
    }
    case "/edge/add": {
	var name = msg.args[0].value;
	var src = msg.args[1].value;
	var dest = msg.args[2].value;
	var label = msg.args[3].value;
	var prob = msg.args[4].value;
	var edge_id = name + '-edge-n' + src + '-n' + dest;	  

	var e = layouts[name].$('#' + edge_id);
	if(e.length > 0) {
	    e.data("label", label);
	    e.data("width", thickness(prob));
	} 
	
	new_edges[name].push({
	    group: "edges",
	    data: {
		id: edge_id,  // giving edges an id helps avoid duplicates
		source: name + '-n' + src,
		target: name + '-n' + dest,
		width: thickness(prob),
		label: label
	    }
	});
	
	break;
    }
    case "/render": {
	var name = msg.args[0].value;
	var layout = msg.args[1].value.toLowerCase();

	// make sure these exist 
	if(!edges.hasOwnProperty(name)) {
	    edges[name] = [];
	}

	if(!nodes.hasOwnProperty(name)) {
	    nodes[name] = [];
	}

	// check if the graph has changed ...
	let incoming_nodes = nodes_diff(new_nodes[name], nodes[name]);
	let incoming_edges = edges_diff(new_edges[name], edges[name]);
	
	let removed_nodes = nodes_diff(nodes[name], new_nodes[name]);
	let removed_edges = edges_diff(edges[name], new_edges[name]);

	//console.log(incoming_nodes);
	//console.log(removed_nodes);
	//console.log(incoming_edges);
	//console.log(removed_edges);
	
	// check if the current graph changed 
	let changed =
	    incoming_nodes.length !== 0
	    || incoming_edges.length !== 0
	    || removed_nodes.length !== 0
	    || removed_edges.length !== 0;

	console.log(changed);
	
	// if yes, update its data
	if (changed) {

	    // console.log("applying changes");

	    // remove all
	    // not sure why it's so hard to do this selectively
	    layouts[name].elements().remove();

	    // add new
	    layouts[name].add(new_nodes[name]);
	    layouts[name].add(new_edges[name]);
	    	    	   	    
	    edges[name] = new_edges[name];
	    nodes[name] = new_nodes[name];

	    // console.log("keep");
	}
	
	// either re-run all layouts if the container dimensions changed,
	// or if the current layout changed ...
	if (num_changed) {
	    var objKeys = Object.keys(layouts);
	    var numLayouts = objKeys.length;
	    for (i = 0; i < numLayouts; i++) {
		layouts[objKeys[i]].resize();
		layouts[objKeys[i]].layout({
		    name: 'fcose',
		    animate: true,
		    fit: true,	      
		}).run();		
	    }	    
	    num_changed = false;
	} else if (changed) {
	    layouts[name].layout({
		name: 'fcose',
		animate: true,
		fit: true,	      
	    }).run();	    
	}
	
	break;
    }
    case "/clear": {	  	  
	var name = msg.args[0].value;

	layouts[name].destroy();
	delete layouts[name];

	delete edges[name];
	delete nodes[name];
	delete new_edges[name];
	delete new_nodes[name];
	
	var elem = document.getElementById('div-' + name);
	elem.parentNode.removeChild(elem);

	break;
    }
    }            
});
