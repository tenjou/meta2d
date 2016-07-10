"use strict";

meta.Timer = function(owner, func, tDelta, numTimes)
{
	this.$id = meta.cache.timerIndex++;
	this.$index = -1;

	this.set(owner, func, tDelta, numTimes);
};

meta.Timer.prototype =
{
	set: function(owner, func, tDelta, numTimes)
	{
		this.func = func;
		this.owner = owner;

		this.numTimes = numTimes ? numTimes : -1;
		this.numTimesRemaining = this.numTimes;

		this.tDelta = tDelta;
		this.tAccumulator = 0.0;
	},

	play: function() 
	{
		if(this.$index !== -1) { 
			this.reset();
			return; 
		}

		this.$index = meta.engine.timers.push(this) - 1;
		this.tStart = Date.now();
	},

	stop: function() 
	{
		if(this.$index === -1) { return; }

		meta.engine.timersRemove.push(this);
		this.$index = -1;
	},

	pause: function() 
	{
		this.paused = true;
		this.stop();
	},

	resume: function() 
	{
		this.paused = false;

		this.start();
		this.tStart = Date.now();
	},

	reset: function() {
		this.tAccumulator = 0;
		this.numTimes = this.initNumTimes;
		this.paused = false;
		this.play();
	},

	//
	paused: false
};

meta.createTimer = function(owner, func, tDelta, numTimes)
{
	if(typeof owner === "function") {
		numTimes = tDelta;
		tDelta = func;
		func = owner;
		owner = window;
	} 

	if(!func) {
		console.warn("(meta.createTimer) Invalid function passed");
		return;
	}

	var timer = meta.pools.timers.pop();
	if(!timer) {
		timer = new meta.Timer(owner, func, tDelta, numTimes);
	}
	else {
		timer.setup(owner, func, tDelta, numTimes);
	}

	return timer;
};

meta.addTimer = function(owner, func, tDelta, numTimes)
{
	var timer = meta.createTimer(owner, func, tDelta, numTimes);
	timer.play();

	return timer;
};

meta.pools.timers = {};
