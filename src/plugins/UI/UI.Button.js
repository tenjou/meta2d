"use strict";

UI.Button = Entity.Geometry.extend
({
	_initParams: function(params) 
	{		
		if(params) {
			this.style = meta.createStyle(params, UI.ctrl.coreStyle.button);
		}
		else {
			this.style = UI.ctrl.style.button;
		}
	},


	set text(str)
	{
		if(!this._text)
		{
			this._text = new Entity.Text(str);
			this._text.size = 12;
			this._text.color = "#ffffff";
			this.attach(this._text);

			this._text.anchor(0.5);
			this._text.pickable = false;		
		}
		else {
			this._text.setText(str);
		}
	},

	get text()
	{
		if(!this._text) {
			return "";
		}

		return this._text._text;
	},


	//
	_text: null
});

// UI.Button = Entity.Geometry.extend
// ({
// 	init: function(obj) 
// 	{
// 		if(typeof(obj) !== "string") {
// 			this.brush = this._style;
// 			this.state = "default";
// 		}
// 	},

// 	_updateState: function()
// 	{
// 		if(!this._style) { return; }

// 		if(this._disabled) {
// 			this.state = "disabled";
// 			return;
// 		}

// 		if(this.isHover && this._style.states.hover) {
// 			this.state = "hover";
// 			return;
// 		}

// 		this.state = "default";
// 	},





// 	_onHoverEnter: function(event) {
// 		document.body.style.cursor = "pointer";
// 		this._updateState();
// 	},

// 	_onHoverExit: function(event) {
// 		document.body.style.cursor = "auto";
// 		this._updateState();
// 	},

// 	_onDown: function(event) 
// 	{
// 		if(!this._disabled) {
// 			this.move(2, 2);
// 		}
// 	},

// 	_onUp: function(event) 
// 	{
// 		if(!this._disabled) {
// 			this.move(-2, -2);
// 		}
// 	},


// 	// Label.
// 	set style(style)
// 	{
// 		if(typeof(style) === "string") {
// 			style = UI.ctrl.getStyle("button." + style);
// 		}

// 		this._style = style;
// 		this.brush = style;
// 		this._isNeedDraw = true;
// 	},

// 	get style() { return this._style; },




// 	// Resolution.
// 	set width(value) {
// 		this._width = value;
// 		this.isNeedDraw = true;
// 	},

// 	set height(value) {
// 		this._height = value;
// 		this.isNeedDraw = true;
// 	},

// 	get width() { return this._width; },
// 	get height() { return this._height; },

// 	set disabled(value) { 
// 		this._disabled = value;
// 		this.clickable = !value;
// 		this._updateState();
// 	},

// 	get disabled() { return this._disabled; },
	

// 	//
// 	_style: null,
// 	_text: null,

// 	_width: 0,
// 	_height: 0,

// 	_disabled: false
// });