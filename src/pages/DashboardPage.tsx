import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Users,
  Calendar,
  TrendingUp,
  Plus,
  ArrowRight,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useCountry } from "../contexts/CountryContext";

type MissionSummary = {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  actual_progress: number;
  expected_progress: number;
  client_name: string;
  follow_up_type: string;
};

type Stats = {
  invoices: number;
  clients: number;
  missions: number;
  totalGeneral: number;
};

export default function DashboardPage() {
  const { profile } = useAuth();
  const { selectedCountry } = useCountry();
  const [stats, setStats] = useState<Stats>({
    invoices: 0,
    clients: 0,
    missions: 0,
    totalGeneral: 0,
  });
  const [recentInvoices, setRecentInvoices] = useState<
    {
      id: string;
      invoice_number: string;
      date_emission: string;
      total_general: number;
      status: string;
      client_details_snapshot: Record<string, unknown>;
    }[]
  >([]);
  const [recentMissions, setRecentMissions] = useState<MissionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Calcul du montant TTC final à partir des lignes
  const computeInvoiceTotal = (lines: any[]) => {
    let honoraires = 0;
    let retenues = 0;
    let debours = 0;

    for (const line of lines) {
      const montant = line.montant || 0;
      if (line.section === "HONORAIRES") honoraires += montant;
      else if (line.section === "RETENUS") retenues += montant;
      else if (line.section === "DEBOURS") debours += montant;
    }

    const total_ttc = honoraires * 1.1925; // TVA 19,25%
    return total_ttc + retenues + debours;
  };

  useEffect(() => {
    const load = async () => {
      // 1. Récupérer toutes les factures NON archivées (avec leurs lignes)
      const { data: allInvoices, error: invoicesError } = await supabase
        .from("invoices")
        .select("id, created_at, invoice_lines (section, montant)")
        .eq("archived", false); // exclure les archivées

      if (invoicesError) {
        console.error(invoicesError);
        setLoading(false);
        return;
      }

      const invoiceCount = allInvoices?.length || 0;

      // 2. Calculer le total général correct (uniquement factures non archivées)
      let correctTotal = 0;
      for (const inv of allInvoices || []) {
        const lines = inv.invoice_lines || [];
        const total = computeInvoiceTotal(lines);
        correctTotal += total;
      }

      // 3. Récupérer les 5 factures NON archivées les plus récentes
      const { data: recentInv } = await supabase
        .from("invoices")
        .select(
          "id, invoice_number, date_emission, total_general, status, client_details_snapshot",
        )
        .eq("archived", false)
        .order("created_at", { ascending: false })
        .limit(5);

      // 4. Récupérer le nombre de clients (filtré par pays)
      const { count: clientsCount } = await supabase
        .from("clients")
        .select("id", { count: "exact", head: true })
        .eq("country", selectedCountry.code);

      // 5. Récupérer le nombre de missions
      const { count: missionsCount } = await supabase
        .from("missions")
        .select("id", { count: "exact", head: true });

      // 6. Récupérer les 5 missions les plus proches de la date de fin
      const { data: recentMissionsData } = await supabase
        .from("missions")
        .select(
          "id, title, start_date, end_date, actual_progress, expected_progress, client_name, follow_up_type",
        )
        .order("end_date", { ascending: true })
        .limit(5);

      setStats({
        invoices: invoiceCount,
        clients: clientsCount || 0,
        missions: missionsCount || 0,
        totalGeneral: correctTotal,
      });
      setRecentInvoices(recentInv || []);
      setRecentMissions(recentMissionsData || []);
      setLoading(false);
    };
    load();
  }, [selectedCountry.code]);

  const statCards = [
    {
      label: "Factures",
      value: stats.invoices,
      icon: FileText,
      color: "bg-blue-50 text-blue-600",
      link: "/invoices",
    },
    {
      label: "Clients",
      value: stats.clients,
      icon: Users,
      color: "bg-green-50 text-green-600",
      link: "/clients",
    },
    {
      label: "Missions",
      value: stats.missions,
      icon: Calendar,
      color: "bg-amber-50 text-amber-600",
      link: "/missions",
    },
    {
      label: "Montant TTC",
      value: new Intl.NumberFormat("fr-FR").format(stats.totalGeneral),
      suffix: selectedCountry.currencySymbol,
      icon: TrendingUp,
      color: "bg-teal-50 text-teal-600",
      link: "/invoices",
    },
  ];

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tableau de bord</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Bonjour, {profile?.first_name} {profile?.last_name}
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

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, suffix, icon: Icon, color, link }) => (
          <Link
            key={label}
            to={link}
            className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all group"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}
            >
              <Icon size={20} />
            </div>
            <div className="text-2xl font-bold text-slate-800">
              {loading ? (
                <span className="inline-block w-16 h-7 bg-slate-100 rounded animate-pulse" />
              ) : (
                value
              )}
              {suffix && (
                <span className="text-xs font-normal text-slate-400 ml-1">
                  {suffix}
                </span>
              )}
            </div>
            <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-1">
              {label}
              <ArrowRight
                size={12}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
              />
            </div>
          </Link>
        ))}
      </div>

      {/* Missions à suivre */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Missions à suivre</h2>
          <Link
            to="/missions"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : recentMissions.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              Aucune mission enregistrée pour l'instant
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentMissions.map((mission) => {
              const ended = new Date(mission.end_date) <= new Date();
              const progressWidth = Math.min(
                100,
                Math.max(0, mission.actual_progress),
              );
              return (
                <div
                  key={mission.id}
                  className="px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {mission.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {mission.client_name ? `${mission.client_name} · ` : ""}
                        {mission.follow_up_type}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(mission.start_date).toLocaleDateString(
                          "fr-FR",
                        )}{" "}
                        —{" "}
                        {new Date(mission.end_date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        ended
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {ended ? "Date atteinte" : "En cours"}
                    </span>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                      <span>Progrès réel</span>
                      <span>{mission.actual_progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Factures récentes */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Factures récentes</h2>
          <Link
            to="/invoices"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
          >
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 bg-slate-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : recentInvoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">
              Aucune facture pour l'instant
            </p>
            <Link
              to="/invoices/new"
              className="mt-3 inline-flex items-center gap-1 text-blue-600 text-sm hover:text-blue-700"
            >
              <Plus size={14} /> Créer une facture
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">
                    N° Facture
                  </th>
                  <th className="text-left px-4 py-3 font-medium">Client</th>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-right px-4 py-3 font-medium">Total</th>
                  <th className="text-left px-6 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-blue-700">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="hover:underline"
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {(inv.client_details_snapshot as { name?: string })
                        .name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(inv.date_emission).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {new Intl.NumberFormat("fr-FR").format(inv.total_general)}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[inv.status] || statusColors.draft
                        }`}
                      >
                        {statusLabels[inv.status] || inv.status}
                      </span>
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
