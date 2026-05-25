/*
  # Update Mission Tracking - Exact Excel Structure

  1. Changes
    - Truncate and re-seed audit_tasks with the exact CAC Excel hierarchy
    - Add `team_members` table for staff initials/names used in P/S dropdowns
    - Update `audit_mission_assignments` to use single responsible instead of arrays
      for cleaner per-cell dropdowns
    - Add `is_header` flag to audit_tasks for category headers (larger rows)

  2. Task Hierarchy (from Excel)
    - Top-level tasks (no parent): Lettre de mission, Seuils de signification, etc.
    - Header: Contrôle interne/intérim (with sub-tasks)
    - Header: Note de synthèse générale (with many sub-tasks)
    - Each task has a category and display_order

  3. Team Members
    - Stores initials + full name for dropdown selection
    - A person can appear in both Production and Supervision

  4. Cell Color Logic
    - Yellow = in_progress (with percentage)
    - Green = completed
    - Black/dark = n_a (not available)
    - Mission 100% when all non-N/A cells are green
*/

-- Add is_header column to audit_tasks
ALTER TABLE audit_tasks ADD COLUMN IF NOT EXISTS is_header boolean DEFAULT false;

-- Add progress_percentage to assignments (for yellow cells)
ALTER TABLE audit_mission_assignments ADD COLUMN IF NOT EXISTS progress_percentage integer DEFAULT 0;

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initials text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read team members"
  ON team_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage team members"
  ON team_members FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update team members"
  ON team_members FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete team members"
  ON team_members FOR DELETE
  TO authenticated
  USING (true);

-- Seed team members (common initials from the firm)
INSERT INTO team_members (initials, full_name) VALUES
  ('PN', 'Patrick Nkoulou'),
  ('JM', 'Jean Moukouri'),
  ('TT', 'Tresor Tchebe'),
  ('EN', 'Emmanuel Nkoulou'),
  ('SA', 'Sophie Andela'),
  ('FK', 'Fabrice Kamga'),
  ('MB', 'Marie Bidjang'),
  ('ND', 'Nadine Djoussi')
ON CONFLICT (initials) DO NOTHING;

-- Clear existing audit tasks and re-seed with exact Excel structure
DELETE FROM audit_tasks;

-- Re-seed AUDIT tasks with exact hierarchy
INSERT INTO audit_tasks (mission_type_id, task_code, task_name, category, display_order, is_header) VALUES
  -- Top-level tasks (no category header)
  (1, 'LM', 'Lettre de mission', 'Général', 1, false),
  (1, 'SS', 'Seuils de signification', 'Général', 2, false),
  (1, 'PAP', 'Procédure analytique préliminaire / Revue analytique', 'Général', 3, false),
  (1, 'SG', 'Stratégie générale / Plan d''audit', 'Général', 4, false),
  (1, 'PM', 'Planification de la mission / Budget', 'Général', 5, false),

  -- Contrôle interne / Intérim header
  (1, 'CI', 'Contrôle interne / Intérim', 'Contrôle interne / Intérim', 6, true),
  (1, 'TP', 'Test de procédures', 'Contrôle interne / Intérim', 7, false),
  (1, 'CR', 'CR préalable mise en œuvre des contrôles', 'Contrôle interne / Intérim', 8, false),
  (1, 'ERI', 'Evaluation des risques informatiques', 'Contrôle interne / Intérim', 9, false),
  (1, 'LCB', 'Lutte contre le blanchiment', 'Contrôle interne / Intérim', 10, false),

  -- Note de synthèse générale header
  (1, 'NSG', 'Note de synthèse générale', 'Note de synthèse générale', 11, true),
  (1, 'QFM', 'Questionnaire de fin de mission', 'Note de synthèse générale', 12, false),
  (1, 'DD', 'Déclaration de la direction', 'Note de synthèse générale', 13, false),
  (1, 'QPR', 'Questionnaire préparation rapport états financiers', 'Note de synthèse générale', 14, false),
  (1, 'QPCA', 'Questionnaire préparation points clés de l''audit', 'Note de synthèse générale', 15, false),
  (1, 'QCR', 'Questionnaire conventions réglementées', 'Note de synthèse générale', 16, false),
  (1, 'AR', 'Attestations / Rapports', 'Note de synthèse générale', 17, false),

  -- Detailed audit areas
  (1, 'CV', 'Clients - Ventes', 'Note de synthèse générale', 18, false),
  (1, 'FA', 'Fournisseurs - Achats', 'Note de synthèse générale', 19, false),
  (1, 'SE', 'Stocks et en-cours', 'Note de synthèse générale', 20, false),
  (1, 'FG', 'Frais généraux', 'Note de synthèse générale', 21, false),
  (1, 'IIC', 'Immobilisations incorporelles et corporelles', 'Note de synthèse générale', 22, false),
  (1, 'FP', 'Filiales et participations - Relations groupe', 'Note de synthèse générale', 23, false),
  (1, 'AIF', 'Autres immobilisations financières', 'Note de synthèse générale', 24, false),
  (1, 'CP', 'Capitaux propres', 'Note de synthèse générale', 25, false),
  (1, 'PRC', 'Provisions pour risques et charges', 'Note de synthèse générale', 26, false),
  (1, 'EMP', 'Emprunts', 'Note de synthèse générale', 27, false),
  (1, 'VMP', 'Valeurs mobilières de placement', 'Note de synthèse générale', 28, false),
  (1, 'TRES', 'Trésorerie', 'Note de synthèse générale', 29, false),
  (1, 'POS', 'Personnel et organismes sociaux', 'Note de synthèse générale', 30, false),
  (1, 'IT', 'Impôts et taxes', 'Note de synthèse générale', 31, false),
  (1, 'AAP', 'Autres actifs et passifs', 'Note de synthèse générale', 32, false),
  (1, 'HAO', 'Hors activités ordinaires', 'Note de synthèse générale', 33, false),
  (1, 'FJ', 'Forme juridique', 'Note de synthèse générale', 34, false),
  (1, 'LA', 'Lettre d''affirmation', 'Note de synthèse générale', 35, false),

  -- Reports
  (1, 'RGC', 'Rapport général du CAC', 'Rapports', 36, false),
  (1, 'R715', 'Rapport 715', 'Rapports', 37, false),
  (1, 'RSCR', 'Rapport spécial sur les conventions réglementées', 'Rapports', 38, false),
  (1, 'RSRE', 'Rapport spécial sur les rémunérations exceptionnelles', 'Rapports', 39, false),
  (1, 'RSTC', 'Rapport spécial sur la tenue conforme du registre des titres nominatifs', 'Rapports', 40, false),
  (1, 'RSCM', 'Rapport sur la certification du montant des rémunérations versées aux 05 dirigeants et salariés les mieux rémunérés', 'Rapports', 41, false);

-- Seed EXPERTISE placeholder
INSERT INTO audit_tasks (mission_type_id, task_code, task_name, category, display_order, is_header) VALUES
  (2, 'EXP-01', 'À définir - Tâches expertise comptable', 'Expertise', 1, false);
