
'use strict';
import data from './data/data'
import testData2Little from './data/testData2Little'
import bigData from './data/testData-big'
import footBallData from './data/footballData.JSON'
import beicanshijie from './data/beicanshijie.JSON'
import power from './data/2-hu.JSON'
import dolphin from './data/dolphin.JSON'
import football2 from './data/footBallData2'
import customer from './data/cumtomer'
import structure1 from './data/structure1'
import structure2 from './data/structure2'
import structure3 from './data/structure3'
import politic from './data/politic'
import graph from './data/graph'
import StarWars from './data/StarWars'
import acdamic from './data/acdamic'
import myIcons from '../assets/myIcons.svg'

import {classTool} from "./toolFunction/common_Js_Tool"

import ElementEventSet, {dragEnd, dragMove, dragStart, hoverIn, nodeRadiusCallback } from './layoutInteraction'
import forceLayout from './forceLayout'
import Assessment from './assessment'
import inputRangeComponent from './component/rangeInput.js'
import '../CSS/default.css'

/**
 * the binding render function
 */

let renderData = {
	'data': data,
	'bigData': bigData,
	'testData2Little': testData2Little,
	'footBallData': footBallData,
	'footBallData2': football2,
	'dolphin': dolphin,
	'customer': customer,
	'structure1': structure1,
	'structure2': structure2,
	'structure3': structure3,
	'politic': politic,
	'graph': graph,
	'StarWars': StarWars,
	'acdamic': acdamic,
	'beicanshijie': beicanshijie,
	'power': power,
};


let rendering = {};//main object to render layout
rendering.preEventHandler = null; //save event callback function
rendering.renderLayout = function(resolve, renderOptions) {
	let approachSel = document.getElementById('approachSel'),
		layoutAlgorithms = document.getElementById('algorithms'),
		repulsion = document.getElementById('repuval').value,
		stiffness = document.getElementById('stifval').value,
		damping = document.getElementById('dampval').value,
        defSpringLen = document.getElementById('defSpringLen').value,
        initialTemperature = document.getElementById('initialTemperature').value,
        initialIteration = document.getElementById('initailIteration').value,
		approach = approachSel.options[approachSel.selectedIndex].value,
		algorithm = layoutAlgorithms.options[layoutAlgorithms.selectedIndex].value,
		parentId = 'chart',
		containerId = 'forcedLayoutView';

	//return <CSSStyleDeclaration>
	//notice background-color -> backgroundColor
	let style = window.getComputedStyle(document.getElementById(parentId)),
		height = Number.parseFloat(style.getPropertyValue("height")),
		width = Number.parseFloat(style.getPropertyValue("width"));
	console.log("height: " + height);
	console.log("width: " + width);

	if (!(isNaN(repulsion) || isNaN(stiffness) || isNaN(damping) || isNaN(defSpringLen) || isNaN(initialTemperature) || isNaN(initialIteration))) {
		let ins = new forceLayout({
			'parentId': parentId,
			'containerId': containerId,
			'repulsion': Number.parseFloat(repulsion),
			'stiffness': Number.parseFloat(stiffness),
			'damping': Number.parseFloat(damping),
			'defSpringLen': Number.parseFloat(defSpringLen),
			'initialTemperature': Number.parseFloat(initialTemperature),
			'initialIteration': Number.parseFloat(initialIteration),
			'approach': approach,
			'algorithm': algorithm,
			'width': width,
			'height': height
		});
		ins.setData(renderData[renderOptions.data]);

		/**
		 * style change events
		 */
		let chart = document.getElementById('chart'),
			canvasEvents = new ElementEventSet(chart); //chart bind events

		canvasEvents.disable(rendering.preEventHandler); //when reRender, clear all the events

		//node radius change
		inputRangeComponent({containerId:'rangeInputComponent', min:0, max:20, callback:nodeRadiusCallback.bind(ins), step:1, value:5, inputValue:5});

		//node bind mouse events
		canvasEvents.addHandler('dragStart', dragStart.bind(ins));
		canvasEvents.addHandler('dragging', dragMove.bind(ins));
		canvasEvents.addHandler('dragEnd', dragEnd.bind(ins));
		canvasEvents.addHandler('hoverIn', hoverIn.bind(ins));
		rendering.preEventHandler = canvasEvents.enable();

		/**
		 * start render
		 */
		ins.start(resolve);
	}
};

/**
 * main function entry
 * process render and handle the render result,assess the layout, draw something
 * * @type {[type]}
 */
