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

		this.coreStyle = 
		{
			button: {
				"*:hover": {
					cursor: "pointer"
				},
				"*:pressed": {
					cursor: "pointer",
					offsetX: 2,
					offsetY: 2
				}
			}
		};

		this.style = 
		{
			button: new meta.Style({
				"*": {
					texture: buttonTex,
				},
				"*:hover": {
					texture: buttonOnHoverTex,
					cursor: "pointer"
				},
				"*:pressed": {
					texture: buttonOnHoverTex,
					cursor: "pointer",
					offsetX: 2,
					offsetY: 2
				}
			})
		};
	},


	// setStyle: function(style) {
	// 	this.style.setStyle(style);
	// },

	// getStyle: function(def) {
	// 	return this.style.getStyle(def);
	// },


	//
	style: null
});