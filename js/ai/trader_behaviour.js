influence.aiGraphs['trader_behaviour'] = `
?
	%daily_tasks
	%refill_building
	->
		=
			%optimize_production
		%walk_around
`;

influence.aiGraphs['optimize_production'] = `
->                            (Try to find somewhere to do something usefull)
	SelectRandomDynastyBuilding
	GoTo
	OptimizeProduction
`;

influence.aiGraphs['refill_building'] = `
?
	->       (Refill a building with what is in our pocket)
		SelectItemTypesInInventory
		?
			SelectDynastyBuildingLackingItemTypes
			SelectDynastyBuildingNeedingItemTypes
		SelectItemTypesNeededByBuilding
		GoTo
		PutSomeItemsToStock
		OptimizeProduction
	->       (Find something usefull for our buildings)
		?
			->
				SelectDynastyBuildingLackingItems
				SelectItemTypesLackedByBuilding
			->
				SelectRandomDynastyBuilding
				SelectItemTypesNeededByBuilding
		?
			->
				SelectDynastyBuildingWithUnusedItemTypes
				GoTo
				TakeSomeItemsFromStock
			->
				SelectMarketWithItemTypes
				GoTo
				BuyItemTypes
`;

var AI_TRADER_BEHAVIOUR = null;

influence.aiInit.push(function() {
	AI_TRADER_BEHAVIOUR = aiCompileBehaviourTree(influence.aiGraphs['trader_behaviour']);
});

influence.aiBehaviours['TraderBehaviour'] = function(character) {
	// Do nothing if already busy
	if (character.currentAction != 'idle') {
		return;
	}

	// Create context if not already done
	if (typeof character.aiContext === 'undefined') {
		character.aiContext = aiCreateCharacterContext(character.index, AI_TRADER_BEHAVIOUR);
	}

	// Tick the behaviour tree
	behaviourtree.tick(character.aiContext['btdata'], character.aiContext);
};
