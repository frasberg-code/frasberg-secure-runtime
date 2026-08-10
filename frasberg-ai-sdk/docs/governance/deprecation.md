# Deprecation Policy

Guidelines for deprecating and removing features from the Frasberg AI SDK.

## Overview

Deprecation is a process of marking features, APIs, or functionalities as obsolete while maintaining backward compatibility during a transition period. This policy ensures users have adequate time to migrate to newer alternatives.

## Deprecation Workflow

### Phase 1: Announcement (MINOR Release)

**Mark as Deprecated:**

```typescript
/**
 * Generates text using the old method.
 * 
 * @deprecated Since v1.2.0. Use generateText() instead.
 * Will be removed in v2.0.0.
 * 
 * @see generateText for the new implementation
 */
export function oldGenerateText(prompt: string): Promise<string> {
  console.warn(
    'oldGenerateText is deprecated. Use generateText() instead. ' +
    'This method will be removed in v2.0.0.'
  );
  return generateText(prompt);
}
```

**Add to CHANGELOG:**

```markdown
## [1.2.0] - 2024-02-04

### Deprecated
- `oldGenerateText()` is deprecated in favor of `generateText()`. 
  Will be removed in v2.0.0. (#123)
```

**Update Documentation:**

```markdown
## ~~oldGenerateText()~~ (Deprecated)

**Deprecated since:** v1.2.0  
**Will be removed in:** v2.0.0  
**Replacement:** Use `generateText()` instead

### Migration

**Before:**
```typescript
const result = await client.oldGenerateText('prompt');
```

**After:**
```typescript
const result = await client.generateText('prompt');
```
```

### Phase 2: Transition Period

**Duration:** Minimum 6 months or one MAJOR version, whichever is longer

**During this period:**
- ✅ Feature still works normally
- ✅ Runtime warnings issued when used
- ✅ Documentation marked as deprecated
- ✅ TypeScript shows deprecation warnings
- ✅ Migration guide available
- ✅ Support provided for migration

**Actions:**
1. Monitor usage through telemetry (if available)
2. Respond to migration questions
3. Update examples to use new API
4. Publish migration guides
5. Announce in release notes

### Phase 3: Removal (MAJOR Release)

**Remove Deprecated Feature:**

```typescript
// v1.x.x - Deprecated but present
export function oldGenerateText() { ... }

// v2.0.0 - Removed completely
// Function no longer exists
```

**Update CHANGELOG:**

```markdown
## [2.0.0] - 2024-08-04

### Removed
- `oldGenerateText()` (deprecated since v1.2.0). Use `generateText()` instead.

### Breaking Changes
See [MIGRATION_v1_to_v2.md](MIGRATION_v1_to_v2.md) for upgrade instructions.
```

**Provide Migration Guide:**

Create `docs/MIGRATION_v1_to_v2.md`:

```markdown
# Migration Guide: v1.x to v2.0

## Removed APIs

### oldGenerateText()

**Removed in:** v2.0.0  
**Deprecated in:** v1.2.0  
**Replacement:** `generateText()`

**Migration:**

```typescript
// Before (v1.x)
const result = await client.oldGenerateText('prompt');

// After (v2.0)
const result = await client.generateText('prompt');
```

**Breaking Change:** The old method no longer exists. Update all references.
```

## Deprecation Levels

### API Deprecation

**Applies to:**
- Functions
- Methods
- Classes
- Interfaces

**Process:**
1. Add `@deprecated` JSDoc tag
2. Add runtime warning
3. Update TypeScript definitions
4. Document in CHANGELOG
5. Provide migration path

**Example:**

```typescript
/**
 * @deprecated Use generateTextAdvanced() instead. Will be removed in v3.0.0.
 */
export async function generateText(
  prompt: string
): Promise<string> {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(
      'generateText() is deprecated. ' +
      'Use generateTextAdvanced() instead. ' +
      'See https://docs.frasberg.com/migration for details.'
    );
  }
  return generateTextAdvanced(prompt, {});
}
```

### Parameter Deprecation

**Applies to:**
- Function parameters
- Configuration options

