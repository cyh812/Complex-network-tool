'use strict';

import "../../CSS/tab.css"
import {addEventTool, classTool} from "../toolFunction/common_Js_Tool"


const addButtonsEvent = function (container, buttonClass, clickedButtonClass, panelClass , clickedPanelClass ) {
	console.log(panelClass);
  let tabBox = document.getElementById(container),
      button = tabBox.getElementsByClassName(buttonClass),
      panel = tabBox.getElementsByClassName(panelClass),
      length = button.length,
      panelLength = panel.length;

  //handle click function
  function handleClick (event) {
      let eventTarget = addEventTool.getEventTarget(event);
	  for(let i = 0; i < length; i++){
		  button[i] ? classTool.removeClass(button[i], clickedButtonClass) : null;
		  panel[i] ? classTool.removeClass(panel[i], clickedPanelClass) : null;
	  }
	  if(eventTarget)
		  !classTool.hasClass(eventTarget, clickedButtonClass) ? classTool.addClass(eventTarget, clickedButtonClass) : null;

	  // console.log(panel[eventTarget.index]);
	  if(panel[eventTarget.index])
		  !classTool.hasClass(panel[eventTarget.index], clickedPanelClass) ? classTool.addClass(panel[eventTarget.index], clickedPanelClass) : null;
  }

  //add click event for tab buttons
  for(let i = 0; i < length; i++){
	  button[i].index = i;
	  addEventTool.addHandler(button[i], "click", handleClick);
  }

};

addButtonsEvent('panel', 'tabButton', 'current', 'button_panel', 'show');
addButtonsEvent('panel_2', 'tabButton2', 'current2', 'modal', 'show');

