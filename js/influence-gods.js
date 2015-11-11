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

const GODS_MS_PER_DAY = 24 * 60 * 60 * 1000;

const godsMissions = [
	{
		minBlessing: 5,
		maxBlessing: 100,
		create: function(godId, dynastyId) {
			var nbDays = 10;
			return {
				description: 'Aller au temple et prier',
				reward: 10,
				penalty: 20,
				begin: getGameDate(),
				end: new Date(getGameDate().getTime() + nbDays * GODS_MS_PER_DAY),
				god: godId,
				dynasty: dynastyId,
				onPray: function(character) {
					if (character.dynasty == this.dynasty) {
						godsMissionComplete(this.god, this.dynasty);
					}
				},
				onUpdate: function() {
					if (getGameDate() >= this.end) {
						godsMissionFailed(this.god, this.dynasty);
					}
				}
			};
		}
	}
];

function godsEventNewDynasty() {
	for (var godId = 0; godId < influence.gods.length; ++godId) {
		var god = influence.gods[godId];
		god.dynasties.push({
			blessing: 100,
			mission: null
		});
	}
}

function godsPray(character) {
	influence.gods[0].dynasties[character.dynasty].blessing += 1;
	for (var godId = 0; godId < influence.gods.length; ++godId) {
		var god = influence.gods[godId];
		for (var dynastyId = 0; dynastyId < god.dynasties.length; ++dynastyId) {
			var mission = god.dynasties[dynastyId].mission;
			if (mission !== null && mission.hasOwnProperty('onPray')) {
				mission.onPray(character);
			}
		}
	}
	guiEventGodsModified();
}

function godsUpdate() {
	for (var godId = 0; godId < influence.gods.length; ++godId) {
		var god = influence.gods[godId];
		for (var dynastyId = 0; dynastyId < god.dynasties.length; ++dynastyId) {
			var dynasty = god.dynasties[dynastyId];
			if (dynasty.blessing > 0) {
				dynasty.blessing--;
			}
			if (dynasty.mission === null) {
				dynasty.mission = godsSelectMission(godId, dynastyId);
			}else {
				dynasty.mission.onUpdate();
			}
		}
	}
	guiEventGodsModified();
}

function godsMissionComplete(godId, dynastyId) {
	var god = influence.gods[godId];
	var dynasty = god.dynasties[dynastyId];
	dynasty.blessing += dynasty.mission.reward;
	dynasty.mission = null;
	guiEventGodsModified();
}

function godsMissionFailed(godId, dynastyId) {
	var god = influence.gods[godId];
	var dynasty = god.dynasties[dynastyId];
	dynasty.blessing -= Math.min(dynasty.mission.penalty, dynasty.blessing);
	dynasty.mission = null;
	guiEventGodsModified();
}

function godsSelectMission(godId, dynastyId) {
	var dynastyBlessing = influence.gods[godId].dynasties[dynastyId].blessing;
	for (var missionTemplateId = 0; missionTemplateId < godsMissions.length; ++missionTemplateId) {
		var missionTemplate = godsMissions[missionTemplateId];
		if (missionTemplate.minBlessing <= dynastyBlessing && dynastyBlessing <= missionTemplate.maxBlessing) {
			return missionTemplate.create(godId, dynastyId);
		}
	}
	return null;
}
