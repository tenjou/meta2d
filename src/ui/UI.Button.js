"use strict";

meta.class("UI.Button", "Entity.Geometry", 
{
	onCreate: function() {
		this.picking = true;
	},

	onHoverEnter: function(data) {
		meta.engine.cursor = "pointer";
	},

	onHoverExit: function(data) {
		meta.engine.cursor = "auto";
	},

	onDown: function() {
		this.move(this.pressOffset, this.pressOffset);
	},

	onUp: function() {
		this.move(-this.pressOffset, -this.pressOffset);
	},

	_createLabel: function(text)
	{
		if(!text) {
			text = "";
		}

		this._label = new Entity.Text(text);
		this._label.pivot(0.5);
		this._label.anchor(0.5);
		this._label.pickable = false;
		this._label.size = 12;
		this._label.color = "#ffffff";
		this.attach(this._label);
	},

	set text(str)
	{
		if(!this._label) {
			this._createLabel(str);
		}
		else {
			this._label.text = str;
		}
	},

	get text()
	{
		if(!this._label) {
			return "";
		}

		return this._label.text;
	},

	get label() 
	{
		if(!this._label) {
			this._createLabel();
		} 

		return this._label;
	},

	//
	_label: null,
	pressOffset: 2
});