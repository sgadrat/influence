var influance = {
	selected: null,
	currentCharacter: null,
	maze: null,
};

function Building(x, y) {
	rtge.DynObject.call(this);
	this.x = x;
	this.y = y;

	this.actions = [
		'goto',
	];
}

function Case(x, y) {
	Building.call(this, x, y);
	this.animation = 'building.case';

	this.portrait = 'imgs/case.jpg';

	this.click = function(x, y) {
		select(this);
	}
}

function MovingObject(x, y) {
	rtge.DynObject.call(this);
	this.x = x;
	this.y = y;
	this.anchorY = 11;
	this.animation = 'chars.0.idle.bot';

	this.path = [];
	this.movingTime = 0;
	this.origin = null;

	this.onMove = null;
	this.onStopMove = null;

	this.followPath = function(path) {
		this.path = path;
		this.movingTime = 0;
		this.origin = {
			x: this.x,
			y: this.y
		};

		this.tick = function(timeElapsed) {
			this.movingTime += timeElapsed;
			var distance = Math.sqrt(Math.pow(this.path[0].x - this.origin.x, 2) + Math.pow(this.path[0].y - this.origin.y, 2));
			var timeTarget = distance * 10;
			var distanceX = this.path[0].x - this.origin.x;
			var distanceY = this.path[0].y - this.origin.y;
			var timeRatio = Math.min(1, this.movingTime / timeTarget);
			this.x = this.origin.x + distanceX * timeRatio;
			this.y = this.origin.y + distanceY * timeRatio;

			if (this.x == this.path[0].x && this.y == this.path[0].y) {
				this.origin = {
					x: this.path[0].x,
					y: this.path[0].y
				};
				this.path.splice(0, 1);
				if (this.path.length == 0) {
					this.tick = null;
					if (this.onStopMove != null) {
						this.onStopMove();
					}
					return;
				}
				this.movingTime = 0;
				if (this.onMove != null) {
					this.onMove(this.origin, this.path[0]);
				}
			}
		}
	}
}

function Citizen(type, x, y) {
	MovingObject.call(this, x, y);
	this.animTop = 'chars.'+ type +'.walk.top';
	this.animRight = 'chars.'+ type +'.walk.right';
	this.animBot = 'chars.'+ type +'.walk.bot';
	this.animLeft = 'chars.'+ type +'.walk.left';
	this.idleTop = 'chars.'+ type +'.idle.top';
	this.idleRight = 'chars.'+ type +'.idle.right';
	this.idleBot = 'chars.'+ type +'.idle.bot';
	this.idleLeft = 'chars.'+ type +'.idle.left';

	this.lastDir = 'bot';
	this.onMove = function(origin, dest) {
		var diffX = dest.x - origin.x;
		var diffY = dest.y - origin.y;
		if (diffX > 0) {
			this.animation = this.animRight;
			this.lastDir = 'right';
		}else if (diffX < 0) {
			this.animation = this.animLeft;
			this.lastDir = 'left';
		}else if (diffY < 0) {
			this.animation = this.animTop;
			this.lastDir = 'top';
		}else if (diffY > 0) {
			this.animation = this.animBot;
			this.lastDir = 'bot';
		}
	};
	this.onStopMove = function() {
		if (this.lastDir == 'top') {
			this.animation = this.idleTop;
		}else if (this.lastDir == 'right') {
			this.animation = this.idleRight;
		}else if (this.lastDir == 'bot') {
			this.animation = this.idleBot;
		}else if (this.lastDir == 'left') {
			this.animation = this.idleLeft;
		}
	}
}

