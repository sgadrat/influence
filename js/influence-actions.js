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
					if (influence.selected === params.target) {
						select(params.target);
					}
					guiEventDynastyModified(params.actor.dynasty);
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
				guiEventDynastyModified(params.actor.dynasty);
			}
		}
	},
	'work': {
		icon: 'imgs/icons/action/tiny_construct.png',
		description: 'Travail',
		duration: 3000,
		func: function(params) {
			var i;
			var salary = 500;

			var workPossible = params.building.money >= salary && params.building.production.length > 0;
			var materials = influence.productibles[params.building.production[0].product].baseMaterials;
			if (workPossible) {
				for (i = 0; i < materials.length; ++i) {
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
					for (i = 0; i < materials.length; ++i) {
						if (! params.building.stock.removeItems(materials[i].material, materials[i].number)) {
							alert('Bug found ! Unreachable code in work action');
						}
					}
					params.building.stock.addItems(prod.product, 1);
					params.building.production.splice(0, 1);
				}

				guiFillFormManage(influence.selected);
				guiEventDynastyModified(params.actor.dynasty);
			}
		}
	},
	'pray': {
		icon: 'imgs/icons/action/tiny_pray.png',
		description: 'Prière',
		duration: 3000,
		func: function(params) {
			godsPray(params.actor);
		}
	},
	'meal': {
		icon: 'imgs/icons/action/tiny_meal.png',
		description: 'Repas',
		duration: 3000,
		func: function(params) {
			var price = 500;
			var edibleItems = ['jam', 'pie'];
			var willEat = null;
			for (var i = 0; i < edibleItems.length; ++i) {
				if (params.building.stock.containItems(edibleItems[i], 1)) {
					willEat = edibleItems[i];
					break;
				}
			}

			if (willEat === null) {
				return;
			}
			if (influence.dynasties[params.actor.dynasty].wealth < price) {
				return;
			}

			influence.dynasties[params.actor.dynasty].wealth -= price;
			influence.dynasties[params.building.owner].wealth += price;
			params.building.stock.removeItems(willEat, 1);

			guiFillFormManage(influence.selected);
			guiEventDynastyModified(params.actor.dynasty);
			aiEventCharacterAte(params.actor.index);
		}
	},
};

function construct(buildingName) {
	influence.currentCharacter.executeAction({
		action: 'construct',
		actor: influence.currentCharacter,
		buildingName: buildingName,
		originalLot: influence.selected
	});
	guiHideForm('build');
}

function fundBuilding(character, building, value) {
	if (typeof character == 'undefined') {
		character = influence.currentCharacter;
	}
	if (typeof building == 'undefined') {
		building = influence.selected;
	}
	if (typeof value == 'undefined') {
		value = 500;
	}
	var dynasty = influence.dynasties[character.dynasty];

	if (dynasty.wealth >= value) {
		dynasty.wealth -= value;
		building.money += value;
	}
	guiFillFormManage(building);
	guiEventDynastyModified(character.dynasty);
}

function moveCharacter(character, dest, indoorDest) {
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

	if (character === influence.currentCharacter) {
		unselect();
	}

	var path = influence.maze.findPath(from, to);
	character.followPath(path);
	character.indoorDestination = indoorDest;
}

function action_buy() {
	influence.currentCharacter.executeAction({
		action: 'buy',
		actor: influence.currentCharacter,
		target: influence.selected
	});
}

function action_manage() {
	guiFillFormManage(influence.selected);
	guiShowForm('manage');
}

function action_construct() {
	guiShowForm('build');
}

function action_work() {
	influence.currentCharacter.executeAction({
		action: 'work',
		actor: influence.currentCharacter,
		building: influence.selected
	});
}

function action_pray(character) {
	if (typeof character == 'undefined') {
		character = influence.currentCharacter;
	}

	character.executeAction({
		action: 'pray',
		actor: character
	});
}

function action_meal(character, building) {
	if (typeof character == 'undefined') {
		character = influence.currentCharacter;
	}
	if (typeof building == 'undefined') {
		building = influence.selected;
	}
	character.executeAction({
		action: 'meal',
		actor: character,
		building: building
	});
}

function action_auction() {
	guiFillFormAuction(influence.selected);
	guiShowForm('auction');
}
