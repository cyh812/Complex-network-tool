

const customer = {
	nodes: [
		{ id: "1", user: "ARG", description: "Force-Directed Graph" },
		{ id: "2", user: "AUT", description: "Parallel Coordinates" },
		{ id: "3", user: "BEL", description: "Parallel Coordinates" },
		{ id: "4", user: "BGR", description: "Simple d3.js Graph" },
		{ id: "5", user: "BRA", description: "Quadtree" },
		{ id: "6", user: "CHE", description: "Pie Chart Update, II" },
		{ id: "7", user: "CHL", description: "Arc Clock" },
	],
	edges: [
		{ source: "1", target: "2" },
		{ source: "1", target: "3" },
		{ source: "1", target: "4" },
		{ source: "1", target: "5" },
		{ source: "1", target: "6" },
		{ source: "1", target: "7" },
		{ source: "2", target: "3" },
		{ source: "2", target: "4" },
		{ source: "3", target: "5" },
		{ source: "5", target: "7" },
		{ source: "7", target: "6" },
		{ source: "6", target: "4" },

	]
};

export default customer;