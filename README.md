META v0.8.1 pre-release
====

Meta is free and fast open source HTML5 game engine for making cross platform games, supports Canvas and WebGL rendering and Dopple for native compilation.
Note: Engine is currently focusing on developing libraries and tool for developing tile based games. Different type of games are at lower priority.

Features
====

1. **Fast rendering** - Optimized renderer will call minimal required state changes and transforms to render entity.
2. **Memory friendly** - Optimized in all fronts to minimize garbage collection.
3. **Simple API** - Simple yet powerfull API lets you write easy to understand code.
4. **Fast development & support**
	1. Regular update schedule
	2. Fast bug fixing
	3. Request features you need that makes sense to be part of engine
5. **Model View Controller (MVC)** - Engine architecture follows MVC principles but optimized for game and application development.
5. **Entity** - Powerfull way to make any object that is part of screen topology:
	1. Pivot
	2. Anchor points
	3. Rotating
	4. Scaling
	5. Depth ordering
	6. Interactions - clicking, pushing, dragging and hovering
	7. Animations
	8. State managers
	9. Visibility
	10. Spritesheets/Texture atlas
	11. Children/parenting system
	12. Clipping
	13. LookAt
6. **Input** - Multiple ways to handle keyboard/mouse and touch events. Keybind system.
7. **Audio** - Supports automatic loading for supported audio formats and handles multiple simultaneous playing instances. Uses AudioAPI or fallback to legacy Audio element.
8. **Text**
	1. Canvas fonts
	2. Bitmap fonts
9. **Tweening**
10. **SVG** - Helper texture resoruce that helps to generate SVG textures for prototyping or other needs:
	1. FillRect
	2. Rect
	3. Lines
	4. Shape
	5. RoundRect
	6. Circle
	7. Arc
	8. Tiling
	9. Gradient
	10. Grid
11. **Camera** - Comes with utilities to handle different resolutions, scaling, fitting, zooming.
12. **Tilemaps** - Additionally supporting Tiled editor .tmx and .json formats.
13. **Arcade physics**
	1. Supports collisions for: AABB, Circle, Line and Point.
14. **Particles**
15. **Channel event system**
16. **Timer**
17. **Fullscreen**
18. **Store import** - Import plugins from store with just one code line.
19. **UI elements**
	1. Button
	2. Checkbox
	3. Progress Bar
20. Optional libraries:
	1. AStar pathfinding - [GitHub](https://github.com/InfiniteFoundation/metaAstar)
	2. Procedural generation - [GitHub](https://github.com/InfiniteFoundation/metaProcedural)

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
4. Tilemap texture caching
5. Tilemap editor in browser

* [Offical Website](http://meta2d.com/)
* [Examples](http://meta2d.com/examples)