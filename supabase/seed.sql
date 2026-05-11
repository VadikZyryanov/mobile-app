-- =========================================================
-- Iter 2 development seed.
-- HOW TO USE:
-- 1. Apply migrations 20260506000000_content.sql and 20260506000001_search.sql
--    via Studio → SQL editor
-- 2. Create storage buckets via Studio → Storage UI (see storage_policies.sql)
-- 3. Upload media files to buckets (GIFs, videos, covers) via Storage UI
--    Paths below must match your uploaded files:
--    exercise-media/gifs/squat.gif, exercise-media/videos/squat-tech.mp4, etc.
-- 4. Run THIS file in Studio → SQL editor
-- 5. Make yourself admin first (run separately, replace with your user uuid):
--    UPDATE public.profiles SET is_admin = true, subscription_tier = 'pro_max'
--    WHERE id = '<your-user-uuid>';
-- =========================================================

-- EXERCISES -----------------------------------------------
insert into public.exercises (slug, name, description, primary_muscle, secondary_muscles, equipment, gif_path, video_path, min_tier) values
  ('squat',          'Приседания со штангой', 'Базовое упражнение на ноги. Опускайтесь до параллели бедра с полом.',  'quads',     '{"glutes","hamstrings","core"}', '{"barbell","rack"}',  'gifs/squat.gif',         'videos/squat-tech.mp4',    'pro'),
  ('deadlift',       'Становая тяга',         'Базовое упражнение на заднюю цепь. Спина прямая.',                    'back',      '{"hamstrings","glutes","core"}', '{"barbell"}',         'gifs/deadlift.gif',      'videos/deadlift-tech.mp4', 'pro'),
  ('push-up',        'Отжимания от пола',     'Классические отжимания. Тело — прямая линия.',                        'chest',     '{"triceps","shoulders","core"}', '{}',                  'gifs/push-up.gif',       null,                       'free'),
  ('pull-up',        'Подтягивания',          'Подтягивания прямым хватом до подбородка над перекладиной.',           'back',      '{"biceps","shoulders"}',         '{"pull-up-bar"}',     'gifs/pull-up.gif',       'videos/pull-up-tech.mp4',  'basic'),
  ('plank',          'Планка',                'Удержание прямого положения на локтях.',                              'core',      '{}',                             '{}',                  'gifs/plank.gif',         null,                       'free'),
  ('lunge',          'Выпады',                'Шаг вперёд, опускание заднего колена.',                               'quads',     '{"glutes","hamstrings"}',        '{"dumbbells"}',       'gifs/lunge.gif',         null,                       'basic'),
  ('bench-press',    'Жим штанги лёжа',       'Жим штанги от груди на горизонтальной скамье.',                       'chest',     '{"triceps","shoulders"}',        '{"barbell","bench"}', 'gifs/bench-press.gif',   null,                       'basic'),
  ('barbell-row',    'Тяга штанги в наклоне', 'Тяга к поясу в наклоне 45°.',                                         'back',      '{"biceps"}',                     '{"barbell"}',         'gifs/row.gif',           null,                       'basic'),
  ('shoulder-press', 'Жим над головой',       'Жим штанги стоя над головой.',                                         'shoulders', '{"triceps","core"}',             '{"barbell"}',         'gifs/shoulder-press.gif',null,                       'basic'),
  ('burpee',         'Бёрпи',                 'Прыжок-отжимание-прыжок. Кардио + сила.',                              'cardio',    '{"core","chest","quads"}',       '{}',                  'gifs/burpee.gif',        null,                       'free');

-- WORKOUTS ------------------------------------------------
insert into public.workouts (slug, title, description, category, cover_path, duration_minutes, difficulty, min_tier) values
  ('upper-power',       'Верх тела — сила',       'Базовая тренировка на грудь, спину, плечи.',  'upper',     'upper-power.jpg',       45, 3, 'basic'),
  ('lower-power',       'Низ тела — сила',         'Приседания, становая, выпады. Тяжёлая.',      'lower',     'lower-power.jpg',       50, 4, 'basic'),
  ('full-body-starter', 'Full body для новичков',  'Лёгкая полная тренировка тела.',              'full_body', 'full-body-starter.jpg', 30, 1, 'basic'),
  ('hiit-15',           'HIIT 15 минут',           'Высокоинтенсивный интервальный тренинг.',     'cardio',    'hiit-15.jpg',           15, 4, 'basic'),
  ('core-burn',         'Кор и пресс',             'Изоляция кора, планки и скручивания.',        'core',      'core-burn.jpg',         20, 2, 'basic');

