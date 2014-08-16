influence.characterAction = {
	'move': {
		icon: 'imgs/icons/action/tiny_move.png',
		description: 'Déplacement'
	},
	'idle': {
		icon: 'imgs/icons/action/tiny_idle.png',
		description: 'Inactif'
	},
	'buy': {
		icon: 'imgs/icons/tiny_money.png',
		description: 'Achat'
	},
	'construct': {
		icon: 'imgs/icons/action/tiny_construct.png',
		description: 'Construction'
	},
};

function MovingObject(x, y) {
	rtge.DynObject.call(this);
	this.x = x;
	this.y = y;
	this.z = 1;
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
		this.onBeginMove();

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

function Citizen(type, firstName, dynasty, x, y) {
	MovingObject.call(this, x, y);
	this.firstName = firstName;
	this.dynasty = dynasty;
	this.inventory = [null, null];
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
	this.goal = null;
	this.actionTimeout = null;
	this.indoorDestination = false;

	this.getActions = function(target) {
		var actions = [];
		for (var i = 0; i < target.actions.length; ++i) {
			var pushIt = true;
			if (target.actions[i] == 'buy') {
				if (target.owner != null) {
					pushIt = false;
				}
			}else if (target.actions[i] == 'construct') {
				if (target.owner != this.dynasty) {
					pushIt = false;
				}
			}

			if (pushIt) {
				actions.push(target.actions[i]);
			}
		}
		return actions;
	};

	this.setCurrentAction = function(val) {
		this.currentAction = val;
		guiShowCharacter(this);
	};

	this.lastDir = 'bot';
	this.onBeginMove = function() {
		this.cancelCurrentAction();
		this.visible = true;
	};
	this.onMove = function(origin, dest) {
		this.setCurrentAction('move');

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

		if (this.indoorDestination) {
			this.visible = false;
		}

		if (this.goal != null) {
			this.executeGoal();
		}else {
			this.setCurrentAction('idle');
		}
	};

	this.executeGoal = function() {
		if (this.goal.action == 'buy') {
			this.buy(this.goal.target);
		}else if(this.goal.action == 'construct') {
			this.construct(this.goal);
		}
		this.goal = null;
	};

	this.cancelCurrentAction = function() {
		if (this.actionTimeout != null) {
			clearTimeout(this.actionTimeout);
		}
		this.goal = null;
		if (this.currentAction != 'move') {
			this.currentAction = 'idle';
		}
	}

	this.buy = function(target) {
		var character = this;
		this.actionTimeout = setTimeout(
			function() {
				if (target.getOwner() == null) {
					if (influence.dynasties[character.dynasty].wealth >= 1500) {
						target.setOwner(character.dynasty);
						influence.dynasties[character.dynasty].wealth -= 1500;
						guiShowSelection(influence.selected, influence.currentCharacter);
						guiShowDynasty(influence.dynasties[influence.currentCharacter.dynasty]);
					}
				}
				character.setCurrentAction('idle');
				character.actionTimeout = null;
			},
			3000
		);
		this.setCurrentAction('buy');
	};

	this.construct = function(params) {
		var character = this;
		this.actionTimeout = setTimeout(
			function() {
				var constructionPossible = params.buildingName in influence.basicBuildings;
				var buildingInfo = null;
				if (constructionPossible) {
					buildingInfo = influence.basicBuildings[params.buildingName];
					if (influence.dynasties[character.dynasty].wealth < buildingInfo.price) {
						constructionPossible = false;
					}
				}

				if (constructionPossible) {
					var newBuilding = buildingInfo.constructor(params.originalLot.x, params.originalLot.y, params.originalLot.owner);
					rtge.removeObject(params.originalLot);
					rtge.addObject(newBuilding);

					if (influence.selected == params.originalLot) {
						select(newBuilding);
					}
					influence.dynasties[character.dynasty].wealth -= buildingInfo.price;
					guiShowDynasty(influence.dynasties[influence.currentCharacter.dynasty]);
				}
				character.setCurrentAction('idle');
				character.actionTimeout = null;
			},
			3000
		);
		this.setCurrentAction('construct');
	};
}
Citizen.prototype = new MovingObject(0, 0);

function Dynasty(name, wealth) {
	this.name = name;
	this.wealth = wealth;
}

function construct(buildingName) {
	action_goto();
	influence.currentCharacter.goal = {
		action: 'construct',
		buildingName: buildingName,
		originalLot: influence.selected
	};
	guiHideForm('build');
}

function action_goto() {
	var from = null;
	var to = null;
	var dest = {
		x: influence.selected.x,
		y: influence.selected.y
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
	influence.currentCharacter.indoorDestination = influence.selected.indoor;
}

function action_buy() {
	action_goto();
	influence.currentCharacter.goal = {
		action: 'buy',
		target: influence.selected
	};
}

function action_manage() {
	guiShowManage(influence.selected);
}

function action_construct() {
	guiShowForm('build');
}
