const { fork } = require('child_process');

module.exports = function Constructor(proc, options = { idleTime: 3000, taskLimit: Infinity }) {
  const queue = [];
  let running = false;

  let taskProcess = null;
  let taskCount = 0;
  let callback;

  let processorTimeout;
  let getTaskProcessor;

  function handleTask() {
    if (!running && queue.length > 0) {
      clearTimeout(processorTimeout);
      const task = queue.shift();

      callback = task.callback;
      taskCount += 1;
      running = true;
      getTaskProcessor().then(p => p.send(task.body));
    }
  }

  function initNewProcessor() {
    taskCount = 0;
    taskProcess = fork(proc);

    taskProcess.on('message', (msg) => {
      clearTimeout(processorTimeout);
      processorTimeout = setTimeout(() => {
        taskProcess.kill('SIGTERM');
      }, options.idleTime);

      callback((msg && !msg.error), msg);
      running = false;
      handleTask();
    });

    taskProcess.on('exit', () => {
      taskProcess = null;
    });
  }

  getTaskProcessor = () => new Promise((resolve) => {
    if (taskProcess === null) {
      initNewProcessor();
      resolve(taskProcess);
    } else if (taskCount >= options.taskLimit) {
      taskProcess.on('exit', () => {
        initNewProcessor();
        resolve(taskProcess);
      });
      taskProcess.kill('SIGTERM');
    } else {
      resolve(taskProcess);
    }
  });

  return Object.create({
    push(task, outerCallback) {
      return new Promise((resolve, reject) => {
        const localCallback = (success, msg) => {
          if (outerCallback && typeof outerCallback === 'function') {
            outerCallback(success, msg);
          }

          if (success) {
            resolve(msg);
          } else {
            reject(msg);
          }
        };

        queue.push({ body: task, callback: localCallback });
        handleTask();
      });
    }
  });
};
