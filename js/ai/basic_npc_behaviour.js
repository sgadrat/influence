influence.aiGraphs['basic_npc_behaviour'] = `
?
	%go_to_the_pub
	%go_to_work
	%construct
	%optimize_production
	%walk_around
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
	!
		SelectDynastyBuildingOfType
	BuildSelectedType
`;

influence.aiGraphs['optimize_production'] = `
->                            (Try to find somewhere to do something usefull)
	SelectRandomDynastyBuilding
	GoTo
	->
		=
			->                    (Put items consumed by the building in stocks)
				SelectItemTypesNeededByBuilding
				PutSomeItemsToStock
		=
			OptimizeProduction
		->                    (Take produced items in our inventory)
			SelectItemTypesProducedByBuilding
			TakeSomeItemsFromStock
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
		character.aiContext = {
			'actionstate': {},
			'btdata': behaviourtree.initContext(AI_CHARACTER_BEHAVIOUR),
			'character': character.index,
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
			character.aiContext['workHappiness'].push(100);
		}
	}

	// Tick the behaviour tree
	behaviourtree.tick(character.aiContext['btdata'], character.aiContext);
};
