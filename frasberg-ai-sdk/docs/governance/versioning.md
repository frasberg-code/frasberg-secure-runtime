# Versioning Policy

Frasberg AI SDK follows Semantic Versioning 2.0.0 for all releases.

## Semantic Versioning 2.0.0

Given a version number **MAJOR.MINOR.PATCH** (e.g., 2.3.1), increment the:

1. **MAJOR** version when you make incompatible API changes
2. **MINOR** version when you add functionality in a backward compatible manner
3. **PATCH** version when you make backward compatible bug fixes

Additional labels for pre-release and build metadata are available as extensions to the MAJOR.MINOR.PATCH format.

## Version Number Format

### Release Versions

```
MAJOR.MINOR.PATCH
```

**Examples:**
- `1.0.0` - Initial stable release
- `1.1.0` - New features, backward compatible
- `1.1.1` - Bug fixes
- `2.0.0` - Breaking changes

### Pre-release Versions

```
MAJOR.MINOR.PATCH-PRERELEASE
```

**Examples:**
- `1.0.0-alpha.1` - Early development
- `1.0.0-beta.1` - Feature complete, testing
- `1.0.0-rc.1` - Release candidate

### Build Metadata

```
MAJOR.MINOR.PATCH+BUILD
```

**Examples:**
- `1.0.0+20240204`
- `1.0.0+build.123`

## Version Increment Rules

### MAJOR Version (X.0.0)

**Increment when:**
- Removing or renaming public APIs
- Changing function signatures (parameters or return types)
- Removing or changing exported types/interfaces
- Changing default behavior in breaking ways
- Dropping support for Node.js versions
- Removing deprecated features

**Examples:**

```typescript
// Breaking: Removed parameter
// v1.x.x
generateText(prompt: string, options?: Options): Promise<string>

// v2.0.0
generateText(prompt: string): Promise<string>
```

```typescript
// Breaking: Changed return type
// v1.x.x
generateImage(prompt: string): Promise<Buffer>

// v2.0.0
generateImage(prompt: string): Promise<ImageResult>
```

```typescript
// Breaking: Renamed function
// v1.x.x
createClient()

// v2.0.0
createFrasbergClient()
```

### MINOR Version (1.X.0)

**Increment when:**
- Adding new public APIs
- Adding new optional parameters (with defaults)
- Adding new features (backward compatible)
- Deprecating features (with warnings)
- Marking features as internal
- Substantial internal improvements

**Examples:**

```typescript
// New feature: Added optional parameter
// v1.0.0
generateText(prompt: string): Promise<string>

// v1.1.0
generateText(prompt: string, options?: GenerateOptions): Promise<string>
```

```typescript
// New feature: Added new method
// v1.1.0
class FrasbergClient {
  generateText(prompt: string): Promise<string>;
  
  // New in v1.2.0
  generateTextStream(prompt: string): AsyncIterable<string>;
}
```

```typescript
// New feature: Added new export
// v1.2.0
export { createFrasbergClient, ValidationError };

// v1.3.0
export { createFrasbergClient, ValidationError, RetryError };
```

### PATCH Version (1.0.X)

**Increment when:**
- Fixing bugs without changing behavior
- Security patches
- Performance improvements
- Documentation updates
- Internal refactoring (no API changes)
- Dependency updates (non-breaking)

**Examples:**

```typescript
// Bug fix: Corrected validation logic
// v1.0.0 (buggy)
if (prompt.length > 0) { ... } // Should be >= 1

// v1.0.1 (fixed)
if (prompt.length >= 1) { ... }
```

```typescript
// Performance: Optimized algorithm (same behavior)
// v1.0.1
function process(data: string): string {
  // Faster implementation, same output
  return optimizedAlgorithm(data);
}
```

## Pre-release Versions

### Alpha (X.Y.Z-alpha.N)

**Purpose:** Early development, unstable  
**Stability:** API may change drastically  
**Testing:** Internal testing only  

**Usage:**
```bash
npm install @frasberg/core-sdk@1.0.0-alpha.1
```

**When to use:**
- Major refactoring in progress
- Experimental features
- Seeking early feedback
- API design not finalized

### Beta (X.Y.Z-beta.N)

**Purpose:** Feature complete, testing  
**Stability:** API mostly stable  
**Testing:** Public testing encouraged  

**Usage:**
```bash
npm install @frasberg/core-sdk@1.0.0-beta.1
```

**When to use:**
- All features implemented
- API design finalized
- Need wider testing
- Performance tuning

### Release Candidate (X.Y.Z-rc.N)

**Purpose:** Final testing before release  
**Stability:** Production-ready unless bugs found  
**Testing:** Final validation  

**Usage:**
```bash
npm install @frasberg/core-sdk@1.0.0-rc.1
```

**When to use:**
- No known critical bugs
- Documentation complete
- Ready for release unless issues found
- Final smoke testing

## Version Lifecycle

### Development Flow

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐    ┌──────────┐
│ Feature │ -> │  Alpha   │ -> │   Beta   │ -> │   RC    │ -> │  Stable  │
│   Dev   │    │ (0.1.0)  │    │ (0.2.0)  │    │ (1.0.0) │    │  (1.0.0) │
└─────────┘    └──────────┘    └──────────┘    └─────────┘    └──────────┘
```

### Support Timeline

| Version | Status      | Support Period      | Updates          |
|---------|-------------|---------------------|------------------|
| 2.x.x   | Active      | Current + 12 months | Features + Fixes |
| 1.x.x   | Maintenance | 6 months after 2.0  | Critical fixes   |
| 0.x.x   | Unsupported | -                   | None             |

## Version Requirements

### Minimum Node.js Version

**Current:** Node.js >= 18.0.0

**Changing Node.js requirement:**
- Dropping support: MAJOR version bump
- Adding support: MINOR version bump (backward compatible)

**Example:**
```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### TypeScript Version

