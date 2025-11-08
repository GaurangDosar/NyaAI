-- Create government_schemes table
CREATE TABLE IF NOT EXISTS public.government_schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  eligibility_criteria jsonb,
  benefits text,
  application_process text,
  required_documents text[],
  deadline date,
  min_age integer,
  max_age integer,
  min_income numeric,
  max_income numeric,
  gender text CHECK (gender IN ('male', 'female', 'any')),
  category text,
  state text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE public.government_schemes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active government schemes" ON public.government_schemes
  FOR SELECT USING (is_active = true);

-- Create scheme_applications table if not exists
CREATE TABLE IF NOT EXISTS public.scheme_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scheme_id uuid REFERENCES public.government_schemes(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'suggested' CHECK (status IN ('suggested', 'applied', 'approved', 'rejected')),
  application_data jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id, scheme_id)
);

ALTER TABLE public.scheme_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own applications" ON public.scheme_applications
  FOR ALL USING (auth.uid() = user_id);

-- Insert sample government schemes
INSERT INTO public.government_schemes (name, description, benefits, min_age, max_age, max_income, gender, category, state, is_active) VALUES
('Pradhan Mantri Jan Dhan Yojana', 'Financial inclusion program providing access to banking services', 'Free bank account, RuPay debit card, accident insurance cover of Rs. 1 lakh', 18, NULL, NULL, 'any', 'Financial', 'All India', true),
('Beti Bachao Beti Padhao', 'Scheme to address declining child sex ratio and promote girls education', 'Improved child sex ratio, increased enrollment of girls in schools', NULL, NULL, NULL, 'female', 'Education', 'All India', true),
('Pradhan Mantri Awas Yojana', 'Housing for all scheme providing affordable housing', 'Interest subsidy on home loans, construction assistance up to Rs. 1.5 lakh', 18, NULL, 1800000, 'any', 'Housing', 'All India', true),
('Ayushman Bharat', 'Health insurance scheme for economically vulnerable families', 'Health cover of Rs. 5 lakh per family per year', NULL, NULL, NULL, 'any', 'Health', 'All India', true),
('PM Kisan Samman Nidhi', 'Income support scheme for farmers', 'Rs. 6000 per year in three equal installments', 18, NULL, NULL, 'any', 'Agriculture', 'All India', true),
('National Pension Scheme', 'Pension scheme for retirement planning', 'Tax benefits, government co-contribution, regular pension after retirement', 18, 60, NULL, 'any', 'Pension', 'All India', true),
('Sukanya Samriddhi Yojana', 'Savings scheme for girl child', 'High interest rate, tax benefits, lump sum at maturity', NULL, 10, NULL, 'female', 'Savings', 'All India', true),
('PM Mudra Yojana', 'Loan scheme for micro enterprises', 'Loans up to Rs. 10 lakh without collateral', 18, NULL, NULL, 'any', 'Business', 'All India', true),
('Atal Pension Yojana', 'Pension scheme for unorganized sector workers', 'Guaranteed minimum pension from Rs. 1000 to Rs. 5000 per month', 18, 40, NULL, 'any', 'Pension', 'All India', true),
('PM Scholarship Scheme', 'Scholarship for children of armed forces personnel', 'Financial support for education', NULL, 25, NULL, 'any', 'Education', 'All India', true)
ON CONFLICT (id) DO NOTHING;
