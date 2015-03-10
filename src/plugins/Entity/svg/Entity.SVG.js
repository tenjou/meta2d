"use strict";

Entity.SVG = Entity.Geometry.extend
({
	set lineWidth(hex) {
		this._lineWidth = hex;
		this.renderer.needRender = true;
	},

	get lineWidth() { return this._lineWidth; },

	set strokeStyle(hex) {
		this._strokeStyle = hex;
		this.renderer.needRender = true;
	},

	get strokeStyle() { return this._strokeStyle; },

	set fillStyle(hex) {
		this._fillStyle = hex;
		this.renderer.needRender = true;
	},

	get fillStyle() { return this._fillStyle; },	

	//
	_lineWidth: 2,
	_strokeStyle: ""
});
