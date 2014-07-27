meta.import("meta.topDown");

var player = null;

Entity.Bullet = Entity.Geometry.extend
({
	update: function(tDelta) {
		this.moveForward(tDelta * 400);
	}
});

function OnInput(data, event)
{
	var bullet = new Entity.Bullet("circle");
	bullet.scale(0.5);
	bullet.position(player.x, player.y);
	bullet.angle = player.angle;
	meta.view.add(bullet);
};

meta.load = function() 
{
	meta.preloadTextures([ "circle", "square" ], 
        "https://dl.dropboxusercontent.com/u/145051233/img/match3/");

	meta.subscribe(this, "inputDown", OnInput);

	player = new Entity.Geometry("square");
	player.addComponent(Component.MovementTopDown, { speed: 150 });
	player.position(meta.world.centerX, meta.world.centerY);
	meta.view.add(player);
};