/*
  # EXCI-MAA Invoice System – Initial Schema

  ## Overview
  Creates the full database schema for the EXCI-MAA professional invoice and mission
  follow-up system.

  ## New Tables

  ### profiles
  Extended user data linked to Supabase auth.users.
  - id (uuid, FK to auth.users)
  - first_name, last_name, initials (auto-computed)
  - role: admin or user

  ### clients
  Client directory, segmented by country.
  - client_code: e.g. C00001 for Cameroon
  - country: enum (CM, CG, CD, RW)
  - address fields: address_bp, nui, rccm, contract_ref

  ### settings
  Global app settings, stores last_invoice_seq counter.

  ### invoices
  Main invoice record with snapshot of client details and full financial totals.

  ### invoice_lines
  Line items per invoice. Section: HONORAIRES, RETENUS, DEBOURS.

  ### missions
  Mission/event entries for the calendar follow-up page.

  ## Security
  - RLS enabled on all tables
  - Authenticated users can read/write their own data
  - Admin role can access all records
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  initials text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, initials, role)
  VALUES (new.id, '', '', '', 'user');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_code text UNIQUE NOT NULL,
  name text NOT NULL,
  country text NOT NULL DEFAULT 'CM',
  address_bp text DEFAULT '',
  nui text DEFAULT '',
  rccm text DEFAULT '',
  contract_ref text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Settings table (global counters etc.)
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  date_emission date NOT NULL DEFAULT CURRENT_DATE,
  client_id uuid REFERENCES clients(id),
  client_details_snapshot jsonb DEFAULT '{}'::jsonb,
  currency text NOT NULL DEFAULT 'XAF',
  exchange_rate decimal(12,4) DEFAULT 1,
  ref_pf text DEFAULT '',
  date_contrat date,
  total_ht decimal(15,2) DEFAULT 0,
  total_tva decimal(15,2) DEFAULT 0,
  total_ttc decimal(15,2) DEFAULT 0,
  total_retenues decimal(15,2) DEFAULT 0,
  total_debours decimal(15,2) DEFAULT 0,
  total_general decimal(15,2) DEFAULT 0,
  acompte_regle decimal(15,2) DEFAULT 0,
  payment_method text DEFAULT 'virement',
  signature_company text DEFAULT '',
  signature_client text DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Users can insert invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Invoice lines table
CREATE TABLE IF NOT EXISTS invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  section text NOT NULL DEFAULT 'HONORAIRES',
  designation text NOT NULL DEFAULT '',
  unite decimal(15,2),
  taux decimal(10,6),
  montant decimal(15,2) DEFAULT 0,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read invoice lines for own invoices"
  ON invoice_lines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_lines.invoice_id
      AND (
        i.created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    )
  );

CREATE POLICY "Users can insert invoice lines"
  ON invoice_lines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_lines.invoice_id AND i.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update invoice lines"
  ON invoice_lines FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_lines.invoice_id
      AND (
        i.created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_lines.invoice_id
      AND (
        i.created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    )
  );

CREATE POLICY "Users can delete invoice lines"
  ON invoice_lines FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices i
      WHERE i.id = invoice_lines.invoice_id
      AND (
        i.created_by = auth.uid() OR
        EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
      )
    )
  );

-- Missions table
CREATE TABLE IF NOT EXISTS missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  client_id uuid REFERENCES clients(id),
  client_name text DEFAULT '',
  follow_up_type text NOT NULL DEFAULT 'SUIVI AUDIT',
  billing_rhythm jsonb DEFAULT '[]'::jsonb,
  start_date date NOT NULL,
  end_date date NOT NULL,
  expected_progress integer DEFAULT 100,
  actual_progress integer DEFAULT 0,
  color text DEFAULT '#1e3a5f',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own missions"
  ON missions FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Users can insert missions"
  ON missions FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own missions"
  ON missions FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  )
  WITH CHECK (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

CREATE POLICY "Users can delete own missions"
  ON missions FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Initialize invoice sequence counter
INSERT INTO settings (key, value) VALUES ('last_invoice_seq', '0') ON CONFLICT (key) DO NOTHING;
