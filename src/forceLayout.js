
'use strict';
import Vector from './Vector';
import Spring from './Spring';
import {Node, Edge} from './Elements';
import cloneDeep from 'lodash/cloneDeep'


/**
 * Point Struct
 * @param {Vector} position [description]
 * @param {Number} id       [description]
 * @param {Number} group    [description]
 * @param {Number} mass     [description]
 * @param otherStrength
 */
let Point = function(position, id = -1, group = -1, mass = 1.0, otherStrength = 0) {
	this.p = position; // position of Point, with [x, y] in Vector
	this.m = mass; // mass of Point, default to 1.0
	this.v = new Vector(0, 0); // velocity, init with x=0, y=0
	this.a = new Vector(0, 0); // acceleration, init with x=0, y=0
	this.id = id; // id of Point, defaults to -1
	this.group = group; // group of Point, defaults to -1
	this.otherStrength = otherStrength; //other strength to control force
	this.degree = []; //node degree

	//options of render, use array to save pre options
	this.radius= [3];
	this.fillColor = [];
	this.strokeWidth = [1];
	this.strokeColor = ['#FFFFFF'];

	//assessment index for node
	this.nodeOverlap = 1; //the higher the value, the lower the overlap
	this.nodeAngel = 1; //the higher the value, the lower the nodeAngel
	this.nodeCross = 1; //the higher the value, the lower the nodeCross
	this.nodeBeyondEdge = 1; //the higher the value, the lower the nodeBeyondEdge
	this.nodeAbnormalEdge = 1; //the higher the value, the lower the nodeBeyondEdge
	this.nodeDegreeNumber = 1; //the higher the value, the lower the nodeBeyondEdge
	this.nodeRegionalInterference = 1; //the higher the value, the lower the nodeRegionalInterference
	this.nodeLinkLength = 1; //the higher the value, the lower the nodeRegionalInterference

	let self = this; // to guarantee the point bind itself
	/**
	 * Update Point acceleration, acceleration = force/mass
	 * @param  {Vector} force [description]
	 * @return {[type]}       [description]
	 */
	this.updateAcc = function(force) {
		self.a = self.a.add(force.divide(self.m));
	};

	/**
	 * judge whether mouse in node circle
	 * @param  {Vector} mousePosition [description]
	 * @return {Boolean}       [description]
	 */
	this.isMouseInCircle = function (mousePosition) {
    let dis = this.p.subtract(mousePosition).magnitude();
    return this.radius[0] > dis;
  }
};

/**
 * set attributes for one element 
 * @param {[type]} el    [description]
 * @param {[type]} attrs [description]
 */
let setAttributes = function(el, attrs) {
};

/**
 * Force Layout class: The main class to construct Force Directed Layout Structure, calculate the Points and Edges state and render them to the page
 *
 * setData: clean all stored data and set data with passed variable
 * start: start to update Points and Edges states and render them until the total energy less than minEnergyThreshold
 */
class forceLayout {
	constructor(options) {
		this.props = {
			approach: 'canvas', // render approach, svg or canvas
            algorithm: 'Spring', // render approach, svg or canvas
			detail: true, // show the details or not

			parentId: 'chart', // id of DOM parentNode
			containerId: 'forcedLayoutView', // DOM id
			chartParentId1: 'chart1', //id of dom for other chart1
			chartContainerId1: 'nodeVis', // other chart dom 1

			chartParentId2: 'chart2', //id of dom for other chart2
			chartContainerId2: 'edgeVis', // other chart dom 2

			resizeChart: "chart5",
			chartContainerId3: "biggerChart",

			width: 800, // Rendered DOM width
			height: 600, // Rendered DOM height
			stiffness: 200.0, // spring stiffness -configuration
			lastStiffness: 200.0, // spring stiffness -configuration
			repulsion: 200.0, // repulsion -configuration
			lastRepulsion: 200.0, // repulsion -configuration
			damping: 0.8, // volocity damping factor-configuration
            initialTemperature: 100, // cooling:initialTemperature
            initialIteration: 800, // cooling:initialIteration
			minEnergyThreshold: 0.00001, // threshold to determine whether to stop
			maxSpeed: 1000, // max node speed
			defSpringLen: 30, // default Spring length-configuration
			lastDefSpringLen: 30, // default Spring length-configuration
			coulombDisScale: 0.01, // default Coulombs Constant
			tickInterval: 0.02 // default time, used in velocity, acceleration and position's updating
		};

		this.nodes = [];
		this.edges = [];
		this.nodeSet = {};
		this.edgeSet = {};
		this.nodePoints = new Map();
		this.edgeSprings = new Map();

		//save the results of annealing
		this.annealingResults = [];

		this.initState = true; 
		this.renderEnd = false;
		this.nextEdgeId = 0;
		this.iterations = 0; // record iterations -configuration
		this.preIterations = 0; // record iterations -configuration
		this.renderTime = 0;

		//save the fineTuning direction
		this.fineTuningVector = new Map();
		this.notAccpetFineTuning = true;

		this.randomKey = Math.random();
		this.randomKey2 = Math.random();
		this.pathNode = [];

		this.center = {}; // DOM center position
		this.color = function(n) {
			let schemas = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];

			return schemas[ n % schemas.length ];
		}; // color schema

		this.canvas = {};
		this.ctx = {};

		/**
		 * Iterate options to update this.props
		 */
		if ('undefined' !== typeof options) {
			for (let i in options) {
				if ('undefined' !== typeof options[i]) {
					this.props[i] = options[i];
				}
			}
		}

