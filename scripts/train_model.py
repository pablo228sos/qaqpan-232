"""Train the lightweight browser model used by Qaqpan 232.

The dataset is deliberately transparent: it is a synthetic validation corpus
assembled from risk patterns described by Kazakhstan public authorities. It is
not a corpus of criminal cases and must not be presented as one.
"""

from __future__ import annotations

import csv
import json
import random
import re
from pathlib import Path

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, precision_recall_fscore_support
from sklearn.model_selection import GroupShuffleSplit


ROOT = Path(__file__).resolve().parents[1]
SEED = 2321

RISK_BASES = [
    ("ru", "Принимайте переводы на свою карту и сразу пересылайте их менеджеру, десять процентов оставляете себе."),
    ("ru", "Нужна ваша карта Kaspi на пару дней. За каждый входящий платеж получите процент."),
    ("ru", "Передайте доступ к интернет-банкингу, мы сами проведем операции и заплатим вечером."),
    ("ru", "Получайте деньги от клиентов на личный счет, затем отправляйте их по указанным реквизитам."),
    ("ru", "Работа курьером: забираете наличные по адресам и вносите их на чужие карты."),
    ("ru", "Для верификации сотрудника отправьте SMS-код и фото банковской карты с двух сторон."),
    ("ru", "Откройте новый банковский счет на свое имя и передайте логин куратору."),
    ("ru", "Оплата составляет пять процентов от оборота. Ваша задача принимать и дробить платежи."),
    ("ru", "Оформление не требуется. Главное требование: активная карта и быстрые ответы менеджеру."),
    ("ru", "Нужно прогонять деньги через Kaspi и снимать наличные, происхождение средств обсуждать нельзя."),
    ("ru", "Снимайте поступившие деньги в банкомате и отдавайте человеку, которого назовет куратор."),
    ("ru", "Купим или арендуем вашу банковскую карту. Оплата каждый день, вопросов задавать не нужно."),
    ("ru", "Ищем платежного агента без опыта: деньги приходят вам, вы переводите дальше и сохраняете комиссию."),
    ("ru", "Зарегистрируйте ИП и счет на себя, документы и управление будут у нашего бухгалтера."),
    ("ru", "Проводите переводы в интересах третьих лиц за вознаграждение, работа полностью удаленная."),
    ("ru", "Пришлите реквизиты карты, CVV и код подтверждения. Это нужно для подключения зарплатного проекта."),
    ("ru", "Приведите двух друзей с банковскими картами и получите дополнительный бонус."),
    ("ru", "Если банк спросит о переводах, скажите, что это личные расчеты. Не упоминайте работодателя."),
    ("ru", "Подтвердите вход в приложение кодом из SMS, после этого начнется оплачиваемая стажировка."),
    ("ru", "Финансовый помощник: распределяйте входящие суммы по нескольким счетам, обучение за пять минут."),
    ("kk", "Жеке картаңызға ақша қабылдап, оны менеджер көрсеткен шотқа аударыңыз. Әр төлемнен он пайыз аласыз."),
    ("kk", "Kaspi картаңызды бірнеше күнге беріңіз, күн сайын сыйақы төлейміз."),
    ("kk", "Интернет-банкингке кіру деректерін кураторға жіберіңіз, операцияларды өзіміз жасаймыз."),
    ("kk", "Жұмыс үшін SMS кодын және банк картасының екі жағының суретін жіберу керек."),
    ("kk", "Өз атыңызға жаңа шот ашып, логин мен құпиясөзді менеджерге беріңіз."),
    ("kk", "Сіздің міндетіңіз: түскен ақшаны басқа адамдарға аудару, әр операциядан комиссия аласыз."),
    ("kk", "Ресми келісімшарт қажет емес, тек белсенді картаңыз болса жеткілікті."),
    ("kk", "Банкоматтан ақшаны шешіп, куратор айтқан адамға тапсырыңыз."),
    ("kk", "Банк сұраса, аударымдар жеке төлемдер деп айтыңыз және жұмыс туралы айтпаңыз."),
    ("kk", "Тәжірибесіз төлем агенті қажет: ақша сізге түседі, кейін басқа шотқа жібересіз."),
    ("kk", "Банк картаңызды жалға береміз деген ұсыныс: күнделікті табыс және ешқандай құжат жоқ."),
    ("kk", "CVV мен SMS кодын жіберіңіз, сонда жалақы жүйесіне қосамыз."),
]

