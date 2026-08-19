# Qaqpan 232

**English** | [Русский](README.md)

**NovaHack 2026 · Track 4: Sustainable & Social Future**

Qaqpan 232 is an open-source browser-based detector for risky job offers and messages that may recruit people into money-mule schemes. A user can paste text or upload a screenshot. The app highlights suspicious phrases, explains the possible money flow, and suggests a safer next step.

Qaqpan is a risk-warning tool. It does not accuse an employer, establish criminal liability, or replace a bank, police, or legal advice.

![Qaqpan 232 interface](artifacts/site-checkpoint-1.jpg)

## Why this exists

Money-mule recruitment often looks like ordinary remote work: receive money to a personal card, keep a percentage, and forward the rest to a manager or another account. Qaqpan focuses on that moment before a user makes the first transfer.

The project is aimed at students, young job seekers, financial-literacy programs, universities, employment services, and job platforms. The current prototype is localized for Russian and Kazakh text.

## What the MVP does

- analyzes pasted job offers and chat messages;
- extracts Russian and Kazakh text from screenshots with Tesseract.js;
- detects requests to receive or forward money;
- detects requests for card details, PIN, CVV, SMS codes, or banking access;
- highlights matched phrases and rule signals;
- combines a TF-IDF + Logistic Regression model with explicit rules;
- suggests concrete safer actions;
- runs without registration or a paid inference API.

Messages are not stored in a server database. Text analysis runs in the browser.

## How detection works

1. Tesseract.js performs OCR for screenshots.
2. Character TF-IDF features represent fragments of the text.
3. Logistic Regression estimates similarity to risky training examples.
4. A rules layer checks concrete actions involving cards, transfers, banking access, and secrecy.
5. The UI returns a risk index, matched signals, an explanation, and next actions.

The model uses character n-grams from three to five characters. This makes it more tolerant of typos, slang, mixed languages, and OCR noise.

The 0–100 risk index is not a probability that a crime occurred. It is a combined warning score produced from the model and rule signals.

## Data and evaluation

`data/offers.csv` contains 256 synthetic Russian and Kazakh examples derived from patterns described in public official warnings. Real victim conversations were not used.

Template variants are separated between train and test groups with a group-holdout strategy so that near-duplicate examples do not leak across the split.

Current test split:

- 68 messages total;
- 44 risky;
- 24 safe;
- 34 of 44 risky messages detected;
- 10 risky messages missed;
- no safe test message classified as risky;
- reported F1: **0.872**.

This is a small synthetic evaluation. It demonstrates the mechanics of the prototype but does not establish real-world accuracy.

## Stack

- React 19, TypeScript, Vinext;
- Tesseract.js;
- Python, NumPy, scikit-learn;
- TF-IDF + Logistic Regression;
- exported JSON model for browser inference;
- Lucide React.

## Repository layout

```text
app/page.tsx             UI and OCR
app/lib/analyzer.ts      text analysis and risk rules
scripts/train_model.py   model training and export
data/offers.csv          synthetic RU/KZ training examples
data/README.md           dataset notes
artifacts/metrics.json   evaluation results
public/model.json        browser model
tests/                   project checks
docs/                    presentation and supporting material
```

## Run locally

Node.js 22.13 or newer is required.

```bash
git clone https://github.com/pablo228sos/qaqpan-232.git
cd qaqpan-232
npm ci
npm run dev
```

Validate the project before submitting a change:

```bash
npm run lint
npm test
```

Model work additionally requires Python 3.11+:

```bash
python -m pip install scikit-learn numpy
python scripts/train_model.py
```

## Contributing

Contributions are welcome when they materially improve the detector, tests, evaluation, localization, accessibility, documentation, or deployment.

Good starting points are listed under the repository's **good first issue** and **help wanted** labels. Before starting a larger change, comment on the issue so duplicate work can be avoided.

Read [CONTRIBUTING.md](CONTRIBUTING.md) for setup, test requirements, data rules, and pull-request expectations. Security-sensitive findings should follow [SECURITY.md](SECURITY.md).

Please do not submit generated filler, duplicated examples, contribution-count-only changes, private conversations, credentials, or personal data.

## Current limitations

- the dataset is synthetic and small;
- a low score does not guarantee that a job offer is safe;
- a high score does not establish an employer's guilt;
- real deployment requires independently labeled anonymized data;
- Russian, Kazakh, and mixed-language performance still need separate evaluation;
- employer/company verification requires trusted external data sources.

## Roadmap

1. Evaluate Russian, Kazakh, and mixed-language samples separately.
2. Collect consented, anonymized real-world examples with independent labeling.
3. Improve OCR and obfuscation robustness.
4. Add trusted company/identifier verification where official data access permits it.
5. Package the detector for Telegram Mini Apps and job-platform integrations.

## Team

**Sigmabeki**

- Saitov Saidzhan
- Bakasov Abai
- Dzhangaziev Daniyar
- Kurmanbekov Chingiz

## License

Qaqpan 232 is released under the [MIT License](LICENSE).