    //cooling
    this.temperature = this.props.initialTemperature; //初始温度
    this.deltTem = 1 - Math.pow(0.001, 1/this.props.initialIteration); //衰减因子Delta 0.02
    console.log('delt' + this.deltTem + 'initialIteration' + this.props.initialIteration );
    this.targetTem = 0.0001; //目标温度
    this.currentEnergy = 0; //当前能量
    this.deltaEnnergy = 0; //当前能量差
	//use metric to annealing
	this.beyondNode = 1000000000;
	this.angelNode = 1000000000;
	}

	/**
	 * add one Node
	 * @param {[type]} node [description]
	 */
	addNode(node) {
		if (!(node.id in this.nodeSet)) {
			this.nodes.push(node);
		}

		this.nodeSet[node.id] = node;
		return node;
	};
	/**
	 * add Nodes
	 * @param {[type]} data [description]
	 */
	addNodes(data) {
		let len = data.length;
		for (let i = 0; i < len; i++) {
			let node = new Node(data[i]);
			this.addNode(node);
		}
	};
	/**
	 * add one Edge
	 * @param {[type]} edge [description]
	 */
	addEdge(edge) {
		if (!(edge.id in this.edgeSet)) {
			this.edges.push(edge);
		}

		this.edgeSet[edge.id] = edge;
		return edge;
	};
	/**
	 * add Edges
	 * @param {[type]} data [description]
	 */
	addEdges(data) {
		let len = data.length,
			node1, node2;
		for (let i = 0; i < len; i++) {
			let e = data[i];

			if(typeof( e['source']) === "object"){
				node1 = this.nodeSet[e['source'].id]; //set two nodes
			}else{
				node1 = this.nodeSet[e['source']]; //set two nodes
			}
			if (node1 === undefined) {
				throw new TypeError("invalid node name: " + e['source'].id);
			}


			if(typeof(e['target']) === "object"){
				node2 = this.nodeSet[e['target'].id]; //set two nodes
			}else{
				node2 = this.nodeSet[e['target']]; //set two nodes
			}
			if (node2 === undefined) {
				throw new TypeError("invalid node name: " + e['target'].id);
			}

			let attr = e['value'] || null,
				edge = new Edge(this.nextEdgeId++, node1, node2, attr);
			this.addEdge(edge);
		}
	};

	/**
	 * set init node and edge data for this instance
	 * @param {[type]} data [description]
	 */
	setData(data) {
		// clean all data
		this.nodes = [];
		this.edges = [];
		this.nodeSet = {};
		this.edgeSet = {};
		this.nodePoints = new Map();
		this.edgeSprings = new Map();

		// Format data to json object
		if (typeof data === 'string' || data instanceof String) {
			data = JSON.parse(data);
		}

		// add nodes and edges
		if ('nodes' in data || 'edges' in data) {
			this.addNodes(data['nodes']);
			this.addEdges(data['edges']);
			this.center = new Vector(this.props.width / 2, this.props.height / 2);
		}
	}

	/**
	 * the calculation and rendering entrance of layout
	 * nodePoints and edgeSprings should be updated first, then calculate nodes and edges' position frame by frame, until the total energy is less than minEnergyThreshold or iteration time reaches 1000000, as well as render them to page.
	 * @return {[type]} [description]
	 */
	start(callback) {
		let self = this,
			nlen = this.nodes.length,
			elen = this.edges.length;

		let startX = this.props.width * 0.5,
			startY = this.props.height * 0.5,
			initSize = 20;

		for (let i = 0; i < nlen; i++) {
			// initial the point position
			let node = this.nodes[i],
				x = startX + initSize * (Math.random() - .5),
				y = startY + initSize * (Math.random() - .5),
				vec = new Vector(x, y);
			this.nodePoints.set(node.id, new Point(vec, node.id, node.data.group||-1));
		}

		for (let i = 0; i < elen; i++) {
			let edge = this.edges[i],
				source = this.nodePoints.get(edge.source.id),
				target = this.nodePoints.get(edge.target.id),
				// length = this.props.defSpringLen * (Number.parseInt(edge.data) || 1); //edge.data quivalents a weight value to differ distance of different distance
				length = this.props.defSpringLen ; //edge.data quivalents a weight value to differ distance of different distance
			// length = source.p.subtract( target.p ).magnitude();
			// console.log("length" + length);

            source.degree.push(target.id);
            target.degree.push(source.id);

			this.edgeSprings.set(edge.id, new Spring(source, target, length));
		}

		this.renderByBrowser(self, callback);
	}

	/**
	 * update details in page (container: table)
	 * @param  {number} energy [description]
	 * @return {[type]}        [description]
	 */
	updateDetails(energy) {
		let ths = document.getElementById('detailTable').getElementsByTagName('td');
		if (this.iterations === 1) {
			/**
			 * Update Items in first time
			 *
			 * {Drawing Approach} [1]
			 * {Node Number} [9]
			 * {Edge Number} [11]
			 * {DOM ChildNodes} [15]
			 */
			ths[1].innerHTML = this.props.approach;
			ths[9].innerHTML = this.nodes.length;
			ths[11].innerHTML = this.edges.length;
			ths[15].innerHTML = this.props.approach === 'canvas' ? 1 : this.nodes.length + this.edges.length;
		}

		/**
		 * Regular update items
		 * 
		 * {Render time} [3]
		 * {Iterations} [5]
		 * {Current Energy} [7]
		 * {Used JS Heap Size} [13]
		 */
		ths[3].innerHTML = `${this.renderTime}ms`;
		ths[5].innerHTML = this.iterations;
		ths[7].innerHTML = energy.toFixed(4);
		ths[13].innerHTML = `${window.performance.memory.usedJSHeapSize}`;
	}

	/**
	 * tick event
	 * @param  {[type]} interval [description]
	 * @return {[type]}          [description]
	 */
	tick(interval) {
		switch (this.props.algorithm) {
			case 'randomAnnealing':
				this.fineTuning();
				break;
			case 'Linlog':
				this.updateCoulombsLaw_test1();
				this.updateHookesLaw_FR();
				this.updateAngelForce_ForceAR();
				this.attractToCentre();
				this.updateVelocity(interval);
				this.updatePosition(interval);
				break;
			case 'FR':
				this.updateCoulombsLaw_FR();
				this.updateHookesLaw_FR();
				this.attractToCentre();
				this.updateVelocity(interval);
				this.updatePosition(interval);
				break;
			case 'FR_':
				this.updateCoulombsLaw_FR();
				this.updateHookesLaw_FR();
				this.attractToCentre();
				this.updateVelocity(interval);
				this.updatePosition(interval);
                break;
			case 'Spring_':
				this.updateCoulombsLaw_Spring();
				this.updateHookesLaw_Spring();
				this.attractToCentre();
				this.updateVelocity(interval);
				this.updatePosition(interval);
				break;
			case 'Spring':
				this.updateCoulombsLaw_Spring();
				this.updateHookesLaw_Spring();
				this.attractToCentre();
				this.updateVelocity(interval);
				this.updatePosition(interval);
                break;
			case 'test1':
				this.updateCoulombsLaw_test1();
				this.updateHookesLaw_test1();
				this.attractToCentre();
				this.updateVelocity(interval);
				this.updatePosition(interval);
				break;
			case 'forceAR':
				this.updateCoulombsLaw_FR();
				this.updateHookesLaw_FR();
				this.updateAngelForce_ForceAR();
				this.attractToCentre();
				this.updateVelocity(interval);
				this.updatePosition(interval);
				break;
      case 'gephi':
        this.updatePosition_gephi(interval);
        this.temperature = 0;
        break;
    }


	}

	/**
	 * for fineTuning after fixed iterations
	 */
	fineTuning(){

		// this.props.algorithm === 'FR' ? this.cooling_FR() : null;
		if(this.props.algorithm === "FR" || this.props.algorithm === "Spring" ){
			this.cooling_metric_occlusion();
		}else if(this.props.algorithm === "forceAR"){
			this.cooling_metric_angel();
		}
		else{
			this.cooling_FR();
		}
	}

  /**
	 * for FR algorithms
	 * diff1:cooling
  /**
   * Update repulsion forces between nodes
   * @return {[type]} [description]
   */
	  updateCoulombsLaw_FR() {
    let len = this.nodes.length;

    for (let i = 0; i < len; i++) {
      for (let j = i + 1; j < len; j++) {
        if (i === j) continue;

        let iNode = this.nodes[i],
          jNode = this.nodes[j],
          v = this.nodePoints.get(iNode.id).p.subtract(this.nodePoints.get(jNode.id).p), // get the diff of x and y posotion
          dis = (v.magnitude() + 0.1) * this.props.coulombDisScale, //get the distance of the two nodes
          direction = v.normalise();  // (dx | dy) / ||dx + dY||

        // console.log('dis', dis);
        this.nodePoints.get(iNode.id).updateAcc(direction.multiply(this.props.repulsion).divide(Math.pow(dis, 2)));  //  (deltX) * k / (dis * dis), k is lorentz force coefficient
        this.nodePoints.get(jNode.id).updateAcc(direction.multiply(this.props.repulsion).divide(-Math.pow(dis, 2))); //  (deltY) * k / (dis * dis), k is lorentz force coefficient
      }
    }
  }

  updateHookesLaw_FR() {
    let len = this.edges.length;

    for (let i = 0; i < len; i++) {
      let spring = this.edgeSprings.get(this.edges[i].id),
        v = spring.target.p.subtract(spring.source.p),
				sourceDegree = spring.source.degree.length,
				targetDegree = spring.target.degree.length,
				maxStrength = 1 / Math.min(sourceDegree, targetDegree),//depend on the degree of node to differ the distance of nodes
				bias = targetDegree / (targetDegree + sourceDegree),
        displacement = (spring.length - v.magnitude()) * maxStrength, //length can be adjusted based on different data situation
        direction = v.normalise();
      // console.log(displacement);

      // console.log(spring.source, spring.target);
      spring.source.updateAcc(direction.multiply(-this.props.stiffness * displacement * bias ));
      spring.target.updateAcc(direction.multiply(this.props.stiffness * displacement * (1 - bias )));
    }
  }


	/**
	 * for test1 algorithms
	 * to add some readablity index to force
	 * diff1:cooling
	 /**
	 * Update repulsion forces between nodes
	 * @return {[type]} [description]
	 */
	updateCoulombsLaw_test1() {
		let len = this.nodes.length;

		for (let i = 0; i < len; i++) {
			for (let j = i + 1; j < len; j++) {
				if (i === j) continue;

				let iNode = this.nodes[i],
					jNode = this.nodes[j],
					v = this.nodePoints.get(iNode.id).p.subtract(this.nodePoints.get(jNode.id).p), // get the diff of x and y posotion
					dis = (v.magnitude() + 0.1) * this.props.coulombDisScale, //get the distance of the two nodes
					direction = v.normalise();  // (dx | dy) / ||dx + dY||

				let test_iNode = this.props.repulsion / ((this.nodePoints.get(iNode.id).nodeDegreeNumber < 0.01) ?  0.01 :this.nodePoints.get(iNode.id).nodeDegreeNumber) ;
				let test_jNode = this.props.repulsion / ((this.nodePoints.get(iNode.id).nodeDegreeNumber < 0.01) ?  0.01 :this.nodePoints.get(iNode.id).nodeDegreeNumber);
				// console.log('dis', dis);
				this.nodePoints.get(iNode.id).updateAcc(direction.multiply(test_iNode).divide(Math.pow(dis, 2)));  //  (deltX) * k / (dis * dis), k is lorentz force coefficient
				this.nodePoints.get(jNode.id).updateAcc(direction.multiply(test_iNode).divide(-Math.pow(dis, 2))); //  (deltY) * k / -(dis * dis), k is lorentz force coefficient
			}
		}
	}

	updateHookesLaw_test1() {
		let len = this.edges.length;

		for (let i = 0; i < len; i++) {
			let spring = this.edgeSprings.get(this.edges[i].id),
				v = spring.target.p.subtract(spring.source.p),
				displacement = spring.length - v.magnitude(),
				direction = v.normalise();
			//
			// let test_iNode = this.props.repulsion / ((this.nodePoints.get(iNode.id).nodeDegreeNumber < 0.01) ?  0.01 :this.nodePoints.get(iNode.id).nodeDegreeNumber);
			// let test_jNode = this.props.repulsion / ((this.nodePoints.get(iNode.id).nodeDegreeNumber < 0.01) ?  0.01 :this.nodePoints.get(iNode.id).nodeDegreeNumber);

			// console.log(spring.source, spring.target);
			spring.source.updateAcc(direction.multiply(-this.props.stiffness * displacement));
			spring.target.updateAcc(direction.multiply(this.props.stiffness * displacement));
		}
	}



	/**
   * simulating anealing process to  reduce the energy of force system quickly
	 * when temperature is higher,the vector reduce more quickly
   * @return {[type]} [description]
   */
  cooling_FR(){
		this.temperature += -this.temperature * this.deltTem;
		if(this.temperature < this.targetTem) this.temperature = 0;
		console.log(this.temperature);
	}

  /**
	 * for Sprig algorithms
   */

  /**
   * cost function
   * */
  cost_spring_test(){


  	// k1 for node space; k2 for border; k3 for edgeLength; k4 for cross; k5 for node close edge
  	let k1 = 1, k2 = 0, k3 = 1, k4 = 1, k5 = 1;
  	//forEnergy E1(lie in the space evenly)
  	  let e1 = 0;
	  this.nodePoints.forEach((val, key, array)=>{
		  let nodeOverLap = 0;
		  this.nodePoints.forEach((val2, key2, array2)=> {
			  if(key !== key2){
				  let dis = val.p.subtract(val2.p).magnitude();
				  if(dis < 0.1){
				    dis = 0.01
          }
				  e1 += (1 / (dis * dis));
			  }
		  });
	  });

	  //forEnergy E2(the edge of layout repel the node, the distance between node i and the right, left, top and bottom sides)
	  let e2 = 0;
	  this.nodePoints.forEach((val, key, array)=>{
	    if(this.props.width  === val.p.x || this.props.height === val.p.y || val.p.x === 0 || val.p.y === 0  ){
        val.p.x -= 10;
        val.p.y -= 10;
      }
		 e2 += (1 / (val.p.x * val.p.x) + 1 / (val.p.y * val.p.y) +  1 / ((this.props.width - val.p.x) * (this.props.width - val.p.x)) +  1 / ((this.props.height - val.p.y) * (this.props.height - val.p.y)));
	  });

	  //edgeLength can not be to long
	  let e3 = 0;
	  this.edgeSprings.forEach((val, key, array)=> {
		  let v_A = val.source.p, //v_A represents the edgeEnd point, v_B represents the another edgeEnd point
			  v_B = val.target.p,
			  AB = v_B.subtract(v_A),
			  len = AB.magnitude();

		  e3 += len / 1000 ;
	  });

	  //edgeCross Number
	  let e4 = 0;
	  let edgeCrossNumber = 0,
		  edgeCrossValue = 0;
	  this.edgeSprings.forEach((val, key, array) => {
		  let v1_A = val.source,
			  v1_B =  val.target;

		  this.edgeSprings.forEach((val2, key, array) => {
			  let v2_C = val2.source,
				  v2_D =  val2.target;
			  if(v2_C.id === v1_A.id || v2_D.id === v1_A.id || v2_C.id === v1_B.id || v2_D.id === v1_B.id ){
				  edgeCrossValue += 0;
			  }else{
				  //define the vector of ABCD
				  let AC = v2_C.p.subtract(v1_A.p),
					  AD = v2_D.p.subtract(v1_A.p),
					  AB = v1_B.p.subtract(v1_A.p),

					  CA = v1_A.p.subtract(v2_C.p),
					  CB = v1_B.p.subtract(v2_C.p),
					  CD = v2_D.p.subtract(v2_C.p),

					  cross_AB_AC = AB.crossProduct(AC),
					  cross_AB_AD = AB.crossProduct(AD),

					  cross_CD_CA = CD.crossProduct(CA),
					  cross_CD_CB = CD.crossProduct(CB);

				  if(cross_AB_AC * cross_AB_AD < 0 && cross_CD_CA * cross_CD_CB < 0){
					  let dotValue = AB.dotProduct(CD),
						  angel_cos = Math.abs(dotValue/(AB.magnitude() * CD.magnitude()));
					  edgeCrossValue += angel_cos;
					  e4 += 0.01;
				  }else{
					  edgeCrossValue += 0;
				  }
			  }
		  });
	  });

	  //to prevent node is too close from the edge
	  let e5 = 0;
	  let d0 = 20;
	  this.nodePoints.forEach((val, key, array)=>{
		  let v_C = val.p; //represent dot position
		  this.edgeSprings.forEach((val2, key2, array2)=> {
			  let minX = (val2.source.p.x > val2.target.p.x) ? val2.target.p.x : val2.source.p.x,
				  maxX = (val2.source.p.x < val2.target.p.x) ? val2.target.p.x : val2.source.p.x,
				  minY = (val2.source.p.y > val2.target.p.y) ? val2.target.p.y : val2.source.p.y,
				  maxY = (val2.source.p.y < val2.target.p.y) ? val2.target.p.y : val2.source.p.y;
			  if(val2.source.id !== val.id && val2.target.id !== val.id  && v_C.x >= minX && v_C.x <= maxX && v_C.y >= minY && v_C.y <= maxY){
				  let v_A = val2.source.p, //v_A represents the vector point, v_B represents the another vector point
					  v_B = val2.target.p;

				  let AB = v_B.subtract(v_A),
					  AC = v_C.subtract(v_A);

				  let d = Math.abs(AB.crossProduct(AC)/AB.magnitude()); //calculate the distance of point to line

          let max = (d * d) < (d0 * d0) ? 20 : d * d;
				 e5 += (1 / (max));
			  }
		  });
	  });
	  console.log("e1-"+e1+":"+"e2-"+e2+":"+"e3-"+e3+":"+"e4-"+e4+":"+"e5-"+e5);
    let result = k1 * e1 + k2 * e2 + k3 * e3 + k4 * e4 + k5 * e5;
    console.log(result);
	  //record best answer
	  this.annealingResults.push({nodePoints:cloneDeep(this.nodePoints), count:result,  edgeSprings:cloneDeep(this.edgeSprings)});
  }
	cost_spring(){
		let count = 0;
		this.nodePoints.forEach((val, key, array)=>{
			let v_C = val.p; //represent dot position
			this.edgeSprings.forEach((val2, key2, array2)=> {
				let minX = (val2.source.p.x > val2.target.p.x) ? val2.target.p.x : val2.source.p.x,
					maxX = (val2.source.p.x < val2.target.p.x) ? val2.target.p.x : val2.source.p.x,
					minY = (val2.source.p.y > val2.target.p.y) ? val2.target.p.y : val2.source.p.y,
					maxY = (val2.source.p.y < val2.target.p.y) ? val2.target.p.y : val2.source.p.y;
				if(val2.source.id !== val.id && val2.target.id !== val.id  && v_C.x >= minX && v_C.x <= maxX && v_C.y >= minY && v_C.y <= maxY){
					let v_A = val2.source.p, //v_A represents the vector point, v_B represents the another vector point
						v_B = val2.target.p;

					let AB = v_B.subtract(v_A),
						AC = v_C.subtract(v_A);

					let d = Math.abs(AB.crossProduct(AC)/AB.magnitude()); //calculate the distance of point to line

					(d <= (parseInt(val.radius[0]))) ? count++ : null;
				}
			});
		});

		//record crossings based on metric
		let edgeCrossNumber = 0,
			edgeCrossValue = 0;
		this.edgeSprings.forEach((val, key, array) => {
			let v1_A = val.source,
				v1_B =  val.target;

			this.edgeSprings.forEach((val2, key, array) => {
				let v2_C = val2.source,
					v2_D =  val2.target;
				if(v2_C.id === v1_A.id || v2_D.id === v1_A.id || v2_C.id === v1_B.id || v2_D.id === v1_B.id ){
					edgeCrossValue += 0;
				}else{
					//define the vector of ABCD
					let AC = v2_C.p.subtract(v1_A.p),
						AD = v2_D.p.subtract(v1_A.p),
						AB = v1_B.p.subtract(v1_A.p),

						CA = v1_A.p.subtract(v2_C.p),
						CB = v1_B.p.subtract(v2_C.p),
						CD = v2_D.p.subtract(v2_C.p),

						cross_AB_AC = AB.crossProduct(AC),
						cross_AB_AD = AB.crossProduct(AD),

						cross_CD_CA = CD.crossProduct(CA),
						cross_CD_CB = CD.crossProduct(CB);

					if(cross_AB_AC * cross_AB_AD < 0 && cross_CD_CA * cross_CD_CB < 0){
						let dotValue = AB.dotProduct(CD),
							angel_cos = Math.abs(dotValue/(AB.magnitude() * CD.magnitude()));
						edgeCrossValue += angel_cos;
						edgeCrossNumber++;
					}else{
						edgeCrossValue += 0;
					}
				}
			});
		});
		//record best answer
		this.annealingResults.push({nodePoints:cloneDeep(this.nodePoints), count:edgeCrossNumber, edgeCrossNumber:edgeCrossNumber, edgeCrossValue:edgeCrossValue,  edgeSprings:cloneDeep(this.edgeSprings)});
	}
  cooling_metric_occlusion(){


	  //decease the temperature after 50 fixed times
	  if(this.iterations - this.preIterations === 20){
      //caculate the cost function
      this.cost_spring_test();
      //record counts of occlusion based on metric
      let count = this.annealingResults[this.annealingResults.length -1].count;
      // console.log("let me see" +  count);

      let stage = 200;
      // if(this.iterations < 2000){
      // 	stage = 40;
      // }else if(this.iterations < 4000){
      //   stage = 30;
      // }
      // else if(this.iterations < 6000){
      //   stage = 20;
      // }else if(this.iterations < 8000){
      //   stage = 10;
      // }else if(this.iterations < 10000){
      //   stage = 5;
      // }else{
      //   stage = 40;
      // }

      //generation for new configuration
      this.props.repulsion = this.props.repulsion  + stage * (Math.random() - 0.5) ;
      this.props.stiffness =  this.props.stiffness + stage * (Math.random() - 0.5) ;
      this.props.defSpringLen = this.props.defSpringLen + 50 * (Math.random() - 0.5);

      this.props.repulsion < 0 ?   this.props.repulsion = 1 : null;
      this.props.stiffness < 0 ?   this.props.stiffness = 1 : null;
      // this.props.defSpringLen < 0 ?   this.props.defSpringLen = 1 : null;


      this.props.lastRepulsion = this.props.repulsion;
      this.props.lastStiffness =  this.props.stiffness;
      // this.props.lastDefSpringLen = this.props.defSpringLen;


      if(this.beyondNode === 1000000000 ){
        //get initial result f
        this.beyondNode = count;
      } else if(count > this.beyondNode ){
        if(Math.exp(-(count - this.beyondNode)/this.temperature) < (Math.random()/100) && count - this.beyondNode < 3){
          console.log("lucky"+ count + ">" + this.beyondNode +  "---" +Math.exp(-(count - this.beyondNode)/this.temperature) );
        }else{
          //accept new results base on the metropolis to accept the new result
          console.log("changed" + count + ">" + this.beyondNode);
          this.props.repulsion = this.props.lastRepulsion;
          this.props.stiffness = this.props.lastStiffness;
          // this.props.defSpringLen = this.props.lastDefSpringLen;
        }
      }
      this.beyondNode = count;
		  this.preIterations = this.iterations;
		  this.cooling_FR();
	  }
  }
  cooling_fineTuning(){
	  let len = this.nodes.length;
	  for (let i = 0; i < len; i++) {
		  let point = this.nodePoints.get(this.nodes[i].id);

		  if(this.notAccpetFineTuning){
			  //construct [-2, 2] vector
			  let randomVec = new Vector((Math.random() - 0.5)  , (Math.random() - 0.5)  );
			  this.fineTuningVector.set(this.nodes[i].id, randomVec);
		  }
		  point.p = point.p.add(this.fineTuningVector.get(this.nodes[i].id));
	  }
	  // this.getBounds();
	  //caculate the cost function
	  this.cost_spring_test();
	  //record counts of occlusion based on metric
	  let count = this.annealingResults[this.annealingResults.length -1].count;
	  console.log("let me see" +  count);

	if(count < this.beyondNode || Math.exp(-(count - this.beyondNode)/this.temperature) > Math.random()){
		  //accept new results base on the metropolis to accept the new result
		  this.beyondNode = count;
		  this.notAccpetFineTuning = false;
		  // this.props.defSpringLen = this.props.lastDefSpringLen;
	  }else{
		this.notAccpetFineTuning = true;
	}
  }

	cooling_metric_angel(){
		//record counts of occlusion based on metric
		let angelCount = 0;
		for (let i = 0; i < this.nodes.length; i++) {
			//sort node with clockwise angel size
			let val = this.nodePoints.get( this.nodes[i].id);  // get val

			let obj1 = {}, //node located on the upper half of the Y axis, based on the val target
				obj2 = {}, //node located on the upper half of the Y axis  based on the val target
				degreeLength = val.degree.length;

			let angel_ideal = 360 / degreeLength;

			if(degreeLength === 1){
				break;
			}

			for(let i = 0; i < degreeLength; i++){
				//calculate dotValue of v1 and baseVector
				let v2 = this.nodePoints.get(val.degree[i]),
					dealtVector = val.p.subtract(v2.p),
					baseVector = new Vector(1, 0),
					dotValue = dealtVector.dotProduct(baseVector) / dealtVector.magnitude() ; //calculate the value of cos to sort
				//to partition
				dealtVector.y > 0 ? obj1[v2.id] = dotValue : obj2[v2.id] = dotValue;
			}

			// to sort obj based on dotValue
			let sortedId1 = Object.keys(obj1)
				.sort(function(a, b){
					return obj1[a] - obj1[b]; //ascending
				});
			let sortedId2 = Object.keys(obj2)
				.sort(function(a, b){
					return obj2[b] - obj2[a]; //descending
				});
			val.degree = sortedId2.concat(sortedId1);
			//sort ending


			//calculate the diff of angel of the adjacent edge
			for(let i = 1; i < degreeLength; i ++) {
				//get angel
				let v1Node, v2Node, v3Node;
				if (i === degreeLength - 1) {
					v1Node = this.nodePoints.get(val.degree[i]);
					v2Node = this.nodePoints.get(val.degree[0]);
				} else {
					v1Node = this.nodePoints.get(val.degree[i - 1]);
					v2Node = this.nodePoints.get(val.degree[i]);
				}

				let dealtVector1 = v1Node.p.subtract(val.p), //v1-v
					dealtVector2 = v2Node.p.subtract(val.p), //v2-v
					dotValue = dealtVector1.dotProduct(dealtVector2),
					angel = (Math.acos(dotValue / (dealtVector1.magnitude() * dealtVector2.magnitude()))) / 3.14 * 180; //clockwise

					angelCount += Math.abs(angel - angel_ideal);
			}
		}

		let count = 0;
		this.nodePoints.forEach((val, key, array)=>{
			let v_C = val.p; //represent dot position
			this.edgeSprings.forEach((val2, key2, array2)=> {
				let minX = (val2.source.p.x > val2.target.p.x) ? val2.target.p.x : val2.source.p.x,
					maxX = (val2.source.p.x < val2.target.p.x) ? val2.target.p.x : val2.source.p.x,
					minY = (val2.source.p.y > val2.target.p.y) ? val2.target.p.y : val2.source.p.y,
					maxY = (val2.source.p.y < val2.target.p.y) ? val2.target.p.y : val2.source.p.y;
				if(val2.source.id !== val.id && val2.target.id !== val.id  && v_C.x >= minX && v_C.x <= maxX && v_C.y >= minY && v_C.y <= maxY){
					let v_A = val2.source.p, //v_A represents the vector point, v_B represents the another vector point
						v_B = val2.target.p;

					let AB = v_B.subtract(v_A),
						AC = v_C.subtract(v_A);

					let d = Math.abs(AB.crossProduct(AC)/AB.magnitude()); //calculate the distance of point to line

					(d <= (parseInt(val.radius[0]))) ? count++ : null;
				}
			});
		});

		//results generate
		if(angelCount < this.angelNode || angelCount === 0){
			//accept new results
			this.angelNode = angelCount;
		}else{
			//base on the metropolis to accept the new result
			let metropolis = Math.exp(-(angelCount - this.angelNode)/this.temperature);
			if(metropolis < Math.random()){
				//accept new results
				this.angelNode = angelCount;
			}else{
				//can not effect the temperature
				this.props.damping += 0.015;
				if( this.props.damping > 0.95){
					this.props.damping = 0.95;
				}
			}

		}
		//record best answer
		this.annealingResults.push({nodePoints:cloneDeep(this.nodePoints), count:angelCount, occlusionCount:count, edgeSprings:cloneDeep(this.edgeSprings)});
		//decrease the temperature
		this.temperature += -this.temperature * this.deltTem;
		if(this.temperature < this.targetTem) this.temperature = 0;
		// console.log(this.temperature);
	}

	/**
	 * Update repulsion forces between nodes
	 * @return {[type]} [description]
	 */
	
	updateCoulombsLaw_Spring() {
		let len = this.nodes.length;

		for (let i = 0; i < len; i++) {
			for (let j = i + 1; j < len; j++) {
				if (i === j) continue;

				let iNode = this.nodes[i],
					jNode = this.nodes[j],
					v = this.nodePoints.get(iNode.id).p.subtract(this.nodePoints.get(jNode.id).p), // get the diff of x and y posotion
          iNodeDegree = this.nodePoints.get(iNode.id).degree.length,
          jNodeDegree = this.nodePoints.get(jNode.id).degree.length,
          maxStrength = 1 / Math.min(iNodeDegree, jNodeDegree),//depend on the degree of node to differ the distance of nodes
          bias = iNodeDegree / (iNodeDegree + jNodeDegree),
					dis = (v.magnitude() + 0.1) * this.props.coulombDisScale, //get the distance of the two nodes
					direction = v.normalise();  // (dx | dy) / ||dx + dY||

				// console.log('dis', dis);
				this.nodePoints.get(iNode.id).updateAcc(direction.multiply(this.props.repulsion).divide(Math.pow(dis, 2))); //   (deltX | deltY) * k / (dis * dis), k is lorentz force coefficient
				this.nodePoints.get(jNode.id).updateAcc(direction.multiply(this.props.repulsion).divide(-Math.pow(dis, 2)));
				// console.log(direction + 'xxx');
			}
		}
	}

	updateHookesLaw_Spring() {
		let len = this.edges.length;

		for (let i = 0; i < len; i++) {

			let spring = this.edgeSprings.get(this.edges[i].id),
				v = spring.target.p.subtract(spring.source.p),   // v = target - source
        sourceDegree = spring.source.degree.length,
        targetDegree = spring.target.degree.length,
        maxStrength = 1 / Math.min(sourceDegree, targetDegree),//depend on the degree of node to differ the distance of nodes
        bias = targetDegree / (targetDegree + sourceDegree),
				displacement = spring.length - v.magnitude(),
				direction = v.normalise();

			// console.log(spring.source, spring.target);
			spring.source.updateAcc(direction.multiply(-this.props.stiffness * displacement));
			spring.target.updateAcc(direction.multiply(this.props.stiffness * displacement));
		}
	}

	/**
	 * for Spring algorithms
	 * base on the angel of edge to rotate the edge
	 * the degree order is counter clockWise
	 */
	updateAngelForce_ForceAR(){
		let len = this.nodes.length;

		for (let i = 0; i < len; i++) {

			//sort node with clockwise angel size
			let val = this.nodePoints.get( this.nodes[i].id);  // get val

			let obj1 = {}, //node located on the upper half of the Y axis, based on the val target
				obj2 = {}, //node located on the upper half of the Y axis  based on the val target
				degreeLength = val.degree.length;

			let angel_ideal = 360 / degreeLength;

			if(degreeLength === 1){
				break;
			}

			for(let i = 0; i < degreeLength; i++){
				//calculate dotValue of v1 and baseVector
				let v2 = this.nodePoints.get(val.degree[i]),
					dealtVector = val.p.subtract(v2.p),
					baseVector = new Vector(1, 0),
					dotValue = dealtVector.dotProduct(baseVector) / dealtVector.magnitude() ; //calculate the value of cos to sort
				//to partition
				dealtVector.y > 0 ? obj1[v2.id] = dotValue : obj2[v2.id] = dotValue;
			}

			// to sort obj based on dotValue
			let sortedId1 = Object.keys(obj1)
				.sort(function(a, b){
					return obj1[a] - obj1[b]; //ascending
				});
			let sortedId2 = Object.keys(obj2)
				.sort(function(a, b){
					return obj2[b] - obj2[a]; //descending
				});
			val.degree = sortedId2.concat(sortedId1);
			//sort ending


			//calculate the diff of angel of the adjacent edge
			for(let i = 1; i < degreeLength-1; i ++){
				//get angel
				let v1Node, v2Node, v3Node;
				if(i === degreeLength-2){
					v1Node = this.nodePoints.get(val.degree[0]);
					v2Node = this.nodePoints.get(val.degree[i-1]);
					v3Node = this.nodePoints.get(val.degree[i+1]);
				}else{
					v1Node = this.nodePoints.get(val.degree[i-1]);
					v2Node = this.nodePoints.get(val.degree[i]);
					v3Node = this.nodePoints.get(val.degree[i+1]);
				}

				let	dealtVector1 = v1Node.p.subtract(val.p), //v1-v
					dealtVector2 = v2Node.p.subtract(val.p), //v2-v
					dealtVector3 = v3Node.p.subtract(val.p), //v3-v

					dotValue = dealtVector1.dotProduct(dealtVector2),
					dotValue2 = dealtVector2.dotProduct(dealtVector3),
					angel = (Math.acos(dotValue/(dealtVector1.magnitude() * dealtVector2.magnitude()))) / 3.14 * 180, //clockwise
					angel2 = (Math.acos(dotValue2/(dealtVector2.magnitude() * dealtVector3.magnitude()))) / 3.14 * 180; //clockwise

				// if(v2Node.id === '1153292'){
				// 	console.log(val.degree);
				// 	console.log("angel2-" + angel2 + "  angel-" + angel);
				// }

				if( Math.abs(angel2 - angel_ideal) > 10 ||Math.abs(angel - angel_ideal) > 10  ){
					if((angel2 - angel) > 0){ //counter clockwise direction
						let v = this.nodePoints.get(v2Node.id).p.subtract(this.nodePoints.get(val.id).p), // get the diff of x and y posotion
							direction = v.normalise(),
							dis = (v.magnitude() + 0.1) * this.props.coulombDisScale, //get the distance of the two nodes
							direction_rotate = direction.rotate_counterClock(3.14/2);  //the vector  rotate_counterClock 90 degrees

						//v2 counter clockwoise directin roatate
						this.nodePoints.get(v2Node.id).updateAcc(direction_rotate.multiply( 10 * Math.sin((angel2 - angel) / 180 * 3.14)));

					}else if((angel - angel2) > 0){
						let v = this.nodePoints.get(v2Node.id).p.subtract(this.nodePoints.get(val.id).p), // get the diff of x and y posotion
							direction = v.normalise(),
							dis = (v.magnitude() + 0.1) * this.props.coulombDisScale,//get the distance of the two nodes
							direction_rotate = direction.rotate_clock(3.14/2);  //rotate clock 90 degeree

						// this.nodePoints.get(v1Node.id).updateAcc(direction_rotate.multiply(2 * Math.sin((angel - angel2) / 180 * 3.14)));
						this.nodePoints.get(v2Node.id).updateAcc(direction_rotate.multiply(10 * Math.sin((angel - angel2) / 180 * 3.14)));
						// console.log(direction_rotate.multiply(20 * Math.sin((angel - angel_ideal) / 180 * 3.14)))
					}
				}


			}
		}
	}

	/**
	 * Attract to center with little repulsion acceleration
	 *
	 * the divisor is set to 100.0 by experience, but lack of provements
	 * @return {[type]} [description]
	 */
	attractToCentre() {
		let len = this.nodes.length;

		for (let i = 0; i < len; i++) {
			let point = this.nodePoints.get(this.nodes[i].id),

				direction = point.p.subtract(this.center);

			point.updateAcc(direction.multiply(-this.props.repulsion / 20));
		}
	}

  /**
   * Attract to center with little repulsion acceleration
   *
   * the divisor is set to 100.0 by experience, but lack of provements
   * @return {[type]} [description]
   */
  attractToCentre_FR() {
    let len = this.nodes.length;

    for (let i = 0; i < len; i++) {
      let point = this.nodePoints.get(this.nodes[i].id),

        direction = point.p.subtract(this.center);

      point.updateAcc(direction.multiply(-this.props.repulsion / 100));
    }
  }

	/**
	 * update points' velocity
	 * @param  {[type]} interval [description]
	 * @return {[type]}          [description]
	 */
	updateVelocity(interval) {
		let len = this.nodes.length;

		// console.log(this.temperature);
		for (let i = 0; i < len; i++) {
			let point = this.nodePoints.get(this.nodes[i].id);
			point.v = point.v.add(point.a.multiply(interval * this.temperature )).multiply(this.props.damping);

			if (point.v.magnitude() > this.props.maxSpeed) {
				point.v = point.v.normalise().multiply(this.props.maxSpeed);
			}
			point.a = new Vector(0, 0);
		}
	}

	/**
	 * update point's position
	 * @param  {[type]} interval [description]
	 * @return {[type]}          [description]
	 */
	updatePosition_gephi(interval) {
		let len = this.nodes.length;
		for (let i = 0; i < len; i++) {
			let point = this.nodePoints.get(this.nodes[i].id);
			point.p.x = this.nodes[i].data.graphics.x;
			point.p.y = this.nodes[i].data.graphics.y;
		}
		// this.getBounds();
        // this.props.algorithm === 'FR' ? this.cooling_FR() : null;

		if(this.props.algorithm === "FR" || this.props.algorithm === "Spring" ){
			this.cooling_metric_occlusion();
		}else if(this.props.algorithm === "forceAR"){
			this.cooling_metric_angel();
		}
		else{
			this.cooling_FR();
		}
	}

  updatePosition(interval) {
    let len = this.nodes.length;
    for (let i = 0; i < len; i++) {
      let point = this.nodePoints.get(this.nodes[i].id);
      point.p = point.p.add(point.v.multiply(interval));
    }
    // this.getBounds();
    // this.props.algorithm === 'FR' ? this.cooling_FR() : null;

    if(this.props.algorithm === "FR" || this.props.algorithm === "Spring" ){
      this.cooling_metric_occlusion();
    }else if(this.props.algorithm === "forceAR"){
      this.cooling_metric_angel();
    }
    else{
      this.cooling_FR();
    }
  }

	/**
	 * calculate total energy
	 * @return {number} [description]
	 */
	calTotalEnergy() {
		let energy = 0.0,
			len = this.nodes.length;

		for (let i = 0; i < len; i++) {
			let point = this.nodePoints.get(this.nodes[i].id),
				speed = point.v.magnitude();

			energy += point.m * Math.pow(speed, 2) * 0.5;
		}
		this.deltaEnnergy = energy - this.currentEnergy;
		// console.log(this.deltaEnnergy);
		this.currentEnergy = energy;
		return  energy;
	}

	/**
	 * Deprecated function: get current points' boundary
	 * @return {{topLeft: Vector, bottomRight: Vector}} [description]
	 */
	getBounds() {
		let topLeft = new Vector(0, 0),
			bottomRight = new Vector(this.props.width, this.props.height);

		this.nodePoints.forEach(function(point, key, map) {
			if (point.p.x < topLeft.x) {
				point.p.x = topLeft.x + 1;
			}
			if (point.p.y < topLeft.y) {
        point.p.y = topLeft.y + 1;
			}
			if (point.p.x > bottomRight.x) {
        point.p.x = bottomRight.x - 1;
			}
			if (point.p.y > bottomRight.y) {
        point.p.y = bottomRight.y - 1;
			}
		});

		let padding = bottomRight.subtract(topLeft).multiply(0.05);
		return {
			'topLeft': topLeft.add(padding),
			'bottomRight': bottomRight.subtract(padding)
		}
	}

	/**
	 * to render by the browser and timing
	 * @return {[type]} [description]
	 */
	renderByBrowser(selfLayout, callback){
		let self = selfLayout;
		let timer = setInterval(function() {
			self.renderTime += 10;
		}, 10);
		window.requestAnimationFrame(function step() {
			self.tick(self.deltTem); //0.02
			self.render({name: "chart0"}); //to handle user's interaction
			self.iterations++;
			let energy = self.calTotalEnergy();

			if (self.props.detail) {
				self.updateDetails(energy);
			}

			//calculate the percentage of deltaEnergy of Energy / curEnergy
			let percentEnergy = self.deltaEnnergy / self.currentEnergy;
			//cost function value
			let costValue = null;

			//to find best result of annealing
			if(self.props.algorithm === "Spring" || self.props.algorithm === "FR" ) {
				// self.annealingResults.sort((a, b) => {
				// 	return   a.count -b.count;
				// });
				// costValue = self.annealingResults[0].count;
				self.annealingResults.splice(1,self.annealingResults.length -2 );
			}

			if ((self.iterations === 200 ) ||  costValue === 0 || self.temperature === 0) {
			  // self.nodePoints = self.annealingResults[0].nodePoints;
			  // self.edgeSprings = self.annealingResults[0].edgeSprings;
        // self.render({name: "chart0"}); //to handle user's interaction

				console.log(costValue);
				console.log('stop');
				self.renderEnd = true;
				window.cancelAnimationFrame(step);
				clearInterval(timer);
				// self.shortestPath();
				// self.shortestPath2();
				//promise handle render forceLayout macro task, and return value
				callback(self);
			} else {
				window.requestAnimationFrame(step);
			}
		});
	}


	/**
	 * DFS
	 * calculate the shortest path of two nodes
	 * @return {[type]} [description]
	 */

	shortestPath(){
		let count = 0,
			node1 = null,node2 = null,
			self = this,
			minCollection = [],
			nlen = self.nodePoints.size;

		//find node id
		self.nodePoints.forEach(function(val, key, map) {
			// Map(key, val)
			count++;
			count === parseInt((self.randomKey * nlen >= nlen ) ? nlen-1 : self.randomKey * nlen) ? node1 = val.id : null;
			count === parseInt((self.randomKey2 * nlen >= nlen ) ? nlen-1 : self.randomKey * nlen) ? node2 = val.id : null;
		});

		//dfs search for looking shortest path

		//to flag the node in order to produce maximum call stack
		let color = [];

		self.nodePoints.forEach(function(val, key, map) {
			color[key] = 'white';
		});


		function recursion(srcID, tarID, time){
			color[srcID] = 'grey';
			let degreeMember = self.nodePoints.get(srcID).degree,
				length = degreeMember.length;
			let count = time;
			count++; //record recursion times
			for(let i = 0; i < length; i++){
				node1 = degreeMember[i];
				if(color[node1] === 'white'){
					recursion(node1, node2, count);
				}
				if(node1 === tarID){
					minCollection.push(count);
				}
			}
			color[srcID] = 'black';
		}

		recursion(node1, node2, 0);
		let shortestPath = Math.min.apply(this, minCollection);
		console.log(shortestPath + '    length');
		// console.log(minCollection + '    length');
	}

	/**
	 * BFS
	 * calculate the shortest path of two nodes
	 * @return {[type]} [description]
	 */

	shortestPath2(){
		let count = 0,
			node1 = null,node2 = null,
			self = this,
			nlen = self.nodePoints.size;

		//find node id
		self.nodePoints.forEach(function(val, key, map) {
			// Map(key, val)
			count++;
			count === parseInt((self.randomKey * nlen >= nlen ) ? nlen-1 : self.randomKey * nlen) ? node1 = val.id : null;
			count === parseInt((self.randomKey2 * nlen >= nlen ) ? nlen-1 : self.randomKey * nlen) ? node2 = val.id : null;
		});

		//dfs search for looking shortest path

		//to flag the node in order to produce maximum call stack
		let color = [],
			dis = [],
			preNode = [],
			queue = [];

		self.nodePoints.forEach(function(val, key, map) {
			color[key] = 'white';
			dis[key] = 0;
			preNode[key] = null;
		});

		queue.push(node1);

		while(queue.length){
			let curNode = queue.shift();

			color[curNode] = 'grey';

			let degreeMember = self.nodePoints.get(curNode).degree,
				length = degreeMember.length;

			for(let i = 0; i < length; i++){
				let nextNode = degreeMember[i];
				if(color[nextNode] === 'white'){
					color[nextNode] = 'grey';
					dis[nextNode] = dis[curNode] + 1;
					preNode[nextNode] = curNode;
					queue.push(nextNode);
				}
			}
			color[curNode] = 'black';
		}


		let shortestPath = dis[node2];
		// console.log(dis );
		console.log(shortestPath + '    length');

		for(let v = node2; v !== node1; v = preNode[v]){
			this.pathNode.unshift(v);
		}
		this.pathNode.unshift(node1);
		console.log(this.pathNode);
	}


	/**
	 * render function
	 * @return {[type]} [description]
	 */
	render(chart) {
		let self = this,
			nlen = this.nodes.length,
			elen = this.edges.length,
			approach = this.props.approach;
		let scaleX = 1,
			scaleY = 1;


		/**
		 * judge which chart to render
		 * Initiate Container size again
		 * @param  {[type]} this.initState [description]
		 * @return {[type]}                [to control the canvas initialize]
		 */
		switch (chart.name) {
			case 'chart0':
				initContainerSize();
				scaleX = 1;
				scaleY = 1;

				/**
				 * Clean canvas layout if current approach is canvas
				 */

				if (this.props.approach === 'canvas') {
					this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
				}

				/**
				 * render edge and node
				 */

				this.edgeSprings.forEach(function(val, key, map) {
					drawEdge(key, val, scaleX, scaleY);
				});

				this.nodePoints.forEach(function(val, key, map) {
					// Map(key, val)
					drawNode(key, val, scaleX, scaleY);
				});

				break;
			case 'chart5': //resize the canvas

				//initail canvas size and bind dom
				initContainerSize_chart5();

				scaleX =  self.props.width / this.canvas.width;
				scaleY =  self.props.height / this.canvas.height;

				/**
				 * Clean canvas layout if current approach is canvas
				 */
				if (this.props.approach === 'canvas') {
					this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
				}


				if(chart.item.indexOf("node") !== -1){

					/**
					 * render edge and node
					 */
					this.edgeSprings.forEach(function(val, key, map) {
						drawEdge(key, val, scaleX, scaleY);
					});

					this.nodePoints.forEach(function(val, key, map) {
						// Map(key, val)
						drawNode(key, val, scaleX, scaleY);
					});


					let min_node = 1,
						max_node = 0;
					this.nodePoints.forEach((val, key, array) => {
						let value = 1 - val[chart.item];
						min_node > value ? min_node = value : null;
						max_node < value ? max_node = value : null;
					});

					this.nodePoints.forEach(function(val, key, map) {
						// Map(key, val)
						heatMap_node(key, val, map,scaleX, scaleY, chart.item, min_node, max_node);
					});
				}else if(chart.item.indexOf("edge") !== -1){

					let min_edge = 1,
						max_edge = 0;
					this.edgeSprings.forEach((val, key, array) => {
						let value = 1 - val[chart.item];
						min_edge > value ? min_edge = value : null;
						max_edge < value ? max_edge = value : null;
					});

					this.edgeSprings.forEach(function(val, key, map) {
						heatMap_edge(key, val, map,scaleX, scaleY, chart.item, min_edge, max_edge);
					});

					/**
					 * render edge and node
					 */
					this.nodePoints.forEach(function(val, key, map) {
						// Map(key, val)
						drawNode(key, val, scaleX, scaleY);
					});


				}else{
					/**
					 * render edge and node
					 */
					this.edgeSprings.forEach(function(val, key, map) {
						drawEdge(key, val, scaleX, scaleY);
					});

					this.nodePoints.forEach(function(val, key, map) {
						// Map(key, val)
						drawNode(key, val, scaleX, scaleY);
					});
				}

				break;
			case 'chart1':
				initContainerSize_chart1();
				scaleX =  self.props.width / this.canvas.width;
				scaleY =  self.props.height / this.canvas.height;

				if (this.props.approach === 'canvas') {
					this.ctx.clearRect(0, 0, this.canvas.width / scaleX, this.canvas.height / scaleY);
				}

				this.edgeSprings.forEach(function(val, key, map) {
					drawEdge(key, val, scaleX, scaleY);
				});


				this.nodePoints.forEach(function(val, key, map) {
					// Map(key, val)
					drawNode(key, val, scaleX, scaleY);
				});

				//get min and max of node or edge index

				let min_node = 1,
					max_node = 0;
				this.nodePoints.forEach((val, key, array) => {
					let value = 1 - val[chart.item];
					min_node > value ? min_node = value : null;
					max_node < value ? max_node = value : null;
				});

				this.nodePoints.forEach(function(val, key, map) {
					// Map(key, val)
					heatMap_node(key, val, map,scaleX, scaleY, chart.item, min_node, max_node);
				});
				break;
			case 'chart2':
				initContainerSize_chart2();
				scaleX =  self.props.width / this.canvas.width;
				scaleY =  self.props.height / this.canvas.height;

				if (this.props.approach === 'canvas') {
					this.ctx.clearRect(0, 0, this.canvas.width / scaleX, this.canvas.height / scaleY);
				}

				//get min and max of node or edge index

				let min_edge = 1,
					max_edge = 0;
				this.edgeSprings.forEach((val, key, array) => {
					let value = 1 - val[chart.item];
					min_edge > value ? min_edge = value : null;
					max_edge < value ? max_edge = value : null;
				});

				this.edgeSprings.forEach(function(val, key, map) {
					heatMap_edge(key, val, map,scaleX, scaleY, chart.item, min_edge, max_edge);
				});


				this.nodePoints.forEach(function(val, key, map) {
					// Map(key, val)
					drawNode(key, val, scaleX, scaleY);
				});
				break;
			case 'chart3':// experiment chart for node degree experiment
				if(!this.renderEnd){
					initContainerSize();
					scaleX = 1;
					scaleY = 1;

					/**
					 * Clean canvas layout if current approach is canvas
					 */

					if (this.props.approach === 'canvas') {
						this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
					}

					/**
					 * render edge and node
					 */

					this.edgeSprings.forEach(function(val, key, map) {
						drawEdge(key, val, scaleX, scaleY);
					});

					//select random number
					let count = 0,
						color;

					this.nodePoints.forEach(function(val, key, map) {
						// Map(key, val)

						count++;
						count === parseInt(self.randomKey * nlen) ? color = '#d4237a' : color = '#565656';
						drawNode_NodeExperiment(key, val, scaleX, scaleY, color);
					});
				}

				break;
			case 'chart4':// experiment chart for node degree experiment
					initContainerSize();
					scaleX = 1;
					scaleY = 1;

					/**
					 * Clean canvas layout if current approach is canvas
					 */

					if (this.props.approach === 'canvas') {
						this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
					}

					/**
					 * render edge and node
					 */

					this.edgeSprings.forEach(function(val, key, map) {
						drawEdge(key, val, scaleX, scaleY);
					});

					//select random number
					let count = 0,
						color;

					this.nodePoints.forEach(function(val, key, map) {
						// Map(key, val)

						count++;
						if(count === parseInt(self.randomKey * nlen) || count === parseInt(self.randomKey2 * nlen)){
							color = '#d4237a';
						}else{
							color = '#565656';
						}
						drawNode_NodeExperiment(key, val, scaleX, scaleY, color);
					});
				break;
			case 'scaleRender':// experiment chart for node degree experiment

				scaleX =  self.props.width / this.canvas.width;
				scaleY =  self.props.height / this.canvas.height;

				let min_edge_scale = 1,
					max_edge_scale = 0;
				this.edgeSprings.forEach((val, key, array) => {
					let value = 1 - val[chart.item];
					min_edge_scale > value ? min_edge_scale = value : null;
					max_edge_scale < value ? max_edge_scale = value : null;
				});

				this.edgeSprings.forEach(function(val, key, map) {
					heatMap_edge_scale(key, val, map,scaleX , scaleY, chart.item, min_edge_scale, max_edge_scale, chart.zoom);
				});

				/**
				 * render edge and node
				 */
				this.nodePoints.forEach(function(val, key, map) {
					// Map(key, val)
					drawNode_scale(key, val, scaleX, scaleY, chart.zoom);
				});
				break;
		}


		function initContainerSize() {
			let e = document.getElementById(self.props.containerId);
			if (e) {
				e.parentNode.removeChild(e);
			}

			if (self.props.approach === 'canvas') {
				let container = document.createElement('canvas');
				container.id = self.props.containerId;
				container.width = self.props.width;
				container.height = self.props.height;
				document.getElementById(self.props.parentId).appendChild(container);

				self.canvas = container;
				self.ctx = container.getContext("2d");
				return;
			}

			let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute('id', self.props.containerId);
			document.getElementById(self.props.parentId).appendChild(svg);

			svg.setAttribute('width', self.props.width);
			svg.setAttribute('height', self.props.height);
		}

		function initContainerSize_chart5() {
			let e = document.getElementById(self.props.chartContainerId3);
			if (e) {
				e.parentNode.removeChild(e);
			}

			if (self.props.approach === 'canvas') {
				let container = document.createElement('canvas');
				container.id = self.props.chartContainerId3;
				//get container size
				let style = window.getComputedStyle(document.getElementById(self.props.resizeChart)),
					height = Number.parseFloat(style.getPropertyValue("height")),
					width = Number.parseFloat(style.getPropertyValue("width"));

				container.width = width;
				container.height = height;
				document.getElementById(self.props.resizeChart).appendChild(container);

				self.canvas = container;
				self.ctx = container.getContext("2d");
				return;
			}

			let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute('id', self.props.chartContainerId1);
			document.getElementById(self.props.chartParentId1).appendChild(svg);

			svg.setAttribute('width', self.props.width / 2);
			svg.setAttribute('height', self.props.height / 1.5);
		}

		function initContainerSize_chart1() {
			let e = document.getElementById(self.props.chartContainerId1);
			if (e) {
				e.parentNode.removeChild(e);
			}

			if (self.props.approach === 'canvas') {
				let container = document.createElement('canvas');
				container.id = self.props.chartContainerId1;
				container.width = self.props.width/2;
				container.height = self.props.height/1.5;
				document.getElementById(self.props.chartParentId1).appendChild(container);

				self.canvas = container;
				self.ctx = container.getContext("2d");
				return;
			}

			let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute('id', self.props.chartContainerId1);
			document.getElementById(self.props.chartParentId1).appendChild(svg);

			svg.setAttribute('width', self.props.width / 2);
			svg.setAttribute('height', self.props.height / 1.5);
		}

		function initContainerSize_chart2() {
			let e = document.getElementById(self.props.chartContainerId2);
			if (e) {
				e.parentNode.removeChild(e);
			}

			if (self.props.approach === 'canvas') {
				let container = document.createElement('canvas');
				container.id = self.props.chartContainerId2;
				container.width = self.props.width/2;
				container.height = self.props.height/1.5;
				document.getElementById(self.props.chartParentId2).appendChild(container);

				self.canvas = container;
				self.ctx = container.getContext("2d");
				return;
			}

			let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			svg.setAttribute('id', self.props.chartContainerId2);
			document.getElementById(self.props.chartParentId2).appendChild(svg);

			svg.setAttribute('width', self.props.width / 2);
			svg.setAttribute('height', self.props.height / 1.5);
		}

		function heatMap_node(key, val, map, scaleX, scaleY, item, min, max){

			if (self.props.approach === 'canvas') {

				let norValue;
				//nodeCross as test value
				//to normalize the value to  1 - 100
				if(max === min){
					norValue = 1;
				}else{
					norValue = 99 / (max - min) * ((1 - val[item]) - min) + 1;
				}



				// let threshold = this._points_min_threshold * max; //set threshold to filter point
				let pr = (Math.log(245)-1)/245; //alpha enhancement parameters

				//to realize log2N to meets more with human cognitive curve

				let q = parseInt(Math.log(norValue) / Math.log(100)  * 255), //no log2n
					r = parseInt(128 * Math.sin((1 / 256 * q - 0.5 ) * Math.PI ) + 200),
				    g = parseInt(128 * Math.sin((1 / 128 * q - 0.5 ) * Math.PI ) + 127),
				    b = parseInt(256 * Math.sin((1 / 256 * q + 0.5 ) * Math.PI )), //the lower the value q, the higher the transparency of red
				    alp = (0.82 * q + 20) / 255;

				// alp < 0.1 ?  alp = 0.3 : null;
				// console.log('rgb'+  r + ',' + g + ',' + b);

				let x = val.p.x / scaleX,
					y =  val.p.y / scaleY;

				let heatRadius = scaleX>1 ? 11: 20/scaleX;

				    // alp = (Math.exp(pr * q + 1) + 10) / 255 ;	//gray enhancement
				let grd = self.ctx.createRadialGradient(x,  y, 2, x,  y, heatRadius);
				grd.addColorStop( 0, 'rgba(' + r + ',' + g + ','+ b + ',' + alp + ')');
				grd.addColorStop( 0.5, 'rgba(' + r + ',' + g + ','+ b + ',' + alp/3 + ')');
				grd.addColorStop( 1, 'rgba(' + r + ',' + g + ','+ b + ',0)');
				self.ctx.fillStyle = grd;
				self.ctx.fillRect( x - heatRadius, y - heatRadius, heatRadius*2, heatRadius*2);
				return;
			}

			//svg draw
			let node = document.getElementById(`node-${key}`),
				container = document.getElementById(self.props.containerId);

			if (!node) {
				node = document.createElementNS("http://www.w3.org/2000/svg", 'circle');

				node.id = `node-${key}`;
				setAttributes(node, {
					'r': r / scaleX,
					'fill': fillStyle,
					'stroke': strokeStyle,
					'stroke-width': lineWidth
				});

				container.appendChild(node);
			}

			setAttributes(node, {
				'cx': val.p.x,
				'cy': val.p.y
			});
		}

		function drawNode(key, val, scaleX, scaleY) {
			// val.fillColor.length === 0 ? (val.group ? val.fillColor[0] = self.color(val.group) : val.fillColor[0] = '#565656') : null;
			val.fillColor.length === 0 ? (val.group ? val.fillColor[0] = '#565656' : val.fillColor[0] = '#565656') : null;
			let fillStyle =  val.fillColor[0],
				strokeStyle = val.strokeColor[0],
				r = val.radius[0],
				lineWidth = val.strokeWidth[0];

			if (self.props.approach === 'canvas') {
				self.ctx.strokeStyle = strokeStyle;
				self.ctx.fillStyle = fillStyle;
				self.ctx.lineWidth = lineWidth;
				self.ctx.beginPath();
				self.ctx.arc(val.p.x / scaleX, val.p.y / scaleY, r / scaleX, 0, 2 * Math.PI);
				self.ctx.stroke();
				self.ctx.fill();

				return;
			}

			//svg draw
			let node = document.getElementById(`node-${key}`),
				container = document.getElementById(self.props.containerId);

			if (!node) {
				node = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
				
				node.id = `node-${key}`;
				setAttributes(node, {
					'r': r / scaleX,
					'fill': fillStyle,
					'stroke': strokeStyle,
					'stroke-width': lineWidth
				});

				container.appendChild(node);
			}

			setAttributes(node, {
				'cx': val.p.x,
				'cy': val.p.y
			});
		}

		function drawNode_scale(key, val, scaleX, scaleY, zoom) {
			// val.fillColor.length === 0 ? (val.group ? val.fillColor[0] = self.color(val.group) : val.fillColor[0] = '#565656') : null;
			val.fillColor.length === 0 ? (val.group ? val.fillColor[0] = '#565656' : val.fillColor[0] = '#565656') : null;
			let fillStyle =  val.fillColor[0],
				strokeStyle = val.strokeColor[0],
				r = val.radius[0],
				lineWidth = val.strokeWidth[0];

			const canvas = document.querySelector("#biggerChart");
			const w = canvas.width;
			const h = canvas.height;

			if (self.props.approach === 'canvas') {
				self.ctx.strokeStyle = strokeStyle;
				self.ctx.fillStyle = fillStyle;
				self.ctx.lineWidth = lineWidth;
				self.ctx.beginPath();
				self.ctx.arc(val.p.x / scaleX - w / 2, val.p.y / scaleY - h / 2, r / zoom / 5, 0, 2 * Math.PI);
				self.ctx.stroke();
				self.ctx.fill();
			}

		}

		function drawNode_NodeExperiment(key, val, scaleX, scaleY, color) {

			let fillStyle =  color,
				strokeStyle = val.strokeColor[0],
				r = val.radius[0],
				lineWidth = val.strokeWidth[0];

			if (self.props.approach === 'canvas') {
				self.ctx.strokeStyle = strokeStyle;
				self.ctx.fillStyle = fillStyle;
				self.ctx.lineWidth = lineWidth;
				self.ctx.beginPath();
				self.ctx.arc(val.p.x / scaleX, val.p.y / scaleY, r / scaleX, 0, 2 * Math.PI);
				self.ctx.stroke();
				self.ctx.fill();

				return;
			}

			//svg draw
			let node = document.getElementById(`node-${key}`),
				container = document.getElementById(self.props.containerId);

			if (!node) {
				node = document.createElementNS("http://www.w3.org/2000/svg", 'circle');

				node.id = `node-${key}`;
				setAttributes(node, {
					'r': r / scaleX,
					'fill': fillStyle,
					'stroke': strokeStyle,
					'stroke-width': lineWidth
				});

				container.appendChild(node);
			}

			setAttributes(node, {
				'cx': val.p.x,
				'cy': val.p.y
			});
		}

		function heatMap_edge(key, val, map, scaleX = 1 , scaleY = 1, item, min, max) {
			let source = val.source,
				target = val.target,
				strokeStyle = null,
				strokeWidth = 1.5; //change strokeLength

			//nodeCross as test value
			//to normalize the value to  1 - 100

			let norValue = 99 / (max - min) * ((1 - val[item]) - min) + 1;

			//to realize log2N to meets more with human cognitive curve

			let q = parseInt(Math.log(norValue) / Math.log(100)  * 255), //no log2n
				r = parseInt(128 * Math.sin((1 / 256 * q - 0.5 ) * Math.PI ) + 200),
				g = parseInt(128 * Math.sin((1 / 128 * q - 0.5 ) * Math.PI ) + 127),
				b = parseInt(256 * Math.sin((1 / 256 * q + 0.5 ) * Math.PI )), //the lower the value q, the higher the transparency of red
				alp = (0.92 * q + 20) / 255;

			alp < 0.1 ?  alp = 0.3 : null;
			// console.log('rgb'+  r + ',' + g + ',' + b);

			strokeStyle =  'rgba(' + r + ',' + g + ','+ b + ',' + alp + ')';

			if (self.props.approach === 'canvas') {
				self.ctx.strokeStyle = strokeStyle;
				self.ctx.lineWidth = strokeWidth;
				self.ctx.beginPath();
				self.ctx.moveTo(source.p.x / scaleX, source.p.y / scaleY);
				self.ctx.lineTo(target.p.x / scaleX, target.p.y / scaleY);
				self.ctx.stroke();
				return;
			}

			let edge = document.getElementById(`edge-${key}`),
				container = document.getElementById(self.props.containerId);

			if (!edge) {
				edge = document.createElementNS("http://www.w3.org/2000/svg", 'line');

				edge.id = `edge-${key}`;

				setAttributes(edge, {
					'stroke': strokeStyle,
					'stroke-width': strokeWidth
				});

				container.appendChild(edge);
			}

			// update nodes and edge position
			setAttributes(edge, {
				'x1': source.p.x / scaleX,
				'y1': source.p.y / scaleY,
				'x2': target.p.x / scaleX,
				'y2': target.p.y / scaleY
			});
		}

		function heatMap_edge_scale(key, val, map, scaleX = 1, scaleY = 1, item, min, max, zoom) {
			let source = val.source,
				target = val.target,
				strokeStyle = null,
				strokeWidth = 1.5 / zoom ; //change strokeLength


			const canvas = document.querySelector("#biggerChart");
			const w = canvas.width;
			const h = canvas.height;

			//nodeCross as test value
			//to normalize the value to  1 - 100

      let norValue;
      if(max === min){
         norValue = 99 * ((1 - val[item]) - min) + 1;
      }else{
         norValue = 99 / (max - min) * ((1 - val[item]) - min) + 1;
      }
			if(norValue === 0){
        norValue = 0.05;
      }

			//to realize log2N to meets more with human cognitive curve

			let q = parseInt(Math.log(norValue) / Math.log(100)  * 255), //no log2n
				r = parseInt(128 * Math.sin((1 / 256 * q - 0.5 ) * Math.PI ) + 200),
				g = parseInt(128 * Math.sin((1 / 128 * q - 0.5 ) * Math.PI ) + 127),
				b = parseInt(256 * Math.sin((1 / 256 * q + 0.5 ) * Math.PI )), //the lower the value q, the higher the transparency of red
				alp = (0.92 * q + 20) / 255;

			alp < 0.1 ?  alp = 0.3 : null;
			// console.log('rgb'+  r + ',' + g + ',' + b);

			strokeStyle =  'rgba(' + r + ',' + g + ','+ b + ',' + alp + ')';
      console.log(strokeStyle);

			if (self.props.approach === 'canvas') {
				self.ctx.strokeStyle = strokeStyle;
				self.ctx.lineWidth = strokeWidth;
				self.ctx.beginPath();
				self.ctx.moveTo(source.p.x / scaleX - w /2 , source.p.y / scaleY - h / 2);
				self.ctx.lineTo(target.p.x / scaleX- w /2, target.p.y / scaleY- h / 2);
				self.ctx.stroke();
			}

		}


		function drawEdge(key, val, scaleX, scaleY) {
			let source = val.source,
				target = val.target,
				strokeStyle = 'rgb(130,130,130)',
				strokeWidth = 0.75; //change strokeLength

			if (self.props.approach === 'canvas') {
				self.ctx.strokeStyle = strokeStyle;
				self.ctx.lineWidth = strokeWidth;
				self.ctx.beginPath();
				self.ctx.moveTo(source.p.x / scaleX, source.p.y / scaleY);
				self.ctx.lineTo(target.p.x / scaleX, target.p.y / scaleY);
				self.ctx.stroke();

				return;
			}

			// let edge = d3.select(`#edge-${key}`),
			// 	container = d3.select(`#${self.props.containerId}`);

			// if (edge.empty()) {
			// 	edge = container.append('line')
			// 		.attr('id', `edge-${key}`)
			// 		.style('stroke', strokeStyle)
			// 		.style('stroke-width', strokeWidth);
			// }

			// // update nodes and edge position
			// edge.attr('x1', source.p.x)
			// 	.attr('y1', source.p.y)
			// 	.attr('x2', target.p.x)
			// 	.attr('y2', target.p.y);
			 	
			let edge = document.getElementById(`edge-${key}`),
				container = document.getElementById(self.props.containerId);

			if (!edge) {
				edge = document.createElementNS("http://www.w3.org/2000/svg", 'line');
				
				edge.id = `edge-${key}`;

				setAttributes(edge, {
					'stroke': strokeStyle,
					'stroke-width': strokeWidth
				});

				container.appendChild(edge);
			}

			// update nodes and edge position
			setAttributes(edge, {
				'x1': source.p.x / scaleX,
				'y1': source.p.y / scaleY,
				'x2': target.p.x / scaleX,
				'y2': target.p.y / scaleY
			});
		}

	}
}

export default forceLayout;
