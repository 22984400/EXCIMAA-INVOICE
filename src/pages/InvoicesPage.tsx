import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus, Search, Download, Eye, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useCountry } from "../contexts/CountryContext";

type Invoice = {
  id: string;
  invoice_number: string;
  date_emission: string;
  total_general: number;
  status: string;
  currency: string;
  client_details_snapshot: { name?: string };
};

const statusColors: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};
const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  cancelled: "Annulée",
};

export default function InvoicesPage() {
  const { profile } = useAuth();
  const { selectedCountry } = useCountry();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("invoices")
      .select(
        "id, invoice_number, date_emission, total_general, status, currency, client_details_snapshot",
      )
      .eq("archived", false) // ← ne charger que les non archivées
      .order("created_at", { ascending: false });
    setInvoices((data || []) as Invoice[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.client_details_snapshot?.name || "")
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Archiver cette facture ? (Elle ne sera plus visible mais restera en base)",
      )
    )
      return;

    const { error } = await supabase
      .from("invoices")
      .update({ archived: true })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Erreur lors de l'archivage.");
    } else {
      // Recharger la liste (la facture archivée n'apparaîtra plus)
      load();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Factures</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {profile?.initials && (
              <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-xs mr-2">
                {profile.initials}
              </span>
            )}
            Gestion des factures EXCI-MAA
          </p>
        </div>
        <Link
          to="/invoices/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-xl text-sm font-medium hover:bg-[#2a4f7f] transition-all shadow-sm"
        >
          <Plus size={16} />
          Nouvelle facture
        </Link>
      </div>

      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Rechercher par numéro ou client..."
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 bg-slate-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm mb-3">
              Aucune facture trouvée
            </p>
            <Link
              to="/invoices/new"
              className="inline-flex items-center gap-1 text-blue-600 text-sm"
            >
              <Plus size={14} /> Créer votre première facture
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">ur</th>
                  <th className="text-left px-4 py-3 font-medium">Client</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                  <th className="text-left px-4 py-3 font-medium">Statut</th>
                  <th className="text-right px-6 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="font-mono text-xs text-blue-700 hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {inv.client_details_snapshot?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(inv.date_emission).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {new Intl.NumberFormat("fr-FR").format(inv.total_general)}
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        {inv.currency === "XAF" ? "FCFA" : inv.currency}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || statusColors.draft}`}
                      >
                        {statusLabels[inv.status] || inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Eye size={14} />
                        </Link>
                        <Link
                          to={`/invoices/${inv.id}/pdf`}
                          className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                        >
                          <Download size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
