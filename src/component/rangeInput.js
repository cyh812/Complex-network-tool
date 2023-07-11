

import {addEventTool, classTool} from "../toolFunction/common_Js_Tool"
import "../../CSS/rangeInput.css"


const inputRangeComponent = function (props) {
	let {containerId, max, min, callback, step, value,  inputValue} = props;

	let container = document.getElementById(containerId),
		rangeInput = container.getElementsByTagName('input')[0],
		valueInput = container.getElementsByTagName('input')[1];

	container.index = props;

	classTool.attr(rangeInput, 'min', min)
		.attr(rangeInput, 'max', max)
		.attr(rangeInput, 'step', step)
		.attr(rangeInput, 'value', value);
	classTool.attr(valueInput, 'value', inputValue);

	addEventTool.addHandler(valueInput, 'change', valueInputHandler);
	addEventTool.addHandler(rangeInput, 'change', rangeInputHandler);

};

function rangeInputHandler(event) {
	let target = event.target,
		value = target.value,
		min = target.min,
		max = target.max,
		containerId = target.parentNode.index.containerId,
		callback = target.parentNode.index.callback,
		container = document.getElementById(containerId),
		valueInput = container.getElementsByTagName('input')[1],
		percentage = value/(max - min) * 100;

	target.value = value;
	valueInput.value = value;

	target.style.background = 'linear-gradient(to right, #d4237a '  + percentage  +'%, #565656 ' + percentage  + '%)';
	// target.style.backgroundSize = percentage+ '% 100%';




	if(callback)
		callback(target.value);
}

function valueInputHandler(event) {
	let target = event.target,
		value = target.value,
		containerId = target.parentNode.index.containerId,
		callback = target.parentNode.index.callback,
		min = target.parentNode.index.min,
		max = target.parentNode.index.max,
		percentage = value/(max - min) * 100,
		container = document.getElementById(containerId),
		rangeInput = container.getElementsByTagName('input')[0];

	(value > 20) ? value = 20 : null;
	(value < 0) ? value = 0 : null;
	target.value = value;
	rangeInput.value = value;
	rangeInput.style.background = 'linear-gradient(to right, #d4237a '  + percentage  +'%, #565656 ' + percentage  + '%)';

	if(callback)
		callback(target.value);
}

export default inputRangeComponent