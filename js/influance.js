var influance = {
	selected: null,
};

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

	this.portrait = 'imgs/case.jpg';

	this.click = function(x, y) {
		select(this);
	}
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
			'imgs/icons/action/goto.png',
		],
		{
			'worldClick': unselect
		}
	);
}

function select(o) {
	actions = [];
	for (var i = 0; i < o.actions.length; ++i) {
		actions.push({
			'icon': 'imgs/icons/action/'+ o.actions[i] +'.png',
			'action': o.actions[i]
		});
	}
	guiShowSelection(o.portrait, actions);

	influance.selected = o;
}

function unselect() {
	influance.selected = null;
	guiHideSelection();
}

function action_goto() {
}

function guiShowSelection(portrait, actions) {
	document.getElementById('selectportrait').src = portrait;
	var actionList = '';
	for (var i = 0; i < actions.length; ++i) {
		actionList += '<li><img src="'+ actions[i]['icon'] +'" onclick="action_'+ actions[i]['action'] +'()" /></li>';
	}
	document.getElementById('selectactions').innerHTML = actionList;
	document.getElementById('selection').style.visibility = 'visible';
}

function guiHideSelection() {
	document.getElementById('selection').style.visibility = 'hidden';
}