**Current:** TypeScript >= 5.0.0

**Changing TypeScript requirement:**
- Major TypeScript update: MINOR version bump
- Breaking type changes: MAJOR version bump

## Backward Compatibility

### Guarantees

Within the same MAJOR version:
- ✅ Existing code continues to work
- ✅ No breaking changes to public APIs
- ✅ Deprecated features still work (with warnings)
- ✅ Type definitions remain compatible

### Non-guarantees

We DO NOT guarantee:
- ❌ Internal implementation stability
- ❌ Private/undocumented API stability
- ❌ Test utilities stability
- ❌ Development dependencies

### Deprecation Process

See [Deprecation Policy](deprecation.md) for full details.

**Summary:**
1. Announce deprecation in MINOR release
2. Provide migration path
3. Remove in next MAJOR release

## Version Documentation

### CHANGELOG.md

**Format:**
```markdown
## [1.2.0] - 2024-02-04

### Added
- New feature X (#123)

### Changed
- Improved Y (#124)

### Deprecated
- Function Z, use W instead (#125)

### Removed
- (None)

### Fixed
- Bug in A (#126)

### Security
- Fixed vulnerability B (#127)

[1.2.0]: https://github.com/FrasbergAI/frasberg/compare/v1.1.0...v1.2.0
```

### Migration Guides

For MAJOR versions, provide migration guide:

**File:** `docs/MIGRATION_v1_to_v2.md`

**Contents:**
- Breaking changes list
- Migration steps
- Code examples (before/after)
- Common issues and solutions

### Release Notes

For each release, publish detailed notes:
- Highlights
- Breaking changes (if any)
- Upgrade instructions
- Contributors

## Package.json Configuration

```json
{
  "name": "@frasberg/core-sdk",
  "version": "1.2.0",
  "engines": {
    "node": ">=18.0.0"
  },
  "peerDependencies": {},
  "dependencies": {},
  "devDependencies": {}
}
```

## Git Tags

### Tag Format

```
vMAJOR.MINOR.PATCH
```

**Examples:**
- `v1.0.0`
- `v1.1.0`
- `v2.0.0`

### Creating Tags

```bash
# Annotated tag (preferred)
git tag -a v1.2.0 -m "Release v1.2.0"

# Push tag
git push origin v1.2.0
```

### Tag Protection

- Only maintainers can create tags
- Tags cannot be deleted or modified
- Tags trigger automated release process

## NPM Distribution

### Version Tags

**latest (default):**
```bash
npm install @frasberg/core-sdk
# Installs latest stable version
```

**next (pre-release):**
```bash
npm install @frasberg/core-sdk@next
# Installs latest pre-release
```

**Specific version:**
```bash
npm install @frasberg/core-sdk@1.2.0
```

**Version range:**
```bash
npm install @frasberg/core-sdk@^1.0.0  # 1.x.x
npm install @frasberg/core-sdk@~1.2.0  # 1.2.x
```

### Dist Tags

```bash
# Publish with tag
npm publish --tag beta

# Move tag
npm dist-tag add @frasberg/core-sdk@1.2.0 latest

# List tags
npm dist-tag ls @frasberg/core-sdk
```

## Version Checking

### In Code

```typescript
import { version } from '@frasberg/core-sdk';

console.log(`SDK Version: ${version}`);

// Version comparison
import semver from 'semver';

if (semver.lt(version, '2.0.0')) {
  console.warn('Please upgrade to v2.0.0');
}
```

### CLI

```bash
# Check installed version
npm list @frasberg/core-sdk

# Check latest version
npm show @frasberg/core-sdk version

# Check all versions
npm show @frasberg/core-sdk versions
```

## Best Practices

### For Maintainers

1. **Be Conservative with Breaking Changes**
   - Explore backward-compatible alternatives
   - Deprecate before removing
   - Provide migration tools

2. **Document Everything**
   - Update CHANGELOG
   - Write migration guides
   - Update API documentation

3. **Test Thoroughly**
   - Run full test suite
   - Test upgrade path
   - Validate in real applications

4. **Communicate Clearly**
   - Announce in advance
   - Explain reasoning
   - Provide support

### For Users

1. **Use Version Ranges Carefully**
   ```json
   {
     "dependencies": {
       "@frasberg/core-sdk": "^1.0.0"  // Allows 1.x.x
     }
   }
   ```

2. **Pin Versions in Production**
   ```json
   {
     "dependencies": {
       "@frasberg/core-sdk": "1.2.0"  // Exact version
     }
   }
   ```

3. **Test Before Upgrading**
   - Read CHANGELOG
   - Check for breaking changes
   - Test in staging environment

4. **Stay Updated**
   - Subscribe to releases
   - Monitor security advisories
   - Upgrade regularly

## Violations

If we accidentally violate SemVer:

1. **Acknowledge:** Admit the mistake
2. **Fix:** Release correcting version
3. **Communicate:** Notify all users
4. **Document:** Explain in CHANGELOG
5. **Prevent:** Update processes

## Related Documentation

- [Release Process](../development/release-process.md)
- [Deprecation Policy](deprecation.md)
- [Publishing Checklist](../operations/publishing-checklist.md)
- [CHANGELOG](../../CHANGELOG.md)

## References

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [npm Semver Calculator](https://semver.npmjs.com/)

---

**Last Updated:** 2024-02-04  
**Version:** 1.0.0
