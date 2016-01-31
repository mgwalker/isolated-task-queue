"use strict";

var fork = require("child_process").fork;
var Promise = require("promise");

module.exports = function Constructor(proc) {
	var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	options.idleTime = Number(options.idleTime);
	options.taskLimit = Number(options.taskLimit);
	if (Number.isNaN(options.idleTime) || options.idleTime <= 0) {
		options.idleTime = 3000;
	}
	if (Number.isNaN(options.taskLimit)) {
		options.taskLimit = Infinity;
	}

	var queue = [];
	var running = false;

	var taskProcess = null,
	    taskCount = 0;
	var callback = undefined;

	var processorTimeout = undefined;
	var getTaskProcessor = undefined;

	function handleTask() {
		if (!running && queue.length > 0) {
			(function () {
				clearTimeout(processorTimeout);
				var task = queue.shift();

				callback = task.callback;
				taskCount++;
				running = true;
				getTaskProcessor().then(function (p) {
					return p.send(task.body);
				});
			})();
		}
	}

	function initNewProcessor() {
		taskCount = 0;
		taskProcess = fork(proc);

		taskProcess.on("message", function (msg) {
			clearTimeout(processorTimeout);
			processorTimeout = setTimeout(function () {
				taskProcess.kill("SIGTERM");
			}, options.idleTime);

			callback(msg && !msg.error, msg);
			running = false;
			handleTask();
		});

		taskProcess.on("exit", function () {
			taskProcess = null;
		});
	}

	getTaskProcessor = function getTaskProcessor() {
		return new Promise(function (resolve) {
			if (taskProcess === null) {
				initNewProcessor();
				resolve(taskProcess);
			} else if (taskCount >= options.taskLimit) {
				taskProcess.on("exit", function () {
					initNewProcessor();
					resolve(taskProcess);
				});
				taskProcess.kill("SIGTERM");
			} else {
				resolve(taskProcess);
			}
		});
	};

	return Object.create({
		push: function push(task, outerCallback) {
			return new Promise(function (resolve, reject) {
				var localCallback = function localCallback(success, msg) {
					if (outerCallback && typeof outerCallback === "function") {
						outerCallback(success, msg);
					}
					(success ? resolve : reject)(msg);
				};

				queue.push({ body: task, callback: localCallback });
				handleTask();
			});
		}
	});
};