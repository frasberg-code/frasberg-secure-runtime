# Project Policies

Governance policies for the Frasberg SDK project including code review, merge requirements, and development standards.

## Code Review Policy

### Purpose

Code reviews ensure:
- Code quality and maintainability
- Knowledge sharing across the team
- Early bug detection
- Consistency with project standards
- Security best practices

### Review Requirements

#### Standard Pull Requests

**Minimum Reviews:** 1 approved review  
**Requirements:**
- ✅ All CI checks pass
- ✅ No merge conflicts
- ✅ Tests added/updated
- ✅ Documentation updated (if needed)
- ✅ CHANGELOG updated (for user-facing changes)

#### Complex Pull Requests

**Minimum Reviews:** 2 approved reviews  
**Applies to:**
- Changes to core APIs
- Breaking changes
- Performance optimizations
- Security-related changes
- Architectural modifications

**Additional Requirements:**
- ✅ Tech Lead approval
- ✅ Migration guide (for breaking changes)
- ✅ Performance benchmarks (for optimizations)

#### Emergency Hotfixes

**Minimum Reviews:** 1 approved review  
**Requirements:**
- ✅ Critical bug fix or security patch
- ✅ Limited scope
- ✅ Post-merge review scheduled

### Review Process

#### 1. Pull Request Creation

**Author Responsibilities:**
- Write clear PR description
- Link related issues
- Add labels (bug, feature, docs, etc.)
- Request reviewers
- Mark as draft if not ready

**PR Template:**
```markdown
## Description
[Clear description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #123

## Checklist
- [ ] Tests pass locally
- [ ] Added/updated tests
- [ ] Updated documentation
- [ ] Updated CHANGELOG
- [ ] No new warnings
```

#### 2. Reviewer Assignment

**Automatic Assignment:**
- Code owners auto-assigned via CODEOWNERS
- GitHub auto-assigns based on workload

**Manual Assignment:**
- Request specific reviewers for expertise
- Tag domain experts in comments

#### 3. Review Timeline

**Response Time:**
- Initial review: Within 24 hours (business days)
- Follow-up reviews: Within 24 hours of updates

**Stale PRs:**
- 7 days no activity: Ping reviewers
- 14 days no activity: Close with comment

#### 4. Review Criteria

**Code Quality:**
- ✅ Follows TypeScript best practices
- ✅ Clear and maintainable code
- ✅ Appropriate abstractions
- ✅ No code duplication
- ✅ Efficient algorithms

**Testing:**
- ✅ Tests cover new functionality
- ✅ Edge cases tested
- ✅ No test coverage regression
- ✅ Tests are maintainable

**Documentation:**
- ✅ Code comments for complex logic
- ✅ JSDoc for public APIs
- ✅ README/docs updated if needed
- ✅ Examples added/updated

**Security:**
- ✅ No hardcoded secrets
- ✅ Input validation
- ✅ Proper error handling
- ✅ No security vulnerabilities

**Style:**
- ✅ Follows project conventions
- ✅ Consistent naming
- ✅ Linter passes
- ✅ Type-safe

#### 5. Providing Feedback

**Feedback Types:**

**Must Fix (Blocking):**
```markdown
🚫 **Must Fix:** This will cause a runtime error when `value` is undefined.
```

**Suggestion (Non-blocking):**
```markdown
💡 **Suggestion:** Consider using `Array.map()` here for better readability.
```

**Question:**
```markdown
❓ **Question:** Why did we choose this approach over using existing utility?
```

**Praise:**
```markdown
✨ **Nice!** This is a great abstraction!
```

**Best Practices:**
- Be specific and constructive
- Explain the "why" not just "what"
- Suggest improvements
- Link to relevant documentation
- Keep tone positive and professional

#### 6. Addressing Feedback

**Author Responsibilities:**
- Respond to all comments
- Make requested changes or explain why not
- Mark conversations as resolved
- Request re-review when ready

**Response Format:**
```markdown
Fixed in [commit sha]. Good catch!
```

```markdown
I considered this approach, but [reasoning]. WDYT?
```

#### 7. Approval and Merge

**Approval:**
- Reviewer clicks "Approve"
- Or uses "Approve" in comment

**Merge Options:**

**Squash and Merge (Default):**
- Use for feature branches
- Creates clean history
- Squash commits into one

**Merge Commit:**
- Use for release branches
- Preserves history
- Multiple logical commits

**Rebase and Merge:**
- Use for simple changes
- Linear history
- No merge commit

## Merge Requirements

### Branch Protection Rules

#### `main` Branch

**Protection Rules:**
- ✅ Require pull request before merging
- ✅ Require 2 approving reviews
- ✅ Dismiss stale reviews on new commits
- ✅ Require review from code owners
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Require conversation resolution
- ✅ Require signed commits
- ✅ Include administrators

**Status Checks:**
- ✅ Tests
- ✅ Build
- ✅ Linting
- ✅ Type checking
- ✅ Security scan

#### `dev` Branch

**Protection Rules:**
- ✅ Require pull request before merging
- ✅ Require 1 approving review
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Include administrators

**Status Checks:**
- ✅ Tests
- ✅ Build
- ✅ Linting

#### Feature Branches

**No protection rules** - developers have full control

### Auto-merge Criteria

