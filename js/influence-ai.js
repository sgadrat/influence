var AI_CHARACTER_BEHAVIOUR_GRAPH = `
?
	->                            (Go to the pub)
		IsHungry
		?                         (Find an Inn that can serve a meal)
			SelectInnWithMeal     (Simply select one that already can serve a meal)
			->                    (Put a meal in an inn then select it)
				?                 (Find some meal)
					HaveEdibleInInventory
					->            (Take it from one of our building)
						SelectDynastyBuildingWithEdible
						GoTo
						TakeEdibleFromStock
					->            (Buy it from the market)
						SelectMarketWithEdible
						GoTo
						BuyEdible
				SelectDynastyInn
				GoTo
				PutEdibleToStock
		GoTo
		TakeMeal
	->                            (Construct building not owned by the dynasty)
		SelectRandomBuildingType
		!
			SelectDynastyBuildingOfType
		?
			SelectDynastyLot
			SelectBuyableLot
		GoTo
		?
			IsDynastyBuilding
			BuyLot
		!
			SelectDynastyBuildingOfType
		BuildSelectedType
	->                            (Try to find somewhere to do something usefulle)
		SelectRandomBuilding
		GoTo
		->
			=
				->                    (Put items consumed by the building in stocks)
					SelectItemTypesNeededByBuilding
					PutSomeItemsToStock
			=
				?
					CanWork
					ChangeProduction
			=
				Work
			->                    (Take produced items in our inventory)
				SelectItemTypesProducedByBuilding
				TakeSomeItemsFromStock
`;

