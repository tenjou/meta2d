"use strict";

Steering.Component = function() 
{
	this.vel = new meta.math.Vector2(0, 0);
	this.accel = new meta.math.Vector2(0, 0);
	this.target = new meta.math.Vector2(0, 0);

	this.f = 3;
	this.maxSpeed = 4;
	this.maxForce = 0.1;
};

Steering.Component.prototype = 
{
	onActiveEnter: function() {
		meta.steering.add(this);
	},

	update: function(tDelta)
	{
		this.arrive();

		this.vel.addVec(this.accel);
		this.vel.limit(this.maxSpeed);

		this.owner.move(this.vel.x, this.vel.y);
		this.owner.angleRad = this.vel.heading();

		this.accel.mulValue(0);
	},

	seek: function()
	{
		var volume = this.owner.volume;

		var desired = new meta.math.Vector2(
			this.target.x - volume.x,
			this.target.y - volume.y);
		desired.normalize();
		desired.mulValue(this.maxSpeed);

		var steer = new meta.math.Vector2(
			desired.x - this.vel.x,
			desired.y - this.vel.y);
		steer.limit(this.maxForce);

		this.accel.addVec(steer);
	},

	arrive: function()
	{
		var volume = this.owner.volume;

		var desired = new meta.math.Vector2(
			this.target.x - volume.x,
			this.target.y - volume.y);	
		var d = desired.length();
		desired.normalize();

		if(d < 100) {
			var m = map(d, 0, 100, 0, this.maxSpeed);
			desired.mulValue(m);
		}
		else {
			desired.mulValue(this.maxSpeed);
		}

		var steer = new meta.math.Vector2(
			desired.x - this.vel.x,
			desired.y - this.vel.y);
		steer.limit(this.maxForce);

		this.accel.addVec(steer);		
	}
};


var map = function (value, istart, istop, ostart, ostop) {
	return ostart + (ostop - ostart) * ((value - istart) / (istop - istart));
};