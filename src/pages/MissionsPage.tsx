import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Plus,
  X,
  Check,
  Trash2,
  TrendingUp,
  Edit2,
  ArrowLeft,
  ClipboardCheck,
  ListTodo,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import AuditDashboard from "../components/AuditDashboard";
import MyTasksView from "../components/MyTasksView";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  startOfYear,
  endOfYear,
} from "date-fns";
import { fr } from "date-fns/locale";

type BillingRhythmStep = {
  percentage: number;
  months: number;
};

type Mission = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  expected_progress: number;
  actual_progress: number;
  color: string;
  client_id: string | null;
  client_name: string;
  follow_up_type: "SUIVI AUDIT" | "SUIVI EXPERTISE";
  billing_rhythm: BillingRhythmStep[];
};

type Client = {
  id: string;
  client_code: string;
  name: string;
};

type ModalState = { open: boolean; mission: Partial<Mission> | null };

const colors = [
  "#1e3a5f",
  "#2a6fc6",
  "#00a86b",
  "#ff6b6b",
  "#ffd93d",
  "#6c5ce7",
];

export default function MissionsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"calendar" | "cac" | "mytasks">("calendar");
  const [missionTypeId, setMissionTypeId] = useState(1);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [modal, setModal] = useState<ModalState>({
    open: false,
    mission: null,
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!user) return;

    const [missionsResult, clientsResult] = await Promise.all([
      supabase
        .from("missions")
        .select("*")
        .eq("created_by", user.id)
        .order("start_date"),
      supabase
        .from("clients")
        .select("id, client_code, name")
        .order("client_code"),
    ]);

    setMissions((missionsResult.data || []) as Mission[]);
    setClients((clientsResult.data || []) as Client[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const openAdd = () => {
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    setModal({
      open: true,
      mission: {
        title: "",
        description: "",
        client_id: null,
        client_name: "",
        follow_up_type: "SUIVI AUDIT",
        billing_rhythm: [{ percentage: 40, months: 3 }],
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        expected_progress: 100,
        actual_progress: 0,
        color: colors[missions.length % colors.length],
      },
    });
  };

  const openEdit = (mission: Mission) => {
    setModal({ open: true, mission: { ...mission } });
  };

  const handleSave = async () => {
    if (!modal.mission?.title?.trim() || !user) return;
    setSaving(true);
    setError(null);

    try {
      const selectedClient = clients.find(
        (client) => client.id === modal.mission?.client_id,
      );

      const payload = {
        title: modal.mission.title || "",
        description: modal.mission.description || "",
        client_id: modal.mission.client_id || null,
        client_name: selectedClient
          ? selectedClient.name
          : modal.mission.client_name || "",
        follow_up_type: modal.mission.follow_up_type || "SUIVI AUDIT",
        billing_rhythm: modal.mission.billing_rhythm || [],
        start_date: modal.mission.start_date || "",
        end_date: modal.mission.end_date || "",
        expected_progress: modal.mission.expected_progress || 100,
        actual_progress: modal.mission.actual_progress || 0,
        color: modal.mission.color || colors[0],
        created_by: user.id,
      };

      if (modal.mission.id) {
        const { error: updateError } = await supabase
          .from("missions")
          .update(payload)
          .eq("id", modal.mission.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from("missions")
          .insert(payload);
        if (insertError) throw insertError;
      }

      setSaving(false);
      setModal({ open: false, mission: null });
      await load();
    } catch (err: any) {
      console.error("Erreur lors de l'enregistrement:", err);
      setError(err.message || "Erreur lors de l'enregistrement de la mission");
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette mission ?")) return;
    await supabase.from("missions").delete().eq("id", id);
    load();
  };

  const updateField = (field: keyof Mission, value: any) => {
    setModal((m) => ({ ...m, mission: { ...m.mission, [field]: value } }));
  };

  const addBillingLine = () => {
    setModal((m) => {
      const current = m.mission?.billing_rhythm || [];
      return {
        ...m,
        mission: {
          ...m.mission,
          billing_rhythm: [...current, { percentage: 40, months: 3 }],
        },
      };
    });
  };

  const updateBillingLine = (
    index: number,
    field: keyof BillingRhythmStep,
    value: number,
  ) => {
    setModal((m) => {
      const current = m.mission?.billing_rhythm || [];
      const updated = current.map((line, i) =>
        i === index ? { ...line, [field]: value } : line,
      );
      return {
        ...m,
        mission: { ...m.mission, billing_rhythm: updated },
      };
    });
  };

  const removeBillingLine = (index: number) => {
    setModal((m) => {
      const current = m.mission?.billing_rhythm || [];
      return {
        ...m,
        mission: {
          ...m.mission,
          billing_rhythm: current.filter((_, i) => i !== index),
        },
      };
    });
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const activeMissions = missions.filter((m) => {
    const start = new Date(m.start_date);
    const end = new Date(m.end_date);
    return start <= monthEnd && end >= monthStart;
  });

  const chartData = missions.map((m) => ({
    title: m.title.slice(0, 15),
    expected: m.expected_progress,
    actual: m.actual_progress,
  }));

  const totalExpected = missions.reduce((s, m) => s + m.expected_progress, 0);
  const totalActual = missions.reduce((s, m) => s + m.actual_progress, 0);
  const avgProgress =
    missions.length > 0 ? Math.round(totalActual / missions.length) : 0;

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );

  return (
    <div>
      {/* Tab navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {[
            { key: "calendar" as const, label: "Calendrier", icon: Calendar },
            { key: "cac" as const, label: "Suivi CAC", icon: ClipboardCheck },
            { key: "mytasks" as const, label: "Mes tâches", icon: ListTodo },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-white shadow text-slate-800"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* CAC Dashboard */}
      {activeTab === "cac" && (
        <AuditDashboard missionTypeId={missionTypeId} onMissionTypeChange={setMissionTypeId} />
      )}

      {/* My Tasks */}
      {activeTab === "mytasks" && (
        <MyTasksView missionTypeId={missionTypeId} onMissionTypeChange={setMissionTypeId} />
      )}

      {/* Calendar view (original) */}
      {activeTab === "calendar" && (
      <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Suivi des missions
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Planification et suivi de la progression
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-xl text-sm font-medium hover:bg-[#2a4f7f] transition-all shadow-sm"
          >
            <Plus size={16} />
            Nouvelle mission
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">Total missions</p>
          <p className="text-2xl font-bold text-slate-800">{missions.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">Progression moyenne</p>
          <p className="text-2xl font-bold text-blue-600">{avgProgress}%</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">En cours</p>
          <p className="text-2xl font-bold text-green-600">
            {
              missions.filter((m) => {
                const now = new Date();
                return (
                  new Date(m.start_date) <= now && new Date(m.end_date) >= now
                );
              }).length
            }
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
          <p className="text-xs text-slate-500 mb-1">Complétées</p>
          <p className="text-2xl font-bold text-green-600">
            {missions.filter((m) => m.actual_progress >= 100).length}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">
            Progression par mission
          </h3>
          {missions.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucune mission</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="title" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="expected" fill="#cbd5e1" name="Attendu" />
                <Bar dataKey="actual" fill="#2a6fc6" name="Réel" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Tendance</h3>
          {missions.length === 0 ? (
            <p className="text-slate-400 text-sm">Aucune mission</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={missions.map((m, i) => ({
                  name: `M${i + 1}`,
                  progress: m.actual_progress,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="progress"
                  stroke="#2a6fc6"
                  strokeWidth={2}
                  dot={{ fill: "#2a6fc6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Calendar and list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800 capitalize">
              {format(currentDate, "MMMM yyyy", { locale: fr })}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() - 1,
                    ),
                  )
                }
                className="px-2 py-1 hover:bg-slate-100 rounded text-sm"
              >
                ‹
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded font-medium"
              >
                Aujourd'hui
              </button>
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() + 1,
                    ),
                  )
                }
                className="px-2 py-1 hover:bg-slate-100 rounded text-sm"
              >
                ›
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["L", "M", "M", "J", "V", "S", "D"].map((d) => (
              <div
                key={d}
                className="text-xs font-semibold text-slate-500 py-2"
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const dayMissions = missions.filter((m) => {
                const start = new Date(m.start_date);
                const end = new Date(m.end_date);
                return start <= day && end >= day;
              });
              const isToday =
                format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
              return (
                <div
                  key={day.toString()}
                  className={`aspect-square rounded text-xs font-medium flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all ${
                    isToday
                      ? "bg-blue-100 text-blue-700"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <div>{format(day, "d")}</div>
                  {dayMissions.length > 0 && (
                    <div className="text-xs">{dayMissions.length}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Missions list */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">
              Missions enregistrées
            </h3>
          </div>

          {missions.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                Aucune mission enregistrée pour le moment
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {missions.map((mission) => (
                <div
                  key={mission.id}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className="w-3 h-3 rounded-full mt-1"
                        style={{ backgroundColor: mission.color }}
                      />
                      <div>
                        <p className="font-semibold text-slate-800">
                          {mission.title}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          {mission.client_name && (
                            <span>{mission.client_name}</span>
                          )}
                          <span>{mission.follow_up_type}</span>
                          {new Date(mission.end_date) <= new Date() && (
                            <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">
                              Date atteinte
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {format(new Date(mission.start_date), "dd MMM", {
                            locale: fr,
                          })}{" "}
                          -{" "}
                          {format(new Date(mission.end_date), "dd MMM", {
                            locale: fr,
                          })}
                        </p>
                        {mission.description && (
                          <p className="text-xs text-slate-600 mt-1">
                            {mission.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEdit(mission)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(mission.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="ml-6">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-slate-600">
                        Progression:
                      </span>
                      <span className="text-sm font-semibold text-blue-600">
                        {mission.actual_progress}%
                      </span>
                      <span className="text-xs text-slate-400">
                        (attendu: {mission.expected_progress}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${mission.actual_progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">
                {modal.mission?.id ? "Modifier la mission" : "Nouvelle mission"}
              </h2>
              <button
                onClick={() => setModal({ open: false, mission: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 font-medium">
                    Erreur d'enregistrement
                  </p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Titre <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={modal.mission?.title || ""}
                    onChange={(e) => updateField("title", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Audit 2025 - Exca"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Client existant
                  </label>
                  <select
                    value={modal.mission?.client_id || ""}
                    onChange={(e) =>
                      updateField("client_id", e.target.value || null)
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionnez un client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.client_code} — {client.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Catégorie de suivi
                  </label>
                  <select
                    value={modal.mission?.follow_up_type || "SUIVI AUDIT"}
                    onChange={(e) =>
                      updateField(
                        "follow_up_type",
                        e.target.value as "SUIVI AUDIT" | "SUIVI EXPERTISE",
                      )
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SUIVI AUDIT">SUIVI AUDIT</option>
                    <option value="SUIVI EXPERTISE">SUIVI EXPERTISE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={modal.mission?.description || ""}
                    onChange={(e) => updateField("description", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20"
                    placeholder="Notes supplémentaires..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    Rythme de facture
                  </label>
                  <div className="space-y-3">
                    {(modal.mission?.billing_rhythm || []).map(
                      (line, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-[1fr_1fr_auto] gap-3 items-end"
                        >
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">
                              Pourcentage de paie
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={line.percentage}
                              onChange={(e) =>
                                updateBillingLine(
                                  index,
                                  "percentage",
                                  parseInt(e.target.value) || 0,
                                )
                              }
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-500 mb-1">
                              Nombre de mois
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={line.months}
                              onChange={(e) =>
                                updateBillingLine(
                                  index,
                                  "months",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeBillingLine(index)}
                            className="h-10 w-10 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ),
                    )}
                    <button
                      type="button"
                      onClick={addBillingLine}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Plus size={16} /> Ajouter une ligne
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={modal.mission?.start_date || ""}
                      onChange={(e) =>
                        updateField("start_date", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={modal.mission?.end_date || ""}
                      onChange={(e) => updateField("end_date", e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Progression attendue (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={modal.mission?.expected_progress || 100}
                      onChange={(e) =>
                        updateField(
                          "expected_progress",
                          parseInt(e.target.value) || 100,
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Progression actuelle (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={modal.mission?.actual_progress || 0}
                      onChange={(e) =>
                        updateField(
                          "actual_progress",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-2">
                    Couleur
                  </label>
                  <div className="flex gap-2">
                    {colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateField("color", c)}
                        className={`w-8 h-8 rounded-lg transition-all ${modal.mission?.color === c ? "ring-2 ring-offset-1" : "opacity-60 hover:opacity-100"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            {/* Barre de navigation fixe */}
            <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-end gap-3 shadow-lg">
              <button
                onClick={() => setModal({ open: false, mission: null })}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
              >
                <ArrowLeft size={16} />
                Retour
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-medium hover:bg-[#2a4f7f] disabled:opacity-60"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={16} />
                )}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
