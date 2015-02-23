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

	//
	_lineWidth: 0,
	_strokeStyle: "#000"
});
