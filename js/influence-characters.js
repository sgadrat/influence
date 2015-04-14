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
	this.inventory = new Inventory(2);
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

	this.index = influence.characters.length;
	influence.characters.push(this);

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
		var goal = this.goal;
		this.goal = null;
		this.actionTimeout = setTimeout(
			function() {
				influence.characterAction[goal.action].func(goal);
				goal.actor.finishedAction();
			},
			influence.characterAction[goal.action].duration
		);
		this.setCurrentAction(goal.action);
	};

	this.cancelCurrentAction = function() {
		if (this.actionTimeout != null) {
			clearTimeout(this.actionTimeout);
		}
		this.goal = null;
		if (this.currentAction != 'move') {
			this.currentAction = 'idle';
		}
	};

	this.finishedAction = function() {
		this.setCurrentAction('idle');
		this.actionTimeout = null;
	};
}
Citizen.prototype = new MovingObject(0, 0);

function Dynasty(name, wealth) {
	this.name = name;
	this.wealth = wealth;
}
