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

	var buildings = getBuildingsList();
	var building;
	if (needEat >= 24 && influence.dynasties[character.dynasty].wealth >= 500) {
		// Find inns that can serve a meal
		var inns = [];
		for (var buildingIndex = 0; buildingIndex < buildings.length; ++buildingIndex) {
			building = buildings[buildingIndex];
			if (building instanceof Inn) {
				if (building.stock.containItems('jam', 1) || building.stock.containItems('pie', 1)) {
					inns.push(building);
				}
			}
		}

		// Take action with elligible inns
		if (inns.length > 0) {
			// If already in an Inn, get a meal
			var inn;
			for (var i = 0; i < inns.length; ++i) {
				inn = inns[i];
				if (inn.x == character.x && inn.y == character.y) {
					action_meal(character, inn);
					return;
				}
			}

			// Go to an Inn
			var selectedInn = Math.floor(Math.random() * inns.length);
			inn = inns[selectedInn];
			action_goto(character, {x:inn.x, y:inn.y}, inn.indoor);
			return;
		}
	}

	/*Nothing special done, just go somewhere*/

	// Select somewhere to go
	var selected = Math.floor(Math.random() * buildings.length);
	building = buildings[selected];
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
