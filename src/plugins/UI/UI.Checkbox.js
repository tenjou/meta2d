"use strict";

UI.Checkbox = Entity.Geometry.extend
({
	_initParams: function(params) 
	{		
		if(params) {
			this.style = meta.createStyle(params, UI.ctrl.coreStyle.checkbox);
		}
		else {
			this.style = UI.ctrl.style.checkbox;
		}

		var self = this;
		var entity = new Entity.Geometry();
		entity.style = this._style.childStyle;
		entity.anchor(0.5);
		entity.pickable = false;
		entity.onChange = function() { self._onChildChange(this); };
		this.attach(entity);

		this.state = "off";
		this._onClick = this.toggle;
	},

	toggle: function()
	{
		var child = this.children[0];

		if(this.group) {
			child.state = "on";	
		}
		else
		{
			if(child.state === "on") {
				child.state = "off";
			}
			else {
				child.state = "on";
			}
		}	
	},

	_onChange: function() 
	{
		this.children[0].state = this._state;

		if(this.group && this._state === "on") {
			this.group._onStateChange(this);	
		}		
	},

	_onChildChange: function(child) 
	{
		this._state = this.children[0]._state;

		if(this.group && this._state === "on") {
			this.group._onStateChange(this);	
		}		
	},


	set checked(value) {
		this.state = value ? "on" : "off";
	},

	get checked() { 
		return (this._state === "on");
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
	_text: null,
	group: null,
	value: ""
});
