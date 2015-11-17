var AI_CHARACTER_BEHAVIOUR = {
	type: 'selector',
	childs: [
		// Go to the pub
		{
			type: 'sequence',
			childs: [
				// Check if the character needs to eat
				{
					type: 'leaf',
					action: aiIsHungry
				},
				// Select an inn that can serve a meal
				{
					type: 'leaf',
					action: aiSelectInnWithMeal
				},
				// Go to the inn
				{
					type: 'leaf',
					action: aiGoToBuilding
				},
				// Take a meal
				{
					type: 'leaf',
					action: aiTakeMeal
				}
			]
		},
		// Walk to a random building
		{
			type: 'sequence',
			childs: [
				// Select a random building
				{
					type: 'leaf',
					action: aiSelectRandomBuilding
				},
				// Go to the building
				{
					type: 'leaf',
					action: aiGoToBuilding
				},
			]
		}
	]
};

function aiBehaviourVillagerTick(character) {
	// Do nothing if already busy
	if (character.currentAction != 'idle') {
		return;
	}

	// Create context if not already done
	if (typeof character.aiContext === 'undefined') {
		character.aiContext = {
			'btdata': behaviourtree.initContext(AI_CHARACTER_BEHAVIOUR),
			'character': character.index,
			'lastEat': getGameDate(),
			'selectedBuilding': null,
		};
	}

	// Tick the behaviour tree
	behaviourtree.tick(character.aiContext['btdata'], character.aiContext);
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

function aiIsHungry(context) {
	var hoursSinceLastMeal = (getGameDate().getTime() - context['lastEat'].getTime()) / (60*60*1000);
	if (hoursSinceLastMeal >= 24) {
		return behaviourtree.SUCCESS;
	}
	return behaviourtree.FAIL;
}

function aiSelectInnWithMeal(context) {
	var buildings = getBuildingsList();
	var inns = [];
	for (var buildingIndex = 0; buildingIndex < buildings.length; ++buildingIndex) {
		var building = buildings[buildingIndex];
		if (building instanceof Inn) {
			if (building.stock.containItems('jam', 1) || building.stock.containItems('pie', 1)) {
				inns.push(building);
			}
		}
	}
	if (inns.length == 0) {
		return behaviourtree.FAIL;
	}
	var selectedInn = Math.floor(Math.random() * inns.length);
	context['selectedBuilding'] = inns[selectedInn];
	return behaviourtree.SUCCESS;
}

function aiSelectRandomBuilding(context) {
	var buildings = getBuildingsList();
	var selected = Math.floor(Math.random() * buildings.length);
	context['selectedBuilding'] = buildings[selected];
	return behaviourtree.SUCCESS;
}

function aiTakeMeal(context) {
	var character = influence.characters[context['character']];
	var inn = context['selectedBuilding'];

	// We are currently eating
	if (character.currentAction == 'meal') {
		return behaviourtree.RUNNING;
	}

	// We cannot eat if we are not at the inn
	if (inn === null) {
		return behaviourtree.FAIL;
	}
	if (inn.x != character.x || inn.y != character.y) {
		return behaviourtree.FAIL;
	}

	// We are at the inn and not eating, let's know if we have
	// ate somthing or failed badly
	//  context['ate'] contains usefull status for that:
	//   * 'ordered': we have ordered a meal
	//   * 'ate': we have successfully eat
	//   * something else: we don't even have ordered
	//  Since, we passed a previous check, we know we are not eating right now,
	//  so, if we ordered we did not received anything (somebody ate the last meal
	//  before us). So we failed to take a meal.
	if (typeof context['ate'] != 'undefined') {
		if (context['ate'] == 'ate') {
			context['lastEat'] = getGameDate();
			context['ate'] = 'finished';
			return behaviourtree.SUCCESS;
		}else if (context['ate'] == 'ordered') {
			context['ate'] = 'finished';
			return behaviourtree.FAIL;
		}
	}

	// We are in the inn but not have ordered yet, it's time to do it.
	character.executeAction({
		action: 'meal',
		actor: character,
		building: inn
	});
	context['ate'] = 'ordered';
	return behaviourtree.RUNNING;
}

function aiEventCharacterAte(characterIndex) {
	var character = influence.characters[characterIndex];
	if (typeof character.aiContext != 'undefined') {
		character.aiContext['ate'] = 'ate';
	}
}
