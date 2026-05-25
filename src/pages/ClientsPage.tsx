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
  manager_name: string;
  email: string;
  phone: string;
  city: string;
  rue?: string;
  forme_juridique?: string;
  obligation_300_salaries?: boolean;
  obligation_consolidee?: boolean;
  obligation_ca_18000ke?: boolean;
  statut_fiscal?: string;
  regime_fiscal?: string;
  nb_salaries?: number;
  decalage_paie?: boolean;
  jour_versement_salaires?: string;
  date_paye?: string;
  option_versement_mensuel?: boolean;
  entreprise_travail_temporaire?: boolean;
  rattachement_decalage_paie?: boolean;
  vrp_mono_carte?: boolean;
  vrp_multi_carte?: boolean;
  prevoyance_cadres_obligatoire?: boolean;
  prevoyance_cadres_non_cadres?: boolean;
  retraite_complementaire_non_cadre?: boolean;
  retraite_complementaire_cadre?: boolean;
  mutuelle?: boolean;
  retraite_capitalisation?: boolean;
  versement_1_pourcent_cdd?: boolean;
  soumis_cotisations_tns?: boolean;
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
  const [activeTab, setActiveTab] = useState<
    "general" | "juridiques" | "fiscales" | "sociales"
  >("general");

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
        rue: "",
        forme_juridique: "",
        obligation_300_salaries: false,
        obligation_consolidee: false,
        obligation_ca_18000ke: false,
        statut_fiscal: "",
        regime_fiscal: "",
        nb_salaries: 0,
        decalage_paie: false,
        jour_versement_salaires: "",
        date_paye: "",
        option_versement_mensuel: false,
        entreprise_travail_temporaire: false,
        rattachement_decalage_paie: false,
        vrp_mono_carte: false,
        vrp_multi_carte: false,
        prevoyance_cadres_obligatoire: false,
        prevoyance_cadres_non_cadres: false,
        retraite_complementaire_non_cadre: false,
        retraite_complementaire_cadre: false,
        mutuelle: false,
        retraite_capitalisation: false,
        versement_1_pourcent_cdd: false,
        soumis_cotisations_tns: false,
      },
    });
    setError("");
    setActiveTab("general");
  };

  const openEdit = (client: Client) => {
    setModal({ open: true, client: { ...client } });
    setError("");
    setActiveTab("general");
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
      rue: modal.client.rue || "",
      forme_juridique: modal.client.forme_juridique || "",
      obligation_300_salaries: modal.client.obligation_300_salaries || false,
      obligation_consolidee: modal.client.obligation_consolidee || false,
      obligation_ca_18000ke: modal.client.obligation_ca_18000ke || false,
      statut_fiscal: modal.client.statut_fiscal || "",
      regime_fiscal: modal.client.regime_fiscal || "",
      nb_salaries: modal.client.nb_salaries || 0,
      decalage_paie: modal.client.decalage_paie || false,
      jour_versement_salaires: modal.client.jour_versement_salaires || "",
      date_paye: modal.client.date_paye || "",
      option_versement_mensuel: modal.client.option_versement_mensuel || false,
      entreprise_travail_temporaire:
        modal.client.entreprise_travail_temporaire || false,
      rattachement_decalage_paie:
        modal.client.rattachement_decalage_paie || false,
      vrp_mono_carte: modal.client.vrp_mono_carte || false,
      vrp_multi_carte: modal.client.vrp_multi_carte || false,
      prevoyance_cadres_obligatoire:
        modal.client.prevoyance_cadres_obligatoire || false,
      prevoyance_cadres_non_cadres:
        modal.client.prevoyance_cadres_non_cadres || false,
      retraite_complementaire_non_cadre:
        modal.client.retraite_complementaire_non_cadre || false,
      retraite_complementaire_cadre:
        modal.client.retraite_complementaire_cadre || false,
      mutuelle: modal.client.mutuelle || false,
      retraite_capitalisation: modal.client.retraite_capitalisation || false,
      versement_1_pourcent_cdd: modal.client.versement_1_pourcent_cdd || false,
      soumis_cotisations_tns: modal.client.soumis_cotisations_tns || false,
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

  const updateField = (field: keyof Client, value: any) => {
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
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
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

            {/* Tabs */}
            <div className="border-b border-slate-100 px-6">
              <div className="flex gap-6">
                <button
                  onClick={() => setActiveTab("general")}
                  className={`py-2 text-sm font-medium transition-all ${
                    activeTab === "general"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Général
                </button>
                <button
                  onClick={() => setActiveTab("juridiques")}
                  className={`py-2 text-sm font-medium transition-all ${
                    activeTab === "juridiques"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Juridiques
                </button>
                <button
                  onClick={() => setActiveTab("fiscales")}
                  className={`py-2 text-sm font-medium transition-all ${
                    activeTab === "fiscales"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Fiscales
                </button>
                <button
                  onClick={() => setActiveTab("sociales")}
                  className={`py-2 text-sm font-medium transition-all ${
                    activeTab === "sociales"
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Sociales & TNS
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Tab Général */}
              {activeTab === "general" && (
                <>
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
                      Nom / Raison sociale{" "}
                      <span className="text-red-500">*</span>
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
                      onChange={(e) =>
                        updateField("manager_name", e.target.value)
                      }
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
                        Rue
                      </label>
                      <input
                        value={modal.client?.rue || ""}
                        onChange={(e) => updateField("rue", e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="12 Avenue Manga"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Adresse / BP
                    </label>
                    <input
                      value={modal.client?.address_bp || ""}
                      onChange={(e) =>
                        updateField("address_bp", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="BP 1234"
                    />
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
                      onChange={(e) =>
                        updateField("contract_ref", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="CONTRAT/2025/XXX"
                    />
                  </div>
                </>
              )}

              {/* Tab Juridiques */}
              {activeTab === "juridiques" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Forme juridique de l'entreprise
                    </label>
                    <input
                      value={modal.client?.forme_juridique || ""}
                      onChange={(e) =>
                        updateField("forme_juridique", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="SARL, SA, SAS, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Obligations légales
                    </label>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={
                            modal.client?.obligation_300_salaries || false
                          }
                          onChange={(e) =>
                            updateField(
                              "obligation_300_salaries",
                              e.target.checked,
                            )
                          }
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>&gt;= 300 Salariés</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={modal.client?.obligation_consolidee || false}
                          onChange={(e) =>
                            updateField(
                              "obligation_consolidee",
                              e.target.checked,
                            )
                          }
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Consolidée</span>
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={modal.client?.obligation_ca_18000ke || false}
                          onChange={(e) =>
                            updateField(
                              "obligation_ca_18000ke",
                              e.target.checked,
                            )
                          }
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>CA =&gt; 18 000 kE</span>
                      </label>
                    </div>
                  </div>
                </>
              )}

              {/* Tab Fiscales */}
              {activeTab === "fiscales" && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Statut fiscal
                    </label>
                    <input
                      value={modal.client?.statut_fiscal || ""}
                      onChange={(e) =>
                        updateField("statut_fiscal", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="IS, IR, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Régime fiscal
                    </label>
                    <input
                      value={modal.client?.regime_fiscal || ""}
                      onChange={(e) =>
                        updateField("regime_fiscal", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Réel simplifié, Réel normal, etc."
                    />
                  </div>
                </>
              )}

              {/* Tab Sociales & TNS */}
              {activeTab === "sociales" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nombre de salariés
                    </label>
                    <input
                      type="number"
                      value={modal.client?.nb_salaries || 0}
                      onChange={(e) =>
                        updateField(
                          "nb_salaries",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Jour de versement des salaires
                      </label>
                      <input
                        value={modal.client?.jour_versement_salaires || ""}
                        onChange={(e) =>
                          updateField("jour_versement_salaires", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Date de la paye
                      </label>
                      <input
                        type="date"
                        value={modal.client?.date_paye || ""}
                        onChange={(e) =>
                          updateField("date_paye", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={modal.client?.decalage_paie || false}
                        onChange={(e) =>
                          updateField("decalage_paie", e.target.checked)
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Décalage de la paie</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={
                          modal.client?.option_versement_mensuel || false
                        }
                        onChange={(e) =>
                          updateField(
                            "option_versement_mensuel",
                            e.target.checked,
                          )
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>
                        Option versement mensuel (1&gt;=9 et &lt;=9 salariés)
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={
                          modal.client?.entreprise_travail_temporaire || false
                        }
                        onChange={(e) =>
                          updateField(
                            "entreprise_travail_temporaire",
                            e.target.checked,
                          )
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Entreprise de travail temporaire</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={
                          modal.client?.rattachement_decalage_paie || false
                        }
                        onChange={(e) =>
                          updateField(
                            "rattachement_decalage_paie",
                            e.target.checked,
                          )
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Rattachement du décalage de la paie</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={modal.client?.vrp_mono_carte || false}
                        onChange={(e) =>
                          updateField("vrp_mono_carte", e.target.checked)
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>VRP Mono Carte</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={modal.client?.vrp_multi_carte || false}
                        onChange={(e) =>
                          updateField("vrp_multi_carte", e.target.checked)
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>VRP Multi Carte</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={
                          modal.client?.prevoyance_cadres_obligatoire || false
                        }
                        onChange={(e) =>
                          updateField(
                            "prevoyance_cadres_obligatoire",
                            e.target.checked,
                          )
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Prévoyance cadres obligatoire</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={
                          modal.client?.prevoyance_cadres_non_cadres || false
                        }
                        onChange={(e) =>
                          updateField(
                            "prevoyance_cadres_non_cadres",
                            e.target.checked,
                          )
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Prévoyance cadres et non cadres</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={
                          modal.client?.retraite_complementaire_non_cadre ||
                          false
                        }
                        onChange={(e) =>
                          updateField(
                            "retraite_complementaire_non_cadre",
                            e.target.checked,
                          )
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Retraite complémentaire non cadre mensuelle</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={
                          modal.client?.retraite_complementaire_cadre || false
                        }
                        onChange={(e) =>
                          updateField(
                            "retraite_complementaire_cadre",
                            e.target.checked,
                          )
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Retraite complémentaire cadre mensuelle</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={modal.client?.mutuelle || false}
                        onChange={(e) =>
                          updateField("mutuelle", e.target.checked)
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Mutuelle</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={modal.client?.retraite_capitalisation || false}
                        onChange={(e) =>
                          updateField(
                            "retraite_capitalisation",
                            e.target.checked,
                          )
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Retraite par capitalisation</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={
                          modal.client?.versement_1_pourcent_cdd || false
                        }
                        onChange={(e) =>
                          updateField(
                            "versement_1_pourcent_cdd",
                            e.target.checked,
                          )
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Versement 1% CDD</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={modal.client?.soumis_cotisations_tns || false}
                        onChange={(e) =>
                          updateField(
                            "soumis_cotisations_tns",
                            e.target.checked,
                          )
                        }
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Soumis aux cotisations TNS</span>
                    </label>
                  </div>
                </div>
              )}
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
