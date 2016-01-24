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

function shouldFullfillPromise(shouldResolve, options, data, test) {
	var promisesDone = 0;
	var allResolved = true;
	var allRejected = true;
	var noProcessesExceedTaskLimit = true;
	var maxTasks = 0, taskLimit = Infinity;
	if(options && !Number.isNaN(Number(options.taskLimit))) {
		taskLimit = Number(options.taskLimit);
	}

	var promiseFinished = function(output) {
		promisesDone++;
		if(output.messages > maxTasks) {
			maxTasks = output.messages;
		}

		if(promisesDone == promises.length) {
			test.equal(true, (shouldResolve ? allResolved : allRejected), "All promises should " + (shouldResolve ? "resolve" : "reject"));
			test.equal(true, (maxTasks <= taskLimit), "No process exceeded its task limit (" + maxTasks + " <= " + taskLimit + ")");
			test.end();
		}
	}

	var queue = new TaskQueue("./test/processes/" + (shouldResolve ? "pass" : "fail") + ".js", options);
	var promises = kickOffProcesses(queue, data);

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

function shouldCallback(expectSuccess, options, data, test) {
	var callbacks = 0;
	var allSucceeded = true, allFailed = true;
	var maxTasks = 0, taskLimit = Infinity;
	if(options && !Number.isNaN(Number(options.taskLimit))) {
		taskLimit = Number(options.taskLimit);
	}

	var callback = function(success, data) {
		callbacks++;
		allSucceeded = allSucceeded && success;
		allFailed = allFailed && !success;
		if(data.messages > maxTasks) {
			maxTasks = data.messages;
		}

		if(callbacks == NUMBER_OF_PROCESSES) {
			test.equal(true, (expectSuccess ? allSucceeded : allFailed), (expectSuccess ? "No" : "All") + " callbacks return an error");
			test.equal(true, (maxTasks <= taskLimit), "No process exceeded its task limit (" + maxTasks + " <= " + taskLimit + ")");
			test.end();
		}
	};

	var queue = new TaskQueue("./test/processes/" + (expectSuccess ? "pass" : "fail") + ".js", options);
	kickOffProcesses(queue, data, callback);
}


tap.test("With failing process (promises)", function(highLevel) {
	highLevel.test("With undefined options", function(optionsTest) {
		shouldFullfillPromise(false, undefined, "test", optionsTest);
	});

	highLevel.test("With no idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldFullfillPromise(false, { }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldFullfillPromise(false, { taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldFullfillPromise(false, { taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a non-numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldFullfillPromise(false, { idleTime: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldFullfillPromise(false, { idleTime: "NaN", taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldFullfillPromise(false, { idleTime: "NaN", taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldFullfillPromise(false, { idleTime: 50 }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldFullfillPromise(false, { idleTime: 50, taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldFullfillPromise(false, { idleTime: 50, taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});
	highLevel.end();
});

tap.test("With failing process (callbacks)", function(highLevel) {
	highLevel.test("With undefined options", function(optionsTest) {
		shouldCallback(false, undefined, "test", optionsTest);
	});

	highLevel.test("With no idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldCallback(false, { }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldCallback(false, { taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldCallback(false, { taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a non-numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldCallback(false, { idleTime: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldCallback(false, { idleTime: "NaN", taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldCallback(false, { idleTime: "NaN", taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldCallback(false, { idleTime: 50 }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldCallback(false, { idleTime: 50, taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldCallback(false, { idleTime: 50, taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});
	highLevel.end();
});

tap.test("With suceeding process (promises)", function(highLevel) {
	highLevel.test("With undefined options", function(optionsTest) {
		shouldFullfillPromise(true, undefined, "test", optionsTest);
	});

	highLevel.test("With no idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldFullfillPromise(true, { }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldFullfillPromise(true, { taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldFullfillPromise(true, { taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a non-numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldFullfillPromise(true, { idleTime: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldFullfillPromise(true, { idleTime: "NaN", taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldFullfillPromise(true, { idleTime: "NaN", taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldFullfillPromise(true, { idleTime: 50 }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldFullfillPromise(true, { idleTime: 50, taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldFullfillPromise(true, { idleTime: 50, taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});
	highLevel.end();
});

tap.test("With suceeding process (callbacks)", function(highLevel) {
	highLevel.test("With undefined options", function(optionsTest) {
		shouldCallback(true, undefined, "test", optionsTest);
	});

	highLevel.test("With no idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldCallback(true, { }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldCallback(true, { taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldCallback(true, { taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a non-numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldCallback(true, { idleTime: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldCallback(true, { idleTime: "NaN", taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldCallback(true, { idleTime: "NaN", taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldCallback(true, { idleTime: 50 }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldCallback(true, { idleTime: 50, taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldCallback(true, { idleTime: 50, taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});
	highLevel.end();
});