var aiBehaviourTreeFunctions = {
	BuildSelectedType: function (context) {
		if (context['selectedBuildingType'] === null) {
			return behaviourtree.FAIL;
		}
		return aiDoAction(context, {
			action: 'construct',
			buildingName: context['selectedBuildingType'],
			actor: influence.characters[context['character']],
			originalLot: context['selectedBuilding'],
			callback: aiDefaultActionCallback
		});
	},

	BuyEdible: function (context) {
		var edibles = ['pie', 'jam'];
		for (var i = 0; i < edibles.length; ++i) {
			if (context['selectedBuilding'].buy(context['character'], 'pie', 1)) {
				return behaviourtree.SUCCESS;
			}
		}
		return behaviourtree.FAIL;
	},

	BuyLot: function (context) {
		return aiDoAction(context, {
			action: 'buy',
			actor: influence.characters[context['character']],
			target: context['selectedBuilding'],
			callback: aiDefaultActionCallback
		});
	},

	CanWork: function (context) {
		var character = influence.characters[context['character']];
		var building = context['selectedBuilding'];

		if (building === null || typeof building.workPossible == 'undefined') {
			return behaviourtree.FAIL;
		}
		if (! building.workPossible(character)) {
			return behaviourtree.FAIL;
		}
		return behaviourtree.SUCCESS;
	},

	ChangeProduction: function (context) {
		var building = context['selectedBuilding'];
		if (building === null || typeof building.productibles == 'undefined') {
			return behaviourtree.FAIL;
		}

		var productibles = building.productibles;
		var selected = Math.floor(Math.random() * productibles.length);
		if (productibles.indexOf('strawberry') != -1) { /*HACK: prefere strawberries in farms*/
			selected = productibles.indexOf('strawberry');
		}
		if (building.changeProduction(productibles[selected])) {
			return behaviourtree.SUCCESS;
		}
		return behaviourtree.FAIL;
	},

	GoTo: function (context) {
		var character = influence.characters[context['character']];
		if (character.currentAction == 'move') {
			return behaviourtree.RUNNING;
		}
		if (context['selectedBuilding'] === null) {
			return behaviourtree.FAIL;
		}
		var building = context['selectedBuilding'];
		if (character.x == building.x && character.y == building.y) {
			return behaviourtree.SUCCESS;
		}
		moveCharacter(character, {x:building.x, y:building.y}, building.indoor);
		return behaviourtree.RUNNING;
	},

	HaveEdibleInInventory: function (context) {
		var character = influence.characters[context['character']];
		if (
			character.inventory.containItems('pie', 1) ||
			character.inventory.containItems('jam', 1)
		)
		{
			return behaviourtree.SUCCESS;
		}
		return behaviourtree.FAIL;
	},

	IsDynastyBuilding: function (context) {
		var character = influence.characters[context['character']];
		var building = context['selectedBuilding'];

		if (building.owner == character.dynasty) {
			return behaviourtree.SUCCESS;
		}
		return behaviourtree.FAIL;
	},

	IsHungry: function (context) {
		var hoursSinceLastMeal = (getGameDate().getTime() - context['lastEat'].getTime()) / (60*60*1000);
		if (hoursSinceLastMeal >= 24) {
			return behaviourtree.SUCCESS;
		}
		return behaviourtree.FAIL;
	},

	PutEdibleToStock: function (context) {
		var character = influence.characters[context['character']];
		var building = context['selectedBuilding'];

		if (typeof building.stock == 'undefined' || building.owner != character.dynasty) {
			return behaviourtree.FAIL;
		}

		var edibles = ['pie', 'jam'];
		for (var i = 0; i < edibles.length; ++i) {
			var item = edibles[i];
			if (building.stock.hasSlotForItem(item) && character.inventory.containItems(item, 1)) {
				character.inventory.removeItems(item, 1);
				building.stock.addItems(item, 1);
				return behaviourtree.SUCCESS;
			}
		}
		return behaviourtree.FAIL;
	},

	PutSomeItemsToStock: function (context) {
		var character = influence.characters[context['character']];
		var building = context['selectedBuilding'];

		if (typeof building.stock == 'undefined' || building.owner != character.dynasty) {
			return behaviourtree.FAIL;
		}

		for (var i = 0; i < context['selectedItemTypes'].length; ++i) {
			var item = context['selectedItemTypes'][i];
			var num = character.inventory.countItems(item);
			if (num > 0 && building.stock.hasSlotForItem(item)) {
				character.inventory.removeItems(item, num);
				building.stock.addItems(item, num);
				return behaviourtree.SUCCESS;
			}
		}
		return behaviourtree.FAIL;
	},

	SelectBuyableLot: function (context) {
		return aiSelectBuilding(context, function(building) {
			return (
				building instanceof buildingVacantLot.VacantLot &&
				building.owner === null
			);
		});
	},

	SelectMarketWithEdible: function (context) {
		return aiSelectBuilding(context, function(building) {
			return (
				building instanceof buildingClearingHouse.ClearingHouse && (
					building.have('pie') ||
					building.have('jam')
				)
			);
		});
	},

	SelectDynastyBuildingOfType: function (context) {
		var dynastyIndex = influence.characters[context['character']].dynasty;
		return aiSelectBuilding(context, function(building) {
			return (
				building.owner == dynastyIndex &&
				building.type == context['selectedBuildingType']
			);
		});
	},

	SelectDynastyBuildingWithEdible: function (context) {
		var dynastyIndex = influence.characters[context['character']].dynasty;
		return aiSelectBuilding(context, function(building) {
			return (
				building.owner == dynastyIndex &&
				typeof building.stock != 'undefined' && (
					building.stock.containItems('jam', 1) ||
					building.stock.containItems('pie', 1)
				)
			);
		});
	},

	SelectDynastyInn: function (context) {
		var dynastyIndex = influence.characters[context['character']].dynasty;
		return aiSelectBuilding(context, function(building) {
			return (
				building instanceof buildingInn.Inn &&
				building.owner == dynastyIndex
			);
		});
	},

	SelectDynastyLot: function (context) {
		var dynastyIndex = influence.characters[context['character']].dynasty;
		return aiSelectBuilding(context, function(building) {
			return (
				building instanceof buildingVacantLot.VacantLot &&
				building.owner == dynastyIndex
			);
		});
	},

	SelectInnWithMeal: function (context) {
		return aiSelectBuilding(context, function(building) {
			return (
				building instanceof buildingInn.Inn && (
					building.stock.containItems('pie', 1) ||
					building.stock.containItems('jam', 1)
				)
			);
		});
	},

	SelectItemTypesNeededByBuilding: function (context) {
		var building = context['selectedBuilding'];
		var neededItems = [];
		if (building === null) {
			return behaviourtree.FAIL;
		}

		// Add items needed by consumation buildings
		if (building instanceof buildingInn.Inn) {
			neededItems.push('pie');
			neededItems.push('jam');
		}

		// Automatically add items needed by production buildings
		if (typeof building.productibles != 'undefined') {
			for (var productIndex = 0; productIndex < building.productibles.length; ++productIndex) {
				var productId = building.productibles[productIndex];
				var materials = influence.productibles[productId].baseMaterials;
				for (var materialIndex = 0; materialIndex < materials.length; ++materialIndex) {
					var materialId = materials[materialIndex].material;
					if (neededItems.indexOf(materialId) == -1) {
						neededItems.push(materialId);
					}
				}
			}
		}

		// Select needed items or fail if no item is needed
		if (neededItems.length == 0) {
			return behaviourtree.FAIL;
		}
		context['selectedItemTypes'] = neededItems;
		return behaviourtree.SUCCESS;
	},

	SelectItemTypesProducedByBuilding: function (context) {
		var building = context['selectedBuilding'];
		if (building === null || typeof building.productibles == 'undefined') {
			return behaviourtree.FAIL;
		}
		context['selectedItemTypes'] = building.productibles;
		return behaviourtree.SUCCESS;
	},

	SelectRandomBuilding: function (context) {
		var buildings = getBuildingsList();
		var selected = Math.floor(Math.random() * buildings.length);
		context['selectedBuilding'] = buildings[selected];
		return behaviourtree.SUCCESS;
	},

	SelectRandomBuildingType: function (context) {
		var buildingsTypes = Object.getOwnPropertyNames(influence.basicBuildings);
		var selected = Math.floor(Math.random() * buildingsTypes.length);
		context['selectedBuildingType'] = buildingsTypes[selected];
		return behaviourtree.SUCCESS;
	},

	TakeEdibleFromStock: function (context) {
		var character = influence.characters[context['character']];
		var building = context['selectedBuilding'];

		if (typeof building.stock == 'undefined' || building.owner != character.dynasty) {
			return behaviourtree.FAIL;
		}

		var edibles = ['pie', 'jam'];
		for (var i = 0; i < edibles.length; ++i) {
			var item = edibles[i];
			if (character.inventory.hasSlotForItem(item) && building.stock.containItems(item, 1)) {
				building.stock.removeItems(item, 1);
				character.inventory.addItems(item, 1);
				return behaviourtree.SUCCESS;
			}
		}
		return behaviourtree.FAIL;
	},

	TakeMeal: function (context) {
		var character = influence.characters[context['character']];
		var building = context['selectedBuilding'];

		var res = aiDoAction(context, {
			action: 'meal',
			actor: character,
			building: building,
			callback: aiDefaultActionCallback
		});
		if (res == behaviourtree.SUCCESS) {
			context['lastEat'] = getGameDate();
		}
		return res;
	},

	TakeSomeItemsFromStock: function (context) {
		var character = influence.characters[context['character']];
		var building = context['selectedBuilding'];

		if (typeof building.stock == 'undefined' || building.owner != character.dynasty) {
			return behaviourtree.FAIL;
		}

		for (var i = 0; i < context['selectedItemTypes'].length; ++i) {
			var item = context['selectedItemTypes'][i];
			var num = building.stock.countItems(item);
			if (num > 0 && character.inventory.hasSlotForItem(item)) {
				building.stock.removeItems(item, num);
				character.inventory.addItems(item, num);
				return behaviourtree.SUCCESS;
			}
		}
		return behaviourtree.FAIL;
	},

	Work: function (context) {
		var character = influence.characters[context['character']];
		var building = context['selectedBuilding'];

		if (building === null || typeof building.workPossible == 'undefined') {
			return behaviourtree.FAIL;
		}
		if (! building.workPossible(character)) {
			return behaviourtree.FAIL;
		}

		return aiDoAction(context, {
			action: 'work',
			actor: character,
			building: building,
			callback: aiDefaultActionCallback
		});
	}
};

