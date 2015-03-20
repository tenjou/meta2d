"use strict";

meta.class("UI.Controller", "meta.Controller", 
{
	init: function()
	{
		var buttonTex = new Resource.Texture();
		buttonTex.fillRect({
			color: "#111",
			width: 120, height: 30
		});

		var buttonOnHoverTex = new Resource.Texture();
		buttonOnHoverTex.fillRect({
			color: "#ff0000",
			width: 120, height: 30
		});		

		this.coreStyle = 
		{
			button: {
				"*:hover": {
					cursor: "pointer"
				},
				"*:pressed, *:drag": {
					cursor: "pointer",
					offsetX: 1,
					offsetY: 1
				}
			},
			checkbox: {
				"*:hover": {
					cursor: "pointer"
				},
				"*:pressed, *:drag": {
					cursor: "pointer",
					offsetX: 1,
					offsetY: 1
				}
			}			
		};		

		this.style = 
		{
			button: {
				"*": {
					texture: buttonTex
				},
				"*:hover": {
					texture: buttonOnHoverTex,
					cursor: "pointer"
				},
				"*:pressed": {
					texture: buttonOnHoverTex,
					cursor: "pointer",
					offsetX: 1,
					offsetY: 1
				}
			},
			checkbox: {
				"*": {
					texture: buttonTex
				},
				"*:hover": {
					texture: buttonOnHoverTex,
					cursor: "pointer"
				},
				"*:pressed": {
					texture: buttonOnHoverTex,
					cursor: "pointer",
					offsetX: 1,
					offsetY: 1
				},
				"[off]": {
					texture: buttonTex
				},
				"[on]": {
					texture: buttonOnHoverTex
				}
			}
		};
	},

	//
	coreStyle: null,
	style: null
});