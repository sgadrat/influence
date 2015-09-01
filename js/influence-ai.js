function aiBehaviourVillagerTick(character) {
	// Do nothing if already busy
	if (character.currentAction != 'idle') {
		return;
	}

	// Select somewhere to go
	var buildings = [];
	for (var i = 0; i < rtge.state.objects.length; ++i) {
		if (typeof rtge.state.objects[i].indoor != 'undefined') {
			buildings.push(rtge.state.objects[i]);
		}
	}
	selected = Math.floor(Math.random() * buildings.length);
	var building = buildings[selected];

	// Go
	action_goto(character, {x:building.x, y:building.y}, building.indoor);
}
