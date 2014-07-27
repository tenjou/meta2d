"use strict";

Component.MovementTopDown = function() {
	this.speed = 150;
	this._inputX = 0;
	this._inputY = 0;
};

Component.MovementTopDown.prototype = 
{
	load: function() {
		meta.subscribe(this, "inputMove", this.onInputMove);
	},

	unload: function() {
		meta.unsubscribe(this, "inputMove");
	},

	update: function(tDelta)
	{
		var input = Input.ctrl;
		var moveSpeed = this.speed * tDelta;

		if(input.isDown(Input.Key.W)) {
			this.owner.move(0, -moveSpeed);
		}
		else if(input.isDown(Input.Key.S)) {
			this.owner.move(0, moveSpeed);
		}
		
		if(input.isDown(Input.Key.A)) {
			this.owner.move(-moveSpeed, 0);
		}
		else if(input.isDown(Input.Key.D)) {
			this.owner.move(moveSpeed, 0);
		}

		this.owner.lookAt(this._inputX, this._inputY);
	},

	onInputMove: function(data, event) {
		this._inputX = data.x;
		this._inputY = data.y;
		this.owner.lookAt(data.x, data.y);
	}
};