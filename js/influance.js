function Building(x, y) {
	rtge.DynObject.call(this);
	this.x = x;
	this.y = y;

	this.actions = [
		'goto',
	];
}

function Case(x, y) {
	Building.call(this, x, y);
	this.animation = 'building.case';
}

function init() {
	var animations = {};

	var animBuildingCase = new rtge.Animation();
	animBuildingCase.steps = ['imgs/case.jpg'];
	animBuildingCase.durations = [600000];
	animations['building.case'] = animBuildingCase;

	rtge.init(
		'view',
		{
			'terrain': 'imgs/map.jpg',
			'objects': [
				new Case(2*16, 15*16),
				new Case(17*16, 39*16),
			]
		},
		animations,
		[],
		[
			'imgs/map.jpg',
			'imgs/case.jpg',
		],
		{}
	);
}
