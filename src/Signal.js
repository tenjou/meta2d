"use strict";

/**
 * Object that holds information about channel.
 * @property name {String} Name of the channel.
 * @property subs {Array} Array with subsribers.
 * @property numSubs {Number} Total count of subscribers.
 */
meta.Channel = function(name)
{
	this.name = name;
	this.subs = [];
	this.numSubs = 0;

	this._emitting = false;
	this._subsToRemove = null;
};

meta.Channel.prototype =
{
	/**
	 * Emit an event to all subscribers.
	 * @param data {*} Data that comes with event.
	 * @param event {*} Type of event.
	 */
	emit: function(data, event)
	{
		this._emitting = true;

		var sub;
		for(var i = 0; i < this.numSubs; i++) {
			sub = this.subs[i];
			sub.func.call(sub.owner, data, event);
		}

		this._emitting = false;

		// Remove subs from this channel that offd while emited.
		if(this._subsToRemove) 
		{
			var numToRemove = this._subsToRemove.length;
			for(var n = 0; n < numToRemove; n++) {
				this.remove(this._subsToRemove[n]);
			}

			this._subsToRemove = null;
		}
	},

	/**
	 * Subscribe to the channel.
	 * @param owner {Object} Pointer to the owner object.
	 * @param func {Function} Callback function.
	 */
	add: function(func, owner, priority)
	{
		priority = priority || 0;

		if(!func) {
			console.warn("(meta.Channel.subscribe) No valid callback function passed.");
			return false;
		}

		for(var i = 0; i < this.numSubs; i++)
		{
			if(this.subs[i].owner === owner) {
				// console.warn("(meta.Channel.subscribe) Already subscribed to channel: " + this.name);
				return false;
			}
		}

		var newSub = new meta.Subscriber(owner, func, priority);
		this.subs.push(newSub);
		this.numSubs++;

		if(priority) {
			this._havePriority = true;
			this.subs.sort(this._sortFunc);
		}
		else if(this._havePriority) {
			this.subs.sort(this._sortFunc);
		}

		return true;
	},

	/**
	 * Unsubscribe from the channel.
	 * @param owner {Object} Pointer to the owner object.
	 */
	remove: function(owner)
	{
		if(owner === null || owner === void(0)) {
			meta.channels[this.name] = null;
		}
		else
		{
			if(this._emitting) 
			{
				if(!this._subsToRemove) {
					this._subsToRemove = [];
				}
				this._subsToRemove.push(owner);
				return;
			}
	
			var sub;
			for(var i = 0; i < this.numSubs; i++)
			{
				sub = this.subs[i];
				if(sub.owner === owner) {
					this.subs[i] = this.subs[this.numSubs - 1];
					this.subs.pop();
					this.numSubs--;
					break;
				}
			}
	
			if(this._havePriority) {
				this.subs.sort(this._sortFunc);
			}
		}
	},

	removeAll: function() {
		this.subs = [];
		this.numSubs = 0;
	},

	_sortFunc: function(a, b) {
		return (a.priority > b.priority) ? -1 : 1
	},

	//
	_havePriority: false
};

meta.Subscriber = function(owner, func, priority) {
	this.owner = owner;
	this.func = func;
	this.priority = priority;
};

/**
 * Create or get channel from the scope.
 * @param name {String} Name of the channel.
 * @return {meta.Channel} Created channel.
 * @memberof! <global>
 */
meta.createChannel = function(name)
{
	if(!name) {
		console.warn("(meta.createChannel) No name was specified!");
		return null;
	}

	var channel = meta.channels[name];
	if(!channel) {
		channel = new meta.Channel(name);
		meta.channels[name] = channel;
	}

	return channel;
};

/**
 * Release channel.
 * @param name
 * @memberof! <global>
 */
meta.releaseChannel = function(name)
{
	if(!name) {
		console.warn("(meta.releaseChannel) No name was specified!");
		return;
	}

	if(meta.channels[name]) {
		meta.channels[name] = null;
	}
};

/**
 * Subscribe to the channel.
 * @param owner {Object} Pointer of the owner object.
 * @param channel {meta.Channel|String|Array} Name, object or array of the channels to subscribe to.
 * @param func {Function} Callback function that will be called when emit arrives.
 * @memberof! <global>
 */
meta.subscribe = function(channel, func, owner, priority)
{
	if(typeof(owner) !== "object") {
		console.warn("(meta.subscribe) No owner passed.");
		return;
	}
	if(!func) {
		console.warn("(meta.subscribe) No callback function passed.");
		return;		
	}

	if(typeof(channel) === "string")
	{
		var srcChannel = meta.channels[channel];
		if(!srcChannel)
		{
			channel = meta.createChannel(channel);
			if(!channel) {
				return;
			}
		}
		else {
			channel = srcChannel;
		}
	}
	else if(Object.prototype.toString.call(channel) === "[object Array]")
	{
		var numChannels = channel.length;
		for(var i = 0; i < numChannels; i++) {
			meta.subscribe(channel[i], func, owner, priority);
		}
		return;
	}
	else {
		console.warn("(meta.subscribe) Wrong type for channel object: " + typeof(channel));
		return;
	}

	channel.add(func, owner, priority);
};

/**
 * Unsubscribe from the channel.
 * @param owner {Object} Pointer of the owner object.
 * @param channel {meta.Channel|String|Array} Name, object or array of the channels to unsubscribe from.
 * @memberof! <global>
 */
meta.unsubscribe = function(channel, owner)
{
	if(typeof(channel) === "string")
	{
		channel = meta.channels[channel];
		if(!channel) {
			console.warn("(meta.unsubscribe) No name was specified!");
			return;
		}
	}
	else if(Object.prototype.toString.call(channel) === "[object Array]")
	{
		var numChannels = channel.length;
		for(var i = 0; i < numChannels; i++) {
			meta.unsubscribe(channel[i], owner);
		}
		return;
	}
	else {
		console.warn("(meta.unsubscribe) Wrong type for channel object.");
		return;
	}

	channel.remove(owner);
};

/**
 * Emit an event to all subscribers.
 * @param channel {String} Name of the channel.
 * @param data {*} Data that comes with event.
 * @param event {*} Type of event.
 */
meta.emit = function(channel, data, event)
{
	if(typeof(channel) === "string")
	{
		channel = meta.channels[channel];
		if(!channel) {
			console.warn("(meta.emit) No name was specified!");
			return;
		}
	}

	channel.emit(data, event);
};
