-- ============================================================
-- EventSphere - Production PostgreSQL Schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";  -- for geospatial queries
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fuzzy text search

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('user', 'organizer', 'admin');
CREATE TYPE event_status AS ENUM ('draft', 'upcoming', 'live', 'completed', 'cancelled');
CREATE TYPE event_category AS ENUM (
  'marathon', 'meetup', 'cafe', 'club', 'community', 'music',
  'sports', 'tech', 'food', 'art', 'wellness', 'business',
  'outdoor', 'workshop', 'charity', 'other'
);
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE registration_status AS ENUM ('confirmed', 'waitlisted', 'cancelled');
CREATE TYPE notification_type AS ENUM ('event_update', 'registration', 'reminder', 'system', 'organizer');

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'user',
  bio TEXT,
  phone TEXT,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  interests event_category[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORGANIZERS
-- ============================================================
CREATE TABLE organizers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  website TEXT,
  social_links JSONB DEFAULT '{}',
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  total_events INTEGER NOT NULL DEFAULT 0,
  follower_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- VENUES
-- ============================================================
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'India',
  zip_code TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  capacity INTEGER,
  description TEXT,
  amenities TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  short_description TEXT,
  banner_url TEXT,
  category event_category NOT NULL DEFAULT 'other',
  tags TEXT[] DEFAULT '{}',
  status event_status NOT NULL DEFAULT 'draft',
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  is_online BOOLEAN NOT NULL DEFAULT false,
  online_url TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  capacity INTEGER,
  current_attendees INTEGER NOT NULL DEFAULT 0,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  is_free BOOLEAN NOT NULL DEFAULT true,
  registration_deadline TIMESTAMPTZ,
  min_age INTEGER,
  max_age INTEGER,
  requirements TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_capacity CHECK (capacity IS NULL OR capacity > 0),
  CONSTRAINT valid_price CHECK (price >= 0)
);

-- ============================================================
-- EVENT IMAGES
-- ============================================================
CREATE TABLE event_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REGISTRATIONS
-- ============================================================
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status registration_status NOT NULL DEFAULT 'confirmed',
  ticket_code TEXT NOT NULL UNIQUE DEFAULT upper(substr(md5(random()::text), 1, 8)),
  registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(event_id, user_id)
);

-- ============================================================
-- BOOKMARKS
-- ============================================================
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, event_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'system',
  data JSONB DEFAULT '{}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- USER INTERESTS
-- ============================================================
CREATE TABLE user_interests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category event_category NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- ============================================================
-- ORGANIZER VERIFICATION REQUESTS
-- ============================================================
CREATE TABLE organizer_verification_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  documents TEXT[] DEFAULT '{}',
  notes TEXT,
  status verification_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_events_organizer_id ON events(organizer_id);
