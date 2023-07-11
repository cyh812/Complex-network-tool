
'use strict'
/**
 * Spring class
 */
class Spring {
	constructor(source, target, length) {
		this.source = source;
		this.target = target;
		this.length = length;

		//assessment index for edge
		this.edgeCross = 1;
		this.edgeAngel = 1.01;
		this.edgeUnderNode = 1;
		this.edgeLinkLength = 1;
	}
}

export default Spring;