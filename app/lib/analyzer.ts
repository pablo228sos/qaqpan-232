export type RiskLevel = "high" | "review" | "low";

export type RiskSignal = {
  id: string;
  title: string;
  detail: string;
  category: string;
  match: string;
  weight: number;
};

export type ModelMetrics = {
  dataset_size: number;
  train_size: number;
  test_size: number;
  f1: number;
  recall: number;
  precision: number;
  hybrid_f1: number;
  hybrid_recall: number;
  hybrid_precision: number;
  limitation: string;
};

export type AnalysisResult = {
  level: RiskLevel;
  riskIndex: number;
  mlIndex: number;
  signals: RiskSignal[];
  headline: string;
  explanation: string;
  actions: string[];
  flow: string[];
  metrics: ModelMetrics;
};

type BrowserModel = {
  version: string;
  model_type: string;
  ngram_range: [number, number];
  vocabulary: string[];
  idf: number[];
  coefficients: number[];
  intercept: number;
  metrics: ModelMetrics;
};

type RuleDefinition = Omit<RiskSignal, "match"> & { pattern: RegExp };

const rules: RuleDefinition[] = [
  {
    id: "receive-forward",
    title: "Личный счёт используют как транзит",
    detail: "Вам предлагают принять чужие деньги и отправить их дальше.",
    category: "Движение денег",
    weight: 0.34,
    pattern: /(приним\w*|получ\w*|түскен|қабылдап).{0,45}(перевод|платеж|деньг|ақша|аудар)/iu,
  },
  {
    id: "forward-third-party",
    title: "Перевод в интересах третьего лица",
    detail: "Деньги требуют переслать менеджеру, куратору или на другой счёт.",
    category: "Движение денег",
    weight: 0.34,
    pattern: /(перевод|платеж|деньг|ақша|аудар).{0,45}(дальше|менеджер|куратор|шот|отправ|жібер)/iu,
  },
  {
    id: "account-access",
    title: "Запрашивают карту или доступ",
    detail: "Легальный работодатель не управляет личным банковским счётом сотрудника.",
    category: "Доступ к счёту",
    weight: 0.28,
    pattern: /(переда\w*|отдай\w*|жалға|беріңіз).{0,35}(карт|счет|шот|банкинг|логин|құпиясөз)/iu,
  },
  {
    id: "secret-code",
    title: "Запрашивают секретные банковские данные",
    detail: "SMS-код, PIN и CVV нельзя сообщать работодателю или куратору.",
    category: "Персональные данные",
    weight: 0.24,
    pattern: /(sms|смс|cvv|pin|пин|код).{0,35}(пришл|отправ|сообщ|жібер|бер)/iu,
  },
  {
    id: "cash-out",
    title: "Требуется обналичивание",
    detail: "Снятие и передача чужих денег часто встречаются в дропперских схемах.",
    category: "Обналичивание",
    weight: 0.22,
    pattern: /(сним\w* налич|банкомат|ақшаны шеш|обнал)/iu,
  },
  {
    id: "operation-reward",
    title: "Вознаграждение зависит от переводов",
    detail: "Комиссия за каждую операцию отличается от обычной зарплаты за работу.",
    category: "Мотивация",
    weight: 0.16,
    pattern: /(процент|комисси|%|сыйақы).{0,40}(перевод|операц|платеж|аудар|төлем)/iu,
  },
  {
    id: "secrecy",
    title: "Просят скрывать правду от банка",
    detail: "Просьба скрыть правду от банка указывает на высокий риск.",
    category: "Давление",
    weight: 0.14,
    pattern: /(не говор|не упомина|вопросов не|құпия|айтпа|банк сұраса)/iu,
  },
  {
    id: "no-contract",
    title: "Нет нормального оформления",
    detail: "Отсутствие договора усиливает риск, особенно вместе с финансовыми операциями.",
    category: "Оформление",
    weight: 0.12,
    pattern: /(без оформлен|договор не|келісімшарт қажет емес|құжат жоқ)/iu,
  },
  {
    id: "recruit-friends",
    title: "Просят привести владельцев карт",
    detail: "Вербовка знакомых расширяет сеть счетов для вывода денег.",
    category: "Вербовка",
    weight: 0.12,
    pattern: /(привед\w* друз|друзей с карт|достар.*карт)/iu,
  },
];

let modelPromise: Promise<BrowserModel> | null = null;
let vocabularyIndex: Map<string, number> | null = null;

