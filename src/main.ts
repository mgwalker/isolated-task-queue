// We need to import the type, but the eslint rule doesn't understand that
// imported types are, in fact, used. :)
/* eslint-disable-next-line no-unused-vars */
import { fork, ChildProcess } from 'child_process';

interface ConstructorOptions {
  idleTime: number;
  taskLimit: number;
}

type PushCallback = (success: boolean, message: any) => any;

interface QueueItem {
  body: any;
  callback: PushCallback;
}

class IsolatedTaskQueue {
  private callback: PushCallback = null;
  private opts: ConstructorOptions;
  private procPath: string;
  private processorTimeout: NodeJS.Timeout;
  private queue: Array<QueueItem> = [];
  private running: boolean = false;
  private taskCount: number = 0;
  private taskProcess: ChildProcess = null;

  constructor(
    proc: string,
    options: ConstructorOptions = { idleTime: 3000, taskLimit: Infinity }
  ) {
    this.procPath = proc;
    this.opts = options;
  }

  private getTaskProcessor(): Promise<ChildProcess> {
    return new Promise(resolve => {
      if (this.taskProcess === null) {
        this.initNewProcessor();
        resolve(this.taskProcess);
      } else if (this.taskCount >= this.opts.taskLimit) {
        this.taskProcess.on('exit', () => {
          this.initNewProcessor();
          resolve(this.taskProcess);
        });
        this.taskProcess.kill('SIGTERM');
      } else {
        resolve(this.taskProcess);
      }
    });
  }

  private handleTask() {
    if (!this.running && this.queue.length > 0) {
      clearTimeout(this.processorTimeout);
      const task = this.queue.shift();

      this.callback = task.callback;
      this.taskCount += 1;
      this.running = true;
      this.getTaskProcessor().then(p => p.send(task.body));
    }
  }

  private initNewProcessor() {
    this.taskCount = 0;
    this.taskProcess = fork(this.procPath);

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

  public push(data: Object, callback?: PushCallback): Promise<any> {
    return new Promise((resolve, reject) => {
      const localCallback = (success, msg) => {
        if (callback && typeof callback === 'function') {
          callback(success, msg);
        }

        if (success) {
          resolve(msg);
        } else {
          reject(msg);
        }
      };

      this.queue.push({ body: data, callback: localCallback });
      this.handleTask();
    });
  }
}

module.exports = IsolatedTaskQueue;
