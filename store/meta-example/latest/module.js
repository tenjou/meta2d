"use strict";

Entity.Example = Entity.Geometry.extend
({
	init: function()
	{
	    this.texture = new Resource.Texture();
	    this.texture.fillRect({
	        width: 50, height: 50,
	        color: "red"
	    });	
	}
});