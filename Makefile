SHELL := /usr/bin/env bash

.PHONY: mk_serve
mk_serve:
	mkdocs serve

.PHONY: mk_build
mk_build:
	mkdocs build

.PHONY: lint
lint:
	helm upgrade --dry-run --install sso-keycloak -n "${NAMESPACE}" -f values.yaml -f "values-${NAMESPACE}.yaml"

.PHONY: uninstall
uninstall:
	helm uninstall sso-keycloak -n ${NAMESPACE}

.PHONY: force-install
force-install: uninstall
force-install: install
