# Governance

Qaqpan 232 uses lightweight maintainer-led governance while the project is small.

## Maintainer responsibilities

Maintainers are responsible for:

- reviewing pull requests for correctness, scope, privacy, and test coverage;
- keeping model and evaluation claims reproducible and clearly limited;
- protecting the repository from spam, fabricated data, secrets, and unsafe disclosures;
- keeping contribution tasks concrete enough that external contributors can work independently;
- documenting material changes to model behavior, data, metrics, or user-facing risk explanations.

## How changes are accepted

Small documentation fixes may be merged after a single maintainer review. Behavior changes should normally include tests. Changes to the training data, evaluation split, model export, or risk rules should explain why the change is needed and how false positives or data leakage were considered.

A maintainer may request revisions, split an oversized pull request, or decline changes that add maintenance cost without a clear project benefit.

## Decision principles

When tradeoffs exist, the project prioritizes:

1. user safety and privacy;
2. correctness and reproducibility;
3. false-positive control and transparent limitations;
4. maintainable implementation;
5. accessibility and Russian/Kazakh language quality;
6. feature breadth.

## Contributor path

There is no requirement to be a maintainer to contribute. Substantive merged pull requests are credited through Git history and GitHub's contributor graph.

Repeated high-quality contribution, review work, issue triage, or ownership of a project area may lead to broader maintainer responsibilities as the project grows. Access is granted based on demonstrated project work, not contribution volume alone.

## Security and conduct

Security-sensitive reports follow `SECURITY.md`. Community behavior follows `CODE_OF_CONDUCT.md`.
