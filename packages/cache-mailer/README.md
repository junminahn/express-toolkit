# cache-mailer

Simple email sender with handlebars / ejs

## Installation
```sh
$ npm install cache-mailer
```

## Simple and easy way to register templates

cache-mailer provides a easy way to register teamplates by key and send emails with minimum required information.

```js
const mailer = require('cache-mailer');

mailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: ...,
    pass: ...,
  }
});

await mailer.registerTemplates([{
  key: 'signup',
  template: '<p>Dear {{user.name}},<br>...',
  subject: 'Welcome',
}, {
  key: 'checkout',
  template: '<p>Dear {{user.name}},<br>...',
  subject: 'Checked out',
}]);

await mailer.sendEmail({
  key: 'signup',
  receiver: 'guest@guests.com',
  sender: 'mailer@mails.com'
});
```

## Table of contents

- [createTransport](#createTransport)
- [getTransport](#getTransport)
- [clearTransports](#clearTransports)
- [registerTemplate](#registerTemplate)
- [registerTemplates](#registerTemplates)
- [sendMail](#sendMail)
- [sendEmail](#sendEmail)
- [setLocals](#setLocals)
- [setOptions](#setOptions)
- [Express Middleware](#ExpressMiddleware)


---


## createTransport

You can set node-mailer's SMTP transport options.
(https://nodemailer.com/smtp/).


```js
mailer.createTransport({
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: ...,
    pass: ...,
  }
});
```

It also allows to create more than one transports by key.

```js
mailer.createTransport('provider1', {
  host: "smtp.ethereal.email",
  port: 587,
  secure: false,
  auth: {
    user: ...,
    pass: ...,
  }
});
```


[back to top](#table-of-contents)


---


## getTransport

You can retrieve a mailer transport by its key.


```js
const myTransport = mailer.getTransport('provider1');
```

It returns the default mailer transport if defined with empty key.

```js
const defaultTransport = mailer.getTransport();
```


[back to top](#table-of-contents)


---


## clearTransports

It clears all registered mailer transports.


```js
mailer.clearTransports();
```


[back to top](#table-of-contents)


---


## registerTemplate
## registerTemplates

You can register template(s) by key in various ways.
- as template string
- as template path
- as async function returning a template string and a subject

This method takes single template or array of templates.

```js
await mailer.registerTemplate({
  key: 'signup',
  template: '<p>Dear {{user.name}},<br>...',
  subject: 'Welcome',
});

await mailer.registerTemplates([{
  key: 'signup',
  template: '<p>Dear {{user.name}},<br>...',
  subject: 'Welcome',
}, {
  key: 'checkout',
  template: '<p>Dear {{user.name}},<br>...',
  subject: 'Checked out',
}]);
```

You can specify a template engine for each template.
It will override the default template engine defined by 'setOptions' method.

```js
await mailer.registerTemplate({
  key: 'invitation',
  template: '<p>Dear <%= user.name %>,<br>...',
  subject: 'Invitation to ...',
  templateEngine: 'ejs',
});
```

### Register a template as a template string

```js
await mailer.registerTemplate({
  key: 'signup',
  template: '<p>Dear {{user.name}},<br>...',
  subject: 'Welcome',
});
```

### Register a template as a template path
The template path is an absolute path and using 'path.resolve' is a suggested way to get the path.

```js
const path = require('path');

await mailer.registerTemplate({
  key: 'signup',
  templatePath: path.resolve('./signup.email.html'),
  subject: 'Welcome',
});
```

### Register a template as a value function
The value function is expected to return both template and subject to cover a case of retrieving them from db.
In case of db is the source of the templates, disable 'cache' option to get the current ones when sending emails.

```js
await mailer.registerTemplate({
  key: 'signup',
  valueFn: () => Promise.resolve({ template: '<p>Dear {{user.name}},<br>...', subject: 'Welcome' }),
});

await mailer.registerTemplate({
  key: 'signup',
  valueFn: () => {
    const Template = mongoose.model('Template');
    return Template.findOne({ key: 'signup' }).then(({ template, subject }) => { template, subject });
  }),
});
```


[back to top](#table-of-contents)


---


## sendMail

You can send an email directry without templating.

```js
await mailer.sendMail({
  from: 'sender@example.com', // sender address
  to: 'receiver1@example.com, receiver2@example.com', // list of receivers
  subject: 'Hello World!', // Subject line
  html: '<b>Hello There?</b>', // html body
  text: Hello There?, // plain text body; optional
});
```

'text' is an optional argument, and it will be derived from html string if omitted.

You can also send an email with a specific mailer transport.
```js
const myTransport = mailer.getTransport('provider1');
await myTransport.sendMail({
  ...
});
```


[back to top](#table-of-contents)


---


## sendEmail

You can send an email by key with template data.

```js
await mailer.sendEmail({
  key: 'signup',
  receiver: 'guest@guests.com',
  sender: 'mailer@mails.com',
  data: { token: 'abcdefg' }
});
```

Before sending an email, subject and template html will be interpolated with data.
(the below example use 'handlebars' syntax)

```html
<p>You can find your link below.</p>
<a href="http://www.test.com/api/signup/{{token}}" target="_blank">Link</a>
```

will be interpolated with data { token: 'abcdefg' }

```html
<p>You can find your link below.</p>
<a href="http://www.test.com/api/signup/abcdefg" target="_blank">Link</a>
```

You can also send an email with a specific mailer transport.
```js
const myTransport = mailer.getTransport('provider1');
await myTransport.sendEmail({
  ...
});
```


[back to top](#table-of-contents)


---


## setLocals

You can set global template data to use in any email templates.

```js
mailer.setLocals({ sender: 'mailer@mails.com' });
await mailer.sendEmail({
  key: 'signup',
  receiver: 'guest@guests.com',
  data: { token: 'abcdefg' }
});
```

[back to top](#table-of-contents)


---


## setOptions

1. 'cache' option; defaults to false
- if true, it caches handlebar/ ejs instances created with subject and template html
* it won't update cached templates once cached, so in case of db changes, need to register the template again
or just disable 'cache' option.

2. 'templateEngine' option; defaults to 'none' (no templating)
- cache-mailer supports two template engines for now; 'handlebars' and 'ejs'
- since 'handlebars' and 'ejs' are peer dependencies of cache-mailer, it is required to install one or both to set engine and interpolate templates.

```js
mailer.setOptions({ cache: true, templateEngine: 'handlebars' });
await mailer.registerTemplate(...);
```

[back to top](#table-of-contents)


---


## Express Middleware

You can bind 'sendMail' and 'sendEmail' method to request instances and find request-specific data into the templates.

```js
const app = express();

mailer.createTransport({...});
mailer.setOptions({...});
mailer.setLocals({...});

app.use(mailer({...})); // optional transport option to create one instead of using 'createTransport' method

await mailer.registerTemplate({
  key: 'request-send-email',
  template: '<p>Your requested path is {{req.path}}</p>',
  subject: 'Request Path',
});

app.get('/api/test/request-send-email', function(req, res, next) {
  req.sendEmail({
    key: 'request-send-email',
    receiver: 'guest@guests.com',
    sender: 'mailer@mails.com'
  })
});
```
The request data you can find in a template are below:
- domain
- protocol
- hostname
- ip
- baseUrl
- originalUrl
- path
- body
- query
- params
- headers
- httpVersion

[back to top](#table-of-contents)


---


### [MIT Licensed](LICENSE)
