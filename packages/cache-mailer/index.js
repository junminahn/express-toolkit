/*!
 * cache-mailer
 * Copyright(c) 2019 Junmin Ahn
 * MIT Licensed
 */

const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');

const { isString, isNil, isArray, isPlainObject, readFileAsync } = require('./helpers');

const DEFAULT = Symbol('default symbol');
const NAME = Symbol('name symbol');

let _locals;

let _transports = Object.create(null);
const _templateEngines = Object.create(null);
const _templates = Object.create(null);
const _cached = Object.create(null);
const _options = Object.create(null);

const defaultTemplateEngine = {
  compile: v => () => v,
};

/**
 * Set a template engine by name; handlebars | ejs
 */
const setTemplateEngine = function (engineName) {
  if (_templateEngines[engineName]) return _templateEngines[engineName];
  if (!isString(engineName)) return defaultTemplateEngine;

  try {
    const engine = require(engineName);
    _templateEngines[engineName] = engine;
    return engine;
  } catch (err) {
    _templateEngines[engineName] = defaultTemplateEngine;
    return defaultTemplateEngine;
  }
};

/**
 * Set global mail data.
 */
const setLocals = function (locals = {}) {
  _locals = locals;
};

/**
 * Set options.
 *   cache: boolean | cache template data
 *   templateEngine: string | template engine name
 */
const setOptions = function (options = {}) {
  if (options.hasOwnProperty('templateEngine')) {
    const engineName = options.templateEngine;
    setTemplateEngine(engineName);
  }

  Object.assign(_options, options);
};

/**
 * Get handlebar instances for subject and html body.
 *   valueFn expects to be an asynchronous function returning template, subject.
 *   template expects to be an template string.
 *   templatePath expects to be an url of the template
 */
const getTemplate = function ({ template, templatePath, subject, valueFn, templateEngine }) {
  const engineName = isNil(templateEngine) ? _options.templateEngine : templateEngine;
  const engine = setTemplateEngine(engineName);

  if (valueFn) {
    return valueFn().then(({ template, subject }) => {
      return {
        subject: engine.compile(subject),
        html: engine.compile(template),
      };
    });
  }

  const templateProm = template
    ? Promise.resolve(template)
    : readFileAsync(templatePath).catch(err => {
        return 'no template';
      });

  return templateProm.then(template => {
    return {
      subject: engine.compile(subject, { filename: templatePath }),
      html: engine.compile(template, { filename: templatePath }),
    };
  });
};

/**
 * Register a single template.
 *   if cache option is set to true, store handlebar instances for subject and html body.
 *   if not, create handlebar instances as sending emails.
 */
const registerTemplate = function ({ key, template, templatePath, subject, valueFn, templateEngine }) {
  if (_options.cache) {
    return getTemplate({ template, templatePath, subject, valueFn, templateEngine }).then(({ subject, html }) => {
      _cached[key] = { subject, html };
      return _cached[key];
    });
  }

  _templates[key] = { template, templatePath, subject, valueFn, templateEngine };
  return Promise.resolve(_templates[key]);
};

/**
 * Register a single template or more than one templates.
 */
const registerTemplates = function (templates) {
  return isArray(templates) ? Promise.all(templates.map(registerTemplate)) : registerTemplate(templates);
};

/**
 * Send an email using node mailer.
 *   in this state, subject and html body are interpolated.
 */
const sendMail = function ({
  from = 'sender@example.com', // sender address
  to = 'receiver1@example.com, receiver2@example.com', // list of receivers
  subject = 'Hello World!', // Subject line
  html = '<b>Hello There?</b>', // html body
  text = htmlToText.fromString(html, { wordwrap: 130 }), // plain text body
}) {
  return new Promise((resolve, reject) => {
    // disable for now untile email works!
    this._smtpTransport.sendMail({ from, to, subject, text, html }, (err, info) => {
      if (err) reject(err);
      else {
        info.subject = subject;
        info.html = html;
        info.text = text;
        resolve(info);
      }
    });
  });
};

