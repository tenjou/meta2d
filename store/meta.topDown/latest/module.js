"use strict";

Component.MovementTopDown = function() {
	this.speed = 150;
};

Component.MovementTopDown.prototype = 
{
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

		this.owner.lookAt(input.inputX, input.inputY);
	}
};