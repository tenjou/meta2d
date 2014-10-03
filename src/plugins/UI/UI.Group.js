"use strict";

UI.Group = Entity.Geometry.extend
({
	add: function(entity) 
	{
		if(entity.group) {
			entity.detach();
		}

		if(!this.children) {
			entity.state = "on";
		}

		this.attach(entity);
		entity.group = this;
	},

	_onStateChange: function(entity)
	{
		this.value = entity.value;

		var child;
		var numChildren = this.children.length;
		for(var i = 0; i < numChildren; i++) 
		{
			child = this.children[i];
			if(child === entity) { continue; }

			this.children[i].state = "off";
		}

		this.onChange(this);
	},


	//
	value: ""
});