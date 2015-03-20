"use strict";

meta.class("UI.ProgressBar", "Entity.Geometry", 
{
	init: function(texture, fillTexture) 
	{
		var fill = new Entity.Geometry(fillTexture);
		this.attach(fill);		
		this.updateUnits();
	},

	updateProgress: function()
	{
		console.log(this._fillWidth);
		var units = this._fillWidth 
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
		if(this._value === value) { return; }

		this._value = value;
		this.updateProgress();
	},

	set percents(value) {
		this.children[0].width = this._fillWidth / 100 * value;
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
	_value: 0,
	_unit: 1,
	_fillWidth: 1
});
