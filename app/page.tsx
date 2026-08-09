"use client";

import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Check,
  Copy,
  Database,
  ExternalLink,
  FileSearch,
  Fingerprint,
  LockKeyhole,
  ScanLine,
  ShieldAlert,
  Sparkles,
  Upload,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { AnalysisResult, analyzeOffer, loadModel } from "./lib/analyzer";

const examples = [
  {
    label: "Опасная схема",
    tone: "danger",
    text: "Работа удаленно, 30 минут в день. Принимайте переводы на свою карту Kaspi и отправляйте менеджеру. 10% с каждой операции оставляете себе. Оформление не требуется.",
  },
  {
    label: "Скрытый риск",
    tone: "warning",
    text: "Ищем платежного помощника без опыта. Нужно открыть новый счет и быть на связи с куратором. Оплата каждый вечер, подробности после отклика.",
  },
  {
    label: "Обычная вакансия",
    tone: "safe",
    text: "Ищем junior-дизайнера. Нужны портфолио, тестовое задание и собеседование. Официальный договор, фиксированный оклад один раз в месяц.",
  },
];

const sources = [
  {
    org: "АРРФР",
    fact: "6 200 дроп-карт · оборот 24 млрд ₸",
    href: "https://www.gov.kz/memleket/entities/ardfm/press/news/details/1065183?lang=ru",
  },
  {
    org: "Национальный Банк",
    fact: "60 000+ антифрод-инцидентов за 10 месяцев",
    href: "https://nationalbank.kz/ru/news/informacionnye-soobshcheniya/17702",
  },
  {
    org: "МВД РК",
    fact: "Статья 232-1 · ответственность до 7 лет",
    href: "https://www.gov.kz/memleket/entities/qriim/press/news/details/1068462?lang=ru",
  },
];

function levelLabel(result: AnalysisResult) {
  if (result.level === "high") return "Высокий риск";
  if (result.level === "review") return "Нужна проверка";
  return "Явных признаков нет";
}