**Dependabot PRs:**
- Auto-merge if:
  - Patch version updates
  - All tests pass
  - No breaking changes
  - No security vulnerabilities

**Documentation PRs:**
- Auto-merge if:
  - Only docs changes
  - 1 approval
  - CI passes

## Development Standards

### Code Style

**TypeScript:**
- Strict mode enabled
- Explicit types for public APIs
- Avoid `any` type
- Use interfaces for objects

**Formatting:**
- 2 spaces indentation
- Single quotes for strings
- Trailing commas
- Semicolons required

**Naming:**
- camelCase for variables/functions
- PascalCase for classes/interfaces
- UPPER_SNAKE_CASE for constants
- Descriptive names, avoid abbreviations

### Testing Standards

**Coverage Requirements:**
- Overall: ≥ 80%
- Statements: ≥ 80%
- Branches: ≥ 75%
- Functions: ≥ 80%

**Test Types:**
- Unit tests for all functions
- Integration tests for workflows
- Mock external dependencies

**Test Naming:**
```typescript
describe('generateText', () => {
  it('should return text when prompt is valid', () => {});
  it('should throw error when prompt is empty', () => {});
});
```

### Documentation Standards

**README:**
- Quick start guide
- Installation instructions
- Basic examples
- Links to full docs

**API Documentation:**
- JSDoc for all public APIs
- Parameter descriptions
- Return type documentation
- Examples
- Throws documentation

**Guides:**
- Step-by-step instructions
- Code examples
- Best practices
- Common pitfalls

**CHANGELOG:**
- Follow Keep a Changelog format
- Document all user-facing changes
- Include migration notes

### Security Standards

**API Keys:**
- Never commit secrets
- Use environment variables
- Add to `.gitignore`

**Input Validation:**
- Validate all user input
- Sanitize output
- Handle errors gracefully

**Dependencies:**
- Regular security audits
- Update vulnerable dependencies
- Review dependency licenses

### Performance Standards

**Optimization:**
- No premature optimization
- Profile before optimizing
- Benchmark performance changes

**Resource Usage:**
- Avoid memory leaks
- Clean up resources
- Efficient algorithms

## Contribution Workflow

### 1. Issue First

Before starting work:
- Create or find existing issue
- Discuss approach in issue
- Get approval for large changes

### 2. Branch Creation

```bash
git checkout -b feature/descriptive-name
```

### 3. Development

- Follow coding standards
- Write tests
- Update documentation
- Commit frequently

### 4. Before PR

```bash
# Update from dev
git fetch origin
git rebase origin/dev

# Run checks locally
npm test
npm run lint
npm run build
```

### 5. Pull Request

- Fill out PR template
- Link related issues
- Request reviews
- Address feedback

### 6. After Merge

- Delete feature branch
- Close related issues
- Update project board

## Conflict Resolution

### Technical Disagreements

**Level 1: Discussion**
- Discuss in PR comments
- Present pros/cons
- Seek consensus

**Level 2: Team Input**
- Ask for team opinions
- Hold sync meeting if needed
- Vote if necessary

**Level 3: Tech Lead Decision**
- Escalate to Tech Lead
- Present options
- Accept final decision

### Process Violations

**Minor Violations:**
- Gentle reminder
- Update documentation
- Improve tooling

**Major Violations:**
- Discuss with individual
- Document incident
- Create improvement plan

### Code Owner Disputes

**Resolution Process:**
1. Direct discussion between owners
2. Tech Lead mediation
3. Team vote if needed
4. Document decision

## Policy Updates

### Proposal Process

1. **Create RFC Issue**
   - Label: `policy`, `RFC`
   - Template: Policy change proposal

2. **Discussion Period**
   - Minimum 7 days
   - Gather feedback
   - Address concerns

3. **Vote**
   - Maintainers vote
   - Majority required
   - Document decision

4. **Implementation**
   - Update documentation
   - Communicate changes
   - Update tooling

### Review Schedule

- **Quarterly:** Review all policies
- **After Issues:** Update as needed
- **Version Changes:** Update for major releases

## Enforcement

### Automated

- CI/CD checks
- Branch protection
- Linting
- Type checking

### Manual

- Code reviews
- Periodic audits
- Security reviews

### Consequences

**First Violation:**
- Warning
- Discussion
- Documentation

**Repeated Violations:**
- Temporary restriction
- Additional oversight
- Training required

**Serious Violations:**
- Access revocation
- Legal action (if needed)

## Exceptions

### Emergency Procedures

**When Allowed:**
- Critical security vulnerability
- Production outage
- Data loss risk

**Process:**
- Document reason
- Notify team
- Create follow-up issue
- Conduct post-mortem

### Requesting Exception

1. Create issue explaining need
2. Get Tech Lead approval
3. Document in PR
4. Schedule retrospective

## Related Documentation

- [Contributing Guide](../development/contributing.md)
- [Code Owners](codeowners.md)
- [Branching Strategy](../development/branching-strategy.md)
- [Commit Conventions](../development/commit-conventions.md)
- [Security Policy](security.md)

## Contact

Questions about policies:
- **GitHub:** Create issue with `policy` label
- **Email:** team@frasberg.com
- **Tech Lead:** @tech-lead on GitHub

---

**Last Updated:** 2024-02-04  
**Version:** 1.0.0
