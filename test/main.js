var Promise = require("promise");
var tap = require("tap");
var TaskQueue = require("../main.js");

function kickOffProcesses(queue, data, count, callback) {
	if(Number.isNaN(Number(count))) {
		count = 20;
	}
	if(typeof count == "function") {
		callback = count;
	}
	if(typeof callback != "function") {
		callback = undefined;
	}

	var allPromises = [ ];
	for(var i = 0; i < count; i++) {
		allPromises.push(queue.push(data, callback));
	}

	return allPromises;
}

function shouldReject(options, data, test) {
	var promisesDone = 0;
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
			test.equal(true, allRejected, "All promises should reject");
			test.equal(true, (maxTasks <= taskLimit), "No process exceeded its task limit (" + maxTasks + " <= " + taskLimit + ")");
			test.end();
		}
	}

	var queue = new TaskQueue("./test/processes/fail.js", options);
	var promises = kickOffProcesses(queue, data);

	promises.forEach(function(promise) {
		promise.then(function(output) {
			allRejected = false;
			promiseFinished(output);
		}).catch(promiseFinished)
	});
}

function shouldHaveError(options, data, test) {
	var queue = new TaskQueue("./test/processes/fail.js", options);

	var callbacks = 0;
	var allFailed = true;
	var callback = function(success, data) {
		callbacks++;
		allFailed = allFailed && !success;

		if(callbacks == 20) {
			test.equal(allFailed, true, "All callbacks return an error");
			test.end();
		}
	};
	kickOffProcesses(queue, data, 20, callback);
}

function shouldResolve(options, data, test) {
	var queue = new TaskQueue("./test/processes/pass.js", options);
	Promise.all(kickOffProcesses(queue, data))
		.then(function() {
			test.equal(true, true, "Promises should resolve");
			test.end();
		})
		.catch(function() {
			test.equal(true, false, "Promises should resolve");
			test.end();
		});
}

function shouldNotHaveError(options, data, test) {
	var queue = new TaskQueue("./test/processes/pass.js", options);

	var callbacks = 0;
	var allPassed = true;
	var callback = function(success, data) {
		callbacks++;
		allFailed = allPassed && success;

		if(callbacks == 20) {
			test.equal(allPassed, true, "No callbacks return an error");
			test.end();
		}
	};
	kickOffProcesses(queue, data, 20, callback);
}

tap.test("With failing process (promises)", function(highLevel) {
	highLevel.test("With undefined options", function(optionsTest) {
		shouldReject(undefined, "test", optionsTest);
	});

	highLevel.test("With no idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldReject({ }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldReject({ taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldReject({ taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a non-numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldReject({ idleTime: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldReject({ idleTime: "NaN", taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldReject({ idleTime: "NaN", taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldReject({ idleTime: 50 }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldReject({ idleTime: 50, taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldReject({ idleTime: 50, taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});
	highLevel.end();
});

tap.test("With failing process (callbacks)", function(highLevel) {
	highLevel.test("With undefined options", function(optionsTest) {
		shouldHaveError(undefined, "test", optionsTest);
	});

	highLevel.test("With no idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldHaveError({ }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldHaveError({ taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldHaveError({ taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a non-numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldHaveError({ idleTime: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldHaveError({ idleTime: "NaN", taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldHaveError({ idleTime: "NaN", taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldHaveError({ idleTime: 50 }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldHaveError({ idleTime: 50, taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldHaveError({ idleTime: 50, taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});
	highLevel.end();
});

tap.test("With suceeding process (promises)", function(highLevel) {
	highLevel.test("With undefined options", function(optionsTest) {
		shouldResolve(undefined, "test", optionsTest);
	});

	highLevel.test("With no idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldResolve({ }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldResolve({ taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldResolve({ taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a non-numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldResolve({ idleTime: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldResolve({ idleTime: "NaN", taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldResolve({ idleTime: "NaN", taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldResolve({ idleTime: 50 }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldResolve({ idleTime: 50, taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldResolve({ idleTime: 50, taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});
	highLevel.end();
});

tap.test("With suceeding process (callbacks)", function(highLevel) {
	highLevel.test("With undefined options", function(optionsTest) {
		shouldNotHaveError(undefined, "test", optionsTest);
	});

	highLevel.test("With no idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldNotHaveError({ }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldNotHaveError({ taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldNotHaveError({ taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a non-numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldNotHaveError({ idleTime: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldNotHaveError({ idleTime: "NaN", taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldNotHaveError({ idleTime: "NaN", taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});

	highLevel.test("With a numeric idle time", function(idleTime) {
		idleTime.test("With no task limit", function(taskLimit) {
			shouldNotHaveError({ idleTime: 50 }, "test", taskLimit);
		});

		idleTime.test("With a non-numeric task limit", function(taskLimit) {
			shouldNotHaveError({ idleTime: 50, taskLimit: "NaN" }, "test", taskLimit);
		});

		idleTime.test("With a numeric task limit", function(taskLimit) {
			shouldNotHaveError({ idleTime: 50, taskLimit: 3 }, "test", taskLimit);
		});
		idleTime.end();
	});
	highLevel.end();
});
