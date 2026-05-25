/*
  # Mission Tracking Schema - CAC Audit & Expertise

  1. New Tables
    - `mission_types` - Static lookup: AUDIT, EXPERTISE
    - `audit_tasks` - Predefined task list per mission type (seeded from Excel)
    - `audit_mission_assignments` - Per-client, per-mission-type task assignments
    - `client_notes` - Notes linked to client and optionally mission type

  2. Security
    - RLS enabled on all tables
    - Authenticated users can read/write within their scope
    - Unique constraint on (client_id, mission_type_id, task_id) for assignments

  3. Notes
    - AUDIT tasks seeded with 30 predefined tasks from Excel structure
    - EXPERTISE seeded with a single placeholder task
    - Assignments auto-initialized when a client+type matrix is first opened
*/

-- Mission types lookup
CREATE TABLE IF NOT EXISTS mission_types (
  id integer PRIMARY KEY,
  code text UNIQUE NOT NULL,
  label text NOT NULL
);

ALTER TABLE mission_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read mission types"
  ON mission_types FOR SELECT
  TO authenticated
  USING (true);

-- Predefined audit/expertise tasks
CREATE TABLE IF NOT EXISTS audit_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_type_id integer NOT NULL REFERENCES mission_types(id),
  task_code text NOT NULL,
  task_name text NOT NULL,
  category text NOT NULL DEFAULT '',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true
);

CREATE INDEX IF NOT EXISTS audit_tasks_mission_type_idx ON audit_tasks(mission_type_id);
CREATE INDEX IF NOT EXISTS audit_tasks_display_order_idx ON audit_tasks(display_order);

ALTER TABLE audit_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read audit tasks"
  ON audit_tasks FOR SELECT
  TO authenticated
  USING (true);

-- Per-client mission assignments
CREATE TABLE IF NOT EXISTS audit_mission_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  mission_type_id integer NOT NULL REFERENCES mission_types(id),
  task_id uuid NOT NULL REFERENCES audit_tasks(id) ON DELETE CASCADE,
  production_responsible text[] NOT NULL DEFAULT '{}',
  supervision_responsible text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'n_a')),
  completion_date date,
  comments text DEFAULT '',
  last_updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_client_mission_task UNIQUE (client_id, mission_type_id, task_id)
);

CREATE INDEX IF NOT EXISTS audit_mission_assignments_client_idx ON audit_mission_assignments(client_id);
CREATE INDEX IF NOT EXISTS audit_mission_assignments_type_idx ON audit_mission_assignments(mission_type_id);

ALTER TABLE audit_mission_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read mission assignments"
  ON audit_mission_assignments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert mission assignments"
  ON audit_mission_assignments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update mission assignments"
  ON audit_mission_assignments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete mission assignments"
  ON audit_mission_assignments FOR DELETE
  TO authenticated
  USING (true);

-- Client notes (optionally linked to mission type)
CREATE TABLE IF NOT EXISTS client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  mission_type_id integer REFERENCES mission_types(id),
  note text NOT NULL DEFAULT '',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS client_notes_client_idx ON client_notes(client_id);

ALTER TABLE client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read client notes"
  ON client_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert client notes"
  ON client_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update client notes"
  ON client_notes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete client notes"
  ON client_notes FOR DELETE
  TO authenticated
  USING (true);

-- Seed mission types
INSERT INTO mission_types (id, code, label) VALUES
  (1, 'AUDIT', 'Suivi Audit'),
  (2, 'EXPERTISE', 'Suivi Expertise')
ON CONFLICT (id) DO NOTHING;

