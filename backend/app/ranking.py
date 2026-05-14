import math
from datetime import date
from app.models.analyst_project import AnalystProject
from app.models.project import Project
from app.models.profile import Profile

# ================================================================
#  МАТРИЦА СХОДСТВА (0..1) – только твои 6 специализаций
# ================================================================
SPEC_SIMILARITY = {
    # Data Scientist
    ("Data Scientist", "Data Scientist"): 1.0,
    ("Data Scientist", "BI-аналитик"): 0.1,
    ("Data Scientist", "Data Engineer"): 0.5,
    ("Data Scientist", "Аналитик данных"): 0.5,
    ("Data Scientist", "Системный аналитик"): 0.1,
    ("Data Scientist", "Бизнес-аналитик"): 0.1,
    # BI-аналитик
    ("BI-аналитик", "Data Scientist"): 0.1,
    ("BI-аналитик", "BI-аналитик"): 1.0,
    ("BI-аналитик", "Data Engineer"): 0.1,
    ("BI-аналитик", "Аналитик данных"): 0.5,
    ("BI-аналитик", "Системный аналитик"): 0.3,
    ("BI-аналитик", "Бизнес-аналитик"): 0.5,
    # Data Engineer
    ("Data Engineer", "Data Scientist"): 0.5,
    ("Data Engineer", "BI-аналитик"): 0.1,
    ("Data Engineer", "Data Engineer"): 1.0,
    ("Data Engineer", "Аналитик данных"): 0.5,
    ("Data Engineer", "Системный аналитик"): 0.1,
    ("Data Engineer", "Бизнес-аналитик"): 0.1,
    # Аналитик данных
    ("Аналитик данных", "Data Scientist"): 0.5,
    ("Аналитик данных", "BI-аналитик"): 0.5,
    ("Аналитик данных", "Data Engineer"): 0.5,
    ("Аналитик данных", "Аналитик данных"): 1.0,
    ("Аналитик данных", "Системный аналитик"): 0.3,
    ("Аналитик данных", "Бизнес-аналитик"): 0.3,
    # Системный аналитик
    ("Системный аналитик", "Data Scientist"): 0.1,
    ("Системный аналитик", "BI-аналитик"): 0.3,
    ("Системный аналитик", "Data Engineer"): 0.1,
    ("Системный аналитик", "Аналитик данных"): 0.3,
    ("Системный аналитик", "Системный аналитик"): 1.0,
    ("Системный аналитик", "Бизнес-аналитик"): 0.5,
    # Бизнес-аналитик
    ("Бизнес-аналитик", "Data Scientist"): 0.1,
    ("Бизнес-аналитик", "BI-аналитик"): 0.5,
    ("Бизнес-аналитик", "Data Engineer"): 0.1,
    ("Бизнес-аналитик", "Аналитик данных"): 0.3,
    ("Бизнес-аналитик", "Системный аналитик"): 0.5,
    ("Бизнес-аналитик", "Бизнес-аналитик"): 1.0,
}

def calculate_total_score(
    analyst_id: int,
    target_project: Project,
    app_specialization: str,
    db
) -> float:
    """
    Matching Score от 0 до 100.
    80 баллов – сходство специализаций (матрица),
    20 баллов – релевантный опыт (логарифм).
    """
    print("=" * 60)
    print(f"=== calculate_total_score START ===")
    print(f"analyst_id = {analyst_id}")
    print(f"project_id = {target_project.id}, title = '{target_project.title}'")
    print(f"project.category (специализация проекта) = '{target_project.category}'")
    print(f"app_specialization (требуемая в отклике) = '{app_specialization}'")

    # 1. Специализация аналитика из профиля
    # Ищем профиль по user_id (исправлено с analyst_id на user_id)
    profile = db.query(Profile).filter(Profile.user_id == analyst_id).first()
    if not profile:
        print(f"!!! Профиль аналитика {analyst_id} не найден !!!")
        analyst_spec = None
    else:
        analyst_spec = profile.specialization
        print(f"analyst_specialization (из БД) = '{analyst_spec}'")

    # 2. Коэффициент сходства (матрица)
    if analyst_spec is None:
        similarity = 0.1
        print("similarity (нет данных) = 0.1")
    else:
        key = (analyst_spec, app_specialization)
        similarity = SPEC_SIMILARITY.get(key, 0.1)
        print(f"similarity key = {key}")
        print(f"similarity = {similarity}")

    spec_score = similarity * 80.0
    print(f"spec_score = {similarity} * 80 = {spec_score:.1f}")

    # 3. Опыт (логарифмическая шкала, максимум 20 баллов)
    analyst_projects = (
        db.query(AnalystProject)
        .filter(AnalystProject.analyst_id == analyst_id)
        .all()
    )
    print(f"Найдено проектов аналитика: {len(analyst_projects)}")

    today = date.today()
    experience_sum = 0.0
    for idx, ap in enumerate(analyst_projects):
        end_d = ap.end_date or today
        start_d = ap.start_date or today
        actual_days = max((end_d - start_d).days, 0)
        days_i = min(actual_days, 540)

        delta_years = (today - end_d).days / 365.25
        k_age = math.exp(-0.15 * delta_years)

        # c_rel: релевантность категории проекта аналитика к требуемой специализации
        c_rel = 1.0 if ap.category == app_specialization else 0.5

        contribution = days_i * k_age * c_rel
        experience_sum += contribution
        print(f"  проект {idx+1}: cat='{ap.category}', days={actual_days}, "
              f"days_i={days_i}, k_age={k_age:.3f}, c_rel={c_rel}, "
              f"вклад={contribution:.1f}")

    print(f"experience_sum = {experience_sum:.1f}")

    MAX_LOG = math.log(1 + 540)   # ≈ 6.293
    exp_score = (math.log(1 + experience_sum) / MAX_LOG) * 20.0
    print(f"exp_score = (log(1+{experience_sum:.1f}) / {MAX_LOG:.3f}) * 20 = {exp_score:.1f}")

    total_score = spec_score + exp_score
    print(f"total_score = {spec_score:.1f} + {exp_score:.1f} = {total_score:.1f}")
    print(f"=== calculate_total_score END ===")
    print("=" * 60 + "\n")

    return round(total_score, 1)