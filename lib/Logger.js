class Logger {

  error = ({ event, message, job, app }, injectedLogger = console) => {
    injectedLogger.error(this.#createMessage({ event, message, job, app }, 'error'));
  };

  info = ({ event, message, job, app }, injectedLogger = console) => {
    injectedLogger.log(this.#createMessage({ event, message, job, app }, 'info'));
  };

  warn = ({ event, message, job, app }, injectedLogger = console) => {
    injectedLogger.warn(this.#createMessage({ event, message, job, app }, 'warn'));
  };

  ok = ({ event, message, job, app }, injectedLogger = console) => {
    injectedLogger.log(this.#createMessage({ event, message, job, app }, 'ok'));
  };

  #createMessage({ event, message, job, app }, level) {
    let obj = {};

    if (event) {
      obj.event = event;
    }

    if (message) {
      if (typeof message === 'object') {
        message = JSON.stringify(message);
      }

      obj.message = message;
    }

    if (job) {
      obj.job = job;
    }

    if (app) {
      if (typeof app === 'object') {
        app = JSON.stringify(message);
      }

      obj.app = app;
    }

    obj.level = level;

    return JSON.stringify(obj);
  }
}

const logger = new Logger();
export { logger }
