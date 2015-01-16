"use strict";

Physics.Body = function() {
	this._mass = 100;
	this.invMass = 0.01;
	this.restitution = 0.6;
	this.velocity = new meta.math.Vector2(0, 0);
};

Physics.Body.prototype = 
{
	updateVolume: function() {},

	// moveTo: function(x, y)
	// {
		
	// },

	set mass(value) 
	{
		this._mass = value;

		if(value === 0) {
			this.invMass = 0;
		}
		else {
			this.invMass = 1.0 / value;
		}
	},

	get mass() { return this._mass; },

	//
	enableWorldBounds: true,
	ghost: false
};
