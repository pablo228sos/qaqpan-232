# Contributing to Qaqpan 232

Thanks for helping improve Qaqpan 232. Contributions should make the detector, data, documentation, accessibility, localization, testing, or deployment meaningfully better.

## Before you start

1. Check the open issues and choose one that is not already being worked on.
2. Comment on the issue before starting if the change is larger than a typo or a tiny documentation fix.
3. Keep one pull request focused on one problem.
4. Do not add private, leaked, or personally identifying scam messages to the repository.
5. Do not submit generated filler, duplicated examples, mass typo PRs, or changes whose only purpose is contribution-count activity.

## Local setup

Requirements:

- Node.js 22.13+
- npm
- Python 3.11+ only if you want to retrain the model

```bash
git clone https://github.com/pablo228sos/qaqpan-232.git
cd qaqpan-232
npm ci
npm run dev
```

Before opening a pull request:

```bash
npm run lint
npm test
```

For model work:

```bash
python -m pip install scikit-learn numpy
python scripts/train_model.py
```

## Good contribution areas

### Detection rules

Improve `app/lib/analyzer.ts` with narrowly scoped, test-backed rules for scam or dropper-recruitment patterns. Every new rule should include both positive and negative tests to reduce false positives.

### Russian and Kazakh language support

Improve wording, OCR robustness, token handling, or mixed-language detection. Native-language review is especially valuable.

### Dataset improvements

The current dataset is synthetic. New public examples must be derived from legitimate public sources or be safely anonymized and documented. Add a short note explaining the source pattern and why the example is useful.

### Tests

Regression tests for false positives, OCR errors, mixed alphabets, slang, punctuation, and edge cases are welcome.

### Accessibility and UI

Keyboard navigation, screen-reader labels, contrast, mobile layout, error states, and clearer risk explanations are useful contribution areas.

### Documentation

Architecture notes, setup fixes, translations, reproducible evaluation instructions, and clearer model limitations are welcome when they add real information.

## Pull request expectations

A good pull request should include:

- a short explanation of the problem;
- the smallest reasonable change that solves it;
- tests when behavior changes;
- screenshots for visible UI changes;
- no unrelated formatting churn;
- no secrets, credentials, or private user data.

Maintainers may ask for revisions before merging. Substantive contributions are credited through Git history and GitHub's contributor graph.

## Security-sensitive findings

Do not open a public issue for a vulnerability that could expose user data or enable abuse. Follow `SECURITY.md` instead.

## License

By contributing, you agree that your contribution will be licensed under the MIT License used by this repository.