function init() {
	var animations = {};

	var animBuildingCase = new rtge.Animation();
	animBuildingCase.steps = ['imgs/case.jpg'];
	animBuildingCase.durations = [600000];
	animations['building.case'] = animBuildingCase;

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
	animations['chars.0.walk.top'].durations = [200, 200, 200];

	animations['chars.0.walk.right'] = new rtge.Animation();
	animations['chars.0.walk.right'].steps = [
		'imgs/chars/0_walk_right_0.png',
		'imgs/chars/0_idle_right.png',
		'imgs/chars/0_walk_right_2.png',
	];
	animations['chars.0.walk.right'].durations = [200, 200, 200];

	animations['chars.0.walk.bot'] = new rtge.Animation();
	animations['chars.0.walk.bot'].steps = [
		'imgs/chars/0_walk_bot_0.png',
		'imgs/chars/0_idle_bot.png',
		'imgs/chars/0_walk_bot_2.png',
	];
	animations['chars.0.walk.bot'].durations = [200, 200, 200];

	animations['chars.0.walk.left'] = new rtge.Animation();
	animations['chars.0.walk.left'].steps = [
		'imgs/chars/0_walk_left_0.png',
		'imgs/chars/0_idle_left.png',
		'imgs/chars/0_walk_left_2.png',
	];
	animations['chars.0.walk.left'].durations = [200, 200, 200];

	var objects = [
		new Case(2*16, 15*16),
		new Case(17*16, 39*16),
	];

	influance.currentCharacter = new Citizen('0', 81*16, 48*16);
	objects.push(influance.currentCharacter);

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
			'imgs/icons/action/goto.png',
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
		],
		{
			'worldClick': unselect
		}
	);

	influance.maze = new pathfinder.Maze();
	influance.maze.waypoints = [
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
	influance.maze.waypoints[0].addNeighbor(influance.maze.waypoints[3]);
	influance.maze.waypoints[1].addNeighbor(influance.maze.waypoints[4]);
	influance.maze.waypoints[2].addNeighbor(influance.maze.waypoints[3]);
	influance.maze.waypoints[2].addNeighbor(influance.maze.waypoints[15]);
	influance.maze.waypoints[3].addNeighbor(influance.maze.waypoints[0]);
	influance.maze.waypoints[3].addNeighbor(influance.maze.waypoints[2]);
	influance.maze.waypoints[3].addNeighbor(influance.maze.waypoints[4]);
	influance.maze.waypoints[4].addNeighbor(influance.maze.waypoints[1]);
	influance.maze.waypoints[4].addNeighbor(influance.maze.waypoints[3]);
	influance.maze.waypoints[4].addNeighbor(influance.maze.waypoints[5]);
	influance.maze.waypoints[5].addNeighbor(influance.maze.waypoints[4]);
	influance.maze.waypoints[5].addNeighbor(influance.maze.waypoints[18]);
	influance.maze.waypoints[6].addNeighbor(influance.maze.waypoints[11]);
	influance.maze.waypoints[7].addNeighbor(influance.maze.waypoints[12]);
	influance.maze.waypoints[8].addNeighbor(influance.maze.waypoints[14]);
	influance.maze.waypoints[9].addNeighbor(influance.maze.waypoints[16]);
	influance.maze.waypoints[10].addNeighbor(influance.maze.waypoints[17]);
	influance.maze.waypoints[11].addNeighbor(influance.maze.waypoints[6]);
	influance.maze.waypoints[11].addNeighbor(influance.maze.waypoints[12]);
	influance.maze.waypoints[12].addNeighbor(influance.maze.waypoints[7]);
	influance.maze.waypoints[12].addNeighbor(influance.maze.waypoints[11]);
	influance.maze.waypoints[12].addNeighbor(influance.maze.waypoints[13]);
	influance.maze.waypoints[13].addNeighbor(influance.maze.waypoints[12]);
	influance.maze.waypoints[13].addNeighbor(influance.maze.waypoints[14]);
	influance.maze.waypoints[13].addNeighbor(influance.maze.waypoints[25]);
	influance.maze.waypoints[14].addNeighbor(influance.maze.waypoints[8]);
	influance.maze.waypoints[14].addNeighbor(influance.maze.waypoints[13]);
	influance.maze.waypoints[14].addNeighbor(influance.maze.waypoints[15]);
	influance.maze.waypoints[15].addNeighbor(influance.maze.waypoints[2]);
	influance.maze.waypoints[15].addNeighbor(influance.maze.waypoints[14]);
	influance.maze.waypoints[15].addNeighbor(influance.maze.waypoints[16]);
	influance.maze.waypoints[16].addNeighbor(influance.maze.waypoints[9]);
	influance.maze.waypoints[16].addNeighbor(influance.maze.waypoints[15]);
	influance.maze.waypoints[16].addNeighbor(influance.maze.waypoints[17]);
	influance.maze.waypoints[17].addNeighbor(influance.maze.waypoints[10]);
	influance.maze.waypoints[17].addNeighbor(influance.maze.waypoints[16]);
	influance.maze.waypoints[17].addNeighbor(influance.maze.waypoints[18]);
	influance.maze.waypoints[19].addNeighbor(influance.maze.waypoints[23]);
	influance.maze.waypoints[20].addNeighbor(influance.maze.waypoints[24]);
	influance.maze.waypoints[21].addNeighbor(influance.maze.waypoints[27]);
	influance.maze.waypoints[22].addNeighbor(influance.maze.waypoints[28]);
	influance.maze.waypoints[23].addNeighbor(influance.maze.waypoints[19]);
	influance.maze.waypoints[23].addNeighbor(influance.maze.waypoints[24]);
	influance.maze.waypoints[24].addNeighbor(influance.maze.waypoints[20]);
	influance.maze.waypoints[24].addNeighbor(influance.maze.waypoints[23]);
	influance.maze.waypoints[24].addNeighbor(influance.maze.waypoints[25]);
	influance.maze.waypoints[25].addNeighbor(influance.maze.waypoints[13]);
	influance.maze.waypoints[25].addNeighbor(influance.maze.waypoints[24]);
	influance.maze.waypoints[25].addNeighbor(influance.maze.waypoints[26]);
	influance.maze.waypoints[25].addNeighbor(influance.maze.waypoints[36]);
	influance.maze.waypoints[26].addNeighbor(influance.maze.waypoints[15]);
	influance.maze.waypoints[26].addNeighbor(influance.maze.waypoints[25]);
	influance.maze.waypoints[26].addNeighbor(influance.maze.waypoints[27]);
	influance.maze.waypoints[26].addNeighbor(influance.maze.waypoints[37]);
	influance.maze.waypoints[27].addNeighbor(influance.maze.waypoints[21]);
	influance.maze.waypoints[27].addNeighbor(influance.maze.waypoints[26]);
	influance.maze.waypoints[27].addNeighbor(influance.maze.waypoints[28]);
	influance.maze.waypoints[28].addNeighbor(influance.maze.waypoints[22]);
	influance.maze.waypoints[28].addNeighbor(influance.maze.waypoints[27]);
	influance.maze.waypoints[28].addNeighbor(influance.maze.waypoints[29]);
	influance.maze.waypoints[29].addNeighbor(influance.maze.waypoints[18]);
	influance.maze.waypoints[29].addNeighbor(influance.maze.waypoints[28]);
	influance.maze.waypoints[29].addNeighbor(influance.maze.waypoints[40]);
	influance.maze.waypoints[30].addNeighbor(influance.maze.waypoints[34]);
	influance.maze.waypoints[31].addNeighbor(influance.maze.waypoints[35]);
	influance.maze.waypoints[32].addNeighbor(influance.maze.waypoints[38]);
	influance.maze.waypoints[33].addNeighbor(influance.maze.waypoints[39]);
	influance.maze.waypoints[34].addNeighbor(influance.maze.waypoints[30]);
	influance.maze.waypoints[34].addNeighbor(influance.maze.waypoints[35]);
	influance.maze.waypoints[35].addNeighbor(influance.maze.waypoints[31]);
	influance.maze.waypoints[35].addNeighbor(influance.maze.waypoints[34]);
	influance.maze.waypoints[35].addNeighbor(influance.maze.waypoints[36]);
	influance.maze.waypoints[36].addNeighbor(influance.maze.waypoints[25]);
	influance.maze.waypoints[36].addNeighbor(influance.maze.waypoints[35]);
	influance.maze.waypoints[36].addNeighbor(influance.maze.waypoints[37]);
	influance.maze.waypoints[37].addNeighbor(influance.maze.waypoints[26]);
	influance.maze.waypoints[37].addNeighbor(influance.maze.waypoints[36]);
	influance.maze.waypoints[37].addNeighbor(influance.maze.waypoints[38]);
	influance.maze.waypoints[38].addNeighbor(influance.maze.waypoints[32]);
	influance.maze.waypoints[38].addNeighbor(influance.maze.waypoints[37]);
	influance.maze.waypoints[38].addNeighbor(influance.maze.waypoints[39]);
	influance.maze.waypoints[39].addNeighbor(influance.maze.waypoints[33]);
	influance.maze.waypoints[39].addNeighbor(influance.maze.waypoints[38]);
	influance.maze.waypoints[39].addNeighbor(influance.maze.waypoints[40]);
	influance.maze.waypoints[40].addNeighbor(influance.maze.waypoints[29]);
	influance.maze.waypoints[40].addNeighbor(influance.maze.waypoints[39]);
}