export default function Home() {
  const [text, setText] = useState(examples[0].text);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [ocrError, setOcrError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadModel().then(() => setModelReady(true)).catch(() => setModelReady(false));
  }, []);

  const canAnalyze = text.trim().length >= 12 && !loading;

  const groupedSignals = useMemo(() => {
    if (!result) return [];
    return result.signals.slice(0, 6);
  }, [result]);

  async function runAnalysis() {
    if (!canAnalyze) return;
    setLoading(true);
    setOcrError("");
    try {
      const next = await analyzeOffer(text);
      setResult(next);
      requestAnimationFrame(() => document.getElementById("verdict")?.scrollIntoView({ behavior: "smooth", block: "center" }));
    } catch {
      setOcrError("Модель не загрузилась. Обновите страницу и повторите попытку.");
    } finally {
      setLoading(false);
    }
  }

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setOcrError("");
    setOcrProgress(1);
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker(["rus", "kaz"], 1, {
        logger: (message) => {
          if (typeof message.progress === "number") setOcrProgress(Math.max(2, Math.round(message.progress * 100)));
        },
      });
      const recognition = await worker.recognize(file);
      await worker.terminate();
      const extracted = recognition.data.text.replace(/\n{3,}/gu, "\n\n").trim();
      if (!extracted) throw new Error("empty");
      setText(extracted);
      setResult(null);
      setOcrProgress(null);
    } catch {
      setOcrProgress(null);
      setOcrError("Не удалось распознать скриншот. Вставьте текст вручную. Анализ текста работает в браузере.");
    }
  }

  async function copyVerdict() {
    if (!result) return;
    const message = `Qaqpan 232: ${levelLabel(result)} (${result.riskIndex}/100). ${result.headline}`;
    await navigator.clipboard.writeText(message);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <main>
      <nav className="topbar">
        <a className="brand" href="#top" aria-label="Qaqpan 232, наверх">
          <span className="brand-mark"><Fingerprint size={18} /></span>
          <span>QAQPAN <b>232</b></span>
        </a>
        <div className="nav-meta">
          <span className={`model-status ${modelReady ? "ready" : ""}`}><i /> {modelReady ? "ML готов" : "Загрузка ML"}</span>
          <span>NOVAHACK · TRACK 4</span>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><ShieldAlert size={15} /> AI-ПРОФИЛАКТИКА ДРОППЕРСТВА</p>
          <h1>Вакансия<br />или роль в<br /><em>чужой схеме?</em></h1>
          <p className="hero-lede">
            Qaqpan проверяет объявление или переписку. Он находит просьбы принять деньги,
            передать карту или открыть доступ к счёту. Проверку можно сделать до первого перевода.
          </p>
          <div className="hero-proof">
            <div><strong>6 200</strong><span>дроп-карт выявлено<br />в 2024 году</span></div>
            <div><strong>24 млрд ₸</strong><span>их официальный<br />зафиксированный оборот</span></div>
          </div>
          <p className="proof-note">Источник: АРРФР / АФМ РК, данные за 2024 год</p>
        </div>

        <div className="scanner-shell" aria-label="Анализатор вакансии">
          <div className="scanner-head">
            <span><ScanLine size={18} /> QAQPAN X-RAY</span>
            <span className="session">СЕССИЯ НЕ СОХРАНЯЕТСЯ</span>
          </div>
          <textarea
            value={text}
            onChange={(event) => { setText(event.target.value); setResult(null); }}
            aria-label="Текст вакансии или переписки"
            placeholder="Вставьте текст вакансии или переписки…"
          />
          <div className="scanner-actions">
            <label className="upload-button">
              <Upload size={17} />
              {ocrProgress === null ? "Скриншот" : `OCR ${ocrProgress}%`}
              <input type="file" accept="image/*" onChange={handleImage} disabled={ocrProgress !== null} />
            </label>
            <button className="analyze-button" onClick={runAnalysis} disabled={!canAnalyze}>
              {loading ? "Анализируем…" : "Включить X-ray"}<ArrowRight size={18} />
            </button>
          </div>
          {ocrError && <p className="inline-error"><AlertTriangle size={15} /> {ocrError}</p>}
          <div className="example-row" aria-label="Примеры для проверки">
            {examples.map((example) => (
              <button key={example.label} data-tone={example.tone} onClick={() => { setText(example.text); setResult(null); }}>
                <i />{example.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {result && (
        <section className={`verdict verdict-${result.level}`} id="verdict">
          <div className="verdict-score">
            <div className="score-ring" style={{ "--score": `${result.riskIndex * 3.6}deg` } as React.CSSProperties}>
              <span>{result.riskIndex}</span><small>/100</small>
            </div>
            <div>
              <p className="verdict-kicker">ИНДЕКС РИСКА · {levelLabel(result).toUpperCase()}</p>
              <h2>{result.headline}</h2>
              <p>{result.explanation}</p>
            </div>
            <button className="copy-button" onClick={copyVerdict} aria-label="Скопировать результат">
              {copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Скопировано" : "Поделиться"}
            </button>
          </div>

          <div className="xray-grid">
            <div className="evidence-panel">
              <p className="section-label"><FileSearch size={16} /> ЧТО ОБНАРУЖЕНО</p>
              {groupedSignals.length ? groupedSignals.map((signal, index) => (
                <article className="signal" key={signal.id}>
                  <span className="signal-number">0{index + 1}</span>
                  <div><strong>{signal.title}</strong><p>{signal.detail}</p><code>“{signal.match}”</code></div>
                </article>
              )) : (
                <article className="signal clean-signal">
                  <Check size={21} /><div><strong>Критичные действия не найдены</strong><p>Продолжайте проверку компании и договора обычным способом.</p></div>
                </article>
              )}
            </div>

            <div className="flow-panel">
              <p className="section-label"><Fingerprint size={16} /> КАК ВЫГЛЯДИТ ЦЕПОЧКА</p>
              <div className="money-flow">
                {result.flow.map((node, index) => (
                  <div className="flow-step" key={node}>
                    <span className={index === 1 && result.level === "high" ? "you-node" : ""}>{node}</span>
                    {index < result.flow.length - 1 && <ArrowRight size={18} />}
                  </div>
                ))}
              </div>
              {result.level === "high" && <p className="flow-warning">Банк сначала увидит ваш счёт, а не человека, который дал инструкцию.</p>}
              <div className="action-list">
                <p className="section-label"><LockKeyhole size={16} /> ЧТО ДЕЛАТЬ СЕЙЧАС</p>
                {result.actions.map((action) => <div key={action}><Check size={16} /><span>{action}</span></div>)}
              </div>
              <p className="model-readout">ML-индекс {result.mlIndex}/100 · тест: найдено 34 из 44 риск-примеров*</p>
              <p className="model-caveat">*Учебный набор из 68 сообщений. Это не проверка на реальных обращениях.</p>
            </div>
          </div>
        </section>
      )}

      <section className="mechanism">
        <div className="section-intro">
          <p className="eyebrow"><BrainCircuit size={15} /> НЕ ЧАТ-БОТ</p>
          <h2>Qaqpan ищет действия,<br />а не отдельные слова</h2>
          <p>Формулировки меняются. Поэтому модель работает вместе с понятными правилами риска из официальных предупреждений.</p>
        </div>
        <div className="mechanism-steps">
          <article><span>01</span><ScanLine /><h3>OCR</h3><p>Русский и казахский текст извлекается из скриншота прямо в браузере.</p></article>
          <article><span>02</span><BrainCircuit /><h3>Модель</h3><p>TF-IDF и Logistic Regression распознают похожие фразы, опечатки и шум OCR.</p></article>
          <article><span>03</span><Fingerprint /><h3>Сигналы</h3><p>Правила ищут переводы, доступ к карте, коды, снятие денег и просьбы о секретности.</p></article>
          <article><span>04</span><ShieldAlert /><h3>Ответ</h3><p>Пользователь видит найденную фразу, возможную схему денег и безопасный следующий шаг.</p></article>
        </div>
      </section>

      <section className="evidence-section">
        <div className="evidence-title">
          <p className="eyebrow"><Database size={15} /> ПРОВЕРЯЕМАЯ ОСНОВА</p>
          <h2>Все цифры можно<br />проверить.</h2>
        </div>
        <div className="source-list">
          {sources.map((source, index) => (
            <a href={source.href} target="_blank" rel="noreferrer" key={source.org}>
              <span>0{index + 1}</span><div><strong>{source.org}</strong><p>{source.fact}</p></div><ExternalLink size={20} />
            </a>
          ))}
        </div>
      </section>

      <section className="impact-section">
        <div>
          <p className="eyebrow"><Sparkles size={15} /> ГЛАВНЫЙ KPI</p>
          <h2>Остановить человека<br />до первого перевода.</h2>
        </div>
        <div className="impact-path">
          <span>Университеты</span><ArrowRight /><span>Центры занятости</span><ArrowRight /><span>Job-платформы</span><ArrowRight /><span>Банки</span>
        </div>
        <p className="impact-note">Дальше нужны реальные анонимизированные примеры, проверка работодателя по БИН и Telegram Mini App.</p>
      </section>

      <footer>
        <div className="brand"><span className="brand-mark"><Fingerprint size={18} /></span><span>QAQPAN <b>232</b></span></div>
        <p>Команда Sigmabeki · NovaHack 2026 · Track 4</p>
        <p>Qaqpan предупреждает о риске и не заменяет банк, полицию или юридическую консультацию.</p>
      </footer>
    </main>
  );
}
