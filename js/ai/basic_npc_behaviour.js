influence.aiGraphs['basic_npc_behaviour'] = `
?
	%daily_tasks
	%walk_around
`;

influence.aiGraphs['daily_tasks'] = `
?
	%go_to_the_pub
	%go_to_work
`;

influence.aiGraphs['go_to_the_pub'] = `
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
`;

influence.aiGraphs['go_to_work'] = `
->                            (Go to work)
	HasJob
	!
		WorkedToday
	SelectWorkPlace
	GoTo
	Work
`;

influence.aiGraphs['walk_around'] = `
->                            (Juste take a walk around the town)
	SelectRandomBuilding
	GoTo
`;

var AI_CHARACTER_BEHAVIOUR = null;

influence.aiInit.push(function() {
	AI_CHARACTER_BEHAVIOUR = aiCompileBehaviourTree(influence.aiGraphs['basic_npc_behaviour']);
});

influence.aiBehaviours['BasicNpcBehaviour'] = function(character) {
	// Do nothing if already busy
	if (character.currentAction != 'idle') {
		return;
	}

	// Create context if not already done
	if (typeof character.aiContext === 'undefined') {
		character.aiContext = aiCreateCharacterContext(character.index, AI_CHARACTER_BEHAVIOUR);
	}

	// Tick the behaviour tree
	behaviourtree.tick(character.aiContext['btdata'], character.aiContext);
};