CREATE INDEX idx_events_venue_id ON events(venue_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_is_featured ON events(is_featured);
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_location ON events(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_events_search ON events USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_events_tags ON events USING gin(tags);
CREATE INDEX idx_registrations_event_id ON registrations(event_id);
CREATE INDEX idx_registrations_user_id ON registrations(user_id);
CREATE INDEX idx_registrations_status ON registrations(status);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX idx_bookmarks_event_id ON bookmarks(event_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_organizers_user_id ON organizers(user_id);
CREATE INDEX idx_organizers_verification ON organizers(verification_status);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_organizers_updated_at BEFORE UPDATE ON organizers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update attendee count on registration changes
CREATE OR REPLACE FUNCTION update_event_attendee_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE events SET current_attendees = current_attendees + 1 WHERE id = NEW.event_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status != 'confirmed' AND NEW.status = 'confirmed' THEN
      UPDATE events SET current_attendees = current_attendees + 1 WHERE id = NEW.event_id;
    ELSIF OLD.status = 'confirmed' AND NEW.status != 'confirmed' THEN
      UPDATE events SET current_attendees = GREATEST(current_attendees - 1, 0) WHERE id = NEW.event_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    UPDATE events SET current_attendees = GREATEST(current_attendees - 1, 0) WHERE id = OLD.event_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_registration_attendee_count
AFTER INSERT OR UPDATE OR DELETE ON registrations
FOR EACH ROW EXECUTE FUNCTION update_event_attendee_count();

-- Update organizer total_events count
CREATE OR REPLACE FUNCTION update_organizer_event_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE organizers SET total_events = total_events + 1 WHERE id = NEW.organizer_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE organizers SET total_events = GREATEST(total_events - 1, 0) WHERE id = OLD.organizer_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_event_organizer_count
AFTER INSERT OR DELETE ON events
FOR EACH ROW EXECUTE FUNCTION update_organizer_event_count();

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_verification_requests ENABLE ROW LEVEL SECURITY;

-- Helper: is current user an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is current user an organizer
CREATE OR REPLACE FUNCTION is_organizer()
RETURNS BOOLEAN AS $$
  SELECT role IN ('organizer', 'admin') FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL USING (is_admin());

-- ORGANIZERS
CREATE POLICY "organizers_select_public" ON organizers FOR SELECT USING (true);
CREATE POLICY "organizers_insert_own" ON organizers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "organizers_update_own" ON organizers FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "organizers_delete_admin" ON organizers FOR DELETE USING (is_admin());

-- VENUES
CREATE POLICY "venues_select_public" ON venues FOR SELECT USING (true);
CREATE POLICY "venues_insert_organizer" ON venues FOR INSERT WITH CHECK (is_organizer());
CREATE POLICY "venues_update_organizer" ON venues FOR UPDATE USING (
  organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()) OR is_admin()
);
CREATE POLICY "venues_delete_organizer" ON venues FOR DELETE USING (
  organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()) OR is_admin()
);

-- EVENTS: public can read published events
CREATE POLICY "events_select_published" ON events FOR SELECT USING (
  status != 'draft' OR organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()) OR is_admin()
);
CREATE POLICY "events_insert_organizer" ON events FOR INSERT WITH CHECK (
  organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid())
);
CREATE POLICY "events_update_organizer" ON events FOR UPDATE USING (
  organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()) OR is_admin()
);
CREATE POLICY "events_delete_organizer" ON events FOR DELETE USING (
  organizer_id IN (SELECT id FROM organizers WHERE user_id = auth.uid()) OR is_admin()
);

-- EVENT IMAGES
CREATE POLICY "event_images_select_public" ON event_images FOR SELECT USING (true);
CREATE POLICY "event_images_manage_organizer" ON event_images FOR ALL USING (
  event_id IN (
    SELECT e.id FROM events e
    JOIN organizers o ON e.organizer_id = o.id
    WHERE o.user_id = auth.uid()
  ) OR is_admin()
);

-- REGISTRATIONS
CREATE POLICY "registrations_select_own" ON registrations FOR SELECT USING (
  user_id = auth.uid()
  OR event_id IN (
    SELECT e.id FROM events e
    JOIN organizers o ON e.organizer_id = o.id
    WHERE o.user_id = auth.uid()
  )
  OR is_admin()
);
CREATE POLICY "registrations_insert_own" ON registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "registrations_update_own" ON registrations FOR UPDATE USING (
  user_id = auth.uid() OR is_admin()
);

-- BOOKMARKS
CREATE POLICY "bookmarks_own" ON bookmarks FOR ALL USING (auth.uid() = user_id);

-- NOTIFICATIONS
CREATE POLICY "notifications_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- USER INTERESTS
CREATE POLICY "interests_own" ON user_interests FOR ALL USING (auth.uid() = user_id);

-- VERIFICATION REQUESTS
CREATE POLICY "verification_select" ON organizer_verification_requests FOR SELECT USING (
  submitted_by = auth.uid() OR is_admin()
);
CREATE POLICY "verification_insert" ON organizer_verification_requests FOR INSERT WITH CHECK (
  submitted_by = auth.uid()
);
CREATE POLICY "verification_update_admin" ON organizer_verification_requests FOR UPDATE USING (is_admin());

-- ============================================================
-- REALTIME PUBLICATIONS (enable realtime for key tables)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE registrations;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ============================================================
-- STORAGE BUCKETS (run via Supabase dashboard or API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('organizer-assets', 'organizer-assets', true);
