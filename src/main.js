const fork = require("child_process").fork;
const Promise = require("promise");

module.exports = function Constructor(proc, options = { }) {
	options.idleTime = Number(options.idleTime);
	options.taskLimit = Number(options.taskLimit);
	if (Number.isNaN(options.idleTime) || options.idleTime <= 0) {
		options.idleTime = 3000;
	}
	if (Number.isNaN(options.taskLimit)) {
		options.taskLimit = Infinity;
	}

	const queue = [ ];
	let running = false;

	let taskProcess = null, taskCount = 0;
	let callback;

	let processorTimeout;
	let getTaskProcessor;

	function handleTask() {
		if (!running && queue.length > 0) {
			clearTimeout(processorTimeout);
			const task = queue.shift();

			callback = task.callback;
			taskCount++;
			running = true;
			getTaskProcessor().then(p => p.send(task.body));
		}
	}

	function initNewProcessor() {
		taskCount = 0;
		taskProcess = fork(proc);

		taskProcess.on("message", function(msg) {
			clearTimeout(processorTimeout);
			processorTimeout = setTimeout(() => {
				taskProcess.kill("SIGTERM");
			}, options.idleTime);

			callback((msg && !msg.error), msg); // eslint-disable-line callback-return
			running = false;
			handleTask();
		});

		taskProcess.on("exit", function() {
			taskProcess = null;
		});
	}

	getTaskProcessor = function() {
		return new Promise(function(resolve) {
			if (taskProcess === null) {
				initNewProcessor();
				resolve(taskProcess);
			} else if (taskCount >= options.taskLimit) {
				taskProcess.on("exit", function() {
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
		push: function(task, outerCallback) {
			return new Promise(function(resolve, reject) {
				const localCallback = function(success, msg) {
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
