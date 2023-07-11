

// addEventListen package
export const addEventTool = {

	addHandler: function (element, eventType, callback) {
		if(element.addEventListener){
			element.addEventListener(eventType, callback, false);
		}else if(element.attachEvent){
			element.attachEvent('on' + eventType, callback);
		}else{
			element[on + 'eventType'] = callback;
		}
	},

	removeHandler: function (element, eventType, callback) {
		if(element.removeEventListener){
			element.removeEventListener(eventType, callback, false);
			console.log(eventType + "remove");
		}else if(element.detachEvent){
			element.detachEvent('on' + eventType, callback);
		}else{
			element[on + 'eventType'] = null;
		}
	},

	getEvent: function(event){
		return event;
	},

	getEventTarget: function(event){
		return event.target;
	},

	preventDefault: function (event) {
		event.preventDefault();
	},

	stopPropagation: function (event) {
		event.stopPropagation();
	}
};


//js class operate package
export const classTool = {

	addClass: function (ele, className) {
		let ele_class = ele.className,
			blank = (ele_class === '') ? '' : ' ';
		ele.className = ele_class + blank + className;
	},

	removeClass: function (ele, className) {
		let ele_class = ' ' + ele.className + ' ',
			ele_class2 = ele_class.replace(/(\s+)/gi, ' '),
			ele_class3 = ele_class2.replace(' ' + className + ' ', ' ');
		ele.className = ele_class3.replace(/(^\s+) | (\s+$)/, '');
	},

	hasClass: function (ele, className) {
		let ele_class = ele.className,
			classArray = ele_class.split(' ');
		for(let val of classArray){
			if(val === className)
				return true;
		}
		return false;
	},

	attr: function (ele, attrName, attrValue) {
		ele.setAttribute(attrName, attrValue);
		return classTool;
	},
	
	cssText: function (ele, style) {
		ele.style.cssText = style;
	}

};
