"use strict";

UI.Style = function(style)
{
	this.style = null;

	//
	this.generate(style);
};

UI.Style.prototype =
{
	generate: function(style) {
		this.style = {};
		this.setStyle(style);
	},


	setStyle: function(style)
	{
		var element, data, index, selector, elementID;
		var elementObj;

		for(var elementType in style)
		{
			elementObj = this.style[elementType];
			if(!elementObj) {
				elementObj = {};
				this.style[elementType] = elementObj;
			}

			element = style[elementType];

			for(elementID in element)
			{
				data = element[elementID];
				index = elementID.indexOf("@");
				if(index !== -1) {
					elementID = elementID.substr(0, index);
				}

				index = elementID.indexOf(":");
				if(index !== -1) {
					selector = elementID.substr(index + 1, elementID.length - index - 1);
					elementID = elementID.substr(0, index);

					if(!data) {
						elementObj[elementID].removeState(selector);
					}
					else {
						elementObj[elementID].setState(selector, null, data);
					}
				}
				else {
					var brush = new meta.Brush();
					brush.setState("default", null, data);
					elementObj[elementID] = brush;
				}
			}
		}
	},

	getStyle: function(def)
	{
		var index = def.indexOf(".");

		var elementType, styleID;
		if(index === -1) {
			elementType = def;
			styleID = "*";
		}
		else {
			elementType = def.substr(0, index);
			styleID = def.substr(index + 1, def.length - index - 1);
		}

		return this.style[elementType][styleID];
	}
};