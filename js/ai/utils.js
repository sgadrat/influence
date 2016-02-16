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
			if (context['selectedBuilding'].buy(context['character'], edibles[i], 1)) {
				return behaviourtree.SUCCESS;
			}
		}
		return behaviourtree.FAIL;
	},

	BuyItemTypes: function (context) {
		var selectedItemTypes = context['selectedItemTypes'];
		var res = behaviourtree.FAIL;
		for (var itemIndex = 0; itemIndex < selectedItemTypes.length; ++itemIndex) {
			var item = selectedItemTypes[itemIndex];
			for (var buyCount = 0; buyCount < 10; ++buyCount) {
				if (context['selectedBuilding'].buy(context['character'], item, 1)) {
					res = behaviourtree.SUCCESS;
				}else {
					break;
				}
			}
		}
		return res;
	},

	BuyLot: function (context) {
		return aiDoAction(context, {
			action: 'buy',
			actor: influence.characters[context['character']],
			target: context['selectedBuilding'],
			callback: aiDefaultActionCallback
		});
	},

	HasJob: function (context) {
		var character = influence.characters[context['character']];
		if (character.workPlace !== null) {
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

	OptimizeProduction: function (context) {
		var character = influence.characters[context['character']];
		var building = context['selectedBuilding'];

		if (typeof building.stock == 'undefined' || building.owner != character.dynasty) {
			return behaviourtree.FAIL;
		}
		if (typeof building.changeProduction == 'undefined') {
			return behaviourtree.FAIL;
		}

		// List items needed by dynasty's buildings and productible in this one
		var buildings = getBuildingsList();
		var neededProducts = [];
		for (var buildingIndex = 0; buildingIndex < buildings.length; ++buildingIndex) {
			var consumerBuilding = buildings[buildingIndex];
			if (consumerBuilding.owner == character.dynasty && typeof consumerBuilding.productibles != 'undefined') {
				for (var productibleIndex = 0; productibleIndex < consumerBuilding.productibles.length; ++productibleIndex) {
					var productible = consumerBuilding.productibles[productibleIndex];
					var materials = influence.productibles[productible].baseMaterials;
					for (var materialIndex = 0; materialIndex < materials.length; ++materialIndex) {
						var material = materials[materialIndex].material;
						if (building.productibles.indexOf(material) != -1 && neededProducts.indexOf(material) == -1) {
							neededProducts.push(material);
						}
					}
				}
			}
		}

		// If we do not need anything special, do a little bit of everything
		if (neededProducts.length == 0) {
			neededProducts = building.productibles;
		}

		// Hire staff if necessary
		while (building.staff.length < Math.min(neededProducts.length, building.maxStaff)) {
			var employee = aiGetCheapestEmployableCharacter(building);
			if ( employee === null || !building.employ(employee)) {
				break;
			}
		}

		// Affect staff to needed items
		for (var staffIndex = 0; staffIndex < building.staff.length; ++staffIndex) {
			building.changeProduction(staffIndex, neededProducts[staffIndex % neededProducts.length]);
		}

		return behaviourtree.SUCCESS;
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

	SelectMarketWithItemTypes: function (context) {
		var selectedItemTypes = context['selectedItemTypes'];
		return aiSelectBuilding(context, function(building) {
			if (!(building instanceof buildingClearingHouse.ClearingHouse)) {
				return false;
			}
			for (var itemIndex = 0; itemIndex < selectedItemTypes.length; ++itemIndex) {
				var item = selectedItemTypes[itemIndex];
				if (building.have(item)) {
					return true;
				}
			}
			return false;
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

	SelectDynastyBuildingLackingItems: function (context) {
		var dynastyIndex = influence.characters[context['character']].dynasty;
		return aiSelectBuilding(context, function(building) {
			if (building.owner != dynastyIndex || typeof building.stock == 'undefined') {
				return false;
			}
			var neededItems = aiGetItemsNeededByBuilding(building);
			for (var itemIndex = 0; itemIndex < neededItems.items.length; ++itemIndex) {
				var item = neededItems.items[itemIndex];
				var quantity = neededItems.quantities[itemIndex];
				if (!building.stock.containItems(item, quantity)) {
					return true;
				}
			}
			return false;
		});
	},

	SelectDynastyBuildingLackingItemTypes: function (context) {
		var dynastyIndex = influence.characters[context['character']].dynasty;
		return aiSelectBuilding(context, function(building) {
			if (typeof building.stock == 'undefined') {
				return false;
			}
			var someLackingItemsAreSelected = false;
			if (building.owner == dynastyIndex) {
				var neededItems = aiGetItemsNeededByBuilding(building);
				for (var i = 0; i < context['selectedItemTypes'].length; ++i) {
					var neededItem = context['selectedItemTypes'][i];
					var neededItemIndex = neededItems.items.indexOf(neededItem);
					var neededQuantity = (neededItemIndex == -1 ? 0 : neededItems.quantities[neededItemIndex]);
					if (
						neededItemIndex != -1 &&
						!building.stock.containItems(neededItem, neededQuantity)
					)
					{
						someLackingItemsAreSelected = true;
						break;
					}
				}
			}
			return (
				building.owner == dynastyIndex &&
				someLackingItemsAreSelected
			);
		});
	},

	SelectDynastyBuildingNeedingItemTypes: function (context) {
		var dynastyIndex = influence.characters[context['character']].dynasty;
		return aiSelectBuilding(context, function(building) {
			var someNeededItemsAreSelected = false;
			if (building.owner == dynastyIndex) {
				var neededItems = aiGetItemsNeededByBuilding(building).items;
				for (var i = 0; i < context['selectedItemTypes'].length; ++i) {
					if (neededItems.indexOf(context['selectedItemTypes'][i]) != -1) {
						someNeededItemsAreSelected = true;
						break;
					}
				}
			}
			return (
				building.owner == dynastyIndex &&
				someNeededItemsAreSelected
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

	SelectDynastyBuildingWithUnusedItemTypes: function (context) {
		var dynastyIndex = influence.characters[context['character']].dynasty;
		return aiSelectBuilding(context, function(building) {
			if (building.owner != dynastyIndex || typeof building.stock == 'undefined') {
				return false;
			}
			var neededItems = aiGetItemsNeededByBuilding(building).items;
			for (var itemIndex = 0; itemIndex < context['selectedItemTypes'].length; ++itemIndex) {
				var item = context['selectedItemTypes'][itemIndex];
				if (
					neededItems.indexOf(item) == -1 &&
					building.stock.containItems(item, 1)
				)
				{
					return true;
				}
			}
			return false;
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

	SelectItemTypesInInventory: function(context) {
		var inventory = influence.characters[context['character']].inventory;
		var itemTypes = [];

		for (var slotIndex = 0; slotIndex < inventory.getNumberOfSlots(); ++slotIndex) {
			var slot = inventory.getSlot(slotIndex);
			if (slot !== null) {
				itemTypes.push(slot.itemName);
			}
		}

		if (itemTypes.length == 0) {
			return behaviourtree.FAIL;
		}
		context['selectedItemTypes'] = itemTypes;
		return behaviourtree.SUCCESS;
	},

	SelectItemTypesLackedByBuilding: function (context) {
		var building = context['selectedBuilding'];
		var neededItems = {};
		var lackingItems = [];
		var itemIndex, item, quantity;
		if (building === null) {
			return behaviourtree.FAIL;
		}

		// Select needed items or fail if no item is needed
		neededItems = aiGetItemsNeededByBuilding(building);
		for (itemIndex = 0; itemIndex < neededItems.items.length; ++itemIndex) {
			item = neededItems.items[itemIndex];
			quantity = neededItems.quantities[itemIndex];
			if (!building.stock.containItems(item, quantity)) {
				lackingItems.push(item);
			}
		}
		if (lackingItems.length == 0) {
			return behaviourtree.FAIL;
		}
		context['selectedItemTypes'] = lackingItems;
		return behaviourtree.SUCCESS;
	},

	SelectItemTypesNeededByBuilding: function (context) {
		var building = context['selectedBuilding'];
		var neededItems = [];
		if (building === null) {
			return behaviourtree.FAIL;
		}

		// Select needed items or fail if no item is needed
		neededItems = aiGetItemsNeededByBuilding(building).items;
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

	SelectRandomDynastyBuilding: function (context) {
		var dynastyIndex = influence.characters[context['character']].dynasty;
		return aiSelectBuilding(context, function(building) {
			return building.owner == dynastyIndex;
		});
	},

	SelectRandomBuildingType: function (context) {
		var buildingsTypes = Object.getOwnPropertyNames(influence.basicBuildings);
		var selected = Math.floor(Math.random() * buildingsTypes.length);
		context['selectedBuildingType'] = buildingsTypes[selected];
		return behaviourtree.SUCCESS;
	},

	SelectWorkPlace: function (context) {
		var character = influence.characters[context['character']];
		if (character.workPlace !== null) {
			context['selectedBuilding'] = character.workPlace;
			return behaviourtree.SUCCESS;
		}
		return behaviourtree.FAIL;
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
			context['workHappiness'][building.owner] -= 10;
			return behaviourtree.FAIL;
		}

		context['lastWork'] = getGameDate();
		var res = aiDoAction(context, {
			action: 'work',
			actor: character,
			building: building,
			callback: aiDefaultActionCallback
		});
		if (res == behaviourtree.FAIL) {
			context['workHappiness'][building.owner] -= 10;
		}
		return res;
	},

	WorkedToday: function (context) {
		var today = Math.floor(getGameDate().getTime() / (1000*60*60*24));
		var lastWork = Math.floor(context['lastWork'].getTime() / (1000*60*60*24));
		if (lastWork == today) {
			return behaviourtree.SUCCESS;
		}
		return behaviourtree.FAIL;
	},
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
	}else if (nodeName[0] == '%') {
		var subGraphName = nodeName.substring(1);
		if (subGraphName == '' || typeof influence.aiGraphs[subGraphName] == 'undefined') {
			alert('aiCompileNode: unknown subgraph "' + subGraphName + '"');
			node = {
				type: 'leaf',
				action: function() {}
			};
		}else {
			node = aiCompileBehaviourTree(influence.aiGraphs[subGraphName]);
		}
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

function aiGetCheapestEmployableCharacter(building) {
	var res = null;
	var cheapestPrice = null;
	for (var characterIndex = 0; characterIndex < influence.characters.length; ++characterIndex) {
		var character = influence.characters[characterIndex];
		if (character === influence.currentCharacter) {
			continue;
		}
		if (character.workPlace !== null && character.workPlace.owner == building.owner) {
			continue;
		}
		var conditions = aiGetEmployementConditions(characterIndex, building);
		if (! conditions.employable) {
			continue;
		}

		if (cheapestPrice === null || cheapestPrice > conditions.wage) {
			res = characterIndex;
			cheapestPrice = conditions.wage;
		}
	}
	return res;
}

function aiGetItemsNeededByBuilding(building) {
	var neededItems = [];
	var neededQuantities = [];

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
				var quantity = materials[materialIndex].number;
				var itemIndex = neededItems.indexOf(materialId);
				if (itemIndex == -1) {
					itemIndex = neededItems.length;
					neededItems.push(materialId);
					neededQuantities.push(quantity);
				}else if (quantity > neededQuantities[itemIndex]) {
					neededQuantities[itemIndex] = quantity;
				}
			}
		}
	}

	return {items:neededItems, quantities:neededQuantities};
}

function aiGetWorkHappiness(characterIndex) {
	var character = influence.characters[characterIndex];
	if (character.workPlace === null || typeof character.aiContext == 'undefined') {
		return null;
	}
	return character.aiContext['workHappiness'][character.workPlace.owner];
}

function aiGetEmployementConditions(characterIndex, building) {
	var character = influence.characters[characterIndex];
	if (typeof character.aiContext == 'undefined') {
		return {
			employable: false,
			wage: 10
		};
	}

	return  character.aiContext.getEmployementConditions(building);
}

function aiCreateCharacterContext(characterIndex, behaviour) {
	var res = {
		'actionstate': {},
		'btdata': behaviourtree.initContext(behaviour),
		'character': characterIndex,
		'lastEat': getGameDate(),
		'lastWork': getGameDate(),
		'selectedBuilding': null,
		'selectedBuildingType': null,
		'selectedItemTypes': [],
		'workHappiness': [],
		'getEmployementConditions': function(building) {
			var character = influence.characters[this.character];
			var employable = false;
			if (character.workPlace === null) {
				employable = true;
			}else if (this.workHappiness[building.owner] > this.workHappiness[character.workPlace.owner] + 10) {
				employable = true;
			}
			return {
				employable: employable,
				wage: 10
			};
		}
	};
	for (var i = 0; i < influence.dynasties.length; ++i) {
		res['workHappiness'].push(100);
	}
	return res;
}
