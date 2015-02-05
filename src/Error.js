"use strict";

if(meta.device.mobile)
{
	window.onerror = function(message, file, lineNumber) {
		alert(file + ": " + lineNumber + " " + message);
	};
}
