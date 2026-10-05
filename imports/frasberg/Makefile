.PHONY: help mesh mesh-status mesh-bump mesh-raft mesh-snapshot license release sync governance-all

help:
	@echo "Frasberg Governance Make Targets"
	@echo ""
	@echo "Mesh Management:"
	@echo "  make mesh-status         Show current mesh metadata"
	@echo "  make mesh-bump v=X.Y.Z   Bump meshVersion to X.Y.Z"
	@echo "  make mesh-raft           Increment raftTerm"
	@echo "  make mesh-snapshot v=V   Set snapshotVersion to V"
	@echo ""
	@echo "Licensing:"
	@echo "  make license             Run license audit"
	@echo ""
	@echo "Release:"
	@echo "  make release             Generate all release artifacts"
	@echo ""
	@echo "Sync:"
	@echo "  make sync                Check cross-repo sync status"
	@echo ""
	@echo "Governance:"
	@echo "  make governance-all      Run all governance checks"
	@echo ""

mesh-status:
	@node cli/frasberg-governance.js mesh:status

mesh-bump:
	@if [ -z "$(v)" ]; then \
		echo "ERROR: Please specify version with v=X.Y.Z"; \
		exit 1; \
	fi
	@node cli/frasberg-governance.js mesh:bump-version $(v)

mesh-raft:
	@node cli/frasberg-governance.js mesh:bump-raft

mesh-snapshot:
	@if [ -z "$(v)" ]; then \
		echo "ERROR: Please specify version with v=YYYY.MM.DD"; \
		exit 1; \
	fi
	@node cli/frasberg-governance.js mesh:set-snapshot $(v)

license:
	@echo "Running license audit..."
	@if [ -f scripts/repo-license-auditor.js ]; then \
		node scripts/repo-license-auditor.js; \
	else \
		echo "License audit script not found"; \
	fi

release:
	@echo "Generating release artifacts..."
	@npm run release:all

sync:
	@node cli/frasberg-governance.js sync:status

governance-all: mesh-status license sync
	@echo ""
	@echo "✅ All governance checks complete"
