"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
class IsolatedTaskQueue {
    constructor(proc, options = { idleTime: 3000, taskLimit: Infinity }) {
        this.callback = null;
        this.queue = [];
        this.running = false;
        this.taskCount = 0;
        this.taskProcess = null;
        this.procPath = proc;
        this.opts = options;
    }
    getTaskProcessor() {
        return new Promise(resolve => {
            if (this.taskProcess === null) {
                this.initNewProcessor();
                resolve(this.taskProcess);
            }
            else if (this.taskCount >= this.opts.taskLimit) {
                this.taskProcess.on('exit', () => {
                    this.initNewProcessor();
                    resolve(this.taskProcess);
                });
                this.taskProcess.kill('SIGTERM');
            }
            else {
                resolve(this.taskProcess);
            }
        });
    }
    handleTask() {
        if (!this.running && this.queue.length > 0) {
            clearTimeout(this.processorTimeout);
            const task = this.queue.shift();
            this.callback = task.callback;
            this.taskCount += 1;
            this.running = true;
            this.getTaskProcessor().then(p => p.send(task.body));
        }
    }
    initNewProcessor() {
        this.taskCount = 0;
        this.taskProcess = child_process_1.fork(this.procPath);
        this.taskProcess.on('message', msg => {
            clearTimeout(this.processorTimeout);
            this.processorTimeout = setTimeout(() => {
                this.taskProcess.kill('SIGTERM');
            }, this.opts.idleTime);
            this.callback(msg && !msg.error, msg);
            this.running = false;
            this.handleTask();
        });
        this.taskProcess.on('exit', () => {
            this.taskProcess = null;
        });
    }
    push(data, callback) {
        return new Promise((resolve, reject) => {
            const localCallback = (success, msg) => {
                if (callback && typeof callback === 'function') {
                    callback(success, msg);
                }
                if (success) {
                    resolve(msg);
                }
                else {
                    reject(msg);
                }
            };
            this.queue.push({ body: data, callback: localCallback });
            this.handleTask();
        });
    }
}
module.exports = IsolatedTaskQueue;
