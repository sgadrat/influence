influence.aiGraphs['builder_behaviour'] = `
?
	%construct
	%daily_tasks
	%walk_around
`;

influence.aiGraphs['construct'] = `
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
	BuildSelectedType
`;

var AI_BUILDER_BEHAVIOUR = null;

influence.aiInit.push(function() {
	AI_BUILDER_BEHAVIOUR = aiCompileBehaviourTree(influence.aiGraphs['builder_behaviour']);
});

influence.aiBehaviours['BuilderBehaviour'] = function(character) {
	// Do nothing if already busy
	if (character.currentAction != 'idle') {
		return;
	}

	// Create context if not already done
	if (typeof character.aiContext === 'undefined') {
		character.aiContext = aiCreateCharacterContext(character.index, AI_BUILDER_BEHAVIOUR);
	}

	// Tick the behaviour tree
	behaviourtree.tick(character.aiContext['btdata'], character.aiContext);
};
