"use strict";

meta.class("Entity.Particle", "Entity.Geometry", 
{
	init: function()
	{
		var speed = 200;

		this.particles = new Array(this.numMax);

		var particle;
		for(var n = 0; n < this.numMax; n++) {
			particle = new this.Particle();
			particle.angle = 0 * Math.PI / 180;
			particle.velocityX = speed * Math.cos(particle.angle);
			particle.velocityY = -speed * Math.sin(particle.angle);
			this.particles[n] = particle;
		}
	},

	update: function(tDelta) 
	{
		this.elapsed += tDelta;
		if(this.elapsed > this.duration) {
			this.updating = false;
			return;
		}

		if(this.emissionRate > 0)
		{
			var rate = 1.0 / this.emissionRate;
			this.emissionCounter += tDelta;

			var num = Math.floor(this.emissionCounter / rate);
			this.emissionCounter -= (num * rate);
		}

		var particle;
		for(var n = 0; n < this.numActive; n++) {
			this.updateParticle(this.particles[n], tDelta);
		}

		this.renderer.needRender =  true;
	},

	updateParticle: function(particle, tDelta)
	{

	},

	draw: function(ctx)
	{
		var tDelta = meta.time.deltaF;

		var particle;
		var img = this.texture.canvas;
		var parentX = this.volume.x;
		var parentY = this.volume.y;

		for(var n = 0; n < this.numActive; n++) {
			particle = this.particles[n];
			particle.x += (particle.velocityX * tDelta);
			particle.y += (particle.velocityY * tDelta);
			ctx.drawImage(img, parentX + particle.x, parentY + particle.y);
		}
	},

	play: function() {
		this.updating = true;
	},

	pause: function() {
		this.updating = false;
	},

	togglePlay: function() 
	{
		if(this.updating) {
			this.pause();
		}
		else {
			this.play();
		}
	},

	Particle: function()
	{
		this.x = 0;
		this.y = 0;
		this.velocityX = 0;
		this.velocityY = 0;
		this.angle = 0;
		this.life = 0;
	},

	//
	particles: null,

	numMax: 150,
	numActive: 0,
	emissionRate: 75,

	life: 2,
	lifeVar: 1,

	emissionCounter: 0,
	elapsed: 0,
	duration: Infinity
});
