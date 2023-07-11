
/**
 * node bind mouse events
 * @type {[type]}
 */

import {addEventTool, classTool} from "./toolFunction/common_Js_Tool"
import Vector from "./Vector";
import Assessment from "./assessment";


/**
 * define a body for collecting the eventHandler for the  observed object
 * @type {[type]}
 */
 function EventTarget (){
	this.handlerCollector =  new WeakMap(); //use weakMap to package private variant
	this.handlerCollector.set(this, {});  //when a instance is created, this is pointed to the new instance, and only the instance can access the collector value
}

EventTarget.prototype.addHandler = function(eventType, handler){
	if(typeof eventType === 'string' && typeof handler === 'function' ){
		if(! (eventType in this.handlerCollector.get(this))){
				this.handlerCollector.get(this)[eventType] = [];
		}
		this.handlerCollector.get(this)[eventType].push(handler);
	}
};

EventTarget.prototype.fireHandler = function(_event){
	let res = [];
	if( _event.type in this.handlerCollector.get(this)){
		for(let value of  this.handlerCollector.get(this)[_event.type]){
			res.push(value(_event));
		}
		return res;
	}
};

EventTarget.prototype.removeHandler = function(eventType, handler){
	if(eventType in this.handlerCollector.get(this)){
		for(let i = 0; i < this.handlerCollector.get(this)[eventType].length; i++ ){
			if(this.handlerCollector.get(this)[eventType][i] === handler){
				this.handlerCollector.get(this).splice(i, 1);
			}
		}
	}
};



/**
 * define the event types for dom element and some functions to control the events
 * @type {[type]}
 */

 function ElementEventSet (canvasElement) {
	this.element = canvasElement;
	this.target = null;
	this.preMouseHoverTarget = null;
	this.x = null;
	this.y = null;
	EventTarget.call(this);
}

ElementEventSet.prototype = new EventTarget();
ElementEventSet.prototype.constructor =  ElementEventSet;

ElementEventSet.prototype.enable = function() {
	let handler =  handleDraggable.bind(this);
	addEventTool.addHandler(this.element, 'mousedown',handler);
	addEventTool.addHandler(this.element, 'mousemove', handler);
	addEventTool.addHandler(this.element, 'mouseup', handler);
	return handler;
};

ElementEventSet.prototype.disable = function(callback) {
	addEventTool.removeHandler(this.element, 'mousedown', callback);
	addEventTool.removeHandler(this.element, 'mousemove',callback);
	addEventTool.removeHandler(this.element, 'mouseup', callback);
};

/**
 * eventListener function for dom
 */

function handleDraggable(event) { //anonymous function
	switch(event.type){
		case 'mousedown':
			this.target = this.fireHandler({target: this.target, type: 'dragStart', x: event.clientX, y: event.clientY,  preX:this.x, preY:this.y})[0]; //return all value of the return handler
			this.x = event.clientX; //save the pre coordinate of mouse
			this.y = event.clientY;
			break;
		case 'mousemove':
			this.preMouseHoverTarget = this.fireHandler({preTarget:this.preMouseHoverTarget, type: 'hoverIn',  x: event.clientX, y: event.clientY})[0]; //fire hover event for node
			if(this.target){
				this.fireHandler({target: this.target, type: 'dragging',  x: event.clientX, y: event.clientY, preX: this.x, preY: this.y});
				this.x = event.clientX;
				this.y = event.clientY;
			}
			break;
		case 'mouseup':
			if(this.target){
				this.fireHandler({target: this.target, type: 'dragEnd', x: event.clientX, y: event.clientY, preX: this.x, preY: this.y});
				this.target = null;
				this.x = null;
				this.y = null;
			}
			break;
	}
};



/**
 * define event callback
 */

//*****************************
/**
 *  node radius
 * * @type {number}
 */

export function nodeRadiusCallback(radius) {
	this.nodePoints.forEach(function (value, key, array) {
		value.radius.unshift(radius);
	});
	this.render({name: "chart0"});

	//Make assessment
	let assessmentLayout = new Assessment(this.nodePoints, this.edgeSprings); // assessLayout
	if(this.renderEnd){
		assessmentLayout.writeAssessToDom();
	}
}

