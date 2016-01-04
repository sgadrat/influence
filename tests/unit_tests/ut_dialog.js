var ut_dialog = {
	TEXT_STEP_0: 'Do you need something ?',
	TEXT_STEP_1: 'You\'r a nice guy',
	TEXT_STEP_2: 'Bastard',
	TEXT_OPTION_0: 'Hello',
	TEXT_OPTION_1: 'Fuck you',
	TEXT_OPTION_2: 'Thanks',
	TEXT_OPTION_3: 'Sorry',
	TEXT_OPTION_4: 'Fuck off',

	getSampleDialog: function() {
		return {
			steps: [
				{
					text: ut_dialog.TEXT_STEP_0,
					options: [0, 1]
				},
				{
					text: ut_dialog.TEXT_STEP_1,
					options: [2]
				},
				{
					text: ut_dialog.TEXT_STEP_2,
					options: [3, 4]
				},
			],
			options: [
				{
					text: ut_dialog.TEXT_OPTION_0,
					nextStep: 1
				},
				{
					text: ut_dialog.TEXT_OPTION_1,
					nextStep: 2
				},
				{
					text: ut_dialog.TEXT_OPTION_2,
					nextStep: -1
				},
				{
					text: ut_dialog.TEXT_OPTION_3,
					action: {
						func: 'sorry',
						params: {}
					},
					nextStep: 0
				},
				{
					text: ut_dialog.TEXT_OPTION_4,
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
		};
	},

	run: function(assert) {
		var d = new Dialog(ut_dialog.getSampleDialog());
		assert.deepEqual(d.getOption(0).text, ut_dialog.TEXT_OPTION_0, "d.getOption(0).text == ut_dialog.TEXT_OPTION_0");
		assert.deepEqual(d.getOption(1).text, ut_dialog.TEXT_OPTION_1, "d.getOption(1).text == ut_dialog.TEXT_OPTION_1");
		assert.deepEqual(d.getOption(2).text, ut_dialog.TEXT_OPTION_2, "d.getOption(2).text == ut_dialog.TEXT_OPTION_2");
		assert.deepEqual(d.getOption(3).text, ut_dialog.TEXT_OPTION_3, "d.getOption(3).text == ut_dialog.TEXT_OPTION_3");
		assert.deepEqual(d.getOption(4).text, ut_dialog.TEXT_OPTION_4, "d.getOption(4).text == ut_dialog.TEXT_OPTION_4");
		assert.deepEqual(d.getOption(5), null, "d.getOption(5) === null");

		assert.deepEqual(d.currentStep(), 0, "d.currentStep() == 0");
		assert.deepEqual(d.currentText(), ut_dialog.TEXT_STEP_0, "d.currentText() == ut_dialog.TEXT_STEP_0");
		assert.deepEqual(d.currentOptions(), [0, 1], "d.currentOptions() == [0, 1]");

		d.takeOption(1);
		assert.deepEqual(d.currentStep(), 2, "d.currentStep() == 2");
		assert.deepEqual(d.currentText(), ut_dialog.TEXT_STEP_2, "d.currentText() == ut_dialog.TEXT_STEP_2");
		assert.deepEqual(d.currentOptions(), [3, 4], "d.currentOptions() == [3, 4]");

		d.takeOption(0);
		assert.deepEqual(d.currentStep(), 0, "d.currentStep() == 0");
		assert.deepEqual(d.currentText(), ut_dialog.TEXT_STEP_0, "d.currentText() == ut_dialog.TEXT_STEP_0");
		assert.deepEqual(d.currentOptions(), [0], "d.currentOptions() == [0]");

		d.takeOption(0);
		assert.deepEqual(d.currentStep(), 1, "d.currentStep() == 1");
		assert.deepEqual(d.currentText(), ut_dialog.TEXT_STEP_1, "d.currentText() == ut_dialog.TEXT_STEP_1");
		assert.deepEqual(d.currentOptions(), [2], "d.currentOptions() == [2]");

		d.takeOption(0);
		assert.deepEqual(d.currentStep(), null, "d.currentStep() === null");
		assert.deepEqual(d.currentText(), null, "d.currentText() === null");
		assert.deepEqual(d.currentOptions(), null, "d.currentOptions() === null");
	}
};

QUnit.test("Dialog", ut_dialog.run);
