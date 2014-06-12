"use strict";

Entity.CellArray = function()
{
	this.buffer = new Array(8);
	this.size = 8;
	this.length = 0;
	this.isVisible = false;
}

Entity.CellArray.prototype = 
{
	push: function(entity)
	{
		if(this.size === this.length) {
			this.size += 8;
			this.buffer.length = this.size; 
		}

		this.buffer[this.length] = entity;
		entity._cellIndex = this.length;
		this.length++;
	},

	remove: function(entity)
	{
		this.length--;
		this.buffer[entity._cellIndex] = this.buffer[this.length];

		if((this.length + 8) === this.size) {
			this.size -= 8;
			this.buffer.length = this.size;
		}
	}
};