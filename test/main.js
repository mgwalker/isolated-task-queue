var Promise = require("promise");
var tap = require("tap");
var TaskQueue = require("../main.js");

var NUMBER_OF_PROCESSES = 10;

function kickOffProcesses(queue, data, callback) {
	if(typeof callback != "function") {
		callback = undefined;
	}

	var allPromises = [ ];
	for(var i = 0; i < NUMBER_OF_PROCESSES; i++) {
		allPromises.push(queue.push(data, callback));
	}

	return allPromises;
}

function shouldFullfillPromiseAndCallback(expectSuccess, options, data, test) {
	var promisesDone = 0;
	var allResolved = true, allRejected = true;
	var callbacks = 0;
	var allSucceeded = true, allFailed = true;
	var maxTasks = 0, taskLimit = Infinity;

	if(options && !Number.isNaN(Number(options.taskLimit))) {
		taskLimit = Number(options.taskLimit);
	}

	var checkDone = function() {
		if(promisesDone == promises.length && callbacks == NUMBER_OF_PROCESSES) {
			test.equal(true, (expectSuccess ? allResolved : allRejected), "All promises should " + (expectSuccess ? "resolve" : "reject"));
			test.equal(true, (expectSuccess ? allSucceeded : allFailed), (expectSuccess ? "No" : "All") + " callbacks return an error");
			test.equal(true, (maxTasks <= taskLimit), "No process exceeded its task limit (" + maxTasks + " <= " + taskLimit + ")");
			test.end();
		}
	}

	var promiseFinished = function(output) {
		promisesDone++;
		if(output.messages > maxTasks) {
			maxTasks = output.messages;
		}
		checkDone();
	}

	var callback = function(success, data) {
		callbacks++;
		allSucceeded = allSucceeded && success;
		allFailed = allFailed && !success;
		if(data.messages > maxTasks) {
			maxTasks = data.messages;
		}

		checkDone();
	};

	var queue = new TaskQueue("./test/processes/" + (expectSuccess ? "pass" : "fail") + ".js", options);
	var promises = kickOffProcesses(queue, data, callback);

	promises.forEach(function(promise) {
		promise.then(function(output) {
			allRejected = false;
			promiseFinished(output);
		}).catch(function(output) {
			allResolved = false;
			promiseFinished(output);
		});
	});
}

var categories = [
	{ name: "With failing process", value: false },
	{ name: "With succeeding process", value: true }
];
var idleTimes = [
	{ name: "With no idle time ", value: undefined },
	{ name: "With non-numeric idle time", value: "NaN" },
	{ name: "With numeric idle time", value: 50 }
];
var taskLimits = [
	{ name: "With no task limit ", value: undefined },
	{ name: "With non-numeric task limit", value: "NaN" },
	{ name: "With numeric task limit", value: 3 }
];

categories.forEach(function(category) {
	tap.test(category.name, function(categoryTest) {
		idleTimes.forEach(function(idleTime) {
			categoryTest.test(idleTime.name, function(idleTimeTest) {
				taskLimits.forEach(function(taskLimit) {
					idleTimeTest.test(taskLimit.name, function(taskLimitTest) {
						var obj = JSON.parse(JSON.stringify({
							idleTime: idleTime.value,
							taskLimit: taskLimit.value
						}));
						shouldFullfillPromiseAndCallback(category.value, obj, "data", taskLimitTest);
						//taskLimitTest.end();
					});
				})
				idleTimeTest.end();
			})
		});
		categoryTest.end();
	});
})
