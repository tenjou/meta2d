"use strict";

var Intro = {};

Intro.Controller = meta.Controller.extend
({
	init: function()
	{
		var bg = new Entity.Geometry();
		bg.texture = new Resource.Texture();
		bg.pivotTopLeft(0, 0);
		bg.onResize = function(data) {
			this.texture.fillRect(data.width, data.height)
		};
		bg.onClick = function() {
			console.log("set");
			meta.setView("game");
		};
		this.view.add(bg);

		var name = new Entity.Text();
		name.text = "META MATCH 3"
		name.color = "white";
		name.size = 70;
		name.anchor(0.5);
		name.position(0, -30);
		name.isPickable = false;
		this.view.add(name);

		var press = new Entity.Text();
		press.text = "Press screen to continue";
		press.color = "white";
		press.size = 20;
		press.anchor(0.5);
		press.position(0, 50);
		press.isPickable = false;
		this.view.add(press);		
	}
});