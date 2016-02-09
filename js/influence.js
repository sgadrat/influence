var influence = {
	selected: null,
	currentCharacter: null,
	maze: null,
	dynasties: [],
	characters: [],
	guiVariables: {},
	gameTime: 0,
	msPerDay: 5000,
	baseDate: Date.UTC(1700, 0, 1),
	characterAction: {}, // Filled in influence-actions.js
	basicBuildings: {},  // Filled in buildings/*.js
	productibles: {},    // Filled in influence-items.js
	gods: [],            // Filled in influence-gods.js
	map: {},             // Filled in influence-map.js
	aiBehaviours: {},    // Filled in influence-ai.js
	aiInit: [],          // Filled in influence-ai.js
	dialogs: {},         // Filled in influence-dialogs.js
};

function init() {
	var graphics = [
		{
			'name': 'tilemaps/map',
			'data': {
				'type': 'tilemap',
				'tilemap': influence.map
			}
		},
		'imgs/case.jpg',
		'imgs/vacantlot.jpg',
		'imgs/baker.jpg',
		'imgs/farm.jpg',
		'imgs/inn.jpg',
		'imgs/clearinghouse.jpg',
		'imgs/temple.jpg',
		'imgs/icons/action/buy.png',
		'imgs/icons/action/manage.png',
		'imgs/icons/action/meal.png',
		'imgs/icons/action/auction.png',
		'imgs/icons/action/pray.png',
		'imgs/icons/buildings/baker.png',
		'imgs/icons/buildings/clearinghouse.png',
		'imgs/icons/buildings/farm.png',
		'imgs/icons/buildings/inn.png',
		'imgs/icons/action/tiny_idle.png',
		'imgs/icons/action/tiny_move.png',
		'imgs/icons/action/tiny_meal.png',
		'imgs/icons/action/tiny_pray.png',
		'imgs/icons/action/tiny_construct.png',
		'imgs/icons/tiny_money.png',
	];

	var animations = {};

	var animBuildingCase = new rtge.Animation();
	animBuildingCase.steps = ['imgs/case.jpg'];
	animBuildingCase.durations = [600000];
	animations['building.case'] = animBuildingCase;

	animations['building.temple'] = new rtge.Animation();
	animations['building.temple'].steps = ['imgs/temple.jpg'];
	animations['building.temple'].durations = [600000];

	animations['building.vacant'] = new rtge.Animation();
	animations['building.vacant'].steps = ['imgs/vacantlot.jpg'];
	animations['building.vacant'].durations = [600000];

	animations['building.baker'] = new rtge.Animation();
	animations['building.baker'].steps = ['imgs/baker.jpg'];
	animations['building.baker'].durations = [600000];

	animations['building.farm'] = new rtge.Animation();
	animations['building.farm'].steps = ['imgs/farm.jpg'];
	animations['building.farm'].durations = [600000];

	animations['building.clearinghouse'] = new rtge.Animation();
	animations['building.clearinghouse'].steps = ['imgs/clearinghouse.jpg'];
	animations['building.clearinghouse'].durations = [600000];

	animations['building.inn'] = new rtge.Animation();
	animations['building.inn'].steps = ['imgs/inn.jpg'];
	animations['building.inn'].durations = [600000];

	influence.maze = new pathfinder.Maze();
	mapMazeToRtgeMaze();

	var objects = getBuildingsFromMap();

	influence.dynasties.push(new Dynasty('Ramorre', 100000));
	godsEventNewDynasty();
	influence.dynasties.push(new Dynasty('Delvillajo', 1000000));
	godsEventNewDynasty();

	var spawn = getRandomWaypoint();
	influence.currentCharacter = new Citizen(
		{
			gender: 'male',
			body: 0,
			clothes: 0,
			hair: 0
		},
		graphics, animations, 'George', 0, spawn.x, spawn.y
	);
	influence.currentCharacter.inventory.addChangeListener({
		inventoryChanged: function() {
			guiEventCurrentInventoryChanged();
		}
	});
	objects.push(influence.currentCharacter);

	addNpcsFromMap(objects, graphics, animations);

	var camera = new rtge.Camera();
	camera.tick = function(timeDiff) {
		this.x = influence.currentCharacter.x - rtge.canvas.width / 2;
		this.y = influence.currentCharacter.y - rtge.canvas.height / 2;
	};

	rtge.init(
		'view',
		{
			'terrain': 'tilemaps/map',
			'objects': objects
		},
		animations,
		[],
		graphics,
		{
			'worldClick': moveTo,
			'globalTick': globalTick,
		},
		camera
	);

	for (var aiInitFnIndex = 0; aiInitFnIndex < influence.aiInit.length; ++aiInitFnIndex) {
		influence.aiInit[aiInitFnIndex]();
	}

	guiEventReinit();
}