function aiCompileNode(lines, lineNum) {
	var node = null;
	var line = lines[lineNum];
	var indentLevel = line.search(/[^\t]/);
	var nodeName = line.match(/([^\t ]+)/)[1];

	if (nodeName == '->') {
		node = {type: 'sequence'};
	}else if (nodeName == '?') {
		node = {type: 'selector'};
	}else if (nodeName == '!') {
		node = {type: 'inverter'};
	}else if (nodeName == '=') {
		node = {type: 'identity'};
	}else {
		var action = aiBehaviourTreeFunctions[nodeName];
		if (typeof action == 'undefined') {
			//console.warn('influence-ai: unknown BT node "'+ nodeName +'"');
			action = function (context) {
				return false;
			};
		}
		node = {
			type: 'leaf',
			action: action
		};
	}

	var childsLevel = indentLevel + 1;
	var childs = [];
	for (++lineNum; lineNum < lines.length; ++lineNum) {
		line = lines[lineNum];
		indentLevel = line.search(/[^\t]/);
		if (indentLevel == -1) {
			continue;
		}
		if (indentLevel > childsLevel) {
			continue;
		}
		if (indentLevel < childsLevel) {
			break;
		}

		childs.push(aiCompileNode(lines, lineNum));
	}
	if (childs.length > 0) {
		node.childs = childs;
	}

	return node;
}

