var influence = {
	selected: null,
	currentCharacter: null,
	maze: null,
	dynasties: [],
	characters: [],
	characterAction: {}, // Filled in influence-actions.js
	basicBuildings: {},  // Filled in influence-buildings.js
	productibles: {},    // Filled in influence-items.js
};

function init() {
	var animations = {};

	var animBuildingCase = new rtge.Animation();
	animBuildingCase.steps = ['imgs/case.jpg'];
	animBuildingCase.durations = [600000];
	animations['building.case'] = animBuildingCase;

	animations['building.vacant'] = new rtge.Animation();
	animations['building.vacant'].steps = ['imgs/vacantlot.jpg'];
	animations['building.vacant'].durations = [600000];

	animations['building.baker'] = new rtge.Animation();
	animations['building.baker'].steps = ['imgs/baker.jpg'];
	animations['building.baker'].durations = [600000];

	animations['building.farm'] = new rtge.Animation();
	animations['building.farm'].steps = ['imgs/farm.jpg'];
	animations['building.farm'].durations = [600000];

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
		new VacantLot(58*16, 10*16),
		new VacantLot(73*16, 10*16),
		new VacantLot(8*16, 22*16),
		new VacantLot(23*16, 22*16),
		new VacantLot(40*16, 22*16),
		new VacantLot(58*16, 22*16),
		new VacantLot(73*16, 22*16),
		new VacantLot(8*16, 34*16),
		new VacantLot(23*16, 34*16),
		new VacantLot(58*16, 34*16),
		new VacantLot(73*16, 34*16),
		new VacantLot(8*16, 46*16),
		new VacantLot(23*16, 46*16),
		new VacantLot(58*16, 46*16),
		new VacantLot(73*16, 46*16),
	];

	influence.dynasties.push(new Dynasty('Ramorre', 8000));

	influence.currentCharacter = new Citizen('0', 'George', 0, 81*16, 48*16);
	guiShowCharacter(influence.currentCharacter);
	guiShowDynasty(influence.dynasties[influence.currentCharacter.dynasty]);
	objects.push(influence.currentCharacter);

	rtge.init(
		'view',
		{
			'terrain': 'imgs/map.jpg',
			'objects': objects
		},
		animations,
		[],
		[
			'imgs/map.jpg',
			'imgs/case.jpg',
			'imgs/vacantlot.jpg',
			'imgs/baker.jpg',
			'imgs/farm.jpg',
			'imgs/icons/action/goto.png',
			'imgs/icons/action/buy.png',
			'imgs/icons/action/manage.png',
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
			'imgs/icons/action/tiny_construct.png',
			'imgs/icons/tiny_money.png',
		],
		{
			'worldClick': unselect
		}
	);

	influence.maze = new pathfinder.Maze();
	influence.maze.waypoints = [
		new pathfinder.Waypoint(58*16, 10*16),
		new pathfinder.Waypoint(73*16, 10*16),
		new pathfinder.Waypoint(48*16, 12*16),
		new pathfinder.Waypoint(58*16, 12*16),
		new pathfinder.Waypoint(73*16, 12*16),
		new pathfinder.Waypoint(81*16, 12*16),
		new pathfinder.Waypoint(8*16, 22*16),
		new pathfinder.Waypoint(23*16, 22*16),
		new pathfinder.Waypoint(40*16, 22*16),
		new pathfinder.Waypoint(58*16, 22*16),
		new pathfinder.Waypoint(73*16, 22*16),
		new pathfinder.Waypoint(8*16, 24*16),
		new pathfinder.Waypoint(23*16, 24*16),
		new pathfinder.Waypoint(33*16, 24*16),
		new pathfinder.Waypoint(40*16, 24*16),
		new pathfinder.Waypoint(48*16, 24*16),
		new pathfinder.Waypoint(58*16, 24*16),
		new pathfinder.Waypoint(73*16, 24*16),
		new pathfinder.Waypoint(81*16, 24*16),
		new pathfinder.Waypoint(8*16, 34*16),
		new pathfinder.Waypoint(23*16, 34*16),
		new pathfinder.Waypoint(58*16, 34*16),
		new pathfinder.Waypoint(73*16, 34*16),
		new pathfinder.Waypoint(8*16, 36*16),
		new pathfinder.Waypoint(23*16, 36*16),
		new pathfinder.Waypoint(33*16, 36*16),
		new pathfinder.Waypoint(48*16, 36*16),
		new pathfinder.Waypoint(58*16, 36*16),
		new pathfinder.Waypoint(73*16, 36*16),
		new pathfinder.Waypoint(81*16, 36*16),
		new pathfinder.Waypoint(8*16, 46*16),
		new pathfinder.Waypoint(23*16, 46*16),
		new pathfinder.Waypoint(58*16, 46*16),
		new pathfinder.Waypoint(73*16, 46*16),
		new pathfinder.Waypoint(8*16, 48*16),
		new pathfinder.Waypoint(23*16, 48*16),
		new pathfinder.Waypoint(33*16, 48*16),
		new pathfinder.Waypoint(48*16, 48*16),
		new pathfinder.Waypoint(58*16, 48*16),
		new pathfinder.Waypoint(73*16, 48*16),
		new pathfinder.Waypoint(81*16, 48*16),
	];
	influence.maze.waypoints[0].addNeighbor(influence.maze.waypoints[3]);
	influence.maze.waypoints[1].addNeighbor(influence.maze.waypoints[4]);
	influence.maze.waypoints[2].addNeighbor(influence.maze.waypoints[3]);
	influence.maze.waypoints[2].addNeighbor(influence.maze.waypoints[15]);
	influence.maze.waypoints[3].addNeighbor(influence.maze.waypoints[0]);
	influence.maze.waypoints[3].addNeighbor(influence.maze.waypoints[2]);
	influence.maze.waypoints[3].addNeighbor(influence.maze.waypoints[4]);
	influence.maze.waypoints[4].addNeighbor(influence.maze.waypoints[1]);
	influence.maze.waypoints[4].addNeighbor(influence.maze.waypoints[3]);
	influence.maze.waypoints[4].addNeighbor(influence.maze.waypoints[5]);
	influence.maze.waypoints[5].addNeighbor(influence.maze.waypoints[4]);
	influence.maze.waypoints[5].addNeighbor(influence.maze.waypoints[18]);
	influence.maze.waypoints[6].addNeighbor(influence.maze.waypoints[11]);
	influence.maze.waypoints[7].addNeighbor(influence.maze.waypoints[12]);
	influence.maze.waypoints[8].addNeighbor(influence.maze.waypoints[14]);
	influence.maze.waypoints[9].addNeighbor(influence.maze.waypoints[16]);
	influence.maze.waypoints[10].addNeighbor(influence.maze.waypoints[17]);
	influence.maze.waypoints[11].addNeighbor(influence.maze.waypoints[6]);
	influence.maze.waypoints[11].addNeighbor(influence.maze.waypoints[12]);
	influence.maze.waypoints[12].addNeighbor(influence.maze.waypoints[7]);
	influence.maze.waypoints[12].addNeighbor(influence.maze.waypoints[11]);
	influence.maze.waypoints[12].addNeighbor(influence.maze.waypoints[13]);
	influence.maze.waypoints[13].addNeighbor(influence.maze.waypoints[12]);
	influence.maze.waypoints[13].addNeighbor(influence.maze.waypoints[14]);
	influence.maze.waypoints[13].addNeighbor(influence.maze.waypoints[25]);
	influence.maze.waypoints[14].addNeighbor(influence.maze.waypoints[8]);
	influence.maze.waypoints[14].addNeighbor(influence.maze.waypoints[13]);
	influence.maze.waypoints[14].addNeighbor(influence.maze.waypoints[15]);
	influence.maze.waypoints[15].addNeighbor(influence.maze.waypoints[2]);
	influence.maze.waypoints[15].addNeighbor(influence.maze.waypoints[14]);
	influence.maze.waypoints[15].addNeighbor(influence.maze.waypoints[16]);
	influence.maze.waypoints[16].addNeighbor(influence.maze.waypoints[9]);
	influence.maze.waypoints[16].addNeighbor(influence.maze.waypoints[15]);
	influence.maze.waypoints[16].addNeighbor(influence.maze.waypoints[17]);
	influence.maze.waypoints[17].addNeighbor(influence.maze.waypoints[10]);
	influence.maze.waypoints[17].addNeighbor(influence.maze.waypoints[16]);
	influence.maze.waypoints[17].addNeighbor(influence.maze.waypoints[18]);
	influence.maze.waypoints[18].addNeighbor(influence.maze.waypoints[5]);
	influence.maze.waypoints[18].addNeighbor(influence.maze.waypoints[17]);
	influence.maze.waypoints[18].addNeighbor(influence.maze.waypoints[29]);
	influence.maze.waypoints[19].addNeighbor(influence.maze.waypoints[23]);
	influence.maze.waypoints[20].addNeighbor(influence.maze.waypoints[24]);
	influence.maze.waypoints[21].addNeighbor(influence.maze.waypoints[27]);
	influence.maze.waypoints[22].addNeighbor(influence.maze.waypoints[28]);
	influence.maze.waypoints[23].addNeighbor(influence.maze.waypoints[19]);
	influence.maze.waypoints[23].addNeighbor(influence.maze.waypoints[24]);
	influence.maze.waypoints[24].addNeighbor(influence.maze.waypoints[20]);
	influence.maze.waypoints[24].addNeighbor(influence.maze.waypoints[23]);
	influence.maze.waypoints[24].addNeighbor(influence.maze.waypoints[25]);
	influence.maze.waypoints[25].addNeighbor(influence.maze.waypoints[13]);
	influence.maze.waypoints[25].addNeighbor(influence.maze.waypoints[24]);
	influence.maze.waypoints[25].addNeighbor(influence.maze.waypoints[26]);
	influence.maze.waypoints[25].addNeighbor(influence.maze.waypoints[36]);
	influence.maze.waypoints[26].addNeighbor(influence.maze.waypoints[15]);
	influence.maze.waypoints[26].addNeighbor(influence.maze.waypoints[25]);
	influence.maze.waypoints[26].addNeighbor(influence.maze.waypoints[27]);
	influence.maze.waypoints[26].addNeighbor(influence.maze.waypoints[37]);
	influence.maze.waypoints[27].addNeighbor(influence.maze.waypoints[21]);
	influence.maze.waypoints[27].addNeighbor(influence.maze.waypoints[26]);
	influence.maze.waypoints[27].addNeighbor(influence.maze.waypoints[28]);
	influence.maze.waypoints[28].addNeighbor(influence.maze.waypoints[22]);
	influence.maze.waypoints[28].addNeighbor(influence.maze.waypoints[27]);
	influence.maze.waypoints[28].addNeighbor(influence.maze.waypoints[29]);
	influence.maze.waypoints[29].addNeighbor(influence.maze.waypoints[18]);
	influence.maze.waypoints[29].addNeighbor(influence.maze.waypoints[28]);
	influence.maze.waypoints[29].addNeighbor(influence.maze.waypoints[40]);
	influence.maze.waypoints[30].addNeighbor(influence.maze.waypoints[34]);
	influence.maze.waypoints[31].addNeighbor(influence.maze.waypoints[35]);
	influence.maze.waypoints[32].addNeighbor(influence.maze.waypoints[38]);
	influence.maze.waypoints[33].addNeighbor(influence.maze.waypoints[39]);
	influence.maze.waypoints[34].addNeighbor(influence.maze.waypoints[30]);
	influence.maze.waypoints[34].addNeighbor(influence.maze.waypoints[35]);
	influence.maze.waypoints[35].addNeighbor(influence.maze.waypoints[31]);
	influence.maze.waypoints[35].addNeighbor(influence.maze.waypoints[34]);
	influence.maze.waypoints[35].addNeighbor(influence.maze.waypoints[36]);
	influence.maze.waypoints[36].addNeighbor(influence.maze.waypoints[25]);
	influence.maze.waypoints[36].addNeighbor(influence.maze.waypoints[35]);
	influence.maze.waypoints[36].addNeighbor(influence.maze.waypoints[37]);
	influence.maze.waypoints[37].addNeighbor(influence.maze.waypoints[26]);
	influence.maze.waypoints[37].addNeighbor(influence.maze.waypoints[36]);
	influence.maze.waypoints[37].addNeighbor(influence.maze.waypoints[38]);
	influence.maze.waypoints[38].addNeighbor(influence.maze.waypoints[32]);
	influence.maze.waypoints[38].addNeighbor(influence.maze.waypoints[37]);
	influence.maze.waypoints[38].addNeighbor(influence.maze.waypoints[39]);
	influence.maze.waypoints[39].addNeighbor(influence.maze.waypoints[33]);
	influence.maze.waypoints[39].addNeighbor(influence.maze.waypoints[38]);
	influence.maze.waypoints[39].addNeighbor(influence.maze.waypoints[40]);
	influence.maze.waypoints[40].addNeighbor(influence.maze.waypoints[29]);
	influence.maze.waypoints[40].addNeighbor(influence.maze.waypoints[39]);

	guiFillFormBuild();
}

function getMovingObjectsAt(pos) {
	var i;
	var res = [];
	for (i = 0; i < rtge.state.objects.length; ++i) {
		var o = rtge.state.objects[i];
		if (o instanceof MovingObject && o.x == pos.x && o.y == pos.y) {
			res.push(o);
		}
	}
	return res;
}

function select(o) {
	guiShowSelection(o, influence.currentCharacter);

	influence.selected = o;
}

function unselect() {
	influence.selected = null;
	guiHideSelection();
}

function center(o) {
	rtge.camera.x = o.x - rtge.canvas.width / 2;
	rtge.camera.y = o.y - rtge.canvas.height / 2;
}
