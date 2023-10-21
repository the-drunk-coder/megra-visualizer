var layouts = {};
var edges = {};
var nodes = {};
var new_edges = {};
var new_nodes = {};
var last_active = {};

// calculate edge thickness from probablity
function thickness(prob) {
    return 0.2 + (3.0 * (prob / 100.0));
}

var oscPort = new osc.WebSocketPort({
    url: "ws://localhost:8081", // URL to your Web Socket server.
    metadata: true
});

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
	    
	    layouts[objKeys[i]].resize();
	    layouts[objKeys[i]].fit();
	    
	    if(i % 2 === 1){
		curTop += height;
	    }
	    console.log("top: " + curTop);
	} 
    }
}

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
			    //'font-family' : 'Comic Mono, monospace',
			    'font-size' : '11px',
			    "text-valign": "center",
			    "text-halign": "center",
			    "text-outline-color": "#fff",
			    //"text-outline-width": "1.5px",
			    //"border-width": "2px",
			    //"border-color": "#aaa",
			    //'shape': 'ellipse',
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
			    //'font-family' : 'Comic Mono, monospace',
			    'color' : '#000',
			    'font-size' : '7px',
			    "text-outline-color": "#fff",
			    "text-outline-width": "1px",
			}
		    },
		]
	    });
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
	
	//console.log("REDNER");

	if(!edges.hasOwnProperty(name)) {
	    edges[name] = [];
	}

	if(!nodes.hasOwnProperty(name)) {
	    nodes[name] = [];
	}
			
	let incoming_nodes = new_nodes[name].filter(x => !nodes[name].includes(x));
	let incoming_edges = new_edges[name].filter(x => !edges[name].includes(x));

	//console.log(incoming_nodes);
	//console.log(incoming_edges);
	
	let removed_nodes = nodes[name].filter(x => !new_nodes[name].includes(x));
	let removed_edges = edges[name].filter(x => !new_edges[name].includes(x));
		
	layouts[name].elements().remove(removed_nodes);
	layouts[name].elements().remove(removed_edges);
	
	layouts[name].add(incoming_nodes);
	layouts[name].add(incoming_edges);
	
	edges[name] = new_edges[name];
	nodes[name] = new_nodes[name];
		
	layouts[name].layout({
	    name: 'fcose',
	    animate: true,
	    fit: true,	      
	}).run();

	// resize containers
	resizeAll();
	
	break;
    }
    case "/clear": {	  	  
	var name = msg.args[0].value;

	layouts[name].destroy();
	delete layouts[name];

	delete edges[name];
	delete nodes[name];
	
	var elem = document.getElementById('div-' + name);
	elem.parentNode.removeChild(elem);

	//resizeAll();
	break;
    }
    }            
});
