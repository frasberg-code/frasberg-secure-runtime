# Frasberg AI SDK — Code Review Rubric

This rubric is the canonical evaluation framework for all pull requests.  
A PR may only be approved when it satisfies every relevant criterion.

---

## 1. Architectural Alignment

### 1.1 Provider Abstraction
- [ ] No provider-specific logic outside adapters
- [ ] No leaking provider URLs, metadata, or error shapes
- [ ] All provider interactions go through the unified interface

### 1.2 Invariant Compliance
- [ ] No hidden state
- [ ] No silent fallbacks
- [ ] No implicit retries
- [ ] No nondeterministic behavior
- [ ] No magic behavior

### 1.3 Minimalism
- [ ] No unnecessary abstractions
- [ ] No over-engineering
- [ ] No unused utilities
- [ ] No speculative features

---

## 2. Code Quality

### 2.1 Readability
- [ ] Clear naming
- [ ] Clear flow
- [ ] No deeply nested logic
- [ ] No cleverness for its own sake

### 2.2 Maintainability
- [ ] Code is modular
- [ ] No duplication
- [ ] No tightly coupled components
- [ ] Clear separation of concerns

### 2.3 Safety
- [ ] No secrets in code
- [ ] No unsafe defaults
- [ ] No unvalidated inputs
- [ ] No unsanitized outputs

---

## 3. Testing

### 3.1 Coverage
- [ ] All new logic is tested
- [ ] Edge cases covered
- [ ] Error paths tested
- [ ] No skipped tests

### 3.2 Quality
- [ ] Tests are deterministic
- [ ] Tests are readable
- [ ] Tests reflect real usage
- [ ] No incorrect mocking of internal behavior

---

## 4. Documentation

### 4.1 API Documentation
- [ ] Updated for any new or changed behavior
- [ ] Clear, concise, accurate

### 4.2 Examples
- [ ] Updated if behavior changes
- [ ] Demonstrate correct usage

### 4.3 CHANGELOG
- [ ] Updated with correct SemVer category
- [ ] No internal details leaked

---

## 5. Governance Compliance

### 5.1 Commit Conventions
- [ ] All commits follow Conventional Commits
- [ ] No vague messages
- [ ] No unrelated changes in the same commit

### 5.2 Branching Model
- [ ] PR targets dev
- [ ] Branch name follows feature/*, fix/*, etc.

### 5.3 RFC Requirement
- [ ] Major changes include an approved RFC
- [ ] RFC linked in PR description

---

## 6. Performance & Reliability

### 6.1 Efficiency
- [ ] No unnecessary allocations
- [ ] No unbounded loops
- [ ] No synchronous blocking of async flows

### 6.2 Determinism
- [ ] Same input → same behavior
- [ ] No time-based randomness
- [ ] No environment-dependent behavior

---

## 7. Security

### 7.1 Dependency Safety
- [ ] No vulnerable packages introduced
- [ ] No unnecessary dependencies added

### 7.2 Data Handling
- [ ] No logging of sensitive data
- [ ] No exposure of provider secrets
- [ ] No leaking of stack traces

---

## 8. Observability

### 8.1 Optionality
- [ ] Logging only occurs if developer provides logger
- [ ] No default logging
- [ ] No telemetry

### 8.2 Clarity
- [ ] Logs (if present) are structured
- [ ] No ambiguous messages

---

## Approval Criteria

A PR may be approved only when:
- [ ] All rubric sections pass
- [ ] All quality gates pass
- [ ] CI is green
- [ ] Documentation is updated
- [ ] Tests are complete
- [ ] Maintainers agree

This rubric ensures consistency, rigor, and architectural integrity across the entire lifecycle of the SDK.
