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
		entity.state = "on";
		entity.onChange = function() { self._onChildChange(this); };
		this.attach(entity);

		this._onClick = this.toggle;
	},

	toggle: function()
	{
		var child = this.children[0];

		if(child.state === "on") {
			child.state = "off";
		}
		else {
			child.state = "on";
		}
	},

	_onChange: function() {
		this.children[0].state = this._state;
	}

	_onChildChange: function(child) {
		this._state = this.children[0]._state
	},

	set checked(value) {
		this.state = value ? "on" : "off";
	},

	get checked() { 
		return (this._state === "on");
	}
});