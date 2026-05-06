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
