# Architecture

This document is a map for contributors. Qaqpan 232 intentionally keeps the runtime small: OCR, model inference, rules, and the result UI all run in the browser.

## Request flow

```text
text input ───────────────────────────────┐
                                         │
screenshot → Tesseract.js OCR → text ────┤
                                         ▼
                              app/lib/analyzer.ts
                              ├─ normalize text
                              ├─ TF-IDF browser inference
                              ├─ Logistic Regression score
                              ├─ explicit risk rules
                              └─ combined risk result
                                         │
                                         ▼
                                  app/page.tsx
                              verdict + signals + actions
```

No user message is sent to an inference API by the current MVP.

## Main surfaces

### `app/page.tsx`

Owns the user flow:

- example messages;
- text input;
- screenshot upload;
- Tesseract worker lifecycle and OCR progress;
- invoking `analyzeOffer()`;
- rendering verdicts, evidence, and next actions;
- user-facing error states.

UI, OCR lifecycle, upload validation, accessibility, and localization work usually starts here.

### `app/lib/analyzer.ts`

Owns browser-side detection:

- model contract types;
- model loading;
- text normalization;
- character n-gram feature construction;
- Logistic Regression inference;
- explicit rule matching;
- risk-level thresholds;
- user-facing result content.

Detection-rule changes should include positive and negative regression cases. Avoid broad regexes that turn ordinary banking discussion into a risk signal.

### `scripts/train_model.py`

Owns reproducible training/export:

- transparent synthetic base examples;
- deterministic variant generation;
- group-aware train/test split;
- TF-IDF vocabulary and IDF values;
- Logistic Regression fitting;
- metric calculation;
- browser model export.

Training changes must preserve group isolation between train and test. Metric improvements are not meaningful if template variants leak across the split.

### `data/offers.csv`

Generated/maintained evaluation and training examples. Important fields are documented in `data/README.md`.

Do not add leaked conversations, credentials, private user data, or examples whose provenance cannot be explained.

### `public/model.json`

The browser-consumable model artifact. It contains the vocabulary, IDF values, coefficients, intercept, n-gram range, version metadata, and evaluation metrics needed by the client.

Treat changes here as generated model changes, not hand edits.

### `tests/`

Current repository checks. New behavior should have focused regression coverage when practical. Tests should be deterministic and should not require network access or download OCR language packs unless a test explicitly isolates that integration.

## Design constraints

### Privacy

The current promise is local analysis. A contribution must not silently add server-side logging, analytics that capture message text, or remote inference of user-provided content.

### Transparency

Qaqpan is a warning system, not a legal classifier. The risk index must not be described as the probability that a crime occurred.

### Bilingual behavior

Russian and Kazakh are first-class project languages. A change that improves one language should be checked for regressions in the other where the same code path is shared.

### Evaluation honesty

The current corpus is small and synthetic. Documentation, UI, and PR descriptions must not present the reported metrics as measured real-world accuracy.

## Choosing where to contribute

- UI/accessibility/localization: `app/page.tsx` and styles;
- risk patterns/normalization/model loading: `app/lib/analyzer.ts`;
- ML/evaluation/reproducibility: `scripts/train_model.py` and artifacts;
- data quality: `data/` plus validation tooling;
- contributor experience/CI: `.github/`, tests, and docs.

Start from an open `good first issue` or `help wanted` issue where possible so the expected scope and acceptance criteria are clear.