/**
 * drag event
 * * @type {[type]}
 * * @return {string}
 */

export function dragStart(_event){
	let {preX, preY, x, y} = _event,
		targetId = null,
		mousePosition = new Vector(x - 300, y - 65);
	this.nodePoints.forEach(function (value, key, array) {
		if(value.isMouseInCircle(mousePosition)){
			targetId = key;
		}
	});
	for(let value of this.nodePoints){
		let key = value[0],
			pointValue = value[1];
		if(targetId === key){
			pointValue.strokeWidth.unshift(2);
			pointValue.strokeColor.unshift('#262626');
			pointValue.fillColor.unshift('#ff0097');
			break;
		}
	}
	this.render({name: "chart0"});
	return targetId;
}

export function dragMove(_event){
	let {preX, preY, x, y, target} = _event;
	if(target){
		for(let value of this.nodePoints){
			let key = value[0],
				pointValue = value[1];
			if(target === key){
				pointValue.p.x += x - preX;
				pointValue.p.y += y - preY;
				break;
			}
		}
	}
	this.render({name: "chart0"});
}

export function dragEnd(_event){
	let {target} = _event;
	if(target){
		for(let value of this.nodePoints){
			let key = value[0],
				pointValue = value[1];
			if(target === key){
				let color = pointValue.fillColor.pop(),
					width = pointValue.strokeWidth.pop(),
					strokeColor = pointValue.strokeWidth.pop();
				pointValue.fillColor = [];
				pointValue.strokeWidth = [];
				pointValue.strokeColor = [];
				pointValue.fillColor.push(color);
				pointValue.strokeWidth.push(width);
				pointValue.strokeColor.push(strokeColor);
				break;
			}
		}
	}
	this.render({name: "chart0"});
}

export function hoverIn(_event){
	let {preX, preY, x, y, preTarget} = _event,
		targetId = null,
		mousePosition = new Vector(x - 300, y - 65);
	this.nodePoints.forEach(function (value, key, array) {
		if(value.isMouseInCircle(mousePosition)){
			targetId = key;
		}
	});
	//delete pre hover Info
	if(preTarget && document.getElementById('hoverPanel')){
		let preElement = document.getElementById('hoverPanel');
		preElement.parentNode.removeChild(preElement);
	}
	if(targetId){
		for(let value of this.nodePoints){
			let key = value[0],
				pointValue = value[1];
			if(targetId === key){
				let preInfo = document.getElementById(pointValue.id); //get hover info container
				if(!preInfo){
					let info = document.createElement("div");
					classTool.attr(info, "id", 'hoverPanel');
					let html = "<p>"+ "id: " + pointValue.id + "</p>"
						+   "<p>" + "group: " + pointValue.group +"</p>"
						+   "<p>" + "degree: " + pointValue.degree.length +"</p>"
						+   "<p>" + "nodeDegreeNumber: " + pointValue.nodeDegreeNumber +"</p>"
						+   "<p>" + "nodeCross: " + pointValue.nodeCross.toFixed(4) +"</p>"
						+   "<p>" + "nodeAngel: " + pointValue.nodeAngel.toFixed(4) +"</p>"
						+   "<p>" + "nodeOverLap: " + pointValue.nodeOverlap.toFixed(4) +"</p>"
						+   "<p>" + "nodeBeyondEdge: " + pointValue.nodeBeyondEdge.toFixed(4) +"</p>"
						+   "<p>" + "nodeAbnormalEdge: " + pointValue.nodeAbnormalEdge.toFixed(4) +"</p>"
						+   "<p>" + "nodeRegionalInterference: " + pointValue.nodeRegionalInterference.toFixed(4) +"</p>"
						+   "<p>" + "nodeLinkLength: " + pointValue.nodeLinkLength.toFixed(4) +"</p>";
					let css = "position: absolute; left:" + (x + 10) + "px;" + "top:" + (y - 20) + "px;background-color:rgba(0, 0, 0, 0.5);font-size:0.8rem;color:white;padding:0.5rem";
					classTool.cssText(info, css);
					info.innerHTML = html;
					document.body.appendChild(info);
				}
				break;
			}
		}
	}
	return targetId;
}

//*****************************


export default ElementEventSet









