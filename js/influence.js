var influence = {
	selected: null,
	currentCharacter: null,
	maze: null,
	characterAction: {
		'move': {
			icon: 'imgs/icons/action/tiny_move.png',
			description: 'Déplacement'
		},
		'idle': {
			icon: 'imgs/icons/action/tiny_idle.png',
			description: 'Innactif'
		},
	},
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

	this.portrait = 'imgs/chars/'+ type +'_portrait.png';
	this.currentAction = 'idle';

	this.lastDir = 'bot';
	this.onMove = function(origin, dest) {
		this.currentAction = 'move';
		guiShowCharacter(this);

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
		this.currentAction = 'idle';
		guiShowCharacter(this);

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
		new Case(2*16, 15*16),
		new Case(17*16, 39*16),
	];

	influence.currentCharacter = new Citizen('0', 81*16, 48*16);
	guiShowCharacter(influence.currentCharacter);
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
			'imgs/chars/0_portrait.png',
			'imgs/icons/action/tiny_idle.png',
			'imgs/icons/action/tiny_move.png',
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

function action_goto() {
	var from = null;
	var to = null;
	var dest = {
		x: influence.selected.x + 6*16,
		y: influence.selected.y + 7*16
	};
	var i;
	for (i = 0; i < influence.maze.waypoints.length; ++i) {
		var wp = influence.maze.waypoints[i];
		if (influence.currentCharacter.x == wp.x && influence.currentCharacter.y == wp.y) {
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

	var path = influence.maze.findPath(from, to);
	influence.currentCharacter.followPath(path);
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

function guiShowCharacter(character) {
	var action = influence.characterAction[character.currentAction];
	if (action != undefined) {
		document.getElementById('charportrait').src = character.portrait;
		document.getElementById('charicon').src = action.icon;
		document.getElementById('charaction').innerHTML = action.description;
		document.getElementById('character').style.visibility = 'visible';
	}
}