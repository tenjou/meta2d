"use strict";

meta.load = function() 
{
	meta.loadSpriteSheet("assets/match3.json");

	// var intro = meta.getView("intro");
	// intro.register("Intro");

	// var game = meta.getView("game");
	// game.register("MatchGame");

	// meta.setView("intro");

                var entity = new Entity.Geometry("circle");
                entity.anchor(0.5);
                meta.view.add(entity);
};