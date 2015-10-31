META v0.8.2 pre-release
====

Meta is free and fast open source HTML5 game engine for making cross platform games, supports Canvas and WebGL rendering and Dopple for native compilation.

#####**Engine is currently focusing on developing libraries and tool for developing tile based games. Different type of games are at lower priority.**

* [Offical Website](http://meta2d.com/)
* [Examples](http://meta2d.com/examples)

Features
====

1. **Fast rendering** - Optimized renderer will call minimal required state changes and transforms to render entity.
2. **Memory friendly** - Optimized in all fronts to minimize garbage collection.
3. **Simple API** - Simple yet powerfull API lets you write easy to understand code.
4. **Fast development & support**
	* Regular update schedule
	* Fast bug fixing
	* Request features you need that makes sense to be part of engine
5. **Model View Controller (MVC)** - Engine architecture follows MVC principles but optimized for game and application development.
5. **Entity** - Powerfull way to make any object that is part of screen topology:
	* Pivots
	* Anchor points
	* Rotating
	* Scaling
	* Depth ordering
	* Interactions - clicking, pushing, dragging and hovering
	* Animations
	* State managers
	* Visibility
	* Spritesheets/Texture atlas
	* Children/parenting system
	* Clipping
	* LookAt
6. **Input** - Multiple ways to handle keyboard/mouse and touch events. Keybind system.
7. **Audio** - Supports automatic loading for supported audio formats and handles multiple simultaneous playing instances. Uses AudioAPI or fallback to legacy Audio element.
8. **Text** - Canvas and bitmap fonts
9. **Tweening**
10. **SVG** - Helper texture resoruce that helps to generate SVG textures for prototyping or other needs: 
	* Supports: FillRect, Rect, Lines, Shape, RoundRect, Circle, Arc, Tiling, Gradient, Grid.
11. **Camera** - Comes with utilities to handle different resolutions, scaling, fitting, zooming.
12. **Tilemaps** - Additionally supporting Tiled editor .tmx and .json formats.
13. **Arcade physics**
	* Supports collisions for: AABB, Circle, Line and Point.
14. **Particles**
15. **Channel event system**
16. **Timer**
17. **Fullscreen**
18. **Store import** - Import plugins from store with just one code line.
19. **UI elements** - button, checkbox, progress bar.
20. **Optional libraries**:
	* AStar pathfinding - [GitHub](https://github.com/InfiniteFoundation/metaAstar)
	* Procedural generation - [GitHub](https://github.com/InfiniteFoundation/metaProcedural)

Usage
====

Only requirement is to include library either from CDN or download and include locally:
```html
<script src="http://meta2d.com/meta.js"></script>
```
Nightly build (development build):
```html
<script src="http://meta2d.com/meta.dev.js"></script>
```

Roadmap
====

Features that can be expecteded in next releases:

1. Tilemap supporting auto tiling
2. Multiple character controllers
3. Tilemap collision/physics system
4. Tilemap editor in browser
5. Tilemap texture caching
