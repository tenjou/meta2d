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