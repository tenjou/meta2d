"use strict";

UI.ProgressBar = Entity.Geometry.extend
({
	init: function() 
	{
		this.texture = new Resource.Texture();
		this.volume.resize(300, 30);

		this.buildElement();
	},


	buildElement: function()
	{
		this.texture.fillRect({
			width: this.width,
			height: this.height,
			color: "white"
		});
	},

	updateElement: function()
	{

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


	//
	_min: 0,
	_max: 100,
	_value: 0
});