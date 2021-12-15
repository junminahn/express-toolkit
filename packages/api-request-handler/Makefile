SHELL := /usr/bin/env bash

.PHONY: publish
publish:
	npm publish --access public
	yarn sync-version

.PHONY: dry-run
dry-run:
	npm publish --dry-run
