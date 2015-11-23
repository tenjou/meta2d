"use strict";

meta.class("Steering.Manager", 
{
	init: function() {
		this.agents = [];
		meta.engine.onUpdate.add(this.update, this);
	},

	update: function(tDelta)
	{
		var num = this.agents.length;
		for(var n = 0; n < num; n++) {
			this.agents[n].update(tDelta);
		}
	},

	add: function(agent) {
		this.agents.push(agent);
	},

	//
	agents: null
});
