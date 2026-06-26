CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    age INTEGER,
    monthly_income Numeric,
    investment_horizon VARCHAR(50),
    monthly_sip_budget NUMERIC,
    risk_appetite VARCHAR(20),
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- goals table
CREATE TABLE user_goals(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    goal_name VARCHAR(100) NOT NULL
);

-- portfolio funds table
CREATE TABLE portfolio_funds(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    fund_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL,
    invested_amount NUMERIC NOT NULL,
    units NUMERIC DEFAULT 0,
    nav NUMERIC DEFAULT 0,
    current_value NUMERIC DEFAULT 0,
    added_at TIMESTAMP DEFAULT NOW()
);

-- Nav data table(from AMFI)
CREATE TABLE nav_data(
    id SERIAL PRIMARY KEY,
    scheme_code VARCHAR(20),
    scheme_name VARCHAR(300),
    nav NUMERIC,
    nav_date DATE,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI recommendation table
CREATE TABLE ai_recommendations(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recommendation TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- risk quiz answers
CREATE TABLE risk_profiles(
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    answers JSONB,
    total_score INTEGER,
    risk_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW()
);