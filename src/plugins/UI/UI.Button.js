"use strict";

UI.Button = Entity.Geometry.extend
({
	init: function(obj) {
		this.brush = this._style;
		this.state = "default";
	},

	_updateState: function()
	{
		if(!this._style) { return; }

		if(this.isHover && this._style.states.hover) {
			this.state = "hover";
			return;
		}

		if(this._isActive && this._style.states.active) {
			this.state = "active";
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

	_onPress: function(event) {
		this.move(2, 2);
	},

	_onClick: function(event)
	{
		if(!this._style) { return; }

		this.move(-2, -2);
		if(!this._style.states.active) { return; }

		this.isActive = !this._isActive;
		this._updateState();
		this.onActive(this._isActive);
	},

	_onRelease: function(event) {
		this.move(-2, -2);
	},

	onActive: meta.emptyFuncParam,


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
			this._label.position(0, 0);
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

	get label() { return this._label; },


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


	set isActive(value) {
		this._isActive = value;
		this._updateState();
	},

	get isActive() { return this._isActive; },

	//
	_style: null,
	_text: null,

	_width: 1,
	_height: 1,

	_isActive: false
});