SAFE_BASES = [
    ("ru", "Ищем junior-дизайнера. Нужны портфолио, тестовое задание и собеседование с руководителем."),
    ("ru", "Требуется кассир в магазин. Официальное трудоустройство, сменный график и фиксированный оклад."),
    ("ru", "Вакансия оператора поддержки: отвечать клиентам в CRM, обучение проходит в офисе компании."),
    ("ru", "Нужен преподаватель математики. Обязанности: вести занятия и проверять домашние работы."),
    ("ru", "Стажировка аналитика: работа с таблицами, подготовка отчетов, договор и наставник со стороны компании."),
    ("ru", "Ищем курьера для доставки документов. Маршруты выдаются в приложении, наличные принимать не нужно."),
    ("ru", "Удаленная работа переводчиком. Оплата по договору после сдачи согласованного объема текста."),
    ("ru", "Компания не просит PIN, CVV, SMS-коды или доступ к личному банковскому приложению."),
    ("ru", "После подписания трудового договора зарплата перечисляется работодателем один раз в месяц."),
    ("ru", "Вакансия SMM-менеджера: контент-план, публикации и аналитика. Отбор по портфолио."),
    ("ru", "Ассистент проекта будет вести календарь, готовить документы и протоколы встреч."),
    ("ru", "Нужен бариста с обучением. Зарплата фиксированная, адрес и БИН работодателя указаны в объявлении."),
    ("ru", "Работа волонтером на городском мероприятии, без финансовых операций и доступа к банковским данным."),
    ("ru", "Оператор склада принимает товар по накладным и ведет учет в системе. Трудовой договор обязателен."),
    ("ru", "Ищем фотографа на один день. Оплата после съемки по договору оказания услуг."),
    ("ru", "Менеджер по продажам консультирует клиентов и оформляет заказы только через корпоративную кассу."),
    ("ru", "Для оформления сотрудник предоставляет документы в отдел кадров, банковские пароли не требуются."),
    ("ru", "Стажер-разработчик будет исправлять ошибки в приложении и участвовать в код-ревью."),
    ("ru", "Водитель компании работает на служебной машине и получает фиксированную ставку за смену."),
    ("ru", "Подработка промоутером: раздача листовок два часа, расчет официально после смены."),
    ("kk", "Junior дизайнер іздейміз. Портфолио, тест тапсырмасы және сұхбат міндетті."),
    ("kk", "Дүкенге кассир қажет. Ресми еңбек шарты, ауысымдық кесте және тұрақты жалақы бар."),
    ("kk", "Қолдау операторы клиенттердің сұрақтарына CRM жүйесінде жауап береді."),
    ("kk", "Математика мұғалімі қажет. Міндеті: сабақ өткізу және үй тапсырмасын тексеру."),
    ("kk", "Аналитик тағылымдамасы: кестелермен жұмыс, есеп дайындау және ресми келісімшарт."),
    ("kk", "Аудармашыға қашықтан жұмыс. Төлем келісімшарт бойынша орындалған мәтін үшін жасалады."),
    ("kk", "Компания PIN, CVV, SMS кодын немесе банк қосымшасына кіруді сұрамайды."),
    ("kk", "Еңбек шартына қол қойылғаннан кейін жалақы айына бір рет төленеді."),
    ("kk", "SMM менеджердің міндеті: контент жоспарлау, жариялау және нәтижені талдау."),
    ("kk", "Қойма операторы тауарды құжат бойынша қабылдап, жүйеде есеп жүргізеді."),
    ("kk", "Бағдарламашы тағылымдамасы: код жазу, қателерді түзету және командалық тексеру."),
    ("kk", "Промоутерге екі сағаттық жұмыс, төлем ауысым аяқталған соң ресми түрде беріледі."),
]

PREFIXES = ["", "Срочно. ", "Новая вакансия. ", "Удаленно. ", "Хабарландыру: ", "Жұмыс ұсынысы. "]
SUFFIXES = ["", " Пишите в личные сообщения.", " Подробности после отклика.", " Байланыс үшін хабарласыңыз."]


def build_rows() -> list[dict[str, object]]:
    rng = random.Random(SEED)
    rows: list[dict[str, object]] = []
    for label, bases in ((1, RISK_BASES), (0, SAFE_BASES)):
        for group, (language, base) in enumerate(bases):
            variants = {base}
            while len(variants) < 4:
                prefix = rng.choice(PREFIXES)
                suffix = rng.choice(SUFFIXES)
                variants.add(f"{prefix}{base}{suffix}".strip())
            for variant in sorted(variants):
                rows.append(
                    {
                        "text": variant,
                        "language": language,
                        "label": label,
                        "group": f"{label}-{group}",
                        "source_kind": "synthetic_from_official_risk_patterns",
                    }
                )
    rng.shuffle(rows)
    return rows


RULES = [
    (0.34, r"(приним\w*|получ\w*|түскен|қабылдап).{0,45}(перевод|платеж|деньг|ақша|аудар)"),
    (0.34, r"(перевод|платеж|деньг|ақша|аудар).{0,45}(дальше|менеджер|куратор|шот|отправ|жібер)"),
    (0.28, r"(переда\w*|отдай\w*|жалға|беріңіз).{0,35}(карт|счет|шот|банкинг|логин|құпиясөз)"),
    (0.24, r"(sms|смс|cvv|pin|пин|код).{0,35}(пришл|отправ|сообщ|жібер|бер)"),
    (0.22, r"(сним\w* налич|банкомат|ақшаны шеш|обнал)"),
    (0.16, r"(процент|комисси|%|сыйақы).{0,40}(перевод|операц|платеж|аудар|төлем)"),
    (0.14, r"(не говор|не упомина|вопросов не|құпия|айтпа|банк сұраса)"),
    (0.12, r"(без оформлен|договор не|келісімшарт қажет емес|құжат жоқ)"),
    (0.12, r"(привед\w* друз|друзей с карт|достар.*карт)"),
]


