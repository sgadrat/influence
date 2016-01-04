influence.dialogs = {
	'TestDialog': function() {
		var TEXT_STEP_0 = 'Puis-je vous aider ?';
		var TEXT_STEP_1 = 'Vous êtes fort sympathique';
		var TEXT_STEP_2 = 'Enculé';
		var TEXT_OPTION_0 = 'Bonjour';
		var TEXT_OPTION_1 = 'Va te faire';
		var TEXT_OPTION_2 = 'Merci';
		var TEXT_OPTION_3 = 'Désolé';
		var TEXT_OPTION_4 = 'Fait chier';

		return new Dialog({
			steps: [
				{
					text: TEXT_STEP_0,
					options: [0, 1]
				},
				{
					text: TEXT_STEP_1,
					options: [2]
				},
				{
					text: TEXT_STEP_2,
					options: [3, 4]
				},
			],
			options: [
				{
					text: TEXT_OPTION_0,
					nextStep: 1
				},
				{
					text: TEXT_OPTION_1,
					nextStep: 2
				},
				{
					text: TEXT_OPTION_2,
					nextStep: -1
				},
				{
					text: TEXT_OPTION_3,
					action: {
						func: 'sorry',
						params: {}
					},
					nextStep: 0
				},
				{
					text: TEXT_OPTION_4,
					nextStep: -1
				},
			],
			callbacks: {
				'sorry': function(dialog, stepId, optionId, params) {
					// Remove the insult from the first step
					dialog.steps[0].options = [0];

					// Go to the first step
					return 0;
				},
			},
			context: {}
		});
	},
};

function Dialog(data) {
	this.data = data;
	this.currentStepIndex = 0;
}

Dialog.prototype = {
	getOption: function(index) {
		var option = this.data.options[index];
		if (typeof option == 'undefined') {
			return null;
		}
		return option;
	},

	currentStep: function() {
		return this.currentStepIndex;
	},

	currentText: function() {
		var step = this.data.steps[this.currentStepIndex];
		if (typeof step == 'undefined') {
			return null;
		}
		return step.text;
	},

	currentOptions: function() {
		var step = this.data.steps[this.currentStepIndex];
		if (typeof step == 'undefined') {
			return null;
		}
		return step.options;
	},

	takeOption: function(index) {
		var step = this.data.steps[this.currentStepIndex];
		if (typeof step == 'undefined') {
			return;
		}

		var option = this.data.options[step.options[index]];
		if (typeof option == 'undefined') {
			return;
		}

		var nextStep = option.nextStep;
		if (typeof option.action != 'undefined') {
			nextStep = this.data.callbacks[option.action.func](
				this.data, this.currentStepIndex, index, option.action.params
			);
		}

		if (nextStep >= 0) {
			this.currentStepIndex = nextStep;
		}else {
			this.currentStepIndex = null;
		}
	}
};
