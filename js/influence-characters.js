function MovingObject(x, y) {
	rtge.DynObject.call(this);
	this.x = x;
	this.y = y;
	this.z = 1;
	this.anchorY = 11;
	this.animation = null;

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

function Citizen(skin, graphics, animations, firstName, dynasty, x, y, behaviour, dialog) {
	if (typeof behaviour == 'undefined') {
		behaviour = null;
	}
	if (typeof dialog == 'undefined') {
		dialog = null;
	}

	MovingObject.call(this, x, y);
	this.skin = skin;
	var skinId = getSkinId(this.skin);
	buildAnimations(this.skin, graphics, animations);
	this.firstName = firstName;
	this.dynasty = dynasty;
	this.inventory = new Inventory(2);
	this.animTop = `chars.${skinId}.walk.top`;
	this.animRight = `chars.${skinId}.walk.right`;
	this.animBot = `chars.${skinId}.walk.bot`;
	this.animLeft = `chars.${skinId}.walk.left`;
	this.idleTop = `chars.${skinId}.idle.top`;
	this.idleRight = `chars.${skinId}.idle.right`;
	this.idleBot = `chars.${skinId}.idle.bot`;
	this.idleLeft = `chars.${skinId}.idle.left`;
	this.animation = this.idleBot;
	if (behaviour !== null) {
		this.tickers['Citizen.behaviour'] = function(_this, timeElasped) { behaviour(_this); };
	}

	this.currentAction = 'idle';
	this.actionTimeout = null;
	this.indoorDestination = false;
	this.dialog = dialog;

	this.index = influence.characters.length;
	influence.characters.push(this);

	this.setCurrentAction = function(val) {
		this.currentAction = val;
		guiEventCharacterActionChanged(this.index);
	};

	this.click = function() {
		if (this.dialog !== null) {
			guiStartDialog(this.index, this.dialog());
		}
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

function buildAnimations(skin, graphics, animations) {
	var gender = skin.gender;
	var body = skin.body;
	var clothes = skin.clothes;
	var hair = skin.hair;
	var skinId = getSkinId(skin);

	// Add portrait components
	/* no use for the composite, portraits are only displayed in gui */
	addGraphic(graphics, `imgs/chars/${gender}/body/${body}/portrait_neutral.png`);
	addGraphic(graphics, `imgs/chars/${gender}/clothes/${clothes}/portrait_neutral.png`);
	addGraphic(graphics, `imgs/chars/${gender}/hair/${hair}/portrait_neutral.png`);

	// Create animations
	var directions = ['top', 'right', 'bot', 'left'];
	//var parts = [['body', body], ['clothes', clothes], ['hair', hair]];
	for (var directionIndex = 0; directionIndex < directions.length; ++directionIndex) {
		var direction = directions[directionIndex];

		// Add composite graphics
		var animSteps = [ `walk_${direction}_0`, `idle_${direction}`, `walk_${direction}_2`];
		for (var animStepIndex = 0; animStepIndex < animSteps.length; ++animStepIndex) {
			var animStep = animSteps[animStepIndex];
			addGraphic(
				graphics,
				{
					'name': `composites/chars/${skinId}/${animStep}`,
					'data': {
						'type': 'composite',
						'width': 16,
						'height': 27,
						'components': [
							`imgs/chars/${gender}/body/${body}/${animStep}.png`,
							`imgs/chars/${gender}/clothes/${clothes}/${animStep}.png`,
							`imgs/chars/${gender}/hair/${hair}/${animStep}.png`
						]
					}
				}
			);
		}

		// Add the animations for this direction
		animations[`chars.${skinId}.idle.${direction}`] = new rtge.Animation();
		animations[`chars.${skinId}.idle.${direction}`].steps = [
			`composites/chars/${skinId}/idle_${direction}`
		];
		animations[`chars.${skinId}.idle.${direction}`].durations = [600000];

		animations[`chars.${skinId}.walk.${direction}`] = new rtge.Animation();
		animations[`chars.${skinId}.walk.${direction}`].steps = [
			`composites/chars/${skinId}/walk_${direction}_0`,
			`composites/chars/${skinId}/idle_${direction}`,
			`composites/chars/${skinId}/walk_${direction}_2`
		];
		animations[`chars.${skinId}.walk.${direction}`].durations = [100, 100, 100];
	}
}

function getSkinId(skin) {
	return `${skin.gender}.${skin.body}.${skin.clothes}.${skin.hair}`;
}

function addGraphic(graphics, graphic) {
	var name = graphic;
	if (typeof graphic == 'object') {
		name = graphic['name'];
	}

	if (! graphicExists(name, graphics)) {
		graphics.push(graphic);
	}
}

function graphicExists(graphicId, graphics) {
	for (var graphicIndex = 0; graphicIndex < graphics.length; ++graphicIndex) {
		if (
			typeof graphics[graphicIndex] == 'string' &&
			graphics[graphicIndex] == graphicId
		)
		{
			return true;
		}
		if (
			typeof graphics[graphicIndex] == 'object' &&
			graphics[graphicIndex]['name'] == graphicId
		)
		{
			return true;
		}
	}
	return false;
}