-- WORKOUT_EXERCISES ---------------------------------------
insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 1, e.id, 4, '6-8', 120, 'Тяжёлый рабочий вес'
from public.workouts w, public.exercises e where w.slug='upper-power' and e.slug='bench-press';

insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 2, e.id, 4, '6-8', 120, null
from public.workouts w, public.exercises e where w.slug='upper-power' and e.slug='barbell-row';

insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 3, e.id, 3, '8-10', 90, null
from public.workouts w, public.exercises e where w.slug='upper-power' and e.slug='shoulder-press';

insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 4, e.id, 3, 'AMRAP', 60, 'До отказа'
from public.workouts w, public.exercises e where w.slug='upper-power' and e.slug='pull-up';

insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 1, e.id, 5, '5', 180, 'Главное упражнение'
from public.workouts w, public.exercises e where w.slug='lower-power' and e.slug='squat';

insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 2, e.id, 3, '5', 180, null
from public.workouts w, public.exercises e where w.slug='lower-power' and e.slug='deadlift';

insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 3, e.id, 3, '10/нога', 90, null
from public.workouts w, public.exercises e where w.slug='lower-power' and e.slug='lunge';

insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 1, e.id, 3, '10', 60, null
from public.workouts w, public.exercises e where w.slug='full-body-starter' and e.slug='push-up';

insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 2, e.id, 3, '12', 60, null
from public.workouts w, public.exercises e where w.slug='full-body-starter' and e.slug='lunge';

insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 3, e.id, 3, '30s', 60, null
from public.workouts w, public.exercises e where w.slug='full-body-starter' and e.slug='plank';

insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 1, e.id, 5, '20s', 10, '5 раундов: 20s работа / 10s отдых'
from public.workouts w, public.exercises e where w.slug='hiit-15' and e.slug='burpee';

