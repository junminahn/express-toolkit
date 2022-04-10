const http = require('http');

const BASE_URL = 'http://127.0.0.1:8080';

const getAPI = (apiUrl) => {
  return new Promise((resolve, reject) => {
    http
      .get(`${BASE_URL}${apiUrl}`, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
          data += chunk;
        });
        resp.on('end', () => resolve(data));
      })
      .on('error', (err) => {
        console.error('Error: ' + err.message);
        reject(err);
      });
  });
};

const testEqual = (description, val1, val2) => {
  const log = `${description}, ${val1}, ${val2}`;
  if (val1 === val2) console.log(log);
  else console.error(log);
};

const testNotEqual = (description, val1, val2) => {
  const log = `${description}, ${val1}, ${val2}`;
  if (val1 !== val2) console.log(log);
  else console.error(log);
};

module.exports = { getAPI, testEqual, testNotEqual };
