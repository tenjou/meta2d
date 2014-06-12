"use strict";

meta.utils.LinkedList = function()
{
	this.length = 0;
	this.first = new meta.utils.LinkedListNode(null);
	this.last = new meta.utils.LinkedListNode(null);

	this.first.next = this.last;
	this.last.prev = this.first;
};

meta.utils.LinkedList.prototype =
{
	push: function(node)
	{
		this.last.prev.next = node;
		this.last.prev = node;
		node.prev = this.last.prev;
		node.next = this.last;

		this.length++;
	},

	remove: function(node)
	{
		node.prev.next = node.next;
		node.next.prev = node.prev;
		node.prev = null;
		node.next = null;

		this.length--;
	}
};

meta.utils.LinkedListNode = function(data) {
	this.data = data;
	this.prev = null;
	this.next = null;
};