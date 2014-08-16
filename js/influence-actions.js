influence.characterAction = {
	/*
	'action_id': {
		icon: Icon used to represent the action in gui
		description: Localized one word description of the action
		duration: Duration for a character to do the action (in milliseconds)
		func: Function called when a character executed the action

		NOTE when the action is requested from gui, the function action_action_id
		     will be called.
	}
	*/

	'move': {
		icon: 'imgs/icons/action/tiny_move.png',
		description: 'Déplacement',
		duration: null,
		func: null
	},
	'idle': {
		icon: 'imgs/icons/action/tiny_idle.png',
		description: 'Inactif',
		duration: null,
		func: null
	},
	'buy': {
		icon: 'imgs/icons/tiny_money.png',
		description: 'Achat',
		duration: 3000,
		func: function(params) {
			if (params.target.getOwner() == null) {
				if (influence.dynasties[params.actor.dynasty].wealth >= 1500) {
					params.target.setOwner(params.actor.dynasty);
					influence.dynasties[params.actor.dynasty].wealth -= 1500;
					guiShowSelection(influence.selected, influence.currentCharacter);
					guiShowDynasty(influence.dynasties[influence.currentCharacter.dynasty]);
				}
			}
		}
	},
	'construct': {
		icon: 'imgs/icons/action/tiny_construct.png',
		description: 'Construction',
		duration: 3000,
		func: function(params) {
			var constructionPossible = params.buildingName in influence.basicBuildings;
			var buildingInfo = null;
			if (constructionPossible) {
				buildingInfo = influence.basicBuildings[params.buildingName];
				if (influence.dynasties[params.actor.dynasty].wealth < buildingInfo.price) {
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
				influence.dynasties[params.actor.dynasty].wealth -= buildingInfo.price;
				guiShowDynasty(influence.dynasties[influence.currentCharacter.dynasty]);
			}
		}
	},
};

function construct(buildingName) {
	action_goto();
	influence.currentCharacter.goal = {
		action: 'construct',
		actor: influence.currentCharacter,
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
		actor: influence.currentCharacter,
		target: influence.selected
	};
}

function action_manage() {
	guiShowManage(influence.selected);
}

function action_construct() {
	guiShowForm('build');
}