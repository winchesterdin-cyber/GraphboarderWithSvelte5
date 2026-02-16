# Comprehensive Enhancement Plan: Observability and Telemetry Hardening

## Objective

Strengthen the existing observability and telemetry features so they are safer, more diagnosable, and easier to operate in production-like environments while preserving backward compatibility.

## Scope

This plan upgrades `src/lib/observability/logger.ts` and `src/lib/analytics/telemetry.ts` with comprehensive behavior and full automated verification.

## Major Improvements (12)

1. **Configurable log-level thresholding**
   - Add a runtime threshold to suppress low-priority logs in noisy environments.
   - Preserve current defaults so existing behavior remains stable.

2. **Safe log-payload normalization**
   - Ensure logs serialize cleanly by converting `Error`, `Map`, `Set`, and `bigint` values into stable objects/strings.
   - Prevent runtime exceptions from circular references.

3. **Context sanitization for sensitive keys**
   - Mask values for security-sensitive keys (`password`, `token`, `authorization`, etc.) before emitting logs.

4. **Child logger creation utility**
   - Add a helper to create child loggers with immutable base context (e.g., feature/module metadata).

5. **Deterministic trace ID fallback improvements**
   - Strengthen fallback trace-id generation for non-crypto environments and keep format consistent.

6. **Telemetry storage safety wrappers**
   - Add guarded localStorage read/write helpers to avoid crashes from malformed JSON or quota errors.

7. **Telemetry event queue size limit with eviction**
   - Bound event queue size and evict oldest entries when capacity is exceeded.

8. **Telemetry payload sanitization**
   - Sanitize telemetry context keys using the same sensitive-field masking strategy as logs.

9. **Telemetry duplicate-event suppression window**
   - Deduplicate bursty duplicate events (same name/context) within a configurable cooldown window.

10. **Telemetry session correlation support**
    - Generate and persist a telemetry session id so related events can be grouped.

11. **Telemetry inspection and maintenance helpers**
    - Add APIs to list events, clear events, and return queue metadata for diagnostics/testing.

12. **Comprehensive test expansion**
    - Add robust tests for sanitization, serialization safety, dedupe behavior, queue limits, session ids, and opt-out logic.

## Implementation Notes

- Add explanatory comments around every new feature and behavior branch.
- Emit explicit diagnostic logs for dropped/deduplicated telemetry events.
- Keep APIs deterministic and test-friendly through optional configuration parameters.

## Validation Plan

For full verification:

1. Run linting and formatting checks.
2. Run focused unit tests for logger + telemetry modules.
3. Run full unit suite to ensure no regressions.

## Completion Criteria

- All 12 improvements are implemented.
- New/updated tests assert each behavior.
- Lint and unit tests pass.
- Documentation update log reflects the completed enhancement set.

## Implementation Status

- ✅ All 12 planned improvements have been implemented in code.
- ✅ Logger and telemetry unit tests were expanded and are passing.
- ✅ Repository lint checks and full unit suite were executed after implementation.
- ✅ Missing Playwright browser/runtime dependencies required for full test execution were installed.
