SHELL := /usr/bin/env bash

.PHONY: mk-serve
mk-serve:
	mkdocs serve

.PHONY: mk-build
mk-build:
	mkdocs build

.PHONY: db
db:
	mkdir -p ../_mongodb/express-toolkit
	mongod --dbpath ../_mongodb/express-toolkit
