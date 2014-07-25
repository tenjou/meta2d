"use strict";

Entity.DepthList = function()
{
	this.length = 0;
	this.first = new Entity.DepthList.Node(null);
	this.last = new Entity.DepthList.Node(null);

	this.bufferLength = 64;
	this.buffer = new Array(this.bufferLength);

	this.first.depth = -2147483648;
	this.first.next = this.last;

	this.last.depth = 2147483648;
	this.last.prev = this.first;
};

Entity.DepthList.prototype =
{
	push: function(node)
	{
		var currNode = this.last.prev;

		do
		{
			if(node.depth >= currNode.depth)
			{
				node.prev = currNode;
				node.next = currNode.next;
				currNode.next.prev = node;
				currNode.next = node;

				if(this.length >= this.bufferLength) {
					this.bufferLength += 64;
					this.buffer.length = this.bufferLength;
				}
				this.buffer[this.length] = node.entity;
				this.length++;
				return;
			}

			currNode = currNode.prev;
		} while(currNode);

		console.error("[Entity.DepthList.push]:", "Node is out of the bounds!");
	},

	remove: function(node)
	{
		if(node.next) { node.next.prev = node.prev; }
		if(node.prev) { node.prev.next = node.next; }
		node.next = null;
		node.prev = null;

		this.length--;
		this.buffer[node.index] = this.buffer[this.length];
		this.buffer[this.length] = null;
		node.index = 0;
	},

	clear: function() {
		this.length = 0;
		this.buffer = new Array(this.bufferLength);
	},

	update: function(node)
	{
		// Try to sink down.
		var currNode = node.prev;
		if(currNode !== this.first && currNode.depth > node.depth)
		{
			node.next.prev = node.prev;
			node.prev.next = node.next;

			do
			{
				if(currNode.depth <= node.depth)
				{
					node.prev = currNode;
					node.next = currNode.next;
					node.next.prev = node;
					currNode.next = node;
					return;
				}

				currNode = currNode.prev;
			} while(currNode);
		}

		// Try to bubble up.
		currNode = node.next;
		if(currNode !== this.last && currNode.depth < node.depth)
		{
			node.next.prev = node.prev;
			node.prev.next = node.next;

			do
			{
				if(currNode.depth > node.depth)
				{
					node.next = currNode;
					node.prev = currNode.prev;
					node.prev.next = node;
					currNode.prev = node;
					return;
				}

				currNode = currNode.next;
			} while(currNode);
		}
	},

	print: function()
	{
		if(this.length === 0) {
			console.log("Empty");
			return;
		}

		var currNode = this.first.next;
		do
		{
			console.log(currNode.entity.name, currNode.depth);
			currNode = currNode.next;
		} while(currNode !== this.last);
	}
};

Entity.DepthList.Node = function()
{
	this.entity = null;
	this.depth = 0;
	this.prev = null;
	this.next = null;
	this.index = -1;
};