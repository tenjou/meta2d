"use strict";

UI.Button = Entity.Geometry.extend
({
	init: function(obj) 
	{
		if(typeof(obj) !== "string") {
			this.brush = this._style;
			this.state = "default";
		}
	},

	_updateState: function()
	{
		if(!this._style) { return; }

		if(this._disabled) {
			this.state = "disabled";
			return;
		}

		if(this.isHover && this._style.states.hover) {
			this.state = "hover";
			return;
		}

		this.state = "default";
	},


	onAdded: function()
	{
		if(this._label) {
			this.attach(this._label);
		}
	},


	_onHoverEnter: function(event) {
		document.body.style.cursor = "pointer";
		this._updateState();
	},

	_onHoverExit: function(event) {
		document.body.style.cursor = "auto";
		this._updateState();
	},

	_onDown: function(event) 
	{
		if(!this._disabled) {
			this.move(2, 2);
		}
	},

	_onUp: function(event) 
	{
		if(!this._disabled) {
			this.move(-2, -2);
		}
	},


	// Label.
	set style(style)
	{
		if(typeof(style) === "string") {
			style = UI.ctrl.getStyle("button." + style);
		}

		this._style = style;
		this.brush = style;
		this._isNeedDraw = true;
	},

	get style() { return this._style; },

	set text(str)
	{
		if(!this._label)
		{
			this._label = new Entity.Text();
			this._label.color = "white";
			this._label.size = 20;
			this._label.text = str;
			this._label.anchor(0.5);
			this._label.isPickable = false;
			this.attach(this._label);
		}
		else {
			this._label.setText(str);
		}
	},

	get text()
	{
		if(!this._label) {
			return "";
		}

		return this._label._text;
	},


	// Resolution.
	set width(value) {
		this._width = value;
		this.isNeedDraw = true;
	},

	set height(value) {
		this._height = value;
		this.isNeedDraw = true;
	},

	get width() { return this._width; },
	get height() { return this._height; },

	set disabled(value) { 
		this._disabled = value;
		this.clickable = !value;
		this._updateState();
	},

	get disabled() { return this._disabled; },
	

	//
	_style: null,
	_text: null,

	_width: 0,
	_height: 0,

	_disabled: false
});