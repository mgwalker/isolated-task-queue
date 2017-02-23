const tap = require('tap'); // eslint-disable-line import/no-extraneous-dependencies
const TaskQueue = require('../src/main.js');

const NUMBER_OF_TASKS = 300;

function kickOffProcesses(queue, data, callbackFn) {
  let callback = callbackFn;
  if (typeof callback !== 'function') {
    callback = undefined;
  }

  const allPromises = [];
  for (let i = 0; i < NUMBER_OF_TASKS; i += 1) {
    allPromises.push(queue.push(data, callback));
  }

  return allPromises;
}

function shouldFullfillPromiseAndCallback(expectSuccess, options, data, test) {
  let promisesDone = 0;
  let allResolved = true;
  let allRejected = true;
  let callbacks = 0;
  let allSucceeded = true;
  let allFailed = true;
  let maxTasks = 0;
  let taskLimit = Infinity;
  let totalTasksCompleted = 0;
  let promises;

  if (options && !Number.isNaN(Number(options.taskLimit))) {
    taskLimit = Number(options.taskLimit);
  }

  const checkDone = () => {
    if (promisesDone === promises.length && callbacks === NUMBER_OF_TASKS) {
      test.equal(true, (expectSuccess ? allResolved : allRejected), `All promises should ${expectSuccess ? 'resolve' : 'reject'}`);
      test.equal(true, (expectSuccess ? allSucceeded : allFailed), `${expectSuccess ? 'No' : 'All'} callbacks return an error`);
      test.equal(true, (maxTasks <= taskLimit), `No process exceeded its task limit (${maxTasks} <= ${taskLimit})`);
      test.equal(totalTasksCompleted, NUMBER_OF_TASKS, `All tasks (${totalTasksCompleted}) completed`);
      test.end();
    }
  };

  const promiseFinished = (output) => {
    promisesDone += 1;
    totalTasksCompleted += 1;
    if (output.messages > maxTasks) {
      maxTasks = output.messages;
    }
    checkDone();
  };

  const callback = (success, callbackData) => {
    callbacks += 1;
    allSucceeded = allSucceeded && success;
    allFailed = allFailed && !success;
    if (callbackData.messages > maxTasks) {
      maxTasks = callbackData.messages;
    }
    checkDone();
  };

  const queue = new TaskQueue(`./test/processes/${expectSuccess ? 'pass' : 'fail'}.js`, options);
  promises = kickOffProcesses(queue, data, callback);

  promises.forEach((promise) => {
    promise.then((output) => {
      allRejected = false;
      promiseFinished(output);
    }).catch((output) => {
      allResolved = false;
      promiseFinished(output);
    });
  });
}

const categories = [
  { name: 'With failing process', value: false },
  { name: 'With succeeding process', value: true }
];
const idleTimes = [
  { name: 'With no idle time ', value: undefined },
  { name: 'With non-numeric idle time', value: 'NaN' },
  { name: 'With numeric idle time', value: 50 }
];
const taskLimits = [
  { name: 'With no task limit ', value: undefined },
  { name: 'With non-numeric task limit', value: 'NaN' },
  { name: 'With numeric task limit', value: 10 }
];

categories.forEach((category) => {
  tap.test(category.name, (categoryTest) => {
    idleTimes.forEach((idleTime) => {
      categoryTest.test(idleTime.name, (idleTimeTest) => {
        taskLimits.forEach((taskLimit) => {
          idleTimeTest.test(taskLimit.name, (taskLimitTest) => {
            const obj = JSON.parse(JSON.stringify({
              idleTime: idleTime.value,
              taskLimit: taskLimit.value
            }));
            shouldFullfillPromiseAndCallback(category.value, obj, 'data', taskLimitTest);
          });
        });
        idleTimeTest.end();
      });
    });
    categoryTest.end();
  });
});