**Process:**
1. Make parameter optional
2. Add deprecation warning when used
3. Provide alternative
4. Remove in next MAJOR version

**Example:**

```typescript
export interface GenerateOptions {
  /**
   * @deprecated Use 'maxTokens' instead. Will be removed in v2.0.0.
   */
  max_tokens?: number;
  
  /** Maximum number of tokens to generate */
  maxTokens?: number;
}

export function generateText(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  // Handle deprecated parameter
  if (options.max_tokens !== undefined) {
    console.warn(
      'options.max_tokens is deprecated. ' +
      'Use options.maxTokens instead.'
    );
    options.maxTokens = options.max_tokens;
  }
  
  // Use new parameter
  const maxTokens = options.maxTokens ?? 1000;
  // ...
}
```

### Configuration Deprecation

**Applies to:**
- Environment variables
- Configuration files
- Default values

**Process:**
1. Support both old and new
2. Warn when old is used
3. Document transition
4. Remove old in next MAJOR version

**Example:**

```typescript
export function loadConfig(): Config {
  // Support both old and new environment variables
  const apiKey = 
    process.env.FRASBERG_AI_API_KEY ??  // New
    process.env.FRASBERG_API_KEY;          // Old (deprecated)
  
  if (process.env.FRASBERG_API_KEY) {
    console.warn(
      'FRASBERG_API_KEY is deprecated. ' +
      'Use FRASBERG_AI_API_KEY instead.'
    );
  }
  
  return { apiKey, ... };
}
```

### Behavior Deprecation

**Applies to:**
- Default behavior changes
- Return format changes
- Error handling changes

**Process:**
1. Add flag to enable new behavior
2. Warn about upcoming change
3. Make new behavior default in next MAJOR
4. Remove flag eventually

**Example:**

```typescript
export interface GenerateOptions {
  /**
   * Use new error format. Will become default in v2.0.0.
   * @default false (v1.x), true (v2.0+)
   */
  useNewErrorFormat?: boolean;
}

export async function generateText(
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> {
  const useNewFormat = options.useNewErrorFormat ?? false;
  
  if (!options.useNewErrorFormat) {
    console.warn(
      'The error format will change in v2.0.0. ' +
      'Set useNewErrorFormat: true to opt-in early.'
    );
  }
  
  try {
    return await apiCall(prompt);
  } catch (error) {
    if (useNewFormat) {
      throw new ApiError(error);
    } else {
      throw error; // Old behavior
    }
  }
}
```

## Communication Channels

### In-Code Warnings

**Console warnings (development):**
```typescript
if (process.env.NODE_ENV !== 'production') {
  console.warn('DEPRECATION WARNING: ...');
}
```

**TypeScript deprecation:**
```typescript
/** @deprecated */
export function oldMethod() {}
```

### Documentation

**Strikethrough in docs:**
```markdown
## ~~oldMethod()~~ (Deprecated)
```

**Deprecation notice:**
```markdown
> ⚠️ **DEPRECATED:** This method is deprecated since v1.2.0 and will be
> removed in v2.0.0. Use `newMethod()` instead.
```

### CHANGELOG

```markdown
### Deprecated
- `oldMethod()` - Use `newMethod()` instead. Will be removed in v2.0.0.
```

### Release Notes

```markdown
## Deprecations in v1.2.0

### `oldMethod()` → `newMethod()`

We've improved the API and renamed `oldMethod()` to `newMethod()`.
The old method will continue to work until v2.0.0.

**Migration:**
```typescript
// Before
const result = await oldMethod();

// After
const result = await newMethod();
```

See [Migration Guide](MIGRATION.md) for details.
```

### GitHub Issues

Create tracking issue:

```markdown
**Title:** Deprecate oldMethod() in favor of newMethod()

**Description:**
As of v1.2.0, `oldMethod()` is deprecated and will be removed in v2.0.0.

**Timeline:**
- v1.2.0 (2024-02-04): Deprecated
- v2.0.0 (2024-08-04): Removed

**Migration:**
Replace all calls to `oldMethod()` with `newMethod()`.

**Related:**
- Migration guide: [link]
- Documentation: [link]
```

