"use strict";

meta.class("meta.Video", "meta.Resource",
{
	onCanPlay: function()
	{

	},

	onEnd: function()
	{

	},

	set path(path)
	{
		if(this.$path === path) { return; }
		this.$path = path;

		if(!this.videoElement) 
		{
			var self = this;

			this.videoElement = document.createElement("video");
			this.videoElement.preload = "auto";
			this.videoElement.oncanplaythrough = function() {
				self.onCanPlay();
			};
			this.videoElement.onended = function() {
				self.onEnd();
			};
		}

		this.videoElement.src = path;
	},

	get path() {
		return this.$path;
	},

	//
	$path: null,
	videoElement: null
});
