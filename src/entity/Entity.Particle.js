"use strict";

meta.class("Entity.ParticleEmitter", "Entity.Geometry", 
{
	onCreate: function() {
		this.particles = [];
		this.preset = "meteor";
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
			if(num > 0)
			{
				this.emissionCounter -= (num * rate);

				if(num > (this.particles.length - this.numActive)) {
					num = (this.particles.length - this.numActive);
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
		particle.x = meta.random.numberF(-1, 1) * this.xVar;
		particle.y = meta.random.numberF(-1, 1) * this.yVar;
		particle.life = this.life + (meta.random.numberF(-1, 1) * this.lifeVar);

		var speed = this.speed + (meta.random.numberF(-1, 1) * this.speedVar);
		var angle = this.startAngle + (meta.random.numberF(-1, 1) * this.startAngleVar);
		particle.velX = Math.cos((Math.PI * angle) / 180) * speed;
		particle.vecY = -Math.sin((Math.PI * angle) / 180) * speed;

		particle.radialAccel = this.radialAccel + (this.radialAccelVar * meta.random.numberF(-1, 1));
		particle.tangentialAccel = this.tangentialAccel + (this.tangentialAccelVar * meta.random.numberF(-1, 1));

		if(this._textureTinting)
		{
			particle.color[0] = this.startColor[0] + (this.startColorVar[0] * meta.random.numberF(-1, 1));
			particle.color[1] = this.startColor[1] + (this.startColorVar[1] * meta.random.numberF(-1, 1));
			particle.color[2] = this.startColor[2] + (this.startColorVar[2] * meta.random.numberF(-1, 1));
			particle.color[3] = this.startColor[3] + (this.startColorVar[3] * meta.random.numberF(-1, 1));

			this._endColor[0] = this.endColor[0] + (this.endColorVar[0] * meta.random.numberF(-1, 1));
			this._endColor[1] = this.endColor[1] + (this.endColorVar[1] * meta.random.numberF(-1, 1));
			this._endColor[2] = this.endColor[2] + (this.endColorVar[2] * meta.random.numberF(-1, 1));
			this._endColor[3] = this.endColor[3] + (this.endColorVar[3] * meta.random.numberF(-1, 1));

			particle.colorDelta[0] = (this._endColor[0] - this.startColor[0]) / particle.life;
			particle.colorDelta[1] = (this._endColor[1] - this.startColor[1]) / particle.life;
			particle.colorDelta[2] = (this._endColor[2] - this.startColor[2]) / particle.life;
			particle.colorDelta[3] = (this._endColor[3] - this.startColor[3]) / particle.life;	
		}

		particle.scale = this.startScale + (this.startScaleVar * meta.random.numberF(-1, 1));
		var endScale = this.endScale + (this.endScaleVar * meta.random.numberF(-1, 1));
		particle.scaleDelta = (endScale - particle.scale) / particle.life;
	},

	updateParticle: function(particle, tDelta)
	{
		particle.forcesX = (this.gravityX) * tDelta;
		particle.forcesY = (this.gravityY) * tDelta;
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
		if(!this._texture.loaded) { return; }

		var tDelta = meta.time.deltaF;
		var img = this.texture.canvas;
		var parentX = this.volume.minX - (img.width * 0.5);
		var parentY = this.volume.minY - (img.height * 0.5);

		if(this._textureAdditive) {
			ctx.globalCompositeOperation = "lighter";
		}
		else {
			ctx.globalCompositeOperation = "source-over";
		}

		var particle, color;
		for(var n = 0; n < this.numActive; n++) 
		{
			particle = this.particles[n];
			color = particle.color;

			if(color[3] > 1) {
				color[3] = 1;
			}
			if(color[3] < 0) {
				color[3] = 0;
			}
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

			ctx.drawImage(this.texture.canvas, parentX + particle.x, parentY + particle.y);
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

	reset: function() {
		this.numActive = 0;
		this.elapsed = 0;
	},

	set texture(value) 
	{
		if(!value) 
		{
			if(!this._svgTexture) {
				this._svgTexture = new Resource.SVG();
				this._svgTexture.fillStyle = "white";
				this._svgTexture.circle(this._radius);
			}

			this._texture = this._svgTexture;
		}
		else {
			this._texture = value;
		}

		if(this._texture.loaded) {
			this.updateTintCanvas();
		}
		else {
			this.texture.subscribe(this, this.onTextureEvent);
		}
	},

	get texture() {
		return this._texture;
	},

	updateTintCanvas: function() 
	{
		if(!this._canvas) {
			this._canvas = document.createElement("canvas");
			this._ctx = this._canvas.getContext("2d");
		}
		this._canvas.width = this._texture.width;
		this._canvas.height = this._texture.height;			
	},

	onTextureEvent: function(data, event) {
		this.updateTintCanvas();
		this._texture.unsubscribe(this);
	},

	set totalParticles(value) 
	{
		var num = this.particles.length;

		this.particles.length = value;

		for(var n = num; n < value; n++) {
			this.particles[n] = new this.Particle();
		}

		if(this.numActive > value) {
			this.numActive = value;
		}
	},

	get totalParticles() { 
		return this.particles.length;
	},

	set textureAdditive(value) {
		this._textureAdditive = value;
	},

	get textureAdditive() {
		return this._textureAdditive;
	},

	set textureTinting(value) {
		this._textureTinting = value;
	},

	get textureTinting() {
		return this._textureTinting;
	},

	set radius(value) 
	{
		this._radius = value;

		if(this._texture === this._svgTexture) {
			this._svgTexture.clear();
			this._svgTexture.circle(this._radius);
			this.updateTintCanvas();
		}
	},

	get radius() {
		return this._radius;
	},

	set preset(name) 
	{
		var preset = this.presets[name];
		for(var key in preset)
		{
			if(this[key] === preset[key]) {
				continue;
			}

			this[key] = preset[key];
		}

		this.textureAdditive = this._textureAdditive;
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

	//
	particles: null,
	numActive: 0,

	emissionRate: 0,
	emissionCounter: 0,
	elapsed: 0,
	duration: Infinity,
	life: 1, lifeVar: 0,

	xVar: 0, yVar: 0,
	speed: 0, speedVar: 0,
	startAngle: 0, startAngleVar: 0,

	startScale: 1.0, startScaleVar: 0,
	endScale: 1.0, endScaleVar: 0,

	gravityX: 0, gravityY: 0,
	radialAccel: 0, radialAccelVar: 0,
	tangentialAccel: 0, tangentialAccelVar: 0,

	startColor: null, startColorVar: null,
	endColor: null, endColorVar: null,
	_endColor: new Float32Array(4),
	_canvas: null,
	_ctx: null,
	_svgTexture: null,

	_radius: 10,
	_textureAdditive: false,

	//
	presets: 
	{
		empty: {
			totalParticles: 50,
			emissionRate: 10,
			life: 1,
			lifeVar: 0,
		},

		meteor: {
			totalParticles: 45,
			emissionRate: 40,
			life: 1,
			lifeVar: 0.1,

			xVar: 2,
			yVar: 2,

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

			startColor: [ 255, 42, 0, 1 ],
			startColorVar: [ 0, 0, 51, 0.1 ],
			endColor: [ 0, 0, 0, 1 ],
			endColorVar: [ 0, 0, 0, 0 ],
			scale: 1.0,
			scaleVar: 1.0,
			endScale: 1.0,
			endScaleVar: 1.0,

			textureAdditive: true,
			radius: 10
		}
	}
});
