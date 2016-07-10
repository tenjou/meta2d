"use strict";

meta.on("domload", function() {
	meta.engine.init();
});

function DomLoad()
{
	if((document.readyState === "interactive" || document.readyState === "complete")) {
		meta.emit("domload");
		return;
	}

	var cbFunc = function(event) {
		meta.emit("domload");
		window.removeEventListener("DOMContentLoaded", cbFunc);
	};

	window.addEventListener("DOMContentLoaded", cbFunc);		
}

DomLoad();
