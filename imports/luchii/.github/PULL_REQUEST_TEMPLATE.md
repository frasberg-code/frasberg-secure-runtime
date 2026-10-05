# Frasberg AI Pull Request — Governed & Merge‑Gate Compliant

## Summary
Provide a clear, concise explanation of:
- What changed
- Why it changed
- Which part of the platform it affects

("Explain why, not just what" — required)  

---

## Governance & Merge‑Gate Checklist
All items below MUST be satisfied before merge.

### 🔒 Commit & Author Requirements
- [ ] Human‑authored commits only (no Copilot, no automated agents)  
- [ ] Signed commits recommended  
- [ ] Linear history (no merge commits)  

### 🧪 CI / Quality Gates
- [ ] pytest passed  
- [ ] flake8 passed  
- [ ] mypy passed  
- [ ] API contract tests passed (if applicable)  
- [ ] Black formatting (88 chars)  

### 🧩 Code Quality & Standards
- [ ] Full type hints (no `Any` unless justified)  
- [ ] No unused imports  
- [ ] No wildcard imports  
- [ ] Functions are small, single‑responsibility  
- [ ] Docstrings for all public functions/classes  
- [ ] No deep nesting or unnecessary complexity  

### 🔐 Security & Governance
- [ ] No secrets in code  
- [ ] No environment‑specific logic hardcoded  
- [ ] Input validation present  
- [ ] Explicit exception handling (no silent failures)  
- [ ] Policy‑as‑Code validation passed  
- [ ] Rulesets satisfied (no bypass)  

### 📄 Documentation
- [ ] Module‑level docstrings  
- [ ] Public APIs documented  
- [ ] PR includes a summary of changes  

### 🗂 Branch Flow
Select one:
- [ ] feature/* → dev  
- [ ] dev → staging (manual merge only)  
- [ ] staging → main (manual merge only)  

### 💬 Review Requirements
- [ ] All conversations resolved  
- [ ] Meaningful review (no "LGTM")  
- [ ] Code clarity, correctness, security, performance validated  

---

## Testing Evidence
Describe tests performed:
- Unit tests
- Integration tests
- API contract tests
- Manual validation (if applicable)

---

## Deployment Validation
Check all that apply:
- [ ] Development deploy validated  
- [ ] Staging deploy validated  
- [ ] Production deploy validated  

---

## Additional Notes
Add any relevant context for reviewers.
