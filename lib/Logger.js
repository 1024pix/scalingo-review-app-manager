function createMessage({ event, message, job, app }, level) {
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

const error = ({ event, message, job, app }, injectedLogger = console) => {
  injectedLogger.error(createMessage({ event, message, job, app }, 'error'));
};

const info = ({ event, message, job, app }, injectedLogger = console) => {
  injectedLogger.log(createMessage({ event, message, job, app }, 'info'));
};

const warn = ({ event, message, job, app }, injectedLogger = console) => {
  injectedLogger.warn(createMessage({ event, message, job, app }, 'warn'));
};

const ok = ({ event, message, job, app }, injectedLogger = console) => {
  injectedLogger.log(createMessage({ event, message, job, app }, 'ok'));
};

module.exports = {
  error,
  info,
  warn,
  ok,
};
