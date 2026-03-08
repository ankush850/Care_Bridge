-- ==========================================
-- CareBridge Feature Expansion Schema
-- ==========================================
-- This file contains the Supabase SQL commands to 
-- create the necessary tables for the 6 new dashboard features.
-- 
-- To apply these changes, you can copy and paste this into 
-- your Supabase project's SQL Editor.

-- --------------------------------------------------------
-- FEATURE 1: AI Health Assistant
-- Note: We might want a table to store chat history so the AI 
-- Remembers past conversations.
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- --------------------------------------------------------
-- FEATURE 2: Wearable Device Integration
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.connected_devices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider VARCHAR NOT NULL, -- e.g., 'apple_health', 'garmin', 'fitbit'
    access_token TEXT,         -- For actual oAuth integrations later
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    last_synced_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, provider)  -- Prevent duplicate device connections per user
);


-- --------------------------------------------------------
-- FEATURE 3: Diet & Hydration Tracker
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.daily_nutrition_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_calories INTEGER DEFAULT 2000,
    target_protein INTEGER DEFAULT 50,
    target_carbs INTEGER DEFAULT 250,
    target_fats INTEGER DEFAULT 70,
    target_water_glasses INTEGER DEFAULT 8,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.diet_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    food_name VARCHAR NOT NULL,
    meal_type VARCHAR CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner', 'Snack')),
    calories INTEGER NOT NULL DEFAULT 0,
    protein INTEGER DEFAULT 0,
    carbs INTEGER DEFAULT 0,
    fats INTEGER DEFAULT 0,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.hydration_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    glasses INTEGER NOT NULL DEFAULT 1,
    logged_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, logged_date) -- Track total glasses per day per user
);


-- --------------------------------------------------------
-- FEATURE 4: Family & Dependant Management
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dependants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    primary_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    full_name VARCHAR NOT NULL,
    relationship VARCHAR NOT NULL, -- e.g., 'Child', 'Parent', 'Spouse'
    date_of_birth DATE,
    medical_notes TEXT,
    avatar_color VARCHAR DEFAULT 'bg-blue-500', 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: To fully integrate dependants, we would also need to update existing tables 
-- (like medications, appointments, and health_metrics) to include an optional 
-- `dependant_id` column that references this table, so we know if a pill is for 
-- the primary user or their child.
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS dependant_id UUID REFERENCES public.dependants(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS dependant_id UUID REFERENCES public.dependants(id) ON DELETE CASCADE;
ALTER TABLE public.health_metrics ADD COLUMN IF NOT EXISTS dependant_id UUID REFERENCES public.dependants(id) ON DELETE CASCADE;


-- --------------------------------------------------------
-- FEATURE 5: Medical Records Vault
-- Note: This assumes you have a Supabase Storage Bucket setup named 'medical-records'
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    dependant_id UUID REFERENCES public.dependants(id) ON DELETE CASCADE, -- Optional, if the file belongs to a dependant
    file_name VARCHAR NOT NULL,
    file_path TEXT NOT NULL,       -- Path in the Supabase Storage Bucket
    file_size_bytes BIGINT,
    file_type VARCHAR,             -- e.g., 'application/pdf', 'image/png'
    category VARCHAR DEFAULT 'General', -- e.g., 'Lab Result', 'Imaging', 'Prescription'
    record_date DATE,              -- The actual date of the medical record
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- --------------------------------------------------------
-- FEATURE 6: Gamification & Daily Goals
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_gamification (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    current_level INTEGER DEFAULT 1,
    total_xp INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    longest_streak_days INTEGER DEFAULT 0,
    last_activity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    achievement_key VARCHAR NOT NULL, -- e.g., '7_day_streak', 'first_med_logged'
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, achievement_key)
);


-- ==========================================
-- RLS POLICIES (Row Level Security)
-- ==========================================
-- Enable RLS on all the new tables
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_nutrition_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diet_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