function select(o) {
	actions = [];
	for (var i = 0; i < o.actions.length; ++i) {
		actions.push({
			'icon': 'imgs/icons/action/'+ o.actions[i] +'.png',
			'action': o.actions[i]
		});
	}
	guiShowSelection(o.portrait, actions);

	influance.selected = o;
}

function unselect() {
	influance.selected = null;
	guiHideSelection();
}

function action_goto() {
	var from = null;
	var to = null;
	var dest = {
		x: influance.selected.x + 6*16,
		y: influance.selected.y + 7*16
	};
	var i;
	for (i = 0; i < influance.maze.waypoints.length; ++i) {
		var wp = influance.maze.waypoints[i];
		if (influance.currentCharacter.x == wp.x && influance.currentCharacter.y == wp.y) {
			from = wp;
		}
		if (dest.x == wp.x && dest.y == wp.y) {
			to = wp;
		}
	}
	if (from == null || to == null) {
		alert('point not found: from='+ from +' to='+ to);
		return;
	}

	var path = influance.maze.findPath(from, to);
	influance.currentCharacter.followPath(path);
}

function guiShowSelection(portrait, actions) {
	document.getElementById('selectportrait').src = portrait;
	var actionList = '';
	for (var i = 0; i < actions.length; ++i) {
		actionList += '<li><img src="'+ actions[i]['icon'] +'" onclick="action_'+ actions[i]['action'] +'()" /></li>';
	}
	document.getElementById('selectactions').innerHTML = actionList;
	document.getElementById('selection').style.visibility = 'visible';
}

function guiHideSelection() {
	document.getElementById('selection').style.visibility = 'hidden';
}
