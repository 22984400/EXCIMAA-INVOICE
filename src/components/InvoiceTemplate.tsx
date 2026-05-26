import React, { useState } from "react";
import { BANK_DETAILS, COMPANY_INFO } from "../lib/constants";
import { formatNumber } from "../lib/invoiceUtils";

interface Line {
  id: string;
  section: "HONORAIRES" | "RETENUS" | "DEBOURS";
  designation: string;
  unite?: number;
  taux?: number;
  montant: number;
  comments?: string; // added for the comment field
}

interface InvoiceTemplateProps {
  invoice: {
    id: string;
    invoice_number: string;
    date_emission: string;
    client_details_snapshot?: {
      name: string;
      address_bp: string;
      nui: string;
      rccm: string;
      country?: string;
    };
    currency: string;
    signature_company?: string;
    signature_client?: string;
    payment_method?: string;
  };
  lines: Line[];
  totals: {
    honoraires_total: number;
    retenus_total: number;
    debours_total: number;
    montant_ht: number;
    montant_ttc: number;
    tva?: number;
  };
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({
  invoice,
  lines,
}) => {
  const [logoError, setLogoError] = useState(false);

  const honors = lines.filter((l) => l.section === "HONORAIRES");
  const retenues = lines.filter((l) => l.section === "RETENUS");
  const debours = lines.filter((l) => l.section === "DEBOURS");

  const honoraires_total = honors.reduce((sum, l) => sum + l.montant, 0);
  const retenus_total = retenues.reduce((sum, l) => sum + l.montant, 0);
  const debours_total = debours.reduce((sum, l) => sum + l.montant, 0);

  const total_ht = honoraires_total;
  const tva_amount = honoraires_total * 0.1925;
  const total_ttc = total_ht + tva_amount;
  const montant_ttc_final = total_ttc + retenus_total + debours_total;

  // Styles d'impression réduisant polices et espacements
  const printStyles = `
    @media print {
      body, .invoice-container, .invoice-container * {
        font-size: 9px !important;
        line-height: 1.2 !important;
      }
      .invoice-container {
        padding: 8px !important;
        margin: 0 !important;
      }
      .invoice-container h1 {
        font-size: 16px !important;
      }
      .invoice-container h3 {
        font-size: 11px !important;
        margin-bottom: 4px !important;
      }
      .invoice-container .text-4xl {
        font-size: 16px !important;
      }
      .invoice-container .text-2xl {
        font-size: 14px !important;
      }
      .invoice-container .text-lg {
        font-size: 11px !important;
      }
      .invoice-container .text-sm {
        font-size: 8px !important;
      }
      .invoice-container .text-xs {
        font-size: 7px !important;
      }
      .invoice-container .mb-8, .invoice-container .mb-6, .invoice-container .mb-4 {
        margin-bottom: 4px !important;
      }
      .invoice-container .pb-6, .invoice-container .pb-8 {
        padding-bottom: 4px !important;
      }
      .invoice-container .py-2 {
        padding-top: 2px !important;
        padding-bottom: 2px !important;
      }
      .invoice-container .px-3 {
        padding-left: 4px !important;
        padding-right: 4px !important;
      }
      .invoice-container .p-8 {
        padding: 8px !important;
      }
      .invoice-container .p-4 {
        padding: 4px !important;
      }
      .invoice-container .pt-4 {
        padding-top: 4px !important;
      }
      .invoice-container .mt-6 {
        margin-top: 4px !important;
      }
      .invoice-container .gap-8 {
        gap: 8px !important;
      }
      .invoice-container .w-80 {
        width: auto !important;
      }
      .invoice-container .border-b, .invoice-container .border-t {
        border-width: 0.5px !important;
      }
      .invoice-container img {
        max-height: 40px !important;
      }
    }
  `;

  // Helper to split designation into three parts
  const splitDesignation = (desig: string) => {
    const parts = (desig || "").split("||");
    return [parts[0] || "", parts[1] || "", parts[2] || ""];
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100 print:shadow-none print:border-none print:rounded-none invoice-container">
      <style>{printStyles}</style>

      {/* Header */}
      <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">FACTURE</h1>
        </div>
        <div className="flex-shrink-0">
          {!logoError ? (
            <img
              src="/logos/ExicimaaLogo.png"
              alt="EXCI-MAA Logo"
              className="h-auto w-auto object-contain"
              style={{ maxHeight: "60px", maxWidth: "100px" }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <div
              className="w-16 h-16 bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium text-center print:block"
              style={{ width: "60px", height: "60px" }}
            >
              Logo
            </div>
          )}
        </div>
      </div>

      {/* Company and Invoice Info */}
      <div className="grid grid-cols-2 gap-8 mb-8 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2 uppercase">
            EXPERTS COMPTABLES INTERNATIONAUX MANAGEMENT AUDIT ADVISORY
          </p>
          <p className="font-semibold text-slate-800">{COMPANY_INFO.name}</p>
          <p className="text-xs text-slate-600 mt-1">{COMPANY_INFO.tagline}</p>
          <p className="text-xs text-slate-600">{COMPANY_INFO.address}</p>
          <p className="text-xs text-slate-600 mt-1">{COMPANY_INFO.phone}</p>
          <p className="text-xs text-slate-600">{COMPANY_INFO.email}</p>
          {COMPANY_INFO.bp && (
            <p className="text-xs text-slate-600 mt-1">BP: {COMPANY_INFO.bp}</p>
          )}
          {COMPANY_INFO.nui && (
            <p className="text-xs text-slate-600">
              » Expertise Comptable » Management » Commissariat aux Comptes »
              Audits & Conseils » Fiscalité » Organisation & GRH » Formation
              Continue » Informatique de Gestion
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="mb-6">
            <p className="text-xs font-medium text-slate-500 mb-1 uppercase">
              N° Facture
            </p>
            <p className="text-2xl font-bold text-blue-600">
              {invoice.invoice_number}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1 uppercase">
              Date d'émission
            </p>
            <p className="text-sm text-slate-800">
              {new Date(invoice.date_emission).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div className="grid grid-cols-2 gap-8 mb-8 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2 uppercase">
            Client
          </p>
          {invoice.client_details_snapshot ? (
            <>
              <p className="font-semibold text-slate-800">
                {invoice.client_details_snapshot.name}
              </p>
              {invoice.client_details_snapshot.address_bp && (
                <p className="text-xs text-slate-600 mt-1">
                  BP: {invoice.client_details_snapshot.address_bp}
                </p>
              )}
              {invoice.client_details_snapshot.nui && (
                <p className="text-xs text-slate-600">
                  NUI: {invoice.client_details_snapshot.nui}
                </p>
              )}
              {invoice.client_details_snapshot.rccm && (
                <p className="text-xs text-slate-600">
                  RCCM: {invoice.client_details_snapshot.rccm}
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500">
              Informations client non disponibles
            </p>
          )}
        </div>
        <div />
      </div>

      {/* Honoraires Section - Modified with split columns and comment */}
      {honors.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase">
            Honoraires
          </h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">
                  MISSION
                </th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">
                  PRESTATIONA
                </th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">
                  HONORAIRES
                </th>
                <th className="text-center px-3 py-2 font-semibold text-slate-700 w-20 border border-slate-200">
                  Unité
                </th>
                <th className="text-center px-3 py-2 font-semibold text-slate-700 w-24 border border-slate-200">
                  Taux (%)
                </th>
                <th className="text-right px-3 py-2 font-semibold text-slate-700 w-32 border border-slate-200">
                  Montant ({invoice.currency})
                </th>
                <th className="text-left px-3 py-2 font-semibold text-slate-700 w-40 border border-slate-200">
                  Accompte
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {honors.map((l) => {
                const [mission, prestation, honorairesText] = splitDesignation(
                  l.designation,
                );
                return (
                  <tr
                    key={l.id}
                    className="hover:bg-slate-50 print:hover:bg-transparent"
                  >
                    <td className="px-3 py-2 text-slate-700 border border-slate-200">
                      {mission}
                    </td>
                    <td className="px-3 py-2 text-slate-700 border border-slate-200">
                      {prestation}
                    </td>
                    <td className="px-3 py-2 text-slate-700 border border-slate-200">
                      {honorairesText}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600 border border-slate-200">
                      {formatNumber(l.unite || 0)}
                    </td>
                    <td className="px-3 py-2 text-center text-slate-600 border border-slate-200">
                      {l.taux || 0}%
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700 border border-slate-200">
                      {formatNumber(l.montant)}
                    </td>
                    <td className="px-3 py-2 text-slate-700 border border-slate-200">
                      {l.comments || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Retenues Section - unchanged */}
      {retenues.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase">
            Retenues
          </h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">
                  Désignation
                </th>
                <th className="text-center px-3 py-2 font-semibold text-slate-700 w-20 border border-slate-200">
                  Unité
                </th>
                <th className="text-center px-3 py-2 font-semibold text-slate-700 w-24 border border-slate-200">
                  Taux (%)
                </th>
                <th className="text-right px-3 py-2 font-semibold text-slate-700 w-32 border border-slate-200">
                  Montant ({invoice.currency})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {retenues.map((l) => (
                <tr
                  key={l.id}
                  className="hover:bg-slate-50 print:hover:bg-transparent"
                >
                  <td className="px-3 py-2 text-slate-700 border border-slate-200">
                    {l.designation}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-600 border border-slate-200">
                    {formatNumber(l.unite || 0)}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-600 border border-slate-200">
                    {l.taux || 0}%
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700 border border-slate-200">
                    {formatNumber(l.montant)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Debours Section - unchanged */}
      {debours.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase">
            Débours
          </h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">
                  Désignation
                </th>
                <th className="text-center px-3 py-2 font-semibold text-slate-700 w-20 border border-slate-200">
                  Unité
                </th>
                <th className="text-center px-3 py-2 font-semibold text-slate-700 w-24 border border-slate-200">
                  Taux (%)
                </th>
                <th className="text-right px-3 py-2 font-semibold text-slate-700 w-32 border border-slate-200">
                  Montant ({invoice.currency})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {debours.map((l) => (
                <tr
                  key={l.id}
                  className="hover:bg-slate-50 print:hover:bg-transparent"
                >
                  <td className="px-3 py-2 text-slate-700 border border-slate-200">
                    {l.designation}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-600 border border-slate-200">
                    {formatNumber(l.unite || 0)}
                  </td>
                  <td className="px-3 py-2 text-center text-slate-600 border border-slate-200">
                    {l.taux || 0}%
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700 border border-slate-200">
                    {formatNumber(l.montant)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals section - unchanged */}
      <div className="mb-8 pb-8 border-b border-slate-200">
        <div className="flex justify-end">
          <div className="w-80">
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="font-semibold text-slate-700">Total HT :</span>
              <span className="font-semibold text-slate-800">
                {formatNumber(total_ht)} {invoice.currency}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200 text-slate-600">
              <span className="text-sm">TVA (19.25%) :</span>
              <span className="text-sm">
                {formatNumber(tva_amount)} {invoice.currency}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="font-semibold text-slate-700">Total TTC :</span>
              <span className="font-semibold text-slate-800">
                {formatNumber(total_ttc)} {invoice.currency}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="font-semibold text-slate-700">
                Total Retenues :
              </span>
              <span className="font-semibold text-slate-800">
                {formatNumber(retenus_total)} {invoice.currency}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-200">
              <span className="font-semibold text-slate-700">
                Total Débours :
              </span>
              <span className="font-semibold text-slate-800">
                {formatNumber(debours_total)} {invoice.currency}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 text-lg font-bold text-blue-600 bg-blue-50 px-3 rounded mt-2">
              <span>Montant TTC :</span>
              <span>
                {formatNumber(montant_ttc_final)} {invoice.currency}
              </span>
            </div>
            {invoice.payment_method && (
              <div className="flex justify-between items-center py-2 mt-2 border-t-2 border-slate-300">
                <span className="font-semibold text-slate-700">
                  Mode de paiement :
                </span>
                <span className="font-semibold text-slate-800">
                  {invoice.payment_method}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bank Details - unchanged */}
      {BANK_DETAILS && Object.keys(BANK_DETAILS).length > 0 && (
        <div className="mb-8 p-4 bg-slate-50 rounded border border-slate-200">
          <h3 className="text-sm font-semibold text-slate-800 mb-3 uppercase">
            Coordonnées Bancaires
          </h3>
          <div className="space-y-1 text-xs text-slate-700">
            {BANK_DETAILS.bank && (
              <p>
                <span className="font-medium">Banque:</span> {BANK_DETAILS.bank}
              </p>
            )}
            {BANK_DETAILS.account_number && (
              <p>
                <span className="font-medium">N° Compte:</span>{" "}
                {BANK_DETAILS.account_number}
              </p>
            )}
            {BANK_DETAILS.iban && (
              <p>
                <span className="font-medium">IBAN:</span> {BANK_DETAILS.iban}
              </p>
            )}
            {BANK_DETAILS.residenceFiscal && (
              <p>
                <span className="font-medium">Résidence fiscale:</span>{" "}
                {BANK_DETAILS.residenceFiscal}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Signatures and Footer */}
      <div className="mt-6 flex justify-between text-left text-slate-700 text-sm">
        <div>
          <label className="block font-medium">Signature EXCI-MAA :</label>
          <div className="mt-1 border-b border-slate-300 w-48 h-6"></div>
        </div>
        <div>
          <label className="block font-medium">Signature du client :</label>
          <div className="mt-1 border-b border-slate-300 w-48 h-6"></div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-200">
        <p>Document généré automatiquement par EXCI-MAA</p>
        <p className="mt-1">Système de facturation professionnelle</p>
      </div>
    </div>
  );
};
