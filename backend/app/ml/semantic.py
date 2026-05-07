import re
import joblib
import numpy as np
import pymorphy3
from pathlib import Path

# Путь к модели относительно этого файла
MODEL_PATH = Path(__file__).parent.parent / "ml" / "model.pkl"

morph = pymorphy3.MorphAnalyzer()

STOP_WORDS_RU = {
    'и', 'в', 'во', 'не', 'что', 'он', 'на', 'я', 'с', 'со', 'как', 'а', 'то',
    'все', 'она', 'так', 'его', 'но', 'да', 'ты', 'к', 'у', 'же', 'вы', 'за',
    'бы', 'по', 'только', 'ее', 'мне', 'было', 'вот', 'от', 'меня', 'еще',
    'нет', 'о', 'из', 'ему', 'теперь', 'когда', 'даже', 'ну', 'вдруг', 'ли',
    'если', 'уже', 'или', 'ни', 'быть', 'был', 'него', 'до', 'вас', 'нибудь',
    'опять', 'уж', 'вам', 'ведь', 'там', 'потом', 'себя', 'ничего', 'ей',
    'может', 'они', 'тут', 'где', 'есть', 'надо', 'ней', 'для', 'мы', 'тебя',
    'их', 'чем', 'была', 'сам', 'чтоб', 'без', 'будто', 'чего', 'раз', 'тоже',
    'себе', 'под', 'будет', 'ж', 'тогда', 'кто', 'этот', 'того', 'потому',
    'этого', 'какой', 'совсем', 'ним', 'здесь', 'этом', 'один', 'почти',
    'мой', 'тем', 'чтобы', 'нее', 'сейчас', 'были', 'куда', 'зачем', 'всех',
    'никогда', 'можно', 'при', 'наконец', 'два', 'об', 'другой', 'хоть',
    'после', 'над', 'больше', 'тот', 'через', 'эти', 'нас', 'про', 'всего',
    'них', 'какая', 'много', 'разве', 'три', 'эту', 'моя', 'впрочем',
    'хорошо', 'свою', 'этой', 'перед', 'иногда', 'лучше', 'чуть', 'том',
    'нельзя', 'такой', 'им', 'более', 'всегда', 'конечно', 'всю', 'между',
    'это', 'весь', 'наш', 'ваш', 'свой', 'который', 'каждый', 'любой', 'самый'
}

BUSINESS_TERMS = {
    'ритейл', 'ретейл', 'e-commerce', 'ecommerce', 'b2b', 'b2c', 'crm', 'erp',
    'wms', 'tms', 'mes', 'scrum', 'agile', 'kanban', 'roi', 'romi', 'ltv',
    'cac', 'arpu', 'gmv', 'nps', 'csi', 'kpi', 'okr', 'swot', 'pest', '5w',
    'abc', 'xyz', 'rfm', 'cohort', 'churn', 'retention', 'onboarding',
    'fintech', 'edtech', 'medtech', 'adtech', 'agritech', 'proptech', 'hrtech',
    'saas', 'paas', 'iaas', 'api', 'sdk', 'ui', 'ux', 'cx', 'devops', 'mlops',
    'dataops', 'sprint', 'backlog', 'roadmap', 'mvp', 'poc', 'pov',
    'brd', 'frd', 'srs', 'bpmn', 'uml', 'erd', 'dfd', 'sql', 'nosql', 'json',
    'xml', 'csv', 'rest', 'soap', 'graphql', 'websocket', 'oauth', 'jwt',
    'ssl', 'tls', 'vpn', 'lan', 'wan', 'cpu', 'gpu', 'ram', 'ssd', 'hdd',
    'os', 'ios', 'android', 'windows', 'linux', 'macos', 'ubuntu'
}

def preprocess_russian_text(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    text = re.sub(r'[^а-яёa-z0-9\s\-/]', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    tokens = text.split()
    cleaned = []
    for token in tokens:
        if len(token) <= 1: continue
        if re.search(r'[a-z]', token) or token in BUSINESS_TERMS:
            if token not in STOP_WORDS_RU:
                cleaned.append(token)
        else:
            if token not in STOP_WORDS_RU:
                try:
                    lemma = morph.parse(token)[0].normal_form
                    cleaned.append(lemma)
                except:
                    cleaned.append(token)
    return ' '.join(cleaned)

_model = None
_vectorizer = None
_classes = None

def load_model():
    global _model, _vectorizer, _classes
    if _model is None:
        if not MODEL_PATH.exists():
            raise FileNotFoundError(f"Файл модели не найден по пути: {MODEL_PATH}")
        pipeline = joblib.load(MODEL_PATH)
        _vectorizer = pipeline.named_steps['tfidf']
        _model = pipeline.named_steps['clf']
        _classes = _model.classes_
    return _model, _vectorizer, _classes

def predict_category(text: str, threshold: float = 0.05):
    cleaned = preprocess_russian_text(text)
    if not cleaned:
        return None, 0.0
        
    model, vec, classes = load_model()
    X = vec.transform([cleaned])
    proba = model.predict_proba(X)[0]
    max_idx = np.argmax(proba)
    max_prob = float(proba[max_idx])
    
    if max_prob < threshold:
        return None, max_prob
        
    return classes[max_idx], max_prob