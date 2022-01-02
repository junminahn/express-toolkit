SHELL := /usr/bin/env bash

.PHONY: publish
publish:
	rm -rf lib
	yarn build
	yarn pre-publish
	pushd lib && npm publish --access public && popd
	yarn sync-version
