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
			this._value = entity.value;
		}

		this.attach(entity);
		entity.group = this;
	},

	_onStateChange: function(entity)
	{
		this._value = entity.value;

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


	set value(_value) 
	{
		if(this.children)
		{
			var numChildren = this.children.length;
			for(var n = 0; n < numChildren; n++) {
				if(this.children[n].value === _value) {
					this.children[n].state = "on";
					break;
				}
			}
		}
	},

	get value() { return this._value; },


	//
	_value: ""
});