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
};

function init() {
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

	animations['chars.0.idle.top'] = new rtge.Animation();
	animations['chars.0.idle.top'].steps = ['imgs/chars/0_idle_top.png'];
	animations['chars.0.idle.top'].durations = [600000];

	animations['chars.0.idle.right'] = new rtge.Animation();
	animations['chars.0.idle.right'].steps = ['imgs/chars/0_idle_right.png'];
	animations['chars.0.idle.right'].durations = [600000];

	animations['chars.0.idle.bot'] = new rtge.Animation();
	animations['chars.0.idle.bot'].steps = ['imgs/chars/0_idle_bot.png'];
	animations['chars.0.idle.bot'].durations = [600000];

	animations['chars.0.idle.left'] = new rtge.Animation();
	animations['chars.0.idle.left'].steps = ['imgs/chars/0_idle_left.png'];
	animations['chars.0.idle.left'].durations = [600000];

	animations['chars.0.walk.top'] = new rtge.Animation();
	animations['chars.0.walk.top'].steps = [
		'imgs/chars/0_walk_top_0.png',
		'imgs/chars/0_idle_top.png',
		'imgs/chars/0_walk_top_2.png',
	];
	animations['chars.0.walk.top'].durations = [100, 100, 100];

	animations['chars.0.walk.right'] = new rtge.Animation();
	animations['chars.0.walk.right'].steps = [
		'imgs/chars/0_walk_right_0.png',
		'imgs/chars/0_idle_right.png',
		'imgs/chars/0_walk_right_2.png',
	];
	animations['chars.0.walk.right'].durations = [100, 100, 100];

	animations['chars.0.walk.bot'] = new rtge.Animation();
	animations['chars.0.walk.bot'].steps = [
		'imgs/chars/0_walk_bot_0.png',
		'imgs/chars/0_idle_bot.png',
		'imgs/chars/0_walk_bot_2.png',
	];
	animations['chars.0.walk.bot'].durations = [100, 100, 100];

	animations['chars.0.walk.left'] = new rtge.Animation();
	animations['chars.0.walk.left'].steps = [
		'imgs/chars/0_walk_left_0.png',
		'imgs/chars/0_idle_left.png',
		'imgs/chars/0_walk_left_2.png',
	];
	animations['chars.0.walk.left'].durations = [100, 100, 100];

	var objects = [
		new buildingVacantLot.VacantLot(58*16, 10*16),
		new buildingVacantLot.VacantLot(73*16, 10*16),
		new buildingVacantLot.VacantLot(8*16, 22*16),
		new buildingVacantLot.VacantLot(23*16, 22*16),
		new buildingVacantLot.VacantLot(40*16, 22*16),
		new buildingVacantLot.VacantLot(58*16, 22*16),
		new buildingVacantLot.VacantLot(73*16, 22*16),
		new buildingVacantLot.VacantLot(8*16, 34*16),
		new buildingVacantLot.VacantLot(23*16, 34*16),
		new buildingTemple.Temple(58*16, 34*16),
		new buildingVacantLot.VacantLot(73*16, 34*16),
		new buildingVacantLot.VacantLot(8*16, 46*16),
		new buildingVacantLot.VacantLot(23*16, 46*16),
		new buildingVacantLot.VacantLot(58*16, 46*16),
		new buildingVacantLot.VacantLot(73*16, 46*16),
	];

	influence.dynasties.push(new Dynasty('Ramorre', 100000));
	godsEventNewDynasty();
	influence.dynasties.push(new Dynasty('Delvillajo', 1000000));
	godsEventNewDynasty();

	influence.currentCharacter = new Citizen('0', 'George', 0, 81*16, 48*16);
	objects.push(influence.currentCharacter);

	var firstNames = ['Robert', 'Bob', 'Jean', 'Sylvain', 'Joël', 'Florent', 'Marc'];
	for (var i = 0; i < firstNames.length; ++i) {
		var c = new Citizen('0', firstNames[i], 1, 81*16, 48*16, aiBehaviourVillagerTick);
		objects.push(c);
	}

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
		[
			{
				'name': 'tilemaps/map',
				'tilemap': influence.map
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
			'imgs/chars/0_walk_top_0.png',
			'imgs/chars/0_idle_top.png',
			'imgs/chars/0_walk_top_2.png',
			'imgs/chars/0_walk_right_0.png',
			'imgs/chars/0_idle_right.png',
			'imgs/chars/0_walk_right_2.png',
			'imgs/chars/0_walk_bot_0.png',
			'imgs/chars/0_idle_bot.png',
			'imgs/chars/0_walk_bot_2.png',
			'imgs/chars/0_walk_left_0.png',
			'imgs/chars/0_idle_left.png',
			'imgs/chars/0_walk_left_2.png',
			'imgs/chars/0_portrait.png',
			'imgs/icons/action/tiny_idle.png',
			'imgs/icons/action/tiny_move.png',
			'imgs/icons/action/tiny_meal.png',
			'imgs/icons/action/tiny_pray.png',
			'imgs/icons/action/tiny_construct.png',
			'imgs/icons/tiny_money.png',
		],
		{
			'worldClick': moveTo,
			'globalTick': globalTick,
		},
		camera
	);

	influence.maze = new pathfinder.Maze();
	mapMazeToRtgeMaze();

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

function getMapLayerData(layerName) {
	for (var layerIndex = 0; layerIndex < influence.map.layers.length; ++layerIndex) {
		if (influence.map.layers[layerIndex].name == layerName) {
			return influence.map.layers[layerIndex].data;
		}
	}
	return null;
}
