"use strict";

const fork = require("child_process").fork;
const Promise = require("promise");

module.exports = function Constructor(proc, options) {
	if(!options) {
		options = { };
	}

	options.idleTime = +options.idleTime;
	options.taskLimit = +options.taskLimit;
	if(Number.isNaN(options.idleTime) || options.idleTime <= 0) {
		options.idleTime = 3000;
	}
	if(Number.isNaN(options.taskLimit)) {
		options.taskLimit = 0;
	}

	const queue = [ ];
	let running = false;

	let taskProcess = null, taskCount = 0;
	let callback;

	let processorTimeout;

	function handleTask() {
		if(!running && queue.length > 0) {
			clearTimeout(processorTimeout);
			var task = queue.shift();
			callback = task.callback;
			getTaskProcessor().then(p => p.send(task.body));
			taskCount++;
			running = true;
		}
	}

	function initNewProcessor() {
		taskCount = 0;
		taskProcess = fork(proc);

		taskProcess.on("message", function(msg) {
			clearTimeout(processorTimeout);
			processorTimeout = setTimeout(() => {
				taskProcess.kill();
			}, options.idleTime);

			callback((msg && !msg.error), msg);
			running = false;
			handleTask();
		});

		taskProcess.on("exit", function() {
			taskProcess = null;
		});
	}

	function getTaskProcessor() {
		return new Promise(function(resolve) {
			if(taskProcess === null) {
				initNewProcessor();
				resolve(taskProcess);
			} else if(taskCount >= options.taskLimit) {
				taskProcess.on("exit", function() {
					initNewProcessor();
					resolve(taskProcess);
				});
				taskProcess.kill();
			} else {
				resolve(taskProcess);
			}
		});
	}

	return Object.create({
		push: function(task, outerCallback) {
			return new Promise(function(resolve, reject) {
				const localCallback = function(success, msg) {
					if(outerCallback && typeof outerCallback === "function") {
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
