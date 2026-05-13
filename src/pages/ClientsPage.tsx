import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Search,
  CreditCard as Edit2,
  X,
  Check,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useCountry } from "../contexts/CountryContext";

type Client = {
  id: string;
  client_code: string;
  name: string;
  country: string;
  address_bp: string;
  nui: string;
  rccm: string;
  contract_ref: string;
  manager_name: string; // nouveau
  email: string; // nouveau
  phone: string; // nouveau
  city: string; // nouveau
};

type ModalState = { open: boolean; client: Partial<Client> | null };

export default function ClientsPage() {
  const { selectedCountry } = useCountry();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ open: false, client: null });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("country", selectedCountry.code)
        .order("client_code");
      if (error) {
        setError(`Erreur lors du chargement: ${error.message}`);
        setClients([]);
      } else {
        setClients(data || []);
      }
    } catch (err) {
      setError(`Erreur inattendue: ${err}`);
      setClients([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [selectedCountry.code]);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.client_code.toLowerCase().includes(search.toLowerCase()) ||
      (c.manager_name &&
        c.manager_name.toLowerCase().includes(search.toLowerCase())),
  );

  const openAdd = async () => {
    const { data } = await supabase
      .from("clients")
      .select("client_code")
      .eq("country", selectedCountry.code)
      .order("client_code", { ascending: false })
      .limit(1);

    let nextNum = 1;
    if (data && data.length > 0) {
      const lastCode = data[0].client_code;
      const match = lastCode.match(/\d+$/);
      if (match) nextNum = parseInt(match[0]) + 1;
    }

    const prefix = selectedCountry.clientPrefix;
    const nextCode = `${prefix}${String(nextNum).padStart(5, "0")}`;
    setModal({
      open: true,
      client: {
        client_code: nextCode,
        country: selectedCountry.code,
        manager_name: "",
        email: "",
        phone: "",
        city: "",
      },
    });
    setError("");
  };

  const openEdit = (client: Client) => {
    setModal({ open: true, client: { ...client } });
    setError("");
  };

  const handleSave = async () => {
    if (!modal.client?.name?.trim()) {
      setError("Le nom est requis");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      client_code: modal.client.client_code || "",
      name: modal.client.name || "",
      country: modal.client.country || selectedCountry.code,
      address_bp: modal.client.address_bp || "",
      nui: modal.client.nui || "",
      rccm: modal.client.rccm || "",
      contract_ref: modal.client.contract_ref || "",
      manager_name: modal.client.manager_name || "",
      email: modal.client.email || "",
      phone: modal.client.phone || "",
      city: modal.client.city || "",
    };

    if (modal.client.id) {
      await supabase.from("clients").update(payload).eq("id", modal.client.id);
    } else {
      await supabase.from("clients").insert(payload);
    }

    setSaving(false);
    setModal({ open: false, client: null });
    load();
  };

  const updateField = (field: keyof Client, value: string) => {
    setModal((m) => ({ ...m, client: { ...m.client, [field]: value } }));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clients</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {selectedCountry.flag} {selectedCountry.name}
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#1e3a5f] text-white rounded-xl text-sm font-medium hover:bg-[#2a4f7f] transition-all shadow-sm"
        >
          <Plus size={16} />
          Nouveau client
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Rechercher par nom, code client ou gérant..."
        />
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

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
            <Users size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Aucun client trouvé</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-6 py-3 font-medium">Code</th>
                  <th className="text-left px-4 py-3 font-medium">Nom</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">
                    Gérant
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">
                    Ville
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden xl:table-cell">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 font-medium hidden 2xl:table-cell">
                    Téléphone
                  </th>
                  <th className="text-right px-6 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-3 font-mono text-xs text-slate-600">
                      {client.client_code}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {client.name}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell">
                      {client.manager_name || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden md:table-cell">
                      {client.city || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden xl:table-cell">
                      {client.email || "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden 2xl:table-cell">
                      {client.phone || "—"}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => openEdit(client)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal d’ajout / modification */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">
                {modal.client?.id ? "Modifier le client" : "Nouveau client"}
              </h2>
              <button
                onClick={() => setModal({ open: false, client: null })}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Code client
                  </label>
                  <input
                    value={modal.client?.client_code || ""}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Pays
                  </label>
                  <input
                    value={selectedCountry.name}
                    readOnly
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nom / Raison sociale <span className="text-red-500">*</span>
                </label>
                <input
                  value={modal.client?.name || ""}
                  onChange={(e) => updateField("name", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ACME SARL"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nom du gérant / président
                </label>
                <input
                  value={modal.client?.manager_name || ""}
                  onChange={(e) => updateField("manager_name", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mr.TCHEBE Trésor"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mail
                  </label>
                  <input
                    value={modal.client?.email || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                    type="email"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="contact@gmail.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    value={modal.client?.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+237 6XX XXX XXX"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Ville
                  </label>
                  <input
                    value={modal.client?.city || ""}
                    onChange={(e) => updateField("city", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Douala"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Adresse / BP
                  </label>
                  <input
                    value={modal.client?.address_bp || ""}
                    onChange={(e) => updateField("address_bp", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="BP 1234"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    NUI
                  </label>
                  <input
                    value={modal.client?.nui || ""}
                    onChange={(e) => updateField("nui", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="M0000XXXXXXX"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    RCCM
                  </label>
                  <input
                    value={modal.client?.rccm || ""}
                    onChange={(e) => updateField("rccm", e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="RC/DLA/XXXX/B/XXX"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Réf. contrat
                </label>
                <input
                  value={modal.client?.contract_ref || ""}
                  onChange={(e) => updateField("contract_ref", e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="CONTRAT/2025/XXX"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => setModal({ open: false, client: null })}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm"
              >
                Annuler
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
    </div>
  );
}