function main(renderOptions){
	new Promise((resolve) => {
		rendering.renderLayout(resolve,renderOptions) //calculate and render layout
	}).then((res) => { //after the main chart render
		if(res.renderEnd){
			assessmentLayout(res);
			if(res.props.algorithm === 'test1'){
				return new Promise((resolve) => {
					res.temperature = 100;
					res.renderEnd = false;
					res.renderByBrowser(res, resolve);
				})
			}else{
				renderOtherChart(res);
			}
		}
	}).then((res) => {
		if(res && res.renderEnd){
			assessmentLayout(res);
			renderOtherChart(res);
		}
	});

	function renderOtherChart(res) {
		//listener the chart1 render item
		let renderItem = document.getElementById('renderItem'),
			item = renderItem.options[renderItem.selectedIndex].value;

		//need to remove listener function

		renderItem.addEventListener('change', function (e) {
			let item = e.target.options[renderItem.selectedIndex].value;
			res.render({name: "chart1", item:item});
		});


		//listener the chart2 render item for dom
		let renderItem_edge = document.getElementById('renderItem2'),
			item_edge = renderItem_edge.options[renderItem_edge.selectedIndex].value;

		renderItem_edge.addEventListener('change', function (e) {
			let item_edge = e.target.options[renderItem_edge.selectedIndex].value;
			res.render({name: "chart2", item:item_edge});
		});


		//listener enlarge_button and show
		let enlargeButton = document.getElementById('enlarge_button'),
			closeButton = document.getElementById('close_button');

		enlargeButton.addEventListener('click', function(){
			let chartContainer = document.getElementById('resizeChart');
			classTool.addClass(chartContainer, "show");

			//get node item tp render
			let renderItem = document.getElementById('renderItem'),
				item = renderItem.options[renderItem.selectedIndex].value;
			res.render({name: "chart5",item:item });
		});
		//close button
		closeButton.addEventListener('click', function(){
			let chartContainer = document.getElementById('resizeChart');

			classTool.removeClass(chartContainer, "show");
			zoom =1;
		});

		//listener enlarge_button2 and show
		let enlargeButton2 = document.getElementById('enlarge_button2');

		enlargeButton2.addEventListener('click', function(){
			let chartContainer = document.getElementById('resizeChart');
			classTool.addClass(chartContainer, "show");

			//get edge item tp render
			let renderItem_edge = document.getElementById('renderItem2'),
				item_edge = renderItem_edge.options[renderItem_edge.selectedIndex].value;
			res.render({name: "chart5",item:item_edge });
		});


		//mouse scale function
		let scaleContainer =  document.getElementById('chart5');
		let zoom = 1;
		scaleContainer.addEventListener('mousewheel', function(e){
			if(zoom < 0){
				zoom = 0.01;
				return ;
			}
			const canvas = document.querySelector("#biggerChart");
			const w = canvas.width;
			const h = canvas.height;

			res.ctx.clearRect(0, 0, w, h);
			res.ctx.save();

			if(zoom < 0.2){
				zoom += e.wheelDelta/120000;
			}else{
				zoom += e.wheelDelta/12000;
			}
			res.ctx.translate(w / 2, h / 2);
			//store the translate coordination
			res.ctx.scale(zoom, zoom);

			console.log(zoom);

			//scale and render
			//get edge item tp render
			let renderItem_edge = document.getElementById('renderItem2'),
				item_edge = renderItem_edge.options[renderItem_edge.selectedIndex].value;
			res.render({name: "scaleRender", item:item_edge, zoom: Math.abs(zoom)});

			//to rescale the coordination
			res.ctx.restore();
		});

		res.render({name: "chart1", item:item});
		res.render({name: "chart2", item:item_edge});
	}

	function assessmentLayout(res){
		let assessmentLayout = new Assessment(res.nodePoints, res.edgeSprings, res);
		assessmentLayout.writeAssessToDom();
	}
}

/**
 * DOM bind events
 * @type {[type]}
 */
window.onload = function() {
	let run = document.getElementById('run'), //listen the layout parameter
		input = document.getElementsByTagName('input'),//listen the layout parameter
		dataInputSure = document.getElementById('dataSure'), //listener input data change
		dataInputCancell = document.getElementById('dataCancel'), //listener input data change
		inputList = Array.prototype.slice.call(input);

	//listener input data change and show modal
	dataInputSure.addEventListener('click', function(){
		let dataSelection = document.getElementById('dataSelect'),
			tabBox = document.getElementById('panel_2'),
			panel = tabBox.getElementsByClassName('modal'),
			data = dataSelection.options[dataSelection.selectedIndex].value;

		for(let i = 0; i < panel.length; i++){ //remove show class
			panel[i] ? classTool.removeClass(panel[i], 'show') : null;
		}
		main({data: data});
	});
	dataInputCancell.addEventListener('click', function(){
		let tabBox = document.getElementById('panel_2'),
			panel = tabBox.getElementsByClassName('modal');

		for(let i = 0; i < panel.length; i++){ //remove show class
			panel[i] ? classTool.removeClass(panel[i], 'show') : null;
		}
	});


	//listen the layout parameter
	run.addEventListener('click', function(){
		let dataSelection = document.getElementById('dataSelect'),
			data = dataSelection.options[dataSelection.selectedIndex].value;
		main({data: data});
	});
	inputList.forEach(ele => {
		ele.addEventListener('keydown', e => {
			if (e.which === 13) {
				let dataSelection = document.getElementById('dataSelect'),
					data = dataSelection.options[dataSelection.selectedIndex].value;
				main({data: data});
			}
		});
	});

	/**
	 * Initial the page with a default rendering effect
	 */
	main({data: 'data'});
};


