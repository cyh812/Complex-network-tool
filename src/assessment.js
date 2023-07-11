import Vector from './Vector'

class Assessment {
	constructor(nodes, edges, layout){
		this.layout = layout;
		this.nodes = nodes; //[map], {nodeId:PointStruct}  Point Struct{id:value, position: vector...} ex) ‘id’- 'nodeName'
		this.edges = edges; //[map],  {edge.id: new Spring(source, target, length)}  ex) ‘id’- 'edgeNumber', 'source'- 'nodeValue'
		this.nodeLength = nodes.size; //nodeLength
		this.edgeLength = edges.size; //nodeLength
		this.sortNodeDegreeOrder(); //sort node degree
		//global index
		this.global = {
			nodeOverLap: 0,
			nodeAngel: 0,
			nodeCross: 0,
			nodeBeyondEdge: 0,
			nodeAbnormalEdge: 0,
			nodeAverageDegree: 0,
			nodeDegreeNumber: 0,
			nodeRegionalInterference: 0,
			nodeLinkLength: 0,

			edgeCross: 0,
			edgeAngel: 0,
			edgeUnderNode: 0,
			edgeLinkLength: 0
		}
	}

	/**
	 * calculate some geometric characteristic of nodes and edges
	 */
	//sort nodeDegree by adjacent order
	sortNodeDegreeOrder (){

		//sort node with clockwise angular order
		this.nodes.forEach((val, key, array)=>{
			let obj1 = {}, //node located on the upper half of the Y axis, based on the val target
				obj2 = {}, //node located on the upper half of the Y axis  based on the val target
				degreeLength = val.degree.length;

			for(let i = 0; i < degreeLength; i++){
				//calculate dotValue of v1 and baseVector
				let v2 = this.nodes.get(val.degree[i]),
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
		});
	}

	/**
	 * calculate assessment index of nodes
	 */
	//calculateNode overLap of nodes
	nodeLeap(){
		let sum = 0;
		this.nodes.forEach((val, key, array)=>{
			let nodeOverLap = 0;
			this.nodes.forEach((val2, key2, array2)=> {
				if(key !== key2){
					let dis = val.p.subtract(val2.p).magnitude();
					// console.log(key + ":" + val.p.x + '/' + val.p.y + '-' + key2 + val2.p.x + '/' + val2.p.y + "----" + dis);
					dis < (parseInt(val.radius[0]) + parseInt(val2.radius[0])) ? nodeOverLap++ : null;
				}
			});
			val.nodeOverlap = 1 - Number(nodeOverLap / this.nodeLength);
			sum += val.nodeOverlap;
		});
		this.global.nodeOverLap = (sum/this.nodeLength).toFixed(2);
	}

	//calculateNode edge adjacent angel of node, and nodeAngel index for edge
	nodeAngel (){
		let sum = 0;
		this.nodes.forEach((val, key, array)=>{
			let degreeLength = val.degree.length,
			    idealAngel = 360 / degreeLength,
				lowestAngel = 10, //lowest angel for node
				angelMin = [];

			if(degreeLength === 1){
				val.nodeAngel = 1;
			}else{
				let beyondLowestAngel = 0;
				if(degreeLength !== 0){
          for(let i = 1; i <= degreeLength; i++){
            //calculate dotValue of v1 and v1(adjacent node)
            let v1Node, v2Node;
            if(i === degreeLength){
              v1Node = this.nodes.get(val.degree[0]);
              v2Node = this.nodes.get(val.degree[i-1]);
            }else{
              v1Node = this.nodes.get(val.degree[i-1]);
              v2Node = this.nodes.get(val.degree[i]);
            }

            let	dealtVector1 = val.p.subtract(v1Node.p),
              dealtVector2 = val.p.subtract(v2Node.p),

              dotValue = dealtVector1.dotProduct(dealtVector2),
              angel = (Math.acos(dotValue/(dealtVector1.magnitude() * dealtVector2.magnitude()))) / 3.14 * 180;
            // console.log(val.id + '---' + v1Node.id + '-' + v2Node.id + ':    ' + angel);
							if(isNaN(angel)){
								angel = 45;
								console.log("angel false")
							}
            angel > lowestAngel ? beyondLowestAngel++ : null;
            angelMin.push(angel);
          }

          //to consider some node with little k, so the index value will be small, it needs to make some change
          if(idealAngel >= 90){
            idealAngel = 90;
            if(idealAngel < Math.min.apply(this, angelMin)){
              idealAngel = Math.min.apply(this, angelMin);
            }
          }

          val.nodeAngel = (1-(idealAngel - Math.min.apply(this, angelMin)) / idealAngel) * (beyondLowestAngel / degreeLength);
          // if(val.id === "MotherInnocent"){
          // 	console.log(val.id + '-' + idealAngel);
          // }
				}

			}

			sum += val.nodeAngel;

		});
		this.global.nodeAngel = (sum/this.nodeLength).toFixed(2);
	}


	//calculateNode crossing index of the edges of nodes, and calculate cross index for edge time: O(n*m*d)
	nodeCross(){
		let sum = 0;
		this.nodes.forEach((val, key, array)=>{
			let degreeLength = val.degree.length,
				nodeDegreeId = val.degree;

			let nodeCross = 0;

			//calculate the edge of the node
			for(let i = 0; i < degreeLength; i++){
				let v1_A = val,  //source node which can not be repeated calculated
					v1_B =  this.nodes.get(val.degree[i]);

				let cross_all = 0,
					cross_number = 0;

				//calculate the edge with all edges
				this.edges.forEach((val2, key, array) => {
					let v2_C = val2.source,
						v2_D =  val2.target;
					if(v2_C.id === v1_A.id || v2_D.id === v1_A.id ){
						cross_all += 1;
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

							// console.log(val.id + '-' + angel_cos);
							cross_all += 1 - angel_cos;
							cross_number++;
						}else{
							cross_all += 1;
						}
					}
				});
				nodeCross += cross_all / this.edgeLength / (cross_number ? cross_number : 1);
				// if(val.id === "Boulatruelle"){
				// 	console.log(val.id + '-' + cross_all);
				// }
			}
			val.nodeCross = nodeCross / degreeLength ;
			sum += val.nodeCross;
		});

		this.global.nodeCross = (sum/this.nodeLength).toFixed(2);
	}

