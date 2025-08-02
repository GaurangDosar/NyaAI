-- Drop existing tables if they exist to avoid conflicts
DROP TABLE IF EXISTS scheme_applications CASCADE;
DROP TABLE IF EXISTS government_schemes CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS documents CASCADE;

-- Create user_profiles table for regular users
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lawyer_profiles table 
CREATE TABLE lawyer_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  license_number TEXT,
  profile_picture TEXT,
  specialization TEXT,
  experience_years INTEGER,
  rating FLOAT DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  court_level TEXT,
  bar_association TEXT,
  practice_areas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ratings table for lawyer reviews
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lawyer_id UUID REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contacts table to track user-lawyer connections
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  lawyer_id UUID REFERENCES lawyer_profiles(id) ON DELETE CASCADE,
  last_contacted TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table for chat between users and lawyers
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chatbot_logs table for AI chat summaries
CREATE TABLE chatbot_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_ratings_lawyer_id ON ratings(lawyer_id);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_lawyer_id ON contacts(lawyer_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX idx_chatbot_logs_user_id ON chatbot_logs(user_id);

-- Create function to update lawyer ratings
CREATE OR REPLACE FUNCTION update_lawyer_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lawyer_profiles 
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0) 
      FROM ratings 
      WHERE lawyer_id = NEW.lawyer_id
    ),
    review_count = (
      SELECT COUNT(*) 
      FROM ratings 
      WHERE lawyer_id = NEW.lawyer_id
    )
  WHERE id = NEW.lawyer_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update lawyer ratings
CREATE TRIGGER update_lawyer_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_lawyer_rating();