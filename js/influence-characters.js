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

	this.tickers = {};
	this.tick = function(timeElapsed) {
		for (var tickerId in this.tickers) {
			this.tickers[tickerId](this, timeElapsed);
		}
	};

	this.followPath = function(path) {
		this.path = path;
		this.movingTime = 0;
		this.origin = {
			x: this.x,
			y: this.y
		};
		this.onBeginMove();

		this.tickers['MovingObject.move'] = function(_this, timeElapsed) {
			_this.movingTime += timeElapsed;
			var distance = Math.sqrt(Math.pow(_this.path[0].x - _this.origin.x, 2) + Math.pow(_this.path[0].y - _this.origin.y, 2));
			var timeTarget = distance * 10;
			var distanceX = _this.path[0].x - _this.origin.x;
			var distanceY = _this.path[0].y - _this.origin.y;
			var timeRatio = Math.min(1, _this.movingTime / timeTarget);
			_this.x = _this.origin.x + distanceX * timeRatio;
			_this.y = _this.origin.y + distanceY * timeRatio;

			if (_this.x == _this.path[0].x && _this.y == _this.path[0].y) {
				_this.origin = {
					x: _this.path[0].x,
					y: _this.path[0].y
				};
				_this.path.splice(0, 1);
				if (_this.path.length == 0) {
					delete _this.tickers['MovingObject.move'];
					if (_this.onStopMove != null) {
						_this.onStopMove();
					}
					return;
				}
				_this.movingTime = 0;
				if (_this.onMove != null) {
					_this.onMove(_this.origin, _this.path[0]);
				}
			}
		};
	};
}

function Citizen(type, firstName, dynasty, x, y, behaviour) {
	if (typeof behaviour == 'undefined') {
		behaviour = null;
	}

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
	if (behaviour !== null) {
		this.tickers['Citizen.behaviour'] = function(_this, timeElasped) { behaviour(_this); };
	}

	this.portrait = 'imgs/chars/'+ type +'_portrait.png';
	this.currentAction = 'idle';
	this.actionTimeout = null;
	this.indoorDestination = false;

	this.index = influence.characters.length;
	influence.characters.push(this);

	this.setCurrentAction = function(val) {
		this.currentAction = val;
		guiEventCharacterActionChanged(this.index);
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

		if (this === influence.currentCharacter) {
			var buildings = getBuildingsList();
			for (var i = 0; i < buildings.length; ++i) {
				if (buildings[i].x == this.x && buildings[i].y == this.y) {
					select(buildings[i]);
				}
			}
		}

		if (this.indoorDestination) {
			this.visible = false;
		}

		this.setCurrentAction('idle');
	};

	this.executeAction = function(action) {
		var character_index = this.index;
		this.actionTimeout = setTimeout(
			function() {
				var res = influence.characterAction[action.action].func(action);
				action.actor.finishedAction();
				if (typeof action.callback != 'undefined') {
					action.callback(character_index, action, res ? 'success' : 'fail');
				}
			},
			influence.characterAction[action.action].duration
		);
		this.setCurrentAction(action.action);
	};

	this.cancelCurrentAction = function() {
		if (this.actionTimeout != null) {
			clearTimeout(this.actionTimeout);
		}
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