insert into public.workout_exercises (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
select w.id, 1, e.id, 4, '45s', 30, null
from public.workouts w, public.exercises e where w.slug='core-burn' and e.slug='plank';

-- PROGRAMS ------------------------------------------------
insert into public.programs (slug, title, description, cover_path, weeks, sessions_per_week, difficulty, min_tier) values
  ('8-week-strength',  '8 недель — сила',   'Линейная прогрессия в базовых упражнениях. Понедельник/среда/пятница.', '8-week-strength.jpg',  8, 3, 3, 'pro'),
  ('4-week-jumpstart', '4 недели — старт',  'Лёгкая программа для входа в режим. 3 раза в неделю.',                 '4-week-jumpstart.jpg', 4, 3, 1, 'basic');

-- PROGRAM_WORKOUTS: 8-week-strength (пн=1/ср=3/пт=5) x 8 недель
insert into public.program_workouts (program_id, week, day_of_week, workout_id)
select p.id, gs.week, t.day, wk.id
from public.programs p,
     generate_series(1, 8) as gs(week),
     (values (1, 'upper-power'), (3, 'lower-power'), (5, 'full-body-starter')) as t(day, slug),
     public.workouts wk
where p.slug = '8-week-strength' and wk.slug = t.slug;

-- PROGRAM_WORKOUTS: 4-week-jumpstart (пн=1/ср=3/пт=5) x 4 недели
insert into public.program_workouts (program_id, week, day_of_week, workout_id)
select p.id, gs.week, t.day, wk.id
from public.programs p,
     generate_series(1, 4) as gs(week),
     (values (1, 'full-body-starter'), (3, 'core-burn'), (5, 'hiit-15')) as t(day, slug),
     public.workouts wk
where p.slug = '4-week-jumpstart' and wk.slug = t.slug;

-- BLOG_POSTS ----------------------------------------------
-- author_id resolves to the first admin profile found.
-- Make sure you've run: UPDATE profiles SET is_admin = true WHERE id = '<your-uuid>';
-- BEFORE running this seed.
insert into public.blog_posts (slug, title, excerpt, body, cover_path, author_id, published_at)
select
  'how-to-squat',
  'Как правильно приседать',
  'Разбираем технику приседаний пошагово.',
  E'# Техника приседаний\n\nНоги на ширине плеч, носки чуть в стороны.\n\n## Опускание\n- Колени по линии стопы\n- Спина прямая\n\n## Подъём\nТолкаемся пятками.',
  'post-1.jpg',
  (select id from public.profiles where is_admin = true limit 1),
  now() - interval '3 days'
where exists (select 1 from public.profiles where is_admin = true);

insert into public.blog_posts (slug, title, excerpt, body, cover_path, author_id, published_at)
select
  'rest-importance',
  'Зачем нужен отдых',
  'Восстановление так же важно, как и тренировка.',
  E'# Отдых = прогресс\n\nМышцы растут не на тренировке, а во сне.\n\n- 7-9 часов сна\n- 48 часов между тяжёлыми тренировками одной группы',
  'post-2.jpg',
  (select id from public.profiles where is_admin = true limit 1),
  now() - interval '1 day'
where exists (select 1 from public.profiles where is_admin = true);

insert into public.blog_posts (slug, title, excerpt, body, cover_path, author_id, published_at)
select
  'protein-basics',
  'Белок: сколько и когда',
  'Базовая математика по белку.',
  E'# Белок\n\n1.6-2.2 г/кг для атлета.\n\n## Источники\n- Курица, рыба, говядина\n- Яйца, творог\n- Whey-протеин для добора',
  'post-3.jpg',
  (select id from public.profiles where is_admin = true limit 1),
  now()
where exists (select 1 from public.profiles where is_admin = true);

-- FOODS (~80 products) -----------------------------------
-- Run AFTER migration 20260510000000_nutrition.sql is applied
insert into public.foods (slug, name, brand, kcal_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g) values
  -- Мясо и птица
  ('chicken-breast', 'Куриная грудка (отварная)', null, 165, 31.0, 3.6, 0.0),
  ('chicken-thigh', 'Куриное бедро (без кожи)', null, 177, 25.0, 8.0, 0.0),
  ('beef-lean', 'Говядина постная (отварная)', null, 187, 27.0, 9.0, 0.0),
  ('beef-mince', 'Говяжий фарш (5% жирности)', null, 152, 20.5, 7.5, 0.0),
  ('pork-tenderloin', 'Свиная вырезка (отварная)', null, 166, 26.0, 6.4, 0.0),
  ('turkey-breast', 'Индейка грудка (отварная)', null, 157, 30.0, 3.5, 0.0),
  ('duck-breast', 'Утиная грудка', null, 201, 23.5, 11.5, 0.0),

  -- Рыба и морепродукты
  ('salmon', 'Лосось (запечённый)', null, 208, 20.0, 13.0, 0.0),
  ('tuna-canned', 'Тунец консервированный в воде', null, 116, 26.0, 1.0, 0.0),
  ('cod', 'Треска (отварная)', null, 105, 23.0, 0.9, 0.0),
  ('tilapia', 'Тилапия (запечённая)', null, 128, 26.0, 2.7, 0.0),
  ('shrimp', 'Креветки (отварные)', null, 99, 24.0, 0.3, 0.0),
  ('herring', 'Сельдь (слабосолёная)', null, 217, 17.0, 16.0, 0.0),
  ('sardines-canned', 'Сардины в масле (консервы)', null, 208, 24.6, 11.5, 0.0),

  -- Яйца и молочные продукты
  ('eggs', 'Яйцо куриное', null, 155, 13.0, 11.0, 1.1),
  ('egg-white', 'Яичный белок', null, 52, 11.0, 0.2, 0.7),
  ('cottage-cheese-5', 'Творог 5%', null, 121, 17.2, 5.0, 1.8),
  ('cottage-cheese-0', 'Творог обезжиренный 0%', null, 79, 18.0, 0.2, 1.8),
  ('greek-yogurt', 'Греческий йогурт натуральный 2%', null, 59, 10.0, 0.4, 3.6),
  ('kefir-1', 'Кефир 1%', null, 41, 3.3, 1.0, 4.7),
  ('milk-2', 'Молоко 2.5%', null, 52, 2.8, 2.5, 4.7),
  ('cheese-russian', 'Сыр Российский', null, 364, 23.2, 29.5, 0.3),
  ('mozzarella', 'Моцарелла (лёгкая)', null, 254, 24.6, 16.1, 2.2),
  ('whey-protein', 'Протеин сывороточный (порошок)', null, 380, 73.0, 7.0, 8.0),

  -- Крупы и зерновые
  ('rice-white', 'Рис белый (отварной)', null, 130, 2.7, 0.3, 28.0),
  ('rice-brown', 'Рис бурый (отварной)', null, 112, 2.3, 0.8, 24.0),
  ('buckwheat', 'Гречка (отварная)', null, 110, 4.0, 1.0, 21.0),
  ('oats', 'Овсянка (на воде)', null, 88, 3.0, 1.7, 15.0),
  ('pasta', 'Макароны из твёрдых сортов (отварные)', null, 158, 5.8, 0.9, 31.0),
  ('bulgur', 'Булгур (отварной)', null, 83, 3.1, 0.2, 18.6),
  ('quinoa', 'Киноа (отварная)', null, 120, 4.4, 1.9, 21.3),
  ('millet', 'Пшено (отварное)', null, 119, 3.5, 0.9, 23.0),
  ('lentils', 'Чечевица (отварная)', null, 116, 9.0, 0.4, 20.0),
  ('chickpeas', 'Нут (отварной)', null, 164, 8.9, 2.6, 27.4),
  ('black-beans', 'Чёрные бобы (отварные)', null, 132, 8.9, 0.5, 23.7),

  -- Хлеб и выпечка
  ('bread-rye', 'Хлеб ржаной', null, 259, 6.5, 3.3, 48.0),
  ('bread-white', 'Хлеб белый (пшеничный)', null, 265, 8.1, 3.2, 49.0),
  ('crispbread-rye', 'Хлебцы ржаные', null, 334, 9.5, 2.9, 70.0),
  ('oat-bran', 'Отруби овсяные', null, 246, 17.3, 7.0, 34.5),

  -- Овощи
  ('broccoli', 'Брокколи', null, 34, 2.8, 0.4, 7.0),
  ('spinach', 'Шпинат', null, 23, 2.9, 0.4, 3.6),
  ('tomato', 'Помидор', null, 18, 0.9, 0.2, 3.9),
  ('cucumber', 'Огурец', null, 15, 0.6, 0.1, 3.6),
  ('bell-pepper', 'Перец болгарский', null, 31, 1.0, 0.3, 7.0),
  ('carrot', 'Морковь', null, 41, 0.9, 0.2, 10.0),
  ('sweet-potato', 'Батат (запечённый)', null, 90, 2.0, 0.1, 21.0),
  ('potato', 'Картофель (отварной)', null, 87, 1.9, 0.1, 20.0),
  ('zucchini', 'Кабачок', null, 17, 1.2, 0.3, 3.6),
  ('cauliflower', 'Цветная капуста', null, 25, 1.9, 0.3, 5.0),
  ('avocado', 'Авокадо', null, 160, 2.0, 14.7, 8.5),
  ('onion', 'Лук репчатый', null, 40, 1.1, 0.1, 9.3),
  ('garlic', 'Чеснок', null, 149, 6.4, 0.5, 33.1),

  -- Фрукты и ягоды
  ('apple', 'Яблоко', null, 52, 0.3, 0.2, 14.0),
  ('banana', 'Банан', null, 89, 1.1, 0.3, 23.0),
  ('orange', 'Апельсин', null, 47, 0.9, 0.1, 12.0),
  ('strawberry', 'Клубника', null, 32, 0.7, 0.3, 7.7),
  ('blueberry', 'Черника', null, 57, 0.7, 0.3, 14.5),
  ('grape', 'Виноград', null, 67, 0.6, 0.2, 17.2),
  ('watermelon', 'Арбуз', null, 30, 0.6, 0.2, 7.6),
  ('pear', 'Груша', null, 57, 0.4, 0.1, 15.2),
  ('kiwi', 'Киви', null, 61, 1.1, 0.5, 15.0),

  -- Орехи и масла
  ('almonds', 'Миндаль', null, 579, 21.2, 49.9, 21.6),
  ('walnuts', 'Грецкий орех', null, 654, 15.2, 65.2, 14.0),
  ('cashews', 'Кешью', null, 553, 18.2, 43.8, 30.2),
  ('peanut-butter', 'Арахисовая паста натуральная', null, 588, 25.1, 50.4, 20.0),
  ('olive-oil', 'Оливковое масло', null, 884, 0.0, 100.0, 0.0),
  ('sunflower-oil', 'Подсолнечное масло', null, 884, 0.0, 100.0, 0.0),

  -- Сладости и снеки
  ('dark-chocolate', 'Тёмный шоколад 70%', null, 598, 7.8, 42.6, 45.9),
  ('honey', 'Мёд', null, 304, 0.3, 0.0, 82.4),
  ('granola', 'Гранола (без добавок)', null, 471, 10.0, 20.0, 64.0),
  ('protein-bar', 'Протеиновый батончик (BCAA)', null, 380, 30.0, 12.0, 36.0),

  -- Напитки
  ('orange-juice', 'Апельсиновый сок (свежевыжатый)', null, 45, 0.7, 0.2, 10.4),
  ('whole-milk-latte', 'Латте на цельном молоке', null, 62, 3.5, 3.5, 5.0),
  ('coconut-water', 'Кокосовая вода', null, 19, 0.7, 0.2, 3.7);