/**
 * Interpolate subject and html body with input data and send email.
 */
const sendEmail = function ({ key, data, receiver, sender, extraData }) {
  let templateProm;
  if (_options.cache) {
    if (!_cached[key]) return Promise.reject(new Error(`email template '${key}' has not been registered!`));
    templateProm = Promise.resolve(_cached[key]);
  } else {
    if (!_templates[key]) return Promise.reject(new Error(`email template '${key}' has not been registered!`));
    templateProm = getTemplate(_templates[key]);
  }

  return templateProm.then(template => {
    if (!template) throw new Error(`email template ${key} is not registered!`);

    const locals = Object.assign({}, { receiver, sender }, _locals, data, extraData);
    let subject;
    let html;

    try {
      subject = template.subject(locals);
      html = template.html(locals);
    } catch (err) {
      console.error(err);
      throw new Error('error found during generating a template');
    }

    if (!sender) sender = locals.sender;
    if (!sender) return Promise.reject(new Error('sender information is not provided!'));

    const options = {
      from: sender.email || sender,
      to: receiver.email || receiver,
      subject,
      html,
    };

    return this.sendMail(options);
  });
};

/**
 * Create a new mailer transport by key.
 */
const createTransport = function (key, options) {
  if (isPlainObject(key)) {
    options = key;
    key = DEFAULT;
  }

  const base = {
    _smtpTransport: nodemailer.createTransport(options),
    [NAME]: key,
  };

  base.sendMail = sendMail.bind(base);
  base.sendEmail = sendEmail.bind(base);

  const transport = middleware.bind(base);

  Object.assign(transport, base);

  _transports[key] = transport;
  return transport;
};

/**
 * Get a mailer transport by key.
 */
const getTransport = function (key = DEFAULT) {
  return _transports[key];
};

/**
 * Remove all mailer transports.
 */
const clearTransports = function () {
  _transports = Object.create(null);
};

/**
 * Set default options.
 */
setOptions({
  cache: false,
  templateEngine: DEFAULT,
});

/**
 * Derive extra data from Express app and request data.
 */
const getRequestData = req => {
  return {
    app: req.app.locals,
    req: {
      domain: req.domain,
      protocol: req.protocol,
      hostname: req.hostname,
      ip: req.ip,
      baseUrl: req.baseUrl,
      originalUrl: req.originalUrl,
      path: req.path,
      body: req.body,
      query: req.query,
      params: req.params,
      headers: req.headers,
      httpVersion: req.httpVersion,
    },
  };
};

/**
 * Express middle to include 'sendMail' and 'sendEmail' in req
 */
function middleware(options) {
  if (this[NAME] === 'root' && !isNil(options)) {
    createTransport(options);
  }

  return (req, res, next) => {
    const extraData = getRequestData(req);

    req.sendMail = this.sendMail.bind(this);

    req.sendEmail = ({ key, data, receiver, sender }) => {
      return this.sendEmail({ key, data, receiver, sender, extraData });
    };

    next();
  };
}

/**
 * Helper to find and invoke the target method in default transport
 */
const invokeDefaultTransportMethod = function (methodName, options) {
  const defaultTransport = getTransport();
  if (!defaultTransport) return undefined;

  return defaultTransport[methodName].call(defaultTransport, options);
};

/**
 * Cache mailer base methods
 */
const baseMailer = {
  createTransport,
  getTransport,
  clearTransports,
  setLocals,
  setOptions,
  registerTemplate,
  registerTemplates,
  sendMail: invokeDefaultTransportMethod.bind(this, 'sendMail'),
  sendEmail: invokeDefaultTransportMethod.bind(this, 'sendEmail'),
  [NAME]: 'root',
};

const CacheMailer = middleware.bind(baseMailer);
Object.assign(CacheMailer, baseMailer);

module.exports = CacheMailer;
