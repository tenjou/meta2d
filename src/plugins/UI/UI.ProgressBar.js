"use strict";

meta.class("UI.ProgressBar", "Entity.Geometry", 
{
	init: function(texture, fillTexture) 
	{
		this._super(texture);

		var fill = new Entity.Geometry(fillTexture);
		this.attach(fill);		
		this.updateUnits();
	},

	updateProgress: function()
	{
		var units = Math.floor((this._fillWidth / 100) * this._value);
		var fill = this.children[0]; 
		fill.width = units;
		//this.children[0].width = 40;
	},

	updateUnits: function()
	{
		var texture = this.children[0]._texture;

		if(texture._loaded) {
			this._fillWidth = texture.fullWidth
		}
	},

	set min(value) 
	{
		if(this._min === value) { return; }
		this._min = value;

		this.updateProgress();
	},

	set max(value) 
	{
		if(this._max === value) { return; }
		this._max = value;
		
		this.updateProgress();
	},

	set value(value) 
	{
		if(value < this._min) { 
			value = this._min; 
		}
		else if(value > this._max) { 
			value = this._max;
		}

		if(this._value === value) { return; }
		this._value = value;

		this.updateProgress();
	},

	set percents(percents) {
		var range = this._max - this._min;
		var value = range / 100 * percents;
		//this.value = this._min + value;
		//this.children[0].width = this._fillWidth / range * value;
	},

	get min() { return this._min; },
	get max() { return this._max; },
	get value() { return this._value; },
	get percents() { return this._percents; },


	set fillTexture(fillTexture) {
		this.children[0].texture = fillTexture;
		this.updateProgress();
	},

	get fillTexture() { return this.children[0]._texture; },	


	//
	_min: 0,
	_max: 100,
	_value: 100,
	_unit: 1,
	_fillWidth: 1
});
