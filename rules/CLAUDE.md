# Shared AI Rules for 10xCards

## General rules

- Prefer evidence-based reasoning.
- Do not invent repo facts. Inspect files before making claims.
- Separate facts, assumptions, and recommendations.
- Keep changes small and scoped.
- When reviewing code, prioritize correctness, security, and data isolation over formatting.

## Code review rules

- Do not approve changes only because tests pass.
- Check whether tests cover the actual risk.
- For security-sensitive changes, identify the trust boundary.
- For database or RLS changes, verify cross-user isolation assumptions.
- For CI/CD changes, verify secrets, permissions, and failure behavior.