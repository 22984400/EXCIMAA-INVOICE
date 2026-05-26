import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, X, Save, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useCountry } from "../contexts/CountryContext";
import {
  RETENUES_RATES,
  PAYMENT_METHODS,
  BANK_DETAILS,
} from "../lib/constants";
import {
  InvoiceLine,
  computeTotals,
  formatNumber,
  generateRefPF,
  getNextRefPFSequence,
} from "../lib/invoiceUtils";
import { pdf } from "@react-pdf/renderer";
import { InvoicePDF } from "../components/InvoicePDF";

type Client = {
  id: string;
  client_code: string;
  name: string;
  address_bp: string;
  nui: string;
  rccm: string;
  contract_ref: string;
};

export default function InvoiceFormPage() {
  const { id: invoiceId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { selectedCountry } = useCountry();

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [refPf, setRefPf] = useState("");
  const [dateContrat, setDateContrat] = useState("");
  const [invoiceType, setInvoiceType] = useState<"PRO-FORMA" | "FACTURE">(
    "FACTURE",
  );
  const [lines, setLines] = useState<InvoiceLine[]>([]);
  const [acompteRegle, setAcompteRegle] = useState(0);
  const [paymentMethods, setPaymentMethods] = useState<string[]>(["virement"]);
  const [signatureCompany, setSignatureCompany] = useState(
    profile?.first_name || "",
  );
  const [signatureClient, setSignatureClient] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!invoiceId);
  const [error, setError] = useState<string | null>(null);

  const totals = computeTotals(lines, acompteRegle);

  const generateReference = async () => {
    if (profile?.first_name && profile?.last_name && invoiceDate) {
      const baseRef = generateRefPF(
        profile.first_name,
        profile.last_name,
        invoiceDate,
      );
      const sequence = await getNextRefPFSequence(baseRef);
      const fullRef = `${baseRef}-${String(sequence).padStart(3, "0")}`;
      setRefPf(fullRef);
    }
  };

  // Keep generatePDF function but will NOT be called on save
  const generatePDF = async (invoiceData: any) => {
    try {
      const pdfData = {
        ref_pf: invoiceData.ref_pf,
        date_emission: invoiceData.date_emission,
        date_contrat: invoiceData.date_contrat,
        client_details_snapshot: invoiceData.client_details_snapshot,
        lines: invoiceData.lines,
        totals: {
          ...invoiceData.totals,
          tva: invoiceData.montant_ht * 0.1925,
        },
        signature_company: invoiceData.signature_company,
        signature_client: invoiceData.signature_client,
        payment_method: invoiceData.payment_method,
        currency: invoiceData.currency,
      };
      const blob = await pdf(<InvoicePDF invoiceData={pdfData} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `facture-${invoiceData.ref_pf}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Erreur lors de la génération du PDF");
    }
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("country", selectedCountry.code)
        .order("client_code");
      setClients((data || []) as Client[]);

      if (invoiceId) {
        const invRes = await supabase
          .from("invoices")
          .select("*")
          .eq("id", invoiceId)
          .maybeSingle();
        const linesRes = await supabase
          .from("invoice_lines")
          .select("*")
          .eq("invoice_id", invoiceId)
          .order("sort_order");

        if (invRes.data) {
          const inv = invRes.data;
          setInvoiceDate(inv.date_emission);
          setRefPf(inv.ref_pf || "");
          setDateContrat(inv.date_contrat || "");
          setInvoiceType(inv.invoice_type || "FACTURE");
          setAcompteRegle(inv.acompte_regle || 0);
          setPaymentMethods([inv.payment_method]);
          setSignatureCompany(inv.signature_company || "");
          setSignatureClient(inv.signature_client || "");

          const clientMatch = clients.find((c) => c.id === inv.client_id);
          if (clientMatch) setSelectedClient(clientMatch);
        }

        setLines((linesRes.data || []) as InvoiceLine[]);
      } else {
        await generateReference();
        setLines([
          {
            section: "HONORAIRES",
            designation: "Audit comptable et financier 2025 12",
            unite: 0,
            taux: 0,
            montant: 0,
            sort_order: 0,
          },
        ]);
      }
      setLoading(false);
    };
    load();
  }, [selectedCountry.code, invoiceId]);

  useEffect(() => {
    if (!invoiceId && profile?.first_name && profile?.last_name) {
      generateReference();
    }
  }, [invoiceDate, profile?.first_name, profile?.last_name]);

  const addLine = (section: "HONORAIRES" | "RETENUS" | "DEBOURS") => {
    const maxSort = Math.max(...lines.map((l) => l.sort_order || 0), -1);
    setLines([
      ...lines,
      {
        section,
        designation: "",
        unite: null,
        taux: null,
        montant: 0,
        sort_order: maxSort + 1,
      },
    ]);
  };

  const updateLine = (idx: number, field: keyof InvoiceLine, value: any) => {
    const updated = [...lines];
    updated[idx] = { ...updated[idx], [field]: value };

    if (field === "unite" || field === "taux") {
      if (updated[idx].section === "HONORAIRES") {
        updated[idx].montant =
          ((updated[idx].unite || 0) * (updated[idx].taux || 0)) / 100;
      } else if (updated[idx].section === "DEBOURS") {
        updated[idx].montant =
          (updated[idx].unite || 0) * (updated[idx].taux || 0);
      }
    }
    if (field === "taux" && updated[idx].section === "RETENUS") {
      updated[idx].montant = -(totals.totalHT * (updated[idx].taux || 0));
    }

    setLines(updated);
  };

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!user || !selectedClient) return;
    setSaving(true);
    setError(null);

    try {
      const invoiceNumber = invoiceId
        ? undefined
        : `EXCIMAA/FAC${String(new Date().getMonth() + 1).padStart(2, "0")}/${profile?.initials || "XX"}/${String(Math.random()).slice(2, 9).padStart(7, "0")}`;

      const invoiceData: any = {
        ...(invoiceNumber && { invoice_number: invoiceNumber }),
        date_emission: invoiceDate,
        client_id: selectedClient.id,
        client_details_snapshot: {
          name: selectedClient.name,
          address_bp: selectedClient.address_bp,
          nui: selectedClient.nui,
          rccm: selectedClient.rccm,
          contract_ref: selectedClient.contract_ref,
        },
        currency: selectedCountry.currency,
        country: selectedCountry.code,
        ref_pf: refPf,
        date_contrat: dateContrat || null,
        invoice_type: invoiceType, // <-- NEW: save the invoice type
        total_ht: totals.totalHT,
        total_tva: totals.tva,
        total_ttc: totals.totalTTC,
        total_retenues: totals.totalRetenues,
        total_debours: totals.totalDebours,
        total_general: totals.totalGeneral,
        acompte_regle: acompteRegle,
        payment_method: paymentMethods[0] || "virement",
        signature_company: signatureCompany,
        signature_client: signatureClient,
        status: "draft",
        created_by: user.id,
      };

      if (invoiceId) {
        const { error: updateError } = await supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", invoiceId);
        if (updateError) throw updateError;
        for (const line of lines) {
          if (line.id) {
            const { error: lineError } = await supabase
              .from("invoice_lines")
              .update(line)
              .eq("id", line.id);
            if (lineError) throw lineError;
          } else {
            const { error: insertError } = await supabase
              .from("invoice_lines")
              .insert({ ...line, invoice_id: invoiceId });
            if (insertError) throw insertError;
          }
        }
      } else {
        const { data: inv, error: insertError } = await supabase
          .from("invoices")
          .insert(invoiceData)
          .select()
          .maybeSingle();
        if (insertError) throw insertError;
        if (inv) {
          for (const line of lines) {
            const { error: lineError } = await supabase
              .from("invoice_lines")
              .insert({ ...line, invoice_id: inv.id });
            if (lineError) throw lineError;
          }
        }
      }

      // ✅ REMOVED PDF GENERATION – only save
      // await generatePDF(invoiceData); // <-- Commented out

      setSaving(false);
      navigate("/invoices");
    } catch (err: any) {
      console.error("Erreur lors de l'enregistrement:", err);
      setError(err.message || "Erreur lors de l'enregistrement de la facture");
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {invoiceId ? "Modifier" : "Nouvelle"} facture
        </h1>
        <button
          onClick={() => navigate("/invoices")}
          className="text-slate-400 hover:text-slate-600"
        >
          <X size={24} />
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">
              Erreur d'enregistrement
            </p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
        )}
        {/* Header section - changed to 5 columns to accommodate invoice type */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 pb-6 border-b border-slate-200">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Client
            </label>
            <select
              value={selectedClient?.id || ""}
              onChange={(e) =>
                setSelectedClient(
                  clients.find((c) => c.id === e.target.value) || null,
                )
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionner un client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.client_code} - {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Date d'émission
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Réf
            </label>
            <input
              type="text"
              value={refPf}
              readOnly
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Date contrat
            </label>
            <input
              type="date"
              value={dateContrat}
              onChange={(e) => setDateContrat(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Type de facture
            </label>
            <select
              value={invoiceType}
              onChange={(e) =>
                setInvoiceType(e.target.value as "PRO-FORMA" | "FACTURE")
              }
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="FACTURE">Facture</option>
              <option value="PRO-FORMA">Pro‑forma</option>
            </select>
          </div>
        </div>

        {/* Client details */}
        {selectedClient && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b border-slate-200 bg-slate-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-slate-500">BP / Adresse</p>
              <p className="text-sm font-medium text-slate-800">
                {selectedClient.address_bp || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">NUI</p>
              <p className="text-sm font-medium text-slate-800">
                {selectedClient.nui || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">RCCM</p>
              <p className="text-sm font-medium text-slate-800">
                {selectedClient.rccm || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Réf. Contrat</p>
              <p className="text-sm font-medium text-slate-800">
                {selectedClient.contract_ref || "—"}
              </p>
            </div>
          </div>
        )}

        {/* Invoice lines (unchanged) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">HONORAIRES</h3>
            <button
              onClick={() => addLine("HONORAIRES")}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>
          <div className="space-y-2 mb-4">
            {lines
              .filter((l) => l.section === "HONORAIRES")
              .map((line, idx) => {
                const lineIdx = lines.indexOf(line);
                return (
                  <div key={idx} className="flex items-end gap-2">
                    <input
                      type="text"
                      value={line.designation}
                      onChange={(e) =>
                        updateLine(lineIdx, "designation", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Designation"
                    />
                    <input
                      type="number"
                      value={line.unite || ""}
                      onChange={(e) =>
                        updateLine(
                          lineIdx,
                          "unite",
                          parseFloat(e.target.value) || null,
                        )
                      }
                      className="w-20 px-2 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Unité"
                    />
                    <div className="relative">
                      <input
                        type="number"
                        value={line.taux || ""}
                        onChange={(e) =>
                          updateLine(
                            lineIdx,
                            "taux",
                            parseFloat(e.target.value) || null,
                          )
                        }
                        className="w-20 px-2 py-2 pr-6 border border-slate-200 rounded-lg text-sm"
                        placeholder="Taux"
                      />
                      <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-slate-500">
                        %
                      </span>
                    </div>
                    <div className="w-24 px-3 py-2 bg-slate-50 rounded-lg text-sm font-medium text-slate-700">
                      {formatNumber(line.montant, 2)}
                    </div>
                    <button
                      onClick={() => removeLine(lineIdx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
          </div>

          <div className="bg-slate-50 p-4 rounded-lg mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total HONORAIRES HT:</span>
              <span className="font-semibold">
                {formatNumber(totals.totalHT, 2)}{" "}
                {selectedCountry.currencySymbol}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">TVA (19.25%):</span>
              <span className="font-semibold">
                {formatNumber(totals.tva, 2)} {selectedCountry.currencySymbol}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t pt-2">
              <span>Total HONORAIRES TTC(A):</span>
              <span className="text-blue-600">
                {formatNumber(totals.totalTTC, 2)}{" "}
                {selectedCountry.currencySymbol}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">RETENUES</h3>
            <button
              onClick={() => addLine("RETENUS")}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>
          <div className="space-y-2 mb-4">
            {lines
              .filter((l) => l.section === "RETENUS")
              .map((line, idx) => {
                const lineIdx = lines.indexOf(line);
                return (
                  <div key={idx} className="flex items-end gap-2">
                    <input
                      type="text"
                      value={line.designation}
                      onChange={(e) =>
                        updateLine(lineIdx, "designation", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Désignation"
                    />
                    <select
                      value={line.taux || ""}
                      onChange={(e) =>
                        updateLine(
                          lineIdx,
                          "taux",
                          parseFloat(e.target.value) || null,
                        )
                      }
                      className="w-32 px-2 py-2 border border-slate-200 rounded-lg text-sm"
                    >
                      <option value="">Sélectionner</option>
                      {RETENUES_RATES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                    <div className="w-24 px-3 py-2 bg-slate-50 rounded-lg text-sm font-medium text-red-600">
                      {formatNumber(line.montant, 2)}
                    </div>
                    <button
                      onClick={() => removeLine(lineIdx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
          </div>

          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">DÉBOURS</h3>
            <button
              onClick={() => addLine("DEBOURS")}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>
          <div className="space-y-2 mb-4">
            {lines
              .filter((l) => l.section === "DEBOURS")
              .map((line, idx) => {
                const lineIdx = lines.indexOf(line);
                return (
                  <div key={idx} className="flex items-end gap-2">
                    <input
                      type="text"
                      value={line.designation}
                      onChange={(e) =>
                        updateLine(lineIdx, "designation", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Désignation"
                    />
                    <input
                      type="number"
                      value={line.unite || ""}
                      onChange={(e) =>
                        updateLine(
                          lineIdx,
                          "unite",
                          parseFloat(e.target.value) || null,
                        )
                      }
                      className="w-20 px-2 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Unité"
                    />
                    <input
                      type="number"
                      value={line.taux || ""}
                      onChange={(e) =>
                        updateLine(
                          lineIdx,
                          "taux",
                          parseFloat(e.target.value) || null,
                        )
                      }
                      className="w-20 px-2 py-2 border border-slate-200 rounded-lg text-sm"
                      placeholder="Qté/Taux"
                    />
                    <div className="w-24 px-3 py-2 bg-slate-50 rounded-lg text-sm font-medium text-slate-700">
                      {formatNumber(line.montant, 2)}
                    </div>
                    <button
                      onClick={() => removeLine(lineIdx)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Total Débours(C)</p>
              <p className="text-lg font-bold text-orange-600">
                {formatNumber(totals.totalDebours, 2)}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Total Retenues(B)</p>
              <p className="text-lg font-bold text-red-600">
                {formatNumber(totals.totalRetenues, 2)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Acompte réglé</p>
              <input
                type="number"
                value={acompteRegle}
                onChange={(e) =>
                  setAcompteRegle(parseFloat(e.target.value) || 0)
                }
                className="w-full px-2 py-1 border border-green-200 rounded text-sm text-green-700 bg-white"
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
            <p className="text-sm text-slate-600 mb-1">Total général à payer</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatNumber(totals.totalGeneral, 2)}{" "}
              {selectedCountry.currencySymbol}
            </p>
          </div>
        </div>

        {/* Payment & signatures */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-2">
              Mode de paiement
            </label>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={paymentMethods.includes(m.value)}
                    onChange={(e) =>
                      setPaymentMethods(
                        e.target.checked
                          ? [...paymentMethods, m.value]
                          : paymentMethods.filter((p) => p !== m.value),
                      )
                    }
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700">{m.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-xs font-medium text-slate-700 mb-2">
              Détails bancaires
            </p>
            <div className="text-xs space-y-1 text-slate-600">
              <p>
                <span className="font-medium">Banque:</span> {BANK_DETAILS.bank}
              </p>
              <p>
                <span className="font-medium">IBAN:</span> {BANK_DETAILS.iban}
              </p>
              <p>
                <span className="font-medium">RCCM:</span> {BANK_DETAILS.rccm}
              </p>
              <p>
                <span className="font-medium">NIU:</span> {BANK_DETAILS.nui}
              </p>
              <p>
                <span className="font-medium">Résidence fiscale:</span>{" "}
                {BANK_DETAILS.residenceFiscal}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Signature EXCI-MAA
            </label>
            <input
              type="text"
              value={signatureCompany}
              onChange={(e) => setSignatureCompany(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Signature client
            </label>
            <input
              type="text"
              value={signatureClient}
              onChange={(e) => setSignatureClient(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            onClick={() => navigate("/invoices")}
            className="flex-1 px-4 py-2.5 text-slate-700 hover:bg-slate-100 rounded-lg font-medium transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !selectedClient}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1e3a5f] text-white rounded-lg font-medium hover:bg-[#2a4f7f] disabled:opacity-60 transition-all"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
