import math
from datetime import date
from app.models.analyst_project import AnalystProject
from app.models.project import Project
from app.models.user import User

# ============================================================
# ТАБЛИЦА СОПОСТАВЛЕНИЯ "СПЕЦИАЛИЗАЦИЯ → КАТЕГОРИЯ"
# Добавь свои категории. Сюда нужно будет в будущем перенести ML.
# ============================================================
SPECIALIZATION_CATEGORY_MAP = {
    # Data Science / ML
    "Data Scientist": "Data Science",
    "Machine Learning Engineer": "Data Science",
    "ML Engineer": "Data Science",
    
    # Data Engineering
    "Data Engineer": "Data Engineering",
    "ETL Developer": "Data Engineering",
    
    # Business Analysis
    "Бизнес-аналитик": "Business Analysis",
    "Business Analyst": "Business Analysis",
    "System Analyst": "Business Analysis",
    
    # BI / Visualization
    "BI-аналитик": "BI & Visualization",
    "BI Analyst": "BI & Visualization",
    "Data Visualization Specialist": "BI & Visualization",
    
    # Общие категории
    "Аналитик данных": "Data Analysis",
    "Data Analyst": "Data Analysis",
    "Product Analyst": "Data Analysis",
}

# Веса для совпадений (настраивай смело)
MS_EXACT_MATCH = 2.0    # Полное совпадение специализации
MS_CATEGORY_MATCH = 1.2  # Совпадение по категории
MS_NO_MATCH = 0.3        # Нет совпадения

def calculate_total_score(analyst_id: int, target_project: Project, app_specialization: str, db):
    """
    Рассчитывает итоговый Matching Score аналитика для конкретного проекта.
    Возвращает число в диапазоне от ~5 до ~120+, удобное для фронтенда.
    """
    # --------------------------------------------------------
    # 1. Берём аналитика (для рейтинга и доп. данных)
    # --------------------------------------------------------
    analyst = db.query(User).filter(User.id == analyst_id).first()
    avg_rating = float(analyst.average_rating) if analyst and analyst.average_rating else 0.0
    rating_factor = avg_rating / 5.0  # 0 .. 1

    # --------------------------------------------------------
    # 2. Match Quality (Ms) — по таблице категорий
    # --------------------------------------------------------
    proj_category = target_project.category  # Категория проекта
    spec_category = SPECIALIZATION_CATEGORY_MAP.get(app_specialization)  # Категория специализации

    if app_specialization == target_project.category:
        ms = MS_EXACT_MATCH
    elif spec_category and spec_category == proj_category:
        ms = MS_CATEGORY_MATCH
    else:
        ms = MS_NO_MATCH

    # Mh (сфера) — пока базовая, позже можно расширить
    mh = 1.0

    # --------------------------------------------------------
    # 3. Budget Penalty (P_score)
    #    1.0 = нет данных, иначе штраф/бонус за попадание в бюджет
    # --------------------------------------------------------
    p_score = 1.0

    # --------------------------------------------------------
    # 4. Опыт (Days_i) с поправкой на актуальность (K_age)
    # --------------------------------------------------------
    analyst_projects = db.query(AnalystProject).filter(
        AnalystProject.analyst_id == analyst_id
    ).all()

    today = date.today()
    experience_sum = 0.0

    for p in analyst_projects:
        end_d = p.end_date or today
        start_d = p.start_date or today
        actual_days = max((end_d - start_d).days, 0)
        days_i = min(actual_days, 540)  # Cap: 1.5 года

        # K_age — штраф за старину
        delta_years = (today - end_d).days / 365.25
        k_age = math.exp(-0.15 * delta_years)

        # C_rel — совпадение категорий
        c_rel = 1.0 if p.category == proj_category else 0.5

        experience_sum += (days_i * k_age * c_rel)

    # --------------------------------------------------------
    # 5. Итоговая формула: усиленный разброс
    # --------------------------------------------------------
    base_score = (ms + mh) * p_score * math.log(1 + experience_sum)
    total_score = base_score * (1 + rating_factor) * 15  # Масштабирование

    print(
        f"=== calculate_total_score: analyst={analyst_id}, "
        f"target_cat={proj_category}, app_spec={app_specialization}, "
        f"experience_sum={experience_sum:.1f}, rating={avg_rating}, "
        f"total_score={total_score:.1f}"
    )
    return round(total_score, 1)