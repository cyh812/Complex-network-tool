
'use strict'
/**
 * Vector class
 */
class Vector {
	constructor(x, y) {
		this.x = x; // x position
		this.y = y; // y position
	}

	getvec() {
		return this;
	}

	add(v2) {
		return new Vector(this.x + v2.x, this.y + v2.y);
	}

	subtract(v2) {
		return new Vector(this.x - v2.x, this.y - v2.y);
	}

	magnitude() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	normalise() {
		return this.divide(this.magnitude());
	}

	rotate_counterClock(angel){ //CounterclockWise direction,  rotate angel degree
		return new Vector((this.x * Math.cos(angel) - this.y * Math.sin(angel)), (this.x * Math.sin(angel) + this.y * Math.cos(angel)))
	}

	rotate_clock(angel){ // clockWise direction,  rotate angel degree
		return new Vector((this.x * Math.cos(angel) + this.y * Math.sin(angel)), (- this.x * Math.sin(angel) + this.y * Math.cos(angel)))
	}

	divide(n) {
		return new Vector((this.x / n) || 0, (this.y / n) || 0);
	}

	multiply(n) {
		return new Vector(this.x * n, this.y * n);
	}

	dotProduct(v2){ //v1 dot v2
		return this.x * v2.x + this.y * v2.y;
	}

	crossProduct(v2){ //v1 cross v2  when value > 0, v2 is in a counterClockwise direction of v1
		return this.x * v2.y - this.y * v2.x;
	}
}

export default Vector;