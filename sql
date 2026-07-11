CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE,
  prior_marathon_seconds INTEGER,
  training_days JSONB NOT NULL DEFAULT '[]',
  strength_days JSONB NOT NULL DEFAULT '[]',
  dietary_pref TEXT,
  training_time_of_day TEXT,
  load_multiplier NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  last_adapted_week_key TEXT,
  strength_focus TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'race',
  distance_type TEXT NOT NULL,
  distance_km NUMERIC(6,2),
  goal_seconds INTEGER,
  priority TEXT NOT NULL DEFAULT 'C',
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  role TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  distance_km NUMERIC(6,2),
  duration_sec INTEGER,
  rpe INTEGER,
  notes TEXT,
  strength_focus_text TEXT,
  exercises_json JSONB,
  mobility TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
