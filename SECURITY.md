# Security Policy

## Reporting a vulnerability

**Do not** open a public GitHub issue for security vulnerabilities.

Email: `security@wewatch.app` (will be set up before public launch — meanwhile,
DM the founder directly).

We aim to respond within **48 hours** and triage within **5 business days**.

## Scope

In-scope:
- All code in this repository
- Hosted services at `*.wewatch.app` (when live)
- Garmin SDK pipeline (compiled `.prg` / `.iq` artifacts)
- AI Pipeline (prompt injection, IP/safety bypass, cost-exhaustion attacks)

Out-of-scope:
- Social engineering of staff / community
- Physical attacks
- DOS / volumetric attacks (we'll address infrastructure-side)

## Disclosure

We follow coordinated disclosure:
1. Acknowledge within 48h
2. Validate within 5 business days
3. Patch within 30 days for High/Critical, 90 days for Medium
4. Public disclosure after patch is deployed
5. Credit (if you want) in our `SECURITY-HALL-OF-FAME.md`

## Bug bounty

No formal bounty program at this stage. We'll consider rewards case-by-case.

## Operational security commitments

- All PII encrypted at rest (`legal_name`, `email_hashed_index`, etc.)
- Garmin developer key stored in 1Password + offline backup
- Stripe / payment data NEVER touch our database (we hold tokens only)
- Production DB access requires 2FA + audit logging
- See `agents/backend-agent/SECURITY_RULES.md` for engineering-side rules
- See `agents/ai-pipeline-agent/IP_AND_SAFETY.md` for AI-side rules

## Reporting non-security issues

- Bugs: open a GitHub issue using the bug template
- Agent failures: open a GitHub issue using the agent failure template
- Privacy concerns: email `privacy@wewatch.app`
