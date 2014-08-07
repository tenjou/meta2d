"use strict";

Resource.Font = Resource.Basic.extend
({
	init: function(param, path)
	{
		if(typeof(param) === "string") {
			path = param;
			param = void(0);
		}
		else
		{
			for(var key in param) {
				this[key] = param[key];
			}
		}

		if(path)
		{
			// Check if specific format is defined.
			var wildCardIndex = path.lastIndexOf(".");
			if(wildCardIndex !== -1 && (path.length - wildCardIndex) <= 5) {
				this.format = path.substr(wildCardIndex + 1, path.length - wildCardIndex - 1);
				path = path.substr(0, wildCardIndex);
			}

			this.path = Resource.ctrl.rootPath + path;
			if(!this.format) {
				this.format = "fnt";
			}
		}	
	},

	load: function()
	{
		console.log("load");
	},


	//
	type: Resource.Type.FONT,
	format: ""
});