function select(o) {
	influence.selected = o;
	if (isBuilding(o)) {
		o.onPlayerEnters();
	}
}

function unselect() {
	influence.selected = null;
}

function moveTo(x, y) {
	// Select destination waypoint
	var destWaypoint = findNearest(x, y, influence.maze.waypoints);
	if (destWaypoint === null) {
		return;
	}

	moveCharacter(influence.currentCharacter, destWaypoint, false);
}

function findNearest(x, y, positions) {
	var minDist = null;
	var res = null;
	for (var i = 0; i < positions.length; ++i) {
		var dist = Math.abs(x - positions[i].x) + Math.abs(y - positions[i].y);
		if (minDist === null || dist < minDist) {
			res = positions[i];
			minDist = dist;
		}
	}
	return res;
}

function globalTick(timeDiff) {
	var previousDay = Math.floor(influence.gameTime / influence.msPerDay);
	influence.gameTime += timeDiff;
	var currentDay = Math.floor(influence.gameTime / influence.msPerDay);

	if (previousDay != currentDay) {
		godsUpdate();
		guiEventDateChanged();
	}
}

function getGameDate() {
	var speedFactor = (3600*1000*24) / influence.msPerDay;
	var rescaledGameTime = influence.gameTime * speedFactor;
	return new Date(influence.baseDate + rescaledGameTime);
}

function getBuildingsList() {
	var buildings = [];
	for (var i = 0; i < rtge.state.objects.length; ++i) {
		if (isBuilding(rtge.state.objects[i])) {
			buildings.push(rtge.state.objects[i]);
		}
	}
	return buildings;
}

function getBuildingsFromMap() {
	var res = [];

	// Get the buildings info from the tilemap
	var mapBuildings = getMapLayerData('buildings');
	if (mapBuildings === null) {
		alert('getBuildingsFromMap: no building info in map');
		return;
	}

	// Create buildings as indicated
	var creators = [buildingTemple.Temple, buildingVacantLot.VacantLot];
	for (var dataIndex = 0; dataIndex < mapBuildings.length; ++dataIndex) {
		var buildingNum = mapBuildings[dataIndex];
		if (buildingNum == 0 || buildingNum > creators.length) {
			continue;
		}

		var x = dataIndex % influence.map.width;
		var y = Math.floor(dataIndex / influence.map.width);
		var worldX = x * 16;
		var worldY = y * 16;
		res.push(new creators[buildingNum-1](worldX, worldY));
	}

	return res;
}

function mapMazeToRtgeMaze() {
	// Get the maze from the tilemap
	var maze = getMapLayerData('maze');
	if (maze === null) {
		alert('mapMazeToRtgeMaze: no pathfinding info in map');
		return;
	}

	// Create waypoints on intersections and dead-ends
	var x, y;
	influence.maze.waypoints = [];
	for (var dataIndex = 0; dataIndex < maze.length; ++dataIndex) {
		x = dataIndex % influence.map.width;
		y = Math.floor(dataIndex / influence.map.width);

		if (isPassable(maze, x, y)) {
			var leftPassable = isPassable(maze, x-1, y);
			var rightPassable = isPassable(maze, x+1, y);
			var upPassable = isPassable(maze, x, y-1);
			var botPassable = isPassable(maze, x, y+1);
			if (
				(leftPassable && !rightPassable) ||
				(rightPassable && !leftPassable) ||
				(upPassable && !botPassable) ||
				(botPassable && !upPassable) ||
				(leftPassable && rightPassable && upPassable && botPassable)
			)
			{
				influence.maze.waypoints.push(new pathfinder.Waypoint(x*16, y*16));
			}
		}
	}

	// Link connected waypoints
	for (var wpIndex = 0; wpIndex < influence.maze.waypoints.length; ++wpIndex) {
		var wp = influence.maze.waypoints[wpIndex];
		x = wp.x / 16;
		y = wp.y / 16;

		var directions = [{x:1, y:0}, {x:-1, y:0}, {x:0, y:1}, {x:0, y:-1}];
		for (var directionIndex = 0; directionIndex < directions.length; ++directionIndex) {
			var direction = directions[directionIndex];
			var expandedX = x + direction.x;
			var expandedY = y + direction.y;
			while (
				isPassable(maze, expandedX, expandedY) &&
				getWaypoint(expandedX, expandedY) === null
			)
			{
				expandedX = expandedX + direction.x;
				expandedY = expandedY + direction.y;
			}
			var neightbor = getWaypoint(expandedX, expandedY);

			if (neightbor !== null) {
				wp.addNeighbor(neightbor);
			}
		}
	}
}

