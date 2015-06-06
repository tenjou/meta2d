"use strict";

meta.class("Editor", 
{
	start: function()
	{
		this.widgets = [];
		this.renderWidgets = [];

		this.createToolbars();

		init();

		var that = this;
		this._renderFunc = function() { that.render(); };
		this.render();
	},

	createToolbars: function() 
	{
		var palette = new PaletteWidget("palette");
		palette.loadAtlas("assets/tilemap.png", 32, 32);
		this.widgets.push(palette);
	},

	addRender: function(widget) 
	{
		if(widget.flags & widget.Flag.RENDERING) { return; }

		this.renderWidgets.push(widget);
	},

	removeRender: function(widget)
	{
		if((widget.flags & widget.Flag.RENDERING) === 0) { return; }

		var num = this.widgets.length;
		for(var n = 0; n < num; n++) {
			if(this.widgets[n] === widget) {
				this.widgets.splice(n, 1);
			}
		}
	},

	render: function() 
	{
		var widget;
		var num = this.renderWidgets.length;
		for(var n = 0; n < num; n++) {
			widget = this.renderWidgets[n];
			if(widget.flags & widget.Flag.NEED_RENDER) {
				widget.render();
				widget.flags &= ~widget.Flag.NEED_RENDER;
			}
		}

		update();

		window.requestAnimationFrame(this._renderFunc);
	},

	//
	widgets: null,
	renderWidgets: null
});