## Timeline Requirements

### Minimum Deprecation Period

**Standard Features:**
- Minimum: 6 months
- Or: One MAJOR version
- Whichever is longer

**Critical Features:**
- Minimum: 12 months
- Or: Two MAJOR versions
- Provide extra support

**Rarely Used Features:**
- Minimum: 3 months
- Or: One MAJOR version
- Monitor usage carefully

### Exceptions

**Immediate Removal Allowed:**
- Security vulnerabilities
- Critical bugs that cannot be fixed
- Features never documented as public
- Internal/private APIs

**Process for Immediate Removal:**
1. Document security issue
2. Provide hotfix if possible
3. Announce widely
4. Offer support for migration

## Migration Support

### Documentation

**Provide:**
- Clear migration path
- Before/after examples
- Common pitfalls
- FAQ

**Migration Guide Template:**

```markdown
# Migrating from oldMethod() to newMethod()

## Overview
Brief explanation of why the change was made.

## Quick Migration

**Before:**
```typescript
const result = await oldMethod(param);
```

**After:**
```typescript
const result = await newMethod(param);
```

## Detailed Changes

### Parameter Changes
- `oldParam` renamed to `newParam`
- `removedParam` removed, use X instead

### Return Type Changes
- Now returns `Promise<Result>` instead of `Promise<string>`

### Behavior Changes
- Error handling improved
- Performance optimized

## Common Issues

### Issue 1: Type Errors
**Problem:** ...
**Solution:** ...

### Issue 2: Runtime Errors
**Problem:** ...
**Solution:** ...

## Support
Questions? Create an issue or contact support.
```

### Tools and Utilities

**Automated Migration:**

```typescript
// Provide codemods if possible
npx @frasberg/migrate v1-to-v2
```

**Linter Rules:**

```typescript
// ESLint rule to detect deprecated usage
{
  "rules": {
    "@frasberg/no-deprecated": "warn"
  }
}
```

## Monitoring

### Usage Tracking

```typescript
// Track deprecation warnings (if telemetry enabled)
function deprecationWarning(
  feature: string,
  replacement: string,
  version: string
) {
  if (telemetryEnabled) {
    trackDeprecation({ feature, replacement, version });
  }
  console.warn(`DEPRECATED: ${feature}. Use ${replacement} instead.`);
}
```

### Metrics

Track:
- Number of deprecation warnings
- Most used deprecated features
- Adoption rate of new features

## Emergency Deprecation

For critical issues requiring immediate action:

### Process

1. **Identify Issue**
   - Security vulnerability
   - Data loss risk
   - Legal requirement

2. **Immediate Response**
   - Publish security advisory
   - Release hotfix ASAP
   - Notify all users

3. **Accelerated Timeline**
   - Deprecate immediately
   - Shorter removal timeline
   - Provide migration support

4. **Communication**
   - Explain urgency
   - Provide workarounds
   - Offer assistance

## Best Practices

### For Maintainers

1. **Plan Ahead**
   - Design for extensibility
   - Avoid breaking changes
   - Version APIs properly

2. **Communicate Early**
   - Announce deprecations in advance
   - Provide clear timelines
   - Offer alternatives

3. **Support Migration**
   - Write detailed guides
   - Provide examples
   - Answer questions

4. **Monitor Impact**
   - Track usage
   - Gather feedback
   - Adjust timeline if needed

### For Users

1. **Stay Informed**
   - Read release notes
   - Watch for warnings
   - Subscribe to updates

2. **Migrate Promptly**
   - Don't wait until last minute
   - Test thoroughly
   - Update documentation

3. **Provide Feedback**
   - Report migration issues
   - Suggest improvements
   - Help others migrate

## Related Documentation

- [Versioning Policy](versioning.md)
- [Release Process](../development/release-process.md)
- [Breaking Changes Guide](../guides/breaking-changes.md)
- [CHANGELOG](../../CHANGELOG.md)

---

**Last Updated:** 2024-02-04  
**Version:** 1.0.0
