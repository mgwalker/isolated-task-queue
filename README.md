[![npm version](https://badge.fury.io/js/isolated-task-queue.svg)](http://badge.fury.io/js/isolated-task-queue) [![Dependency Status](https://david-dm.org/mgwalker/isolated-task-queue.svg)](https://david-dm.org/mgwalker/isolated-task-queue)
# isolated-task-queue

A simple node module to execute tasks on an isolated process by forking it.  "Isolated" here means from the rest of your process; by default, all tasks dispatched to the queue will be executed on the same forked process, so they are not isolated from each other.  However, there is an idle timeout as well as an optional maximum task limit to provide isolation between tasks if desired.

## Installation

```
npm install --save isolated-task-queue
```

## Usage

First create a new queue, passing it the path to the module that should be used to execute tasks.  This will typically be a path to a Javascript file, as this will be used to fork a child process (see: [node:child_process.fork](https://nodejs.org/api/child_process.html#child_process_child_process_fork_modulepath_args_options)).

```javascript
var TaskQueue = require("isolated-task-queue");
var myQueue = new TaskQueue("./taskRunner.js");
```

The constructor also accepts a second `options` argument, specifying the queue process idle timeout and maximum number of tasks before starting a new process.  The `options` argument looks like this:

```javascript
{
   idleTime: 10000,
   taskLimit: 0
}
```

`idleTime` determines how long the forked process can sit idle before being killed.  If a new task arrives after the forked process was killed, a new one will be created an the idle timer will be restarted.  Each new task resets the timer.

`taskLimit` determines the maximum number of tasks to execute on a forked process before starting a new one.  It defaults to 0, which means no limit.  Setting this to 1 will effectively isolate each task.

Once the queue is created, simply push task information into it:

```javascript
myQueue.push({ stuff: "for the", task: "to", consume: true });
```

The `push` method takes an optional callback whose first argument indicates success or failure (see below to see how success is determined) and whose second argument is the object returned by the task process.  The `push` method also returns a promise which resolves if the callback's first argument would be `true` and rejects if its first argument would be `false`.

## Task Runner

Your task runner will receive one message for each task that is enqueued (this is sequential, so the task runner will never be expected to handle more than one task at a time).  Your runner should look basically like this:

```javascript
process.on("message", function(taskObject) {
	// do stuff with taskObject, which was passed in from myQueue.push()
	process.send({ stuff: "that goes", back: "out" });
});
```

Note that without the `process.send` call, the task is never completed and no additional tasks will ever execute.  The one argument to `process.send` is the object to be sent back to your callback or resolved by the promise.  If this object contains a field called `error` that is not falsey, then the callback's first argument will be `false` and the promise will reject.  Otherwise, the callback's first argument will be `true` and the promise will resolve.