function aiCompileBehaviourTree(graph) {
	var lines = graph.split('\n');
	var root = null;
	for (var lineNum = 0; lineNum < lines.length; ++lineNum) {
		var line = lines[lineNum];
		var indentLevel = line.search(/[^\t]/);
		if (indentLevel == -1) {
			continue;
		}
		root = aiCompileNode(lines, lineNum);
		break;
	}
	return root;
}

var AI_CHARACTER_BEHAVIOUR = aiCompileBehaviourTree(AI_CHARACTER_BEHAVIOUR_GRAPH);

function aiBehaviourVillagerTick(character) {
	// Do nothing if already busy
	if (character.currentAction != 'idle') {
		return;
	}

	// Create context if not already done
	if (typeof character.aiContext === 'undefined') {
		character.aiContext = {
			'actionstate': {},
			'btdata': behaviourtree.initContext(AI_CHARACTER_BEHAVIOUR),
			'character': character.index,
			'lastEat': getGameDate(),
			'selectedBuilding': null,
			'selectedBuildingType': null,
			'selectedItemTypes': [],
		};
	}

	// Tick the behaviour tree
	behaviourtree.tick(character.aiContext['btdata'], character.aiContext);
}

function aiDefaultActionCallback(characterIndex, actionOrder, res) {
	influence.characters[characterIndex].aiContext['actionstate'][actionOrder.action] = res;
}

function aiDoAction(context, actionOrder, successCheck) {
	var character = influence.characters[context['character']];
	var building = context['selectedBuilding'];
	var action = actionOrder.action;

	// We are currently doing it
	if (character.currentAction == action) {
		return behaviourtree.RUNNING;
	}

	// We cannot do the action if we are not at the building
	if (building === null) {
		return behaviourtree.FAIL;
	}
	if (building.x != character.x || building.y != character.y) {
		return behaviourtree.FAIL;
	}

	if (typeof successCheck != 'undefined') {
		successCheck();
	}else {
		// We are at the building and not doing the action, let's know if we have
		// began it or failed badly
		//  context['actionstate'][action] contains usefull status for that:
		//   * 'began': we have began to do our action
		//   * 'success': we have successfully done our action
		//   * 'fail': we failed our action
		//   * something else: we don't even began
		//  We passed a previous check, we know we are not doing it right now.
		//  So if we began, we did not received success confirmation, we failed.
		if (typeof context['actionstate'][action] != 'undefined') {
			if (context['actionstate'][action] == 'success') {
				context['actionstate'][action] = 'finished';
				return behaviourtree.SUCCESS;
			}else if (context['actionstate'][action] == 'began') {
				context['actionstate'][action] = 'finished';
				return behaviourtree.FAIL;
			}else if (context['actionstate'][action] == 'fail') {
				context['actionstate'][action] = 'finished';
				return behaviourtree.FAIL;
			}
		}
	}

	// We are in the building but not have began th action yet, it's time to do it.
	character.executeAction(actionOrder);
	context['actionstate'][action] = 'began';
	return behaviourtree.RUNNING;
}

function aiSelectBuilding(context, filter) {
	var buildings = getBuildingsList();
	var eligibleBuildings = [];
	for (var buildingIndex = 0; buildingIndex < buildings.length; ++buildingIndex) {
		var building = buildings[buildingIndex];
		if (filter(building)) {
			eligibleBuildings.push(building);
		}
	}
	if (eligibleBuildings.length == 0) {
		return behaviourtree.FAIL;
	}
	var selectedBuilding = Math.floor(Math.random() * eligibleBuildings.length);
	context['selectedBuilding'] = eligibleBuildings[selectedBuilding];
	return behaviourtree.SUCCESS;
}