def rule_score(text: str) -> float:
    normalized = text.lower().replace("ё", "е")
    safe_negation = bool(
        re.search(r"(не просит|не требует|сұрамайды|талап етпейді).{0,45}(pin|cvv|sms|смс|код|банкинг)", normalized)
    )
    score = 0.0
    for weight, pattern in RULES:
        if safe_negation and any(token in pattern for token in ("sms", "переда", "cvv")):
            continue
        if re.search(pattern, normalized, re.IGNORECASE):
            score += weight
    return min(1.0, score)


def main() -> None:
    rows = build_rows()
    texts = [str(row["text"]) for row in rows]
    labels = np.array([int(row["label"]) for row in rows])
    groups = np.array([str(row["group"]) for row in rows])

    splitter = GroupShuffleSplit(n_splits=1, test_size=0.26, random_state=SEED)
    train_idx, test_idx = next(splitter.split(texts, labels, groups))
    train_texts = [texts[index] for index in train_idx]
    test_texts = [texts[index] for index in test_idx]

    vectorizer = TfidfVectorizer(
        analyzer="char",
        ngram_range=(3, 5),
        lowercase=True,
        min_df=2,
        max_features=7000,
        sublinear_tf=False,
        norm="l2",
    )
    train_matrix = vectorizer.fit_transform(train_texts)
    model = LogisticRegression(class_weight="balanced", max_iter=1500, random_state=SEED)
    model.fit(train_matrix, labels[train_idx])

    test_matrix = vectorizer.transform(test_texts)
    probabilities = model.predict_proba(test_matrix)[:, 1]
    predictions = (probabilities >= 0.5).astype(int)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels[test_idx], predictions, average="binary", zero_division=0
    )
    matrix = confusion_matrix(labels[test_idx], predictions, labels=[0, 1]).tolist()
    hybrid_scores = np.array(
        [min(1.0, probability + 0.35 * rule_score(text)) for probability, text in zip(probabilities, test_texts)]
    )
    hybrid_predictions = (hybrid_scores >= 0.5).astype(int)
    h_precision, h_recall, h_f1, _ = precision_recall_fscore_support(
        labels[test_idx], hybrid_predictions, average="binary", zero_division=0
    )
    hybrid_matrix = confusion_matrix(labels[test_idx], hybrid_predictions, labels=[0, 1]).tolist()

    metrics = {
        "dataset_size": len(rows),
        "train_size": len(train_idx),
        "test_size": len(test_idx),
        "accuracy": round(float(accuracy_score(labels[test_idx], predictions)), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1": round(float(f1), 4),
        "confusion_matrix": matrix,
        "hybrid_accuracy": round(float(accuracy_score(labels[test_idx], hybrid_predictions)), 4),
        "hybrid_precision": round(float(h_precision), 4),
        "hybrid_recall": round(float(h_recall), 4),
        "hybrid_f1": round(float(h_f1), 4),
        "hybrid_confusion_matrix": hybrid_matrix,
        "hybrid_operating_threshold": 0.5,
        "test_protocol": "group holdout; base message templates do not cross train/test",
        "limitation": "synthetic validation corpus; not production accuracy",
    }

    feature_names = vectorizer.get_feature_names_out()
    order = np.argsort([vectorizer.vocabulary_[name] for name in feature_names])
    ordered_features = feature_names[order]
    ordered_idf = vectorizer.idf_[order]
    ordered_coef = model.coef_[0][order]

    payload = {
        "version": "1.0.0",
        "model_type": "character TF-IDF + logistic regression",
        "ngram_range": [3, 5],
        "lowercase": True,
        "vocabulary": ordered_features.tolist(),
        "idf": [round(float(value), 8) for value in ordered_idf],
        "coefficients": [round(float(value), 8) for value in ordered_coef],
        "intercept": round(float(model.intercept_[0]), 8),
        "metrics": metrics,
        "sources": [
            "https://www.gov.kz/memleket/entities/qriim/press/news/details/1068462?lang=ru",
            "https://www.gov.kz/memleket/entities/ardfm/press/news/details/1065183?lang=ru",
            "https://fingramota.kz/ru/news/post/ne-bud-marionetkoj-moshennikov-skazhi-net-dropperstvu",
            "https://www.gov.kz/memleket/entities/mvd-atyrau/press/news/1",
        ],
    }

    (ROOT / "data").mkdir(exist_ok=True)
    (ROOT / "artifacts").mkdir(exist_ok=True)
    (ROOT / "public").mkdir(exist_ok=True)

    with (ROOT / "data" / "offers.csv").open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    (ROOT / "artifacts" / "metrics.json").write_text(
        json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (ROOT / "public" / "model.json").write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
