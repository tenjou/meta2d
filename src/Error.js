"use strict";

if(meta.device.isMobile)
{
	window.onerror = function(message, file, lineNumber) {
		alert(file + ": " + lineNumber + " " + message);
	};
}