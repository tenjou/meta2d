"use strict";

var UI = {};

UI.Controller = meta.Controller.extend
({
	init: function()
	{
		var buttonTex = new Resource.Texture();
		buttonTex.fillRect({
			color: "#111",
			width: 160, height: 40
		});

		var buttonOnHoverTex = new Resource.Texture();
		buttonOnHoverTex.fillRect({
			color: "#ff0000",
			width: 160, height: 40
		});

		var buttonOnActive = new Resource.Texture();
		buttonOnActive.fillRect({
			color: "#ff4488",
			width: 160, height: 40
		});

		//
		this.style = new UI.Style({
			button: {
				"*": {
					texture: buttonTex
				},
				"*:hover": {
					texture: buttonOnHoverTex
				},
				"*:active": {
					texture: buttonOnActive
				}
			}
		});

		UI.Button.prototype._style = this.style.getStyle("button");
	},


	setStyle: function(style) {
		this.style.setStyle(style);
	},

	getStyle: function(def) {
		return this.style.getStyle(def);
	},


	//
	style: null
});