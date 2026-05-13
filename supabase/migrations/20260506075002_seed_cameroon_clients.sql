/*
  # Seed Cameroon Clients

  Inserts the 33 pre-defined Cameroon clients (C00001 to C00033).
  Uses ON CONFLICT DO NOTHING to be idempotent.
*/

INSERT INTO clients (client_code, name, country) VALUES
  ('C00001', 'OMEGA PHI RH', 'CM'),
  ('C00002', 'GLOBE SERVICES RH', 'CM'),
  ('C00003', 'GFS CAMEROUN', 'CM'),
  ('C00004', 'BLUE LAND', 'CM'),
  ('C00005', 'BLUE LINE INVEST', 'CM'),
  ('C00006', 'GFS FRANCE', 'CM'),
  ('C00007', 'TECNO CAMEROUN SARL', 'CM'),
  ('C00008', 'ELCAM', 'CM'),
  ('C00009', 'EXCA', 'CM'),
  ('C00010', 'ECG', 'CM'),
  ('C00011', 'MAKEDA', 'CM'),
  ('C00012', 'ARCHI GROUPE', 'CM'),
  ('C00013', 'STRICAM SARL', 'CM'),
  ('C00014', 'KAFARM INDUSTRY SARL', 'CM'),
  ('C00015', 'EXCI-MAA', 'CM'),
  ('C00016', 'FALAISE BONAPRISO', 'CM'),
  ('C00017', 'FALAISE AKWA', 'CM'),
  ('C00018', 'ITA', 'CM'),
  ('C00019', 'TDZ', 'CM'),
  ('C00020', 'PAJO CONSEILS', 'CM'),
  ('C00021', 'DWC', 'CM'),
  ('C00022', 'DPWS', 'CM'),
  ('C00023', 'BFC', 'CM'),
  ('C00024', 'BES', 'CM'),
  ('C00025', 'CANDACE', 'CM'),
  ('C00026', 'CAMBUILD SARL', 'CM'),
  ('C00027', 'ECLIPSE', 'CM'),
  ('C00028', 'GTS', 'CM'),
  ('C00029', 'FBI', 'CM'),
  ('C00030', 'APS COMPANY LIMITED', 'CM'),
  ('C00031', 'SUISSE PIZZAROTTI BRANCH CAMEROUN', 'CM'),
  ('C00032', 'PIZZAROTTI BRANCH CAMEROUN', 'CM'),
  ('C00033', 'TSMC', 'CM')
ON CONFLICT (client_code) DO NOTHING;
