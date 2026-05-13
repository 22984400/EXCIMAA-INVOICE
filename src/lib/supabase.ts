import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string;
          initials: string;
          role: 'admin' | 'user';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      clients: {
        Row: {
          id: string;
          client_code: string;
          name: string;
          country: string;
          address_bp: string;
          nui: string;
          rccm: string;
          contract_ref: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['clients']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['clients']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          date_emission: string;
          client_id: string | null;
          client_details_snapshot: Record<string, unknown>;
          currency: string;
          exchange_rate: number;
          ref_pf: string;
          date_contrat: string | null;
          total_ht: number;
          total_tva: number;
          total_ttc: number;
          total_retenues: number;
          total_debours: number;
          total_general: number;
          acompte_regle: number;
          payment_method: string;
          signature_company: string;
          signature_client: string;
          status: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
      invoice_lines: {
        Row: {
          id: string;
          invoice_id: string;
          section: 'HONORAIRES' | 'RETENUS' | 'DEBOURS';
          designation: string;
          unite: number | null;
          taux: number | null;
          montant: number;
          sort_order: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['invoice_lines']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['invoice_lines']['Insert']>;
      };
      missions: {
        Row: {
          id: string;
          title: string;
          description: string;
          client_id: string | null;
          client_name: string;
          follow_up_type: string;
          billing_rhythm: {
            percentage: number;
            months: number;
          }[];
          start_date: string;
          end_date: string;
          expected_progress: number;
          actual_progress: number;
          color: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['missions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['missions']['Insert']>;
      };
      settings: {
        Row: { key: string; value: string; updated_at: string };
        Insert: { key: string; value: string };
        Update: { value?: string };
      };
    };
  };
};
