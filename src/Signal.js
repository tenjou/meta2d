"use strict";

/**
 * Object that holds information about channel.
 * @constructor
 * @property name {String} Name of the channel.
 * @property subs {Array} Array with subsribers.
 * @property numSubs {Number} Total count of subscribers.
 */
meta.Channel = function(name)
{
	this.name = name;
	this.subs = [];
	this.numSubs = 0;

	this._isEmiting = false;
	this._subsToRemove = null;
};

meta.Channel.prototype =
{
	/**
	 * Remove the channel.
	 */
	remove: function() {
		meta.channels[this.name] = null;
	},

	/**
	 * Emit an event to all subscribers.
	 * @param data {*} Data that comes with event.
	 * @param event {*} Type of event.
	 */
	emit: function(data, event)
	{
		this._isEmiting = true;

		var sub;
		for(var i = 0; i < this.numSubs; i++) {
			sub = this.subs[i];
			sub.func.call(sub.owner, data, event);
		}

		this._isEmiting = false;

		// Remove subs from this channel that offd while emited.
		if(this._subsToRemove) 
		{
			var numToRemove = this._subsToRemove.length;
			for(var n = 0; n < numToRemove; n++) {
				this.unsubscribe(this._subsToRemove[n]);
			}

			this._subsToRemove = null;
		}
	},

	/**
	 * Subscribe to the channel.
	 * @param owner {Object} Pointer to the owner object.
	 * @param func {Function} Callback function.
	 */
	subscribe: function(owner, func)
	{
		if(!func) {
			console.warn("[meta.Channel.subscribe]:", "No callback function passed.");
			return;			
		}

		for(var i = 0; i < this.numSubs; i++)
		{
			if(this.subs[i].owner === owner) {
				console.warn("[meta.Channel.subscribe]:", "Already subscribed to channel: " + this.name);
				return;
			}
		}

		var newSub = new meta.Subscriber(owner, func);
		this.subs.push(newSub);
		this.numSubs++;
	},

	/**
	 * Unsubscribe from the channel.
	 * @param owner {Object} Pointer to the owner object.
	 */
	unsubscribe: function(owner)
	{
		if(this._isEmiting) 
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
	}
};

meta.Subscriber = function(owner, func) {
	this.owner = owner;
	this.func = func;
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
		console.warn("[meta.createChannel]:", "No name was specified!");
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
		console.warn("[meta.releaseChannel]:", "No name was specified!");
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
meta.subscribe = function(owner, channel, func)
{
	if(typeof(owner) !== "object") {
		console.warn("[meta.subscribe]:", "No owner passed.");
		return;
	}
	if(!func) {
		console.warn("[meta.subscribe]:", "No callback function passed.");
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
			meta.subscribe(owner, channel[i], func);
		}
		return;
	}
	else {
		console.warn("[meta.subscribe]:", "Wrong type for channel object: " + typeof(channel));
		return;
	}

	channel.subscribe(owner, func);
};

/**
 * Unsubscribe from the channel.
 * @param owner {Object} Pointer of the owner object.
 * @param channel {meta.Channel|String|Array} Name, object or array of the channels to unsubscribe from.
 * @memberof! <global>
 */
meta.unsubscribe = function(owner, channel)
{
	if(typeof(channel) === "string")
	{
		channel = meta.channels[channel];
		if(!channel) {
			console.warn("[meta.unsubscribe]:", "No name was specified!");
			return;
		}
	}
	else if(Object.prototype.toString.call(channel) === "[object Array]")
	{
		var numChannels = channel.length;
		for(var i = 0; i < numChannels; i++) {
			meta.unsubscribe(owner, channel[i]);
		}
		return;
	}
	else {
		console.warn("[meta.unsubscribe]:", "Wrong type for channel object.");
		return;
	}

	channel.unsubscribe(owner);
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
			console.warn("[meta.emit]:", "No name was specified!");
			return;
		}
	}

	channel.emit(data, event);
};
