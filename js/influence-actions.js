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
	'work': {
		icon: 'imgs/icons/action/tiny_construct.png',
		description: 'Travail',
		duration: 3000,
		func: function(params) {
			var salary = 500;

			var workPossible = params.building.money >= salary && params.building.production.length > 0;
			if (workPossible) {
				var materials = influence.productibles[params.building.production[0].product].baseMaterials;
				for (var i = 0; i < materials.length; ++i) {
					if (! params.building.stock.containItems(materials[i].material, materials[i].number)) {
						workPossible = false;
						break;
					}
				}
			}

			if (workPossible) {
				params.building.money -= salary;
				influence.dynasties[params.actor.dynasty].wealth += salary;

				var prod = params.building.production[0];
				prod.work += 1;
				if (prod.work >= influence.productibles[prod.product].work) {
					var materials = influence.productibles[params.building.production[0].product].baseMaterials;
					for (var i = 0; i < materials.length; ++i) {
						if (! params.building.stock.removeItems(materials[i].material, materials[i].number)) {
							alert('Bug found ! Unreachable code in work action');
						}
					}
					params.building.stock.addItems(prod.product, 1);
					params.building.production.splice(0, 1);
				}

				guiFillFormManage(influence.selected);
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

function fundBuilding() {
	var dynasty = influence.dynasties[influence.currentCharacter.dynasty];
	var building = influence.selected;
	var value = 500;

	if (dynasty.wealth >= value) {
		dynasty.wealth -= value;
		building.money += value;
	}
	guiFillFormManage(building);
	guiShowDynasty(dynasty);
}

function action_goto(character, dest, indoorDest) {
	if (typeof character == 'undefined') {
		character = influence.currentCharacter;
	}
	if (typeof dest == 'undefined') {
		dest = {
			x: influence.selected.x,
			y: influence.selected.y
		};
	}
	if (typeof indoorDest == 'undefined') {
		indoorDest = influence.selected.indoor;
	}
	var from = null;
	var to = null;
	var i;
	for (i = 0; i < influence.maze.waypoints.length; ++i) {
		var wp = influence.maze.waypoints[i];
		if (character.x == wp.x && character.y == wp.y) {
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
	character.followPath(path);
	character.indoorDestination = indoorDest;
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
	guiFillFormManage(influence.selected);
	guiShowForm('manage');
}

function action_construct() {
	guiShowForm('build');
}

function action_work() {
	action_goto();
	influence.currentCharacter.goal = {
		action: 'work',
		actor: influence.currentCharacter,
		building: influence.selected
	}
}

function action_auction() {
	guiFillFormAuction(influence.selected);
	guiShowForm('auction');
}
