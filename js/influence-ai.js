/*eslint-disable indent*/
var AI_CHARACTER_BEHAVIOUR = {
	type: 'selector',
	childs: [{
		// Go to the pub
		type: 'sequence',
		childs: [{
			// Check if the character needs to eat
			type: 'leaf',
			action: aiIsHungry
		},
		{
			// Select an inn that can serve a meal
			type: 'selector',
			childs: [{
				// Select an inn that already can serve a meal
				type: 'leaf',
				action: aiSelectInnWithMeal
			},
			{
				// Put a meal in an inn, then select it
				type: 'sequence',
				childs: [{
					// Get someting edible in inventory
					type: 'selector',
					childs: [{
						// Already have it in inventory ?
						type: 'leaf',
						action: aiHaveEdibleInInventory
					},
					{
						// Take it from one of our building
						type: 'sequence',
						childs: [{
							type: 'leaf',
							action: aiSelectDynastyBuildingStockingEdible
						},
						{
							type: 'leaf',
							action: aiGoToBuilding
						},
						{
							type: 'leaf',
							action: aiTakeEdibleFromStock
						}]
					},
					{
						// Buy it from the market
						type: 'sequence',
						childs: [{
							type: 'leaf',
							action: aiSelectClearingHouseHavingEdible
						},
						{
							type: 'leaf',
							action: aiGoToBuilding
						},
						{
							type: 'leaf',
							action: aiBuyOneEdible
						}]
					}]
				},
				{
					// Select an inn to put our meal in
					type: 'selector',
					childs: [{
						type: 'leaf',
						action: aiSelectDynastyInn
					},
					{
						// Build an inn
						type: 'sequence',
						childs: [{
							type: 'leaf',
							action: aiSelectBuyableVacantLot
						},
						{
							type: 'leaf',
							action: aiGoToBuilding
						},
						{
							type: 'leaf',
							action: aiBuyVacantLot
						},
						{
							type: 'leaf',
							action: aiBuildInn
						},
						{
							type: 'leaf',
							action: aiSelectDynastyInn
						}]
					}]
				},
				{
					// Go to our inn
					type: 'leaf',
					action: aiGoToBuilding
				},
				{
					// Put our meal in our inn
					type: 'leaf',
					action: aiPutEdibleToStock
				}]
			}]
		},
		{
			// Go to the inn
			type: 'leaf',
			action: aiGoToBuilding
		},
		{
			// Take a meal
			type: 'leaf',
			action: aiTakeMeal
		}]
	},
	{
		// Walk to a random building
		type: 'sequence',
		childs: [{
			// Select a random building
			type: 'leaf',
			action: aiSelectRandomBuilding
		},
		{
			// Go to the building
			type: 'leaf',
			action: aiGoToBuilding
		}]
	}]
};
/*eslint-enable indent*/

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
		};
	}

	// Tick the behaviour tree
	behaviourtree.tick(character.aiContext['btdata'], character.aiContext);
}

function aiBuildInn(context) {
	return aiDoAction(context, {
		action: 'construct',
		buildingName: 'inn',
		actor: influence.characters[context['character']],
		originalLot: context['selectedBuilding'],
		callback: aiDefaultActionCallback
	});
}

function aiBuyOneEdible(context) {
	var edibles = ['pie', 'jam'];
	for (var i = 0; i < edibles.length; ++i) {
		if (context['selectedBuilding'].buy(context['character'], 'pie', 1)) {
			return behaviourtree.SUCCESS;
		}
	}
	return behaviourtree.FAIL;
}

function aiBuyVacantLot(context) {
	return aiDoAction(context, {
		action: 'buy',
		actor: influence.characters[context['character']],
		target: context['selectedBuilding'],
		callback: aiDefaultActionCallback
	});
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

function aiGoToBuilding(context) {
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
}

function aiHaveEdibleInInventory(context) {
	var character = influence.characters[context['character']];
	if (
		character.inventory.containItems('pie', 1) ||
		character.inventory.containItems('jam', 1)
	)
	{
		return behaviourtree.SUCCESS;
	}
	return behaviourtree.FAIL;
}

function aiIsHungry(context) {
	var hoursSinceLastMeal = (getGameDate().getTime() - context['lastEat'].getTime()) / (60*60*1000);
	if (hoursSinceLastMeal >= 24) {
		return behaviourtree.SUCCESS;
	}
	return behaviourtree.FAIL;
}

function aiPutEdibleToStock(context) {
	var character = influence.characters[context['character']];
	var building = context['selectedBuilding'];

	if (typeof building.stock == 'undefined') {
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

function aiSelectBuyableVacantLot(context) {
	return aiSelectBuilding(context, function(building) {
		return (
			building instanceof buildingVacantLot.VacantLot &&
			building.owner === null
		);
	});
}

function aiSelectClearingHouseHavingEdible(context) {
	return aiSelectBuilding(context, function(building) {
		return (
			building instanceof buildingClearingHouse.ClearingHouse && (
				building.have('pie') ||
				building.have('jam')
			)
		);
	});
}

function aiSelectDynastyBuildingStockingEdible(context) {
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
}

function aiSelectDynastyInn(context) {
	var dynastyIndex = influence.characters[context['character']].dynasty;
	return aiSelectBuilding(context, function(building) {
		return (
			building instanceof buildingInn.Inn &&
			building.owner == dynastyIndex
		);
	});
}

function aiSelectInnWithMeal(context) {
	return aiSelectBuilding(context, function(building) {
		return (
			building instanceof buildingInn.Inn && (
				building.stock.containItems('pie', 1) ||
				building.stock.containItems('jam', 1)
			)
		);
	});
}

function aiSelectRandomBuilding(context) {
	var buildings = getBuildingsList();
	var selected = Math.floor(Math.random() * buildings.length);
	context['selectedBuilding'] = buildings[selected];
	return behaviourtree.SUCCESS;
}

function aiTakeEdibleFromStock(context) {
	var character = influence.characters[context['character']];
	var building = context['selectedBuilding'];

	if (typeof building.stock == 'undefined') {
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
}

function aiTakeMeal(context) {
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
}