	//calculate the index of  Node beyond edges, main: the dot to line distance
	nodeBeyondEdge(){
		let min = 1;
		this.nodes.forEach((val, key, array)=>{
			let nodeBeyondEdge = 0,
				v_C = val.p, //represent dot position
				nodeDegree = val.degree.length;
			this.edges.forEach((val2, key2, array2)=> {
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

					(d <= (parseInt(val.radius[0]) + 2)) ? nodeBeyondEdge++ : null;
				}
			});
			// console.log(val.id + '-' + nodeBeyondEdge);
			val.nodeBeyondEdge = 1 - Number(nodeBeyondEdge / (this.nodeLength - nodeDegree));
			min >=  val.nodeBeyondEdge ? min = val.nodeBeyondEdge : null;
		});
		let sum =  this.eliminateMagnitude_nodes(min, 1, 'nodeBeyondEdge');
		this.global.nodeBeyondEdge = (sum/this.nodeLength).toFixed(2);
	}

	//calculate the index of abnormal edge, main: distance sort
	nodeAbnormalEdge(){
		let sum = 0;
		this.nodes.forEach((val, key, array)=>{
			let nodeAbnormalEdge = 0;
			let degreeLength = val.degree.length,
				nodeDegreeId = val.degree;


				//calculate the distance of the node and the degree node
				for(let i = 0; i < degreeLength; i++) {
					let v_A = val.p,  //source node
						v_B = this.nodes.get(val.degree[i]).p,
						sr = 0; //the sequence of the distance

					let distanceA_B = v_A.subtract(v_B).magnitude(),
						distanceCollection = [];

					//calculate the distance of the node with the other nodes
					this.nodes.forEach((val2, key2, array2)=> {
						if(key !== key2){
							let v_C = val2.p, //other nodes
								distanceA_C =  v_A.subtract(v_C).magnitude();
							distanceCollection.push(distanceA_C);
						}
					});

					//calculate the sequence of the distanceA_B
					distanceCollection.sort(function (a, b) {
						return a - b;
					});
					for(let i = 0; i < distanceCollection.length; i++){
						if(distanceA_B < distanceCollection[i] ){
							sr = i + 1;
							break;
						}
					}
					(sr > degreeLength) ? nodeAbnormalEdge += (sr - degreeLength) / (this.nodeLength - 1 - degreeLength) : null;

					// if (val.id === "Valjean"){
					// 	console.log(sr - degreeLength);
					// }
				}

				val.nodeAbnormalEdge = 1 - Number(nodeAbnormalEdge / degreeLength);


			sum += val.nodeAbnormalEdge;
		});
		this.global.nodeAbnormalEdge = (sum / this.nodeLength).toFixed(2);
	}

	nodeDegreeNumber(){
		let sum = 0;
		this.nodes.forEach((val, key, array)=>{
			let nodeDegreeNumber = 0;
			let degreeLength = val.degree.length;

			degreeLength < 20 ? val.nodeDegreeNumber = (20 - degreeLength +1) / 20 : val.nodeDegreeNumber = 0;

			sum += val.nodeDegreeNumber;
		});
		this.global.nodeDegreeNumber = (sum / this.nodeLength).toFixed(2);
	}

	nodeRegionalInterference(){
		let sum = 0;
		this.nodes.forEach((val, key, array)=>{
			let nodeRegionalInterferenceNum = 0,
				nodeRegionalInterferenceValue = 0;

			let v_C = val.p; //represent dot position
			this.edges.forEach((val2, key2, array2)=> {
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

					if(d <= 30){
						nodeRegionalInterferenceNum++;
						nodeRegionalInterferenceValue += val2.edgeCross;
					}
				}
			});

			// if(val.id === "Combeferre"){
			// 	console.log(val.id + ":" + nodeRegionalInterferenceNum + "-" + nodeRegionalInterferenceValue);
			// }

			if(nodeRegionalInterferenceNum === 0){
				val.nodeRegionalInterference = 1 ;
			}else{
				val.nodeRegionalInterference = nodeRegionalInterferenceValue / nodeRegionalInterferenceNum;
			}
			sum += val.nodeRegionalInterference;
		});
		this.global.nodeRegionalInterference = (sum / this.nodeLength).toFixed(2);
	}

	nodeLinkLength(){
		let sum = 0;
		this.nodes.forEach((val, key, array)=>{
			let degreeLength = val.degree.length,
				idealLength = 80,
				lowestLength = 30, //lowest angel for node
				lengthMin = [];

			let beyondLowestLength = 0;
			for(let i = 0; i < degreeLength; i++){
				//calculate dotValue of v1 and v1(adjacent node)
				let v1Node = this.nodes.get(val.degree[i]);

				let	dealtVector1 = val.p.subtract(v1Node.p),
					distance = dealtVector1.magnitude();

				distance > lowestLength ? beyondLowestLength++ : null;
				lengthMin.push(distance);
			}

			val.nodeLinkLength = ( Math.min.apply(this, lengthMin) / idealLength) * (beyondLowestLength / degreeLength);
			val.nodeLinkLength > 1 ? val.nodeLinkLength = 1 : null;
			sum += val.nodeLinkLength;

		});
		this.global.nodeLinkLength = (sum/this.nodeLength).toFixed(2);
	}

	/**
	 * calculate assessment index of edges
	 */
	edgeCross(){
		//calculate the edge with all edges
		let min = 1; //to eliminate the order of magnitude
		this.edges.forEach((val, key, array) => {
			let v1_A = val.source,
				v1_B =  val.target;

			//count for edge
			let edgeCrossNumber = 0,
				edgeCrossValue = 0;

			this.edges.forEach((val2, key, array) => {
				let v2_C = val2.source,
					v2_D =  val2.target;
				if(v2_C.id === v1_A.id || v2_D.id === v1_A.id || v2_C.id === v1_B.id || v2_D.id === v1_B.id ){
					edgeCrossValue += 1;
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

						// console.log(val.id + '-' + angel_cos);
						edgeCrossValue += 1 - angel_cos;
						edgeCrossNumber++;
					}else{
						edgeCrossValue += 1;
					}
				}
			});
			if(edgeCrossNumber === 0){
				val.edgeCross = 1;
			}else{
				val.edgeCross = edgeCrossValue / (this.edgeLength);
			}
			min >= val.edgeCross ? min = val.edgeCross : null;
			// console.log(val.source.id + '-' + val.target.id + ":" + val.edgeCross + '-' + edgeCrossNumber);
		});

		//to eliminate the magnitude,
		let sum = this.eliminateMagnitude_edges(min, 1, "edgeCross");

		this.global.edgeCross = (sum / this.edgeLength).toFixed(2);
	}

	edgeAngel(){
		let sum = 0;
		this.nodes.forEach((val, key, array)=>{
			let degreeLength = val.degree.length,
				lowestAngel = 10; //lowest angel for edge

			if(degreeLength > 1){
				for(let i = 1; i < degreeLength; i++){
					//calculate dotValue of v1 and v2(adjacent node)
					let v1Node, v2Node, v3Node;
					if(i === degreeLength - 1){
						v1Node = this.nodes.get(val.degree[0]);
						v2Node = this.nodes.get(val.degree[i]); //v2-v is the edge to calculate
						v3Node = this.nodes.get(val.degree[i-1]);
					}else{
						v1Node = this.nodes.get(val.degree[i-1]);
						v2Node = this.nodes.get(val.degree[i]); //v2-v is the edge to calculate
						v3Node = this.nodes.get(val.degree[i+1]);
					}

					let	dealtVector1 = val.p.subtract(v1Node.p),
						dealtVector2 = val.p.subtract(v2Node.p),
						dealtVector3 = val.p.subtract(v3Node.p),

						dotValue = dealtVector1.dotProduct(dealtVector2),
						dotValue1 = dealtVector2.dotProduct(dealtVector3),
						angel = (Math.acos(dotValue/(dealtVector1.magnitude() * dealtVector2.magnitude()))) / 3.14 * 180,
						angel2 = (Math.acos(dotValue1/(dealtVector3.magnitude() * dealtVector2.magnitude()))) / 3.14 * 180; //calculate v1 and v2

					// console.log(angel + '-' + angel2);



					//find the edge
					let sourceID = val.id,
						targetID = v2Node.id;

					for(let value of this.edges){
						if((value[1].source.id === sourceID || value[1].target.id === sourceID) && (value[1].source.id === targetID || value[1].target.id === targetID) && sourceID && targetID){
							let index = (( angel - lowestAngel)/angel + (angel2 - lowestAngel)/angel2)/2;
							// console.log(index);
							if(value[1].edgeAngel === 1.01){
								index > 0 ? value[1].edgeAngel = index :  value[1].edgeAngel = 0;
								sum += value[1].edgeAngel;
							}
							break;
						}
        }
        // console.log(val.id + '---' + v1Node.id + '-' + v2Node.id + ':    ' + angel);
      }
    }else{
      //find the edge
      if(val.degree.length === 0 ) {

        }else{
          let sourceID = val.id,
            targetID = this.nodes.get(val.degree[0]).id;


          for(let value of this.edges){
            if((value[1].source.id === sourceID || value[1].target.id === sourceID) && (value[1].source.id === targetID || value[1].target.id === targetID)  && sourceID && targetID){
              value[1].edgeAngel = 1;
              sum += 1;
              break;
            }
          }
        }

			}
		});
		this.global.edgeAngel = (sum/this.edgeLength).toFixed(2);
	}

	edgeUnderNode(){
		let sum = 0;
		this.nodes.forEach((val, key, array)=>{
			let v_C = val.p; //represent dot position
			this.edges.forEach((val2, key2, array2)=> {
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

					(d <= (parseInt(val.radius[0]))) ? val2.edgeUnderNode = 0 : null;
				}
			});
		});
		this.edges.forEach((val2, key2, array2)=> {
			sum += val2.edgeUnderNode;
		});
		this.global.edgeUnderNode = (sum/this.edgeLength).toFixed(2);
	}

	edgeLinkLength(){
		let sum = 0;
		this.edges.forEach((val, key, array)=>{
			let idealLength = 50,
				source = val.source.p,
				target = val.target.p;

			let dis = source.subtract(target).magnitude();

			// console.log(val.source.id + val.target.id + ":" + dis);

			if(dis < 2 * idealLength){
				val.edgeLinkLength = 1-Math.abs(idealLength - dis) / idealLength;
			}else{
				val.edgeLinkLength = 0;
			}
			sum += val.edgeLinkLength;

		});
		this.global.edgeLinkLength = (sum/this.edgeLength).toFixed(2);

	}

	/**
	 * to eliminate the magnitude
	 * return {number} [newSum]
	 */
	eliminateMagnitude_edges(min, max, index){
		let newSum = 0;
		if(min === max){
			this.edges.forEach((val, key, array) => {
				newSum += 1;
				// console.log(val.source.id + '-' + val.target.id + ":" + '-' + val[index]);
			});
		}else{
			this.edges.forEach((val, key, array) => {
				val[index] = (val[index] - min) / (max - min);
				newSum += val[index];
				// console.log(val.source.id + '-' + val.target.id + ":" + '-' + val[index]);
			});
		}
		return newSum;
	}

	eliminateMagnitude_nodes(min, max, index){
		let newSum = 0;

			this.nodes.forEach((val, key, array) => {
				if(min === max){
					newSum += 1;
				}else{
					val[index] = (val[index] - min) / (max - min);
					newSum += val[index];
				}
			});

		return newSum;
	}

	/**
	 * analyse shortest path
	 */
	shortestPath_Analysis(){
		let path = this.layout.pathNode;
		let props = {};

		props.shortestPath = path.length-1;
		props.nodeDegreeNumber = 0;
		props.nodeCross = 0;
		props.nodeAngel = 0;
		props.nodeBeyondEdge = 0;
		props.nodeAbnormalEdge = 0;
		props.nodeRegionalInterference = 0;
		props.nodeLinkLength = 0;

		props.edgeCross = 0;
		props.edgeAngel = 0;
		props.edgeUnderNode = 0;
		props.edgeLinkLength = 0;


		for(let i = 0; i < path.length; i++){
			this.nodes.forEach((val, key, array)=>{
				if(val.id === path[i]){
					props.nodeDegreeNumber += 1 - val.nodeDegreeNumber;
					props.nodeCross += 1 - val.nodeCross;
					props.nodeAngel += 1 - val.nodeAngel;
					props.nodeBeyondEdge += 1 - val.nodeBeyondEdge;
					props.nodeAbnormalEdge += 1 - val.nodeAbnormalEdge;
					props.nodeRegionalInterference += 1 - val.nodeRegionalInterference;
					props.nodeLinkLength += 1 - val.nodeLinkLength;
				}
			});
		}

		for(let i = 1; i < path.length; i++){
			this.edges.forEach((val, key, array) => {
				if((val.source.id === path[i] || val.target.id === path[i]) && (val.source.id === path[i-1] || val.target.id === path[i-1])){
					props.edgeCross += 1 - val.edgeCross;
					props.edgeAngel += 1 - val.edgeAngel;
					props.edgeUnderNode += 1 - val.edgeUnderNode;
					props.edgeLinkLength += 1 - val.edgeLinkLength;
				}
			})
		}

		console.log(
			`shortestPath:${props.shortestPath.toFixed(4)}` + "\n" +
			`nodeDegreeNumber:${props.nodeDegreeNumber.toFixed(4)}` + "\n" +
			`nodeCross:${props.nodeCross.toFixed(4)}` + "\n" +
			`nodeAngel:${props.nodeAngel.toFixed(4)}` + "\n" +
			`nodeBeyondEdge:${props.nodeBeyondEdge.toFixed(4)}` + "\n" +
			`nodeAbnormalEdge:${props.nodeAbnormalEdge.toFixed(4)}` + "\n" +
			`nodeRegionalInterference:${props.nodeRegionalInterference.toFixed(4)}` + "\n" +
			`nodeLinkLength:${props.nodeLinkLength.toFixed(4)}` + "\n" +
			`edgeCross:${props.edgeCross.toFixed(4)}` + "\n" +
			`edgeAngel:${props.edgeAngel.toFixed(4)}` + "\n" +
			`edgeUnderNode:${props.edgeUnderNode.toFixed(4)}` + "\n" +
			`edgeLinkLength:${props.edgeLinkLength.toFixed(4)}` + "\n"
		);


	}

	modalEvaluation(){
		//node modal
		let nodeReaction = 0,
				nodeAccuarcy = 0;
      nodeReaction += -19.638* this.global.nodeDegreeNumber - 7.491*this.global.nodeBeyondEdge - 3.544 * this.global.nodeCross + 30.026;
      nodeAccuarcy += 0.87* this.global.nodeDegreeNumber + 0.398*this.global.nodeBeyondEdge + 0.341 * this.global.nodeAngel - 0.475;

    //path modal
    let pathReaction = 0,
      pathAccuarcy = 0;

    pathReaction += 2.637* (1-this.global.nodeRegionalInterference) + 0.989* (1-this.global.edgeUnderNode) +   2.272 *  (1- this.global.edgeLinkLength) + 2;

    //wirte to dom
    let table1 = document.getElementById('modalTable').getElementsByTagName('td');
    let table2 = document.getElementById('modalTable2').getElementsByTagName('td');
    table1[1].innerHTML = nodeReaction.toFixed(4);
    table1[3].innerHTML = nodeAccuarcy.toFixed(4);
    table2[1].innerHTML = pathReaction.toFixed(4);
    table2[3].innerHTML = this.global.edgeUnderNode/2;

	}


	//assess all the paras and choose dom to write
	writeAssessToDom(){
		//node index calculate
		this.nodeLeap();//calculateNode overLap
		this.nodeAngel(); //calculateNode nodeAngel
		this.nodeCross(); //calculateNode nodeCross
		this.nodeBeyondEdge(); //calculateNode nodeBeyondEdge
		this.nodeAbnormalEdge(); //calculateNode nodeBeyondEdge
		this.nodeDegreeNumber(); //calculateNode nodeDegreeNumber
		this.nodeLinkLength(); //calculateNode nodeDegreeNumber

		//edge index calculate
		this.edgeCross();
		this.edgeAngel();
		this.edgeUnderNode();
		this.edgeLinkLength();

		this.nodeRegionalInterference(); //calculateNode nodeDegreeNumber, after the calculate of edgeCross

		this.shortestPath_Analysis();

		this.modalEvaluation();

		let ths = document.getElementById('assessment_panel').getElementsByTagName('td');
		let ths_edge = document.getElementById('assessTable_read_edge').getElementsByTagName('td');
		/**
		 * Regular update items for assess
		 * {node overLap} [1]
		 * {node angel} [3]
		 * {node nodeCross} [5]
		 * {node nodeCross} [7]
		 * {node nodeDegreeNumber} [11]
		 * {node nodeRegionalInterference} [13]
		 * {node nodeLinkLength} [15]
		 */
		ths[1].innerHTML = this.global.nodeOverLap;
		ths[3].innerHTML = this.global.nodeAngel;
		ths[5].innerHTML = this.global.nodeCross;
		ths[7].innerHTML = this.global.nodeBeyondEdge;
		ths[9].innerHTML = this.global.nodeAbnormalEdge;
		ths[11].innerHTML = this.global.nodeDegreeNumber;
		ths[13].innerHTML = this.global.nodeRegionalInterference;
		ths[15].innerHTML = this.global.nodeLinkLength;
		// ths[13].innerHTML = `${window.performance.memory.usedJSHeapSize}`;

		/**
		 * Regular update items for assess
		 * {edge edgeAngel} [1]
		 * {edge cross} [3]
		 */
		ths_edge[1].innerHTML = this.global.edgeAngel;
		ths_edge[3].innerHTML = this.global.edgeCross;
		ths_edge[5].innerHTML = this.global.edgeUnderNode;
		ths_edge[7].innerHTML = this.global.edgeLinkLength;
		console.log('done');
	}

}

export default Assessment;