function isPassable(maze, x, y) {
	// Avoid out of map tiles
	if (
		x < 0 ||
		x > influence.map.width ||
		y < 0 ||
		y > influence.map.height
	)
	{
		return false;
	}

	var dataIndex = y * influence.map.width + x;
	return maze[dataIndex] == 1;
}

function getWaypoint(x, y) {
	var wpX = x * 16;
	var wpY = y * 16;
	var waypoints = influence.maze.waypoints;
	for (var wpIndex = 0; wpIndex < waypoints.length; ++wpIndex) {
		var wp = waypoints[wpIndex];
		if (wp.x == wpX && wp.y == wpY) {
			return wp;
		}
	}
	return null;
}

function getRandomWaypoint() {
	var selected = Math.floor(Math.random() * influence.maze.waypoints.length);
	return influence.maze.waypoints[selected];
}

function getMapLayer(layerName) {
	for (var layerIndex = 0; layerIndex < influence.map.layers.length; ++layerIndex) {
		if (influence.map.layers[layerIndex].name == layerName) {
			return influence.map.layers[layerIndex];
		}
	}
	return null;
}

function getMapLayerData(layerName) {
	var layer = getMapLayer(layerName);
	if (layer === null) {
		return null;
	}
	return layer.data;
}

function addNpcsFromMap(collection, graphics, animations) {
	var layer = getMapLayer('objects');
	if (layer === null) {
		return;
	}
	for (var objectIndex = 0; objectIndex < layer.objects.length; ++objectIndex) {
		var object = layer.objects[objectIndex];

		var firstName = object.properties.firstName;
		var dynasty = getDynastyIndexFromName(object.properties.dynasty);
		if (dynasty >= influence.dynasties.length) {
			alert('Unknown dynasty "'+ object.properties.dynasty + '" in map data');
			continue;
		}
		var behaviour = getObjectFromMapObjectProperty(
			object, 'behaviour', influence.aiBehaviours
		);
		var dialog = getObjectFromMapObjectProperty(
			object, 'dialog', influence.dialogs
		);

		var npc = new Citizen(
			{
				gender: getDefault(object.properties, 'gender', 'male'),
				body: getDefault(object.properties, 'body', 0),
				clothes: getDefault(object.properties, 'clothes', 0),
				hair: getDefault(object.properties, 'hair', 0)
			},
			graphics, animations, firstName, dynasty, object.x, object.y, behaviour, dialog
		);
		collection.push(npc);
	}
}

function getDefault(object, key, defaultValue) {
	if (typeof object[key] == 'undefined') {
		return defaultValue;
	}
	return object[key];
}

function getObjectFromMapObjectProperty(object, property, collection) {
	var res = null;
	if (typeof object.properties[property] != 'undefined') {
		res = collection[object.properties[property]];
		if (typeof res == 'undefined') {
			alert('Unknown property "'+ object.properties[property] +'" in map data');
			res = null;
		}
	}
	return res;
}

function getDynastyIndexFromName(name) {
	var dynastyIndex;
	for (dynastyIndex = 0; dynastyIndex < influence.dynasties.length; ++dynastyIndex) {
		if (influence.dynasties[dynastyIndex].name == name) {
			break;
		}
	}
	return dynastyIndex;
}
