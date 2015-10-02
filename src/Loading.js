"use strict";

meta.controller("meta.Loading", 
{
	onInit: function() {
		meta.loading = this;			
	},

	onFirstLoad: function() 
	{
		this.view.z = Number.MAX_SAFE_INTEGER;
		this.view.static = true;

		var bgTexture = new Resource.SVG();
		bgTexture.fillStyle = "#030303";
		bgTexture.fillRect(0, 0, meta.camera.width, meta.camera.height);
		this.bg = new Entity.Geometry(bgTexture);
		this.view.attach(this.bg);

		var loadingText = new Entity.Text();
		loadingText.color = "white";
		loadingText.text = "LOADING";
		loadingText.pivot(0.5);
		loadingText.anchor(0.5);
		loadingText.position(0, -8);
		this.view.attach(loadingText);

		var progressShadowTexture = new Resource.SVG();
		progressShadowTexture.fillStyle = "#222";
		progressShadowTexture.fillRect(0, 0, 100, 3);
		var progressShadow = new Entity.Geometry(progressShadowTexture);
		progressShadow.pivot(0.5);
		progressShadow.anchor(0.5);
		progressShadow.position(0, 5);
		this.view.attach(progressShadow);

		var progressTexture = new Resource.SVG();
		progressTexture.fillStyle = "white";
		progressTexture.fillRect(0, 0, 100, 3);
		this.progress = new Entity.Geometry(progressTexture);
		this.progress.clipBounds(0, 3);
		this.progress.pivot(0.5);
		this.progress.anchor(0.5);
		this.progress.position(0, 5);
		this.view.attach(this.progress);
	},

	onLoad: function() {
		meta.camera.onResize.add(this.onResize, this);
		meta.resources.onLoadingUpdate.add(this.onResourceLoaded, this);
	},

	onUnload: function() {
		meta.camera.onResize.remove(this);
		meta.resources.onLoadingUpdate.remove(this);
	},

	onResize: function(data){
		this.bg.texture.resizeSilently(data.width, data.height);
		this.bg.texture.fillRect(0, 0, data.width, data.height);
	},

	onResourceLoaded: function(mgr) 
	{
		var percents = Math.min((100 / mgr.numTotalToLoad) * (mgr.numTotalToLoad - mgr.numToLoad), 100);
		this.progress.clipBounds(percents, 3);
	},

	//
	bg: null,
	progress: null
});
