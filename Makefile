SHELL := /usr/bin/env bash

.PHONY: commit
commit:
	@@node_modules/.bin/git-cz

.PHONY: changelog
changelog:
	@@node_modules/.bin/standard-version