-- Seed AUDIT tasks (from Excel structure - TABLEAU DE SUIVI DES MISSIONS CAC)
INSERT INTO audit_tasks (mission_type_id, task_code, task_name, category, display_order) VALUES
  -- Category: Prise de connaissance
  (1, 'PC-01', 'Prise de connaissance générale de l''entreprise', 'Prise de connaissance', 1),
  (1, 'PC-02', 'Examen des procès-verbaux d''assemblée', 'Prise de connaissance', 2),
  (1, 'PC-03', 'Examen du Manuel de procédures', 'Prise de connaissance', 3),
  (1, 'PC-04', 'Examen du rapport de gestion et du rapport des commissaires aux comptes', 'Prise de connaissance', 4),
  -- Category: Vérification et rapprochement
  (1, 'VR-01', 'Rapprochement des états de rapprochement bancaire', 'Vérification et rapprochement', 5),
  (1, 'VR-02', 'Vérification de la balance générale et de la balance auxiliaire', 'Vérification et rapprochement', 6),
  (1, 'VR-03', 'Rapprochement des comptes de tiers (fournisseurs, clients)', 'Vérification et rapprochement', 7),
  (1, 'VR-04', 'Vérification des immobilisations et des amortissements', 'Vérification et rapprochement', 8),
  -- Category: Contrôle des comptes
  (1, 'CC-01', 'Contrôle du compte de résultat', 'Contrôle des comptes', 9),
  (1, 'CC-02', 'Contrôle des charges de personnel', 'Contrôle des comptes', 10),
  (1, 'CC-03', 'Contrôle des charges fiscales et sociales', 'Contrôle des comptes', 11),
  (1, 'CC-04', 'Contrôle des produits d''exploitation', 'Contrôle des comptes', 12),
  (1, 'CC-05', 'Contrôle des autres produits et charges', 'Contrôle des comptes', 13),
  -- Category: Inventaire et stock
  (1, 'IS-01', 'Participation à l''inventaire physique des stocks', 'Inventaire et stock', 14),
  (1, 'IS-02', 'Vérification de la valorisation des stocks', 'Inventaire et stock', 15),
  (1, 'IS-03', 'Rapprochement inventaire/comptabilité', 'Inventaire et stock', 16),
  -- Category: Trésorerie
  (1, 'TR-01', 'Contrôle de la trésorerie et des équivalents de trésorerie', 'Trésorerie', 17),
  (1, 'TR-02', 'Vérification des emprunts et dettes financières', 'Trésorerie', 18),
  (1, 'TR-03', 'Contrôle des placements et titres', 'Trésorerie', 19),
  -- Category: Vérification de la régularité et sincérité
  (1, 'RS-01', 'Vérification de l''application des principes comptables', 'Régularité et sincérité', 20),
  (1, 'RS-02', 'Examen des engagements hors bilan', 'Régularité et sincérité', 21),
  (1, 'RS-03', 'Vérification des événements postérieurs à la clôture', 'Régularité et sincérité', 22),
  (1, 'RS-04', 'Examen des provisions et passifs éventuels', 'Régularité et sincérité', 23),
  -- Category: Rédaction et revue
  (1, 'RR-01', 'Rédaction des feuilles de travail et des conclusions', 'Rédaction et revue', 24),
  (1, 'RR-02', 'Revue croisée des dossiers de travail', 'Rédaction et revue', 25),
  (1, 'RR-03', 'Rédaction du rapport de révision', 'Rédaction et revue', 26),
  (1, 'RR-04', 'Rédaction du rapport des commissaires aux comptes', 'Rédaction et revue', 27),
  -- Category: Opinion et certification
  (1, 'OC-01', 'Formulation de l''opinion sur les comptes', 'Opinion et certification', 28),
  (1, 'OC-02', 'Vérification de la conformité avec le référentiel comptable OHADA', 'Opinion et certification', 29),
  (1, 'OC-03', 'Rédaction de la déclaration de conformité', 'Opinion et certification', 30)
ON CONFLICT DO NOTHING;

-- Seed EXPERTISE placeholder task
INSERT INTO audit_tasks (mission_type_id, task_code, task_name, category, display_order) VALUES
  (2, 'EXP-01', 'À définir - Tâches expertise comptable', 'Expertise', 1)
ON CONFLICT DO NOTHING;
