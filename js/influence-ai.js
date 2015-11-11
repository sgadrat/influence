function aiBehaviourVillagerTick(character) {
	// Do nothing if already busy
	if (character.currentAction != 'idle') {
		return;
	}

	// Compute needs
	if (typeof character.lastEat == 'undefined') {
		character.lastEat = getGameDate();
	}
	var needEat = (getGameDate().getTime() - character.lastEat.getTime()) / (60*60*1000);

	if (needEat >= 24 && influence.dynasties[character.dynasty].wealth >= 500) {
		// Find inns that can serve a meal
		var buildings = getBuildingsList();
		var inns = [];
		for (var i = 0; i < buildings.length; ++i) {
			var building = buildings[i];
			if (building instanceof Inn) {
				if (building.stock.containItems('jam', 1) || building.stock.containItems('pie', 1)) {
					inns.push(building);
				}
			}
		}

		// Take action with elligible inns
		if (inns.length > 0) {
			// If already in an Inn, get a meal
			for (var i = 0; i < inns.length; ++i) {
				var inn = inns[i];
				if (inn.x == character.x && inn.y == character.y) {
					action_meal(character, inn);
					return;
				}
			}

			// Go to an Inn
			var selected = Math.floor(Math.random() * inns.length);
			var inn = inns[selected];
			action_goto(character, {x:inn.x, y:inn.y}, inn.indoor);
			return;
		}
	}

	/*Nothing special done, just go somewhere*/

	// Select somewhere to go
	var buildings = getBuildingsList();
	var selected = Math.floor(Math.random() * buildings.length);
	var building = buildings[selected];

	// Go
	action_goto(character, {x:building.x, y:building.y}, building.indoor);
}

function getBuildingsList() {
	var buildings = [];
	for (var i = 0; i < rtge.state.objects.length; ++i) {
		if (typeof rtge.state.objects[i].indoor != 'undefined') {
			buildings.push(rtge.state.objects[i]);
		}
	}
	return buildings;
}
