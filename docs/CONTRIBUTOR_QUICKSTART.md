# Contributor quickstart

Use this when you want to make a first Qaqpan 232 contribution without reading the whole codebase first.

## 1. Pick one scoped issue

Prefer an open issue labeled `good first issue` or `help wanted`. Comment before starting anything larger than a very small fix so duplicate work can be avoided.

## 2. Run the project

Requirements: Node.js 22.13+ and npm.

```bash
git clone https://github.com/pablo228sos/qaqpan-232.git
cd qaqpan-232
npm ci
npm run dev
```

Open the local URL printed by the dev server.

For model-training work, also install Python 3.11+ dependencies:

```bash
python -m pip install scikit-learn numpy
```

## 3. Know the three main files

- `app/page.tsx`: UI, screenshot upload, OCR, result rendering.
- `app/lib/analyzer.ts`: model loading, normalization, rules, risk result.
- `scripts/train_model.py`: synthetic corpus generation, group split, training, metrics, model export.

See `docs/ARCHITECTURE.md` for the full map.

## 4. Keep the change narrow

One pull request should solve one problem. Do not combine a localization change, model retraining, formatting cleanup, and unrelated UI changes in the same PR.

If behavior changes, add a focused test. For risk rules, include both a positive example and a safe negative example.

## 5. Validate before opening the PR

```bash
npm run lint
npm test
```

If you changed training/model code:

```bash
python scripts/train_model.py
```

Review generated artifact changes before committing them. Do not hand-edit model coefficients or metrics.

## 6. Open the PR

Explain:

- what was wrong or missing;
- what changed;
- how you tested it;
- any limitations or tradeoffs;
- screenshots for visible UI changes.

Keep generated filler, private conversations, credentials, personal data, unrelated formatting churn, and contribution-count-only changes out of the PR.

## Project promises to preserve

- user messages are analyzed locally in the current MVP;
- Qaqpan reports risk signals, not guilt or legal conclusions;
- the reported evaluation is from a small synthetic corpus, not real-world accuracy;
- Russian and Kazakh support should not be silently broken by shared-code changes.

More detail: `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, and `GOVERNANCE.md`.
