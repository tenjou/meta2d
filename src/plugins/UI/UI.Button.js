"use strict";

meta.class("UI.Button", "Entity.Geometry", 
{
	init: function() {
		this.pickable = true;
	},

	onHoverEnter: function(data) {
		meta.engine.cursor = "pointer";
	},

	onHoverExit: function(data) {
		meta.engine.cursor = "auto";
	},

	onDown: function() {
		this.offset(2, 2);
	},

	onUp: function() {
		this.offset(0, 0);
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