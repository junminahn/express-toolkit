SHELL := /usr/bin/env bash

.PHONY: mk-serve
mk-serve:
	mkdocs serve

.PHONY: mk-build
mk-build:
	mkdocs build

.PHONY: db
db:
	mongod --dbpath ~/projects/_mongodb/db
