"use strict";

meta.class("Entity.Particle", "Entity.Geometry", 
{
	init: function()
	{
		var max = this.cfg.numMax;

		this.particles = new Array(max);
		for(var n = 0; n < max; n++) {
			this.particles[n] = new this.Particle();
		}
	},

	update: function(tDelta) 
	{
		this.elapsed += tDelta;
		if(this.elapsed > this.duration) {
			this.updating = false;
			return;
		}

		if(this.cfg.emissionRate > 0)
		{
			var rate = 1.0 / this.cfg.emissionRate;
			this.emissionCounter += tDelta;

			var num = Math.floor(this.emissionCounter / rate);
			if(num > 0)
			{
				this.emissionCounter -= (num * rate);

				if(num > (this.cfg.numMax - this.numActive)) {
					num = (this.cfg.numMax - this.numActive);
				}

				var newNumActive = this.numActive + num;
				for(var i = this.numActive; i < newNumActive; i++) {
					this.initParticle(this.particles[i]);
				}

				this.numActive = newNumActive;
			}
		}

		var particle;
		for(var n = 0; n < this.numActive; n++) 
		{
			particle = this.particles[n];
			particle.life -= tDelta;
			if(particle.life <= 0) {
				this.numActive--;
				this.particles[n] = this.particles[this.numActive];
				this.particles[this.numActive] = particle;
				continue;
			}

			this.updateParticle(particle, tDelta);
		}

		this.renderer.needRender =  true;
	},

	initParticle: function(particle)
	{
		particle.x = meta.random.numberF(-1, 1) * this.cfg.xVar;
		particle.y = meta.random.numberF(-1, 1) * this.cfg.yVar;
		particle.life = this.cfg.life + (meta.random.numberF(-1, 1) * this.cfg.lifeVar);

		var speed = this.cfg.speed + (meta.random.numberF(-1, 1) * this.cfg.speedVar);
		var angle = this.cfg.angle + (meta.random.numberF(-1, 1) * this.cfg.angleVar);
		particle.velX = Math.cos((Math.PI * angle) / 180) * speed;
		particle.vecY = -Math.sin((Math.PI * angle) / 180) * speed;
		particle.velX = 0;
		particle.velY = 0;

		particle.color[0] = this.cfg.startColor[0] + (this.cfg.startColorVar[0] * meta.random.numberF(-1, 1));
		particle.color[1] = this.cfg.startColor[1] + (this.cfg.startColorVar[1] * meta.random.numberF(-1, 1));
		particle.color[2] = this.cfg.startColor[2] + (this.cfg.startColorVar[2] * meta.random.numberF(-1, 1));
		particle.color[3] = this.cfg.startColor[3] + (this.cfg.startColorVar[3] * meta.random.numberF(-1, 1));
	},

	updateParticle: function(particle, tDelta)
	{
		particle.x += particle.velX * tDelta;
		particle.y += particle.vecY * tDelta;
	},

	draw: function(ctx)
	{
		var tDelta = meta.time.deltaF;

		var particle;
		var img = this.texture.canvas;
		var parentX = this.volume.minX;
		var parentY = this.volume.minY;

		for(var n = 0; n < this.numActive; n++) {
			particle = this.particles[n];
			// particle.x += (particle.velocityX * tDelta);
			// particle.y += (particle.velocityY * tDelta);
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

	reset: function()
	{

	},

	Particle: function()
	{
		this.x = 0;
		this.y = 0;
		this.velX = 0;
		this.velY = 0;
		this.life = 0;

		this.color = new Float32Array(4);
		this.colorDelta = new Float32Array(4);
	},

	cfg: 
	{
		numMax: 150,
		emissionRate: 75,

		life: 2,
		lifeVar: 1,

		xVar: 0,
		yVar: 0,

		speed: 15,
		speedVar: 5,
		angle: 90,
		angleVar: 139,

		startColor: new Float32Array(4),
		startColorVar: new Float32Array(4),
		endColor: new Float32Array(4),
		endColorVar: new Float32Array(4)		
	},

	//
	particles: null,

	numActive: 0,

	emissionCounter: 0,
	elapsed: 0,
	duration: Infinity,

	addictive: false
});
