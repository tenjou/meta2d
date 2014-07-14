"use strict";

UI.Chekcbox = UI.Button.extend
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


	_onClick: function(event)
	{
		if(!this._style) { return; }
		if(!this._style.states.active) { return; }

		this.isActive = !this._isActive;
		this._updateState();
		this.onActive(this._isActive);
	},


	onActive: meta.emptyFuncParam,


	set isActive(value) {
		this._isActive = value;
		this._updateState();
	},

	get isActive() { return this._isActive; },


	//
	_isActive: false
});