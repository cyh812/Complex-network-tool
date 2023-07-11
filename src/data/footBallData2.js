

const football2 = {
	nodes: [
		{ id: "1", user: "ARG", description: "Force-Directed Graph" },
		{ id: "2", user: "AUT", description: "Parallel Coordinates" },
		{ id: "3", user: "BEL", description: "Parallel Coordinates" },
		{ id: "4", user: "BGR", description: "Simple d3.js Graph" },
		{ id: "5", user: "BRA", description: "Quadtree" },
		{ id: "6", user: "CHE", description: "Pie Chart Update, II" },
		{ id: "7", user: "CHL", description: "Arc Clock" },
		{ id: "8", user: "CMR", description: "The Amazing Pie" },
		{ id: "9", user: "COL", description: "Donut Transitions" },
		{ id: "10", user: "DEU", description: "World Tour" },
		{ id: "11", user: "DNK", description: "Zoom to Bounding Box II" },
		{ id: "12", user: "ESP", description: "Project to Bounding Box" },
		{ id: "13", user: "FRA", description: "Mobile Patent Suits" },
		{ id: "14", user: "GBR", description: "Force-Directed Graph with Mouseover" },
		{ id: "15", user: "GRE", description: "Basic Directional Force Layout Diagram" },
		{ id: "16", user: "HRV", description: "Random World Tour with flags" },
		{ id: "17", user: "IRN", description: "Gray Earth" },
		{
			id: "18",
			user: "ITA",
			description: "Directional Force Layout Diagram with Node Highlighting"
		},

		{ id: "19", user: "JAM", description: "genome browser" },
		{ id: "20", user: "JPN", description: "Genome Ruler" },
		{ id: "21", user: "KOR", description: "Genome Ruler" },
		{ id: "22", user: "MAR", description: "genome browser" },
		{ id: "23", user: "MEX", description: "Arc Padding II" },
		{ id: "24", user: "NGA", description: "genome browser" },
		{ id: "25", user: "NLD", description: "genome browser" },
		{ id: "26", user: "NOR", description: "The genome browser" },
		{ id: "27", user: "PRT", description: "genome browser" },
		{ id: "28" , user: "PRY", description: "genome browser" },
		{ id: "29", user: "ROM", description: "genome browser" },
		{ id: "30", user: "SCO", description: "genome browser"  },
		{ id: "31" , user: "TUN", description: "genome browser" },
		{ id: "32" , user: "TUR", description: "genome browser" },
		{ id: "33", user: "USA", description: "genome browser" },
		{ id: "34", user: "YUG", description: "genome browser" },
		{ id: "35", user: "ZAF", description: "genome browser" },
	],
	edges: [
		{ source: "1", target: "12" },
		{ source: "1", target: "18" },
		{ source: "2", target: "10" },
		{ source: "2 ", target: "12" },
		{ source: "2", target: "13" },
		{ source: "2", target: "14" },
		{ source: "2", target: "18" },
		{ source: "3", target: "10" },
		{ source: "3", target: "13" },
		{ source: "3", target: "18" },
		{ source: "3", target: "25" },
		{ source: "4", target: "10" },
		{ source: "4", target: "12" },
		{ source: "4", target: "27" },
		{ source: "4", target: "32" },
		{ source: "5", target: "12" },
		{ source: "5", target: "13" },
		{ source: "5", target: "18" },
		{ source: "5", target: "20" },
		{ source: "5", target: "27" },
		{ source: "7", target: "1" },
		{ source: "7", target: "18" },
		{ source: "7", target: "33" },
		{ source: "8", target: "2" },
		{ source: "8", target: "10" },
		{ source: "8", target: "12" },
		{ source: "8", target: "13" },
		{ source: "8", target: "16" },
		{ source: "8", target: "18" },
		{ source: "8", target: "20" },
		{ source: "8", target: "27" },
		{ source: "8", target: "32" },
		{ source: "9", target: "1" },
		{ source: "9", target: "5" },
		{ source: "9", target: "12" },
		{ source: "9", target: "18" },
		{ source: "9", target: "33" },
		{ source: "10", target: "12" },
		{ source: "10", target: "13" },
		{ source: "10", target: "18" },
		{ source: "11", target: "10" },
		{ source: "11", target: "12" },
		{ source: "11", target: "14" },
		{ source: "11", target: "18" },
		{ source: "11", target: "25" },

		{ source: "11", target: "30" },
		{ source: "11", target: "32" },
		{ source: "16", target: "2" },
		{ source: "16", target: "10" },
		{ source: "16", target: "12" },
		{ source: "16", target: "14" },
		{ source: "16", target: "18" },
		{ source: "16", target: "32" },
		{ source: "17", target: "10" },
		{ source: "18", target: "12" },
		{ source: "18", target: "13" },
		{ source: "18", target: "14" },
		{ source: "19", target: "14" },
		{ source: "21", target: "13" },
		{ source: "21", target: "10" },
		{ source: "22", target: "12" },
		{ source: "22", target: "13" },
		{ source: "22", target: "18" },
		{ source: "22", target: "27" },
		{ source: "22", target: "31" },
		{ source: "22", target: "12" },
		{ source: "22", target: "13" },

		{ source: "24", target: "3" },
		{ source: "24", target: "6" },
		{ source: "24", target: "10" },
		{ source: "24", target: "12" },
		{ source: "24", target: "13" },
		{ source: "24", target: "18" },
		{ source: "24", target: "25" },
		{ source: "24", target: "32" },
		{ source: "24", target: "33" },
		{ source: "24", target: "35" },
		{ source: "25", target: "10" },
		{ source: "25", target: "12" },
		{ source: "25", target: "14" },
		{ source: "25", target: "18" },
		{ source: "26", target: "10" },
		{ source: "26", target: "12" },
		{ source: "26", target: "14" },
		{ source: "26", target: "15" },
		{ source: "26", target: "18" },
		{ source: "26", target: "30" },

		{ source: "28", target: "5" },
		{ source: "28", target: "12" },
		{ source: "28", target: "23" },
		{ source: "29", target: "3" },
		{ source: "29", target: "10" },
		{ source: "29", target: "12" },
		{ source: "29", target: "14" },
		{ source: "29", target: "15" },
		{ source: "29", target: "25" },
		{ source: "29", target: "32" },
		{ source: "30", target: "13" },
		{ source: "30", target: "14" },
		{ source: "31", target: "10" },
		{ source: "31", target: "13" },
		{ source: "33", target: "10" },
		{ source: "33", target: "14" },
		{ source: "33", target: "25" },
		{ source: "34", target: "10" },
		{ source: "34", target: "12" },
		{ source: "34", target: "13" },
		{ source: "34", target: "14" },
		{ source: "34", target: "18" },
		{ source: "34", target: "20" },
		{ source: "35", target: "2" },
		{ source: "35", target: "6" },
		{ source: "35", target: "10" },
		{ source: "35", target: "12" },
		{ source: "35", target: "13" },
		{ source: "35", target: "14" },
		{ source: "35", target: "18" },
		{ source: "35", target: "25" },
		{ source: "35", target: "32" },

	]
};

export default football2;