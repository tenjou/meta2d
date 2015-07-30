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

		this._canvas = document.createElement("canvas");
		this._ctx = this._canvas.getContext("2d");
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

		particle.radialAccel = this.cfg.radialAccel + (this.cfg.radialAccelVar * meta.random.numberF(-1, 1));
		particle.tangentialAccel = this.cfg.tangentialAccel + (this.cfg.tangentialAccelVar * meta.random.numberF(-1, 1));

		particle.color[0] = this.cfg.startColor[0] + (this.cfg.startColorVar[0] * meta.random.numberF(-1, 1));
		particle.color[1] = this.cfg.startColor[1] + (this.cfg.startColorVar[1] * meta.random.numberF(-1, 1));
		particle.color[2] = this.cfg.startColor[2] + (this.cfg.startColorVar[2] * meta.random.numberF(-1, 1));
		particle.color[3] = this.cfg.startColor[3] + (this.cfg.startColorVar[3] * meta.random.numberF(-1, 1));

		this._endColor[0] = this.cfg.endColor[0] + (this.cfg.endColorVar[0] * meta.random.numberF(-1, 1));
		this._endColor[1] = this.cfg.endColor[1] + (this.cfg.endColorVar[1] * meta.random.numberF(-1, 1));
		this._endColor[2] = this.cfg.endColor[2] + (this.cfg.endColorVar[2] * meta.random.numberF(-1, 1));
		this._endColor[3] = this.cfg.endColor[3] + (this.cfg.endColorVar[3] * meta.random.numberF(-1, 1));

		particle.colorDelta[0] = (this._endColor[0] - this.cfg.startColor[0]) / particle.life;
		particle.colorDelta[1] = (this._endColor[1] - this.cfg.startColor[1]) / particle.life;
		particle.colorDelta[2] = (this._endColor[2] - this.cfg.startColor[2]) / particle.life;
		particle.colorDelta[3] = (this._endColor[3] - this.cfg.startColor[3]) / particle.life;

		particle.scale = this.cfg.scale + (this.cfg.scaleVar * meta.random.numberF(-1, 1));
		var endScale = this.cfg.endScale + (this.cfg.endScaleVar * meta.random.numberF(-1, 1));
		particle.scaleDelta = (endScale - particle.scale) / particle.life;
	},

	updateParticle: function(particle, tDelta)
	{
		particle.forcesX = (this.cfg.gravityX) * tDelta;
		particle.forcesY = (this.cfg.gravityY) * tDelta;
		particle.velX += particle.forcesX;
		particle.vecY += particle.forcesY

		particle.x += particle.velX * tDelta;
		particle.y += particle.vecY * tDelta;

		if(particle.color)
		{
			particle.color[0] += particle.colorDelta[0] * tDelta;
			particle.color[1] += particle.colorDelta[1] * tDelta;
			particle.color[2] += particle.colorDelta[2] * tDelta;
			particle.color[3] += particle.colorDelta[3] * tDelta;
		}

		particle.scale += this.scaleDelta;
	},

	draw: function(ctx)
	{
		var tDelta = meta.time.deltaF;
		var img = this.texture.canvas;
		var parentX = this.volume.minX;
		var parentY = this.volume.minY;

		var particle, color;
		for(var n = 0; n < this.numActive; n++) 
		{
			particle = this.particles[n];
			color = particle.color;

			this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
			this._ctx.globalCompositeOperation = "source-over";
			this._ctx.globalAlpha = color[3];
			this._ctx.drawImage(img, 0, 0);

			this._ctx.globalCompositeOperation = "source-atop";
			this._ctx.fillStyle = "rgba(" + 
				(color[0] | 0) + ", " + 
				(color[1] | 0) + ", " + 
				(color[2] | 0) + ", 1.0)";
// console.log("rgba(" + 
// 				(color[0] | 0) + ", " + 
// 				(color[1] | 0) + ", " + 
// 				(color[2] | 0) + ", 1.0)");
			this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

			this._ctx.globalCompositeOperation = "source-over";
			this._ctx.globalAlpha = color[3];			

			ctx.globalCompositeOperation = 'lighter';
			ctx.drawImage(this._canvas, parentX + particle.x, parentY + particle.y);
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

	setTexture: function(texture)
	{
		this._super(texture);

		if(!this.texture) 
		{
			if(this._cache.texture) {
				this._svgTexture = new Resource.SVG();
				this._svgTexture.fillStyle = "white";
				this._svgTexture.circle(this.cfg.radius);
			}
			this.texture = this._svgTexture;
		}
	},

	updateFromTexture: function() 
	{
		this._super();

		this._canvas.width = this.texture.width;
		this._canvas.height = this.texture.height;
	},

	Particle: function()
	{
		this.life = 0;
		this.x = 0;
		this.y = 0;
		this.velX = 0;
		this.velY = 0;
		this.radialAccel = 0;
		this.tangentialAccel = 0;
		this.forcesX = 0;
		this.forcesY = 0;

		this.color = new Float32Array(4);
		this.colorDelta = new Float32Array(4);
		this.scale = 1;
		this.scaleDelta = 1;
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
		angleVar: 360,
		gravityX: -200,
		gravityY: -200,
		radialAccel: 0,
		radialAccelVar: 0,
		tangentialAccel: 0,
		tangentialAccelVar: 0,

		startColor: [ 51, 102, 179, 1 ],
		startColorVar: [ 0, 0, 51, 0.1 ],
		endColor: [ 0, 0, 0, 1 ],
		endColorVar: [ 0, 0, 0, 0 ],
		scale: 1.0,
		scaleVar: 1.0,
		endScale: 1.0,
		endScaleVar: 1.0,

		texture: null,
		radius: 10
	},

	//
	particles: null,

	numActive: 0,

	emissionCounter: 0,
	elapsed: 0,
	duration: Infinity,

	addictive: false,

	_endColor: new Float32Array(4),
	_canvas: null,
	_ctx: null,
	_svgTexture: null
});
