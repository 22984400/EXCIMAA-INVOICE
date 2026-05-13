import { TVA_RATE } from './constants';
import { supabase } from './supabase';

export type LineSection = 'HONORAIRES' | 'RETENUS' | 'DEBOURS';

export type InvoiceLine = {
  id?: string;
  section: LineSection;
  designation: string;
  unite: number | null;
  taux: number | null;
  montant: number;
  sort_order: number;
};

export type InvoiceTotals = {
  totalHT: number;
  totalTTC: number;
  totalRetenues: number;
  totalDebours: number;
  totalGeneral: number;
  tva: number;
};

export function generateRefPF(firstName: string, lastName: string, dateEmission: string): string {
  // Extract first letters of first two names
  const names = `${firstName} ${lastName}`.split(' ');
  const initials = names.slice(0, 2).map(name => name.charAt(0).toUpperCase()).join('');

  // Extract year from date
  const year = new Date(dateEmission).getFullYear();

  return `${initials}${year}`;
}

export async function getNextRefPFSequence(refPFBase: string): Promise<number> {
  try {
    // Get all ref_pf values that start with the base
    const { data, error } = await supabase
      .from('invoices')
      .select('ref_pf')
      .like('ref_pf', `${refPFBase}-%`);

    if (error) {
      console.error('Error fetching ref_pf sequences:', error);
      return 1;
    }

    if (!data || data.length === 0) {
      return 1;
    }

    // Extract sequence numbers and find the highest
    const sequences = data
      .map(invoice => {
        const match = invoice.ref_pf.match(new RegExp(`^${refPFBase}-(\\d+)$`));
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(seq => !isNaN(seq));

    const maxSequence = sequences.length > 0 ? Math.max(...sequences) : 0;
    return maxSequence + 1;
  } catch (error) {
    console.error('Error in getNextRefPFSequence:', error);
    return 1;
  }
}

export function computeTotals(lines: InvoiceLine[], acompteRegle: number): InvoiceTotals {
  const honoraireLines = lines.filter(l => l.section === 'HONORAIRES');
  const retenuLines = lines.filter(l => l.section === 'RETENUS');
  const debourLines = lines.filter(l => l.section === 'DEBOURS');

  const totalHT = honoraireLines.reduce((s, l) => s + (l.montant || 0), 0);
  const tva = totalHT * TVA_RATE;
  const totalTTC = totalHT + tva;

  const totalRetenues = retenuLines.reduce((s, l) => s + (l.montant || 0), 0);
  const totalDebours = debourLines.reduce((s, l) => s + (l.montant || 0), 0);

  const totalGeneral = totalTTC + totalRetenues + totalDebours - acompteRegle;

  return { totalHT, tva, totalTTC, totalRetenues, totalDebours, totalGeneral };
}

export function computeLineMontant(line: InvoiceLine, totalHT: number): number {
  if (line.section === 'HONORAIRES') {
    return (line.unite || 0) * (line.taux || 0) / 100;
  }
  if (line.section === 'DEBOURS') {
    return (line.unite || 0) * (line.taux || 0);
  }
  if (line.section === 'RETENUS') {
    return -(totalHT * (line.taux || 0));
  }
  return 0;
}

export function formatNumber(n: number, decimals = 0): string {
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}
