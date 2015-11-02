influence.gods = [
    {
		name: 'Athena',
		dynasties: []
	},
    {
		name: 'Bacchus',
		dynasties: []
	},
];

function godsEventNewDynasty() {
	godsForEach(function(god) {
		god.dynasties.push({
			blessing: 100
		});
	});
}

function godsPray(character) {
	influence.gods[0].dynasties[character.dynasty].blessing += 1;
	guiEventGodsModified();
}

function godsUpdate() {
	var currentDate = getGameDate();
	godsForEach(function(god) {
		for (var i = 0; i < god.dynasties.length; ++i) {
			if (god.dynasties[i].blessing > 0) {
				god.dynasties[i].blessing--;
			}
		}
	});
	guiEventGodsModified();
}

function godsForEach(fn) {
	for (var i = 0; i < influence.gods.length; ++i) {
		fn(influence.gods[i]);
	}
}
