/*!
 * CSV Response
 * Copyright(c) 2024 Junmin Ahn
 * MIT Licensed
 */
const { format } = require('@fast-csv/format');
const isBoolean = (value) => typeof value === 'boolean';
const isPlainObject = (value) => value !== null && typeof value === 'object' && value.constructor === Object;

exports.CSVResponse = class CSVResponse {
  constructor(dataset = [], options = {}) {
    this.dataset = Array.isArray(dataset) ? dataset : [dataset];
    this.filename = options.filename || 'download.csv';
    this.processor = options.processor || ((v) => v);

    if (isBoolean(options.headers)) {
      this.headers = options.headers;
    } else if (this.dataset.length > 0) {
      this.headers = isPlainObject(this.dataset[0]) ? true : false;
    }
  }

  streamCsv(res) {
    const stream = format({ headers: this.headers });
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment;filename=${this.filename}`);
    stream.pipe(res);
    stream.on('end', () => res.end());
    this.dataset.map((v) => {
      return stream.write(this.processor(v));
    });
    stream.end();
  }
};
