"use strict";

UI.ProgressBar = Entity.Geometry.extend
({
	init: function(texture, fillTexture) 
	{
		var fill = new Entity.Geometry(fillTexture);
		this.attach(fill);
	},

	set min(value) 
	{
		if(this._min === value) { return; }

		this._min = value;
		this.updateElement();
	},

	set max(value) 
	{
		if(this._max === value) { return; }

		this._max = value;
		this.updateElement();
	},

	set value(value) 
	{
		if(this._value === value) { return; }

		this._value = value;
		this.updateElement();
	},


	get min() { return this._min; },
	get max() { return this._max; },
	get value() { return this._value; },


	set fillTexture(fillTexture) {
		this.children[0].texture = fillTexture;
	},

	get fillTexture() { return this.children[0].texture; },	


	//
	_min: 0,
	_max: 100,
	_value: 0
});