export function loadModel(): Promise<BrowserModel> {
  if (!modelPromise) {
    modelPromise = fetch("/model.json").then(async (response) => {
      if (!response.ok) throw new Error("Не удалось загрузить ML-модель");
      const model = (await response.json()) as BrowserModel;
      vocabularyIndex = new Map(model.vocabulary.map((token, index) => [token, index]));
      return model;
    });
  }
  return modelPromise;
}

function normalize(text: string): string {
  return text.toLocaleLowerCase("ru-RU").replaceAll("ё", "е").replace(/\s+/gu, " ").trim();
}

function mlProbability(text: string, model: BrowserModel): number {
  const normalized = normalize(text);
  const counts = new Map<number, number>();
  const [minN, maxN] = model.ngram_range;
  const vocab = vocabularyIndex ?? new Map(model.vocabulary.map((token, index) => [token, index]));

  for (let size = minN; size <= maxN; size += 1) {
    for (let start = 0; start <= normalized.length - size; start += 1) {
      const token = normalized.slice(start, start + size);
      const index = vocab.get(token);
      if (index !== undefined) counts.set(index, (counts.get(index) ?? 0) + 1);
    }
  }

  const values = new Map<number, number>();
  let squaredNorm = 0;
  counts.forEach((count, index) => {
    const value = count * model.idf[index];
    values.set(index, value);
    squaredNorm += value * value;
  });
  const norm = Math.sqrt(squaredNorm) || 1;
  let logit = model.intercept;
  values.forEach((value, index) => {
    logit += (value / norm) * model.coefficients[index];
  });
  return 1 / (1 + Math.exp(-logit));
}

function detectSignals(text: string): RiskSignal[] {
  const normalized = normalize(text);
  const safeNegation = /(не просит|не требует|сұрамайды|талап етпейді).{0,45}(pin|cvv|sms|смс|код|банкинг)/iu.test(
    normalized,
  );

  return rules.flatMap((rule) => {
    if (safeNegation && ["secret-code", "account-access"].includes(rule.id)) return [];
    const match = normalized.match(rule.pattern)?.[0];
    return match ? [{ ...rule, match: match.trim() }] : [];
  });
}

export async function analyzeOffer(text: string): Promise<AnalysisResult> {
  const model = await loadModel();
  const probability = mlProbability(text, model);
  const signals = detectSignals(text);
  const ruleScore = Math.min(1, signals.reduce((sum, signal) => sum + signal.weight, 0));
  const combined = Math.min(1, probability + 0.35 * ruleScore);
  const level: RiskLevel = combined >= 0.66 ? "high" : combined >= 0.4 ? "review" : "low";

  if (level === "high") {
    return {
      level,
      riskIndex: Math.round(combined * 100),
      mlIndex: Math.round(probability * 100),
      signals,
      headline: "Похоже, вас хотят использовать для перевода чужих денег",
      explanation:
        "В сообщении есть действия из официальных предупреждений о дропперстве. Qaqpan показывает риск, но не выносит юридический вердикт.",
      actions: [
        "Не передавайте карту, реквизиты, SMS-коды и доступ к банкингу.",
        "Не принимайте и не пересылайте деньги по инструкции незнакомого лица.",
        "Сохраните переписку. Если уже передали данные, сразу свяжитесь с банком и полицией.",
      ],
      flow: ["Потерпевший", "Ваша карта", "Куратор", "Вывод денег"],
      metrics: model.metrics,
    };
  }

  if (level === "review") {
    return {
      level,
      riskIndex: Math.round(combined * 100),
      mlIndex: Math.round(probability * 100),
      signals,
      headline: "Нужна дополнительная проверка работодателя",
      explanation:
        "Модель обнаружила неоднозначные признаки. Не считайте вакансию безопасной, пока не проверены договор, компания и фактические обязанности.",
      actions: [
        "Попросите трудовой договор и точное описание обязанностей.",
        "Проверьте официальный сайт, БИН и корпоративные контакты работодателя.",
        "Откажитесь от любых операций через личный счёт и передачи банковских данных.",
      ],
      flow: ["Объявление", "Проверка компании", "Договор", "Решение"],
      metrics: model.metrics,
    };
  }

  return {
    level,
    riskIndex: Math.round(combined * 100),
    mlIndex: Math.round(probability * 100),
    signals,
    headline: "Явных дропперских признаков не обнаружено",
    explanation:
      "Это не гарантия безопасности. Проверьте работодателя и никогда не передавайте банковские коды, карту или доступ к личному счёту.",
    actions: [
      "Проверьте юридическое лицо и контактные данные.",
      "Читайте договор до передачи документов.",
      "Никому не сообщайте PIN, CVV или SMS-коды.",
    ],
    flow: ["Вакансия", "Собеседование", "Договор", "Работа"],
    metrics: model.metrics,
  };
}
