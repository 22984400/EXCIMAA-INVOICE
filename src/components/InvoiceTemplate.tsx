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
  comments?: string;
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

  const printStyles = `
    @media print {
      body, .invoice-container, .invoice-container * {
        font-size: 8px !important;
        line-height: 1.1 !important;
      }
      .invoice-container {
        padding: 6px !important;
        margin: 0 !important;
      }
      .invoice-container h1 {
        font-size: 14px !important;
      }
      .invoice-container h3 {
        font-size: 9px !important;
        margin-bottom: 2px !important;
      }
      .invoice-container .text-4xl {
        font-size: 14px !important;
      }
      .invoice-container .text-2xl {
        font-size: 12px !important;
      }
      .invoice-container .text-lg {
        font-size: 10px !important;
      }
      .invoice-container .text-sm {
        font-size: 7px !important;
      }
      .invoice-container .text-xs {
        font-size: 6px !important;
      }
      .invoice-container .mb-8, .invoice-container .mb-6, .invoice-container .mb-4 {
        margin-bottom: 2px !important;
      }
      .invoice-container .pb-6, .invoice-container .pb-8 {
        padding-bottom: 2px !important;
      }
      .invoice-container .py-2 {
        padding-top: 1px !important;
        padding-bottom: 1px !important;
      }
      .invoice-container .px-3 {
        padding-left: 2px !important;
        padding-right: 2px !important;
      }
      .invoice-container .p-8 {
        padding: 4px !important;
      }
      .invoice-container .p-4 {
        padding: 2px !important;
      }
      .invoice-container .pt-4 {
        padding-top: 2px !important;
      }
      .invoice-container .mt-6 {
        margin-top: 2px !important;
      }
      .invoice-container .gap-8 {
        gap: 4px !important;
      }
      .invoice-container .w-80 {
        width: auto !important;
      }
      .invoice-container .border-b, .invoice-container .border-t {
        border-width: 0.3px !important;
      }
      .invoice-container img {
        max-height: 50px !important;
      }
      .invoice-container table td, .invoice-container table th {
        padding: 2px 4px !important;
      }
    }
  `;

  const splitDesignation = (desig: string) => {
    const parts = (desig || "").split("||");
    return [parts[0] || "", parts[1] || "", parts[2] || ""];
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100 print:shadow-none print:border-none print:rounded-none invoice-container">
      <style>{printStyles}</style>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">FACTURE</h1>
        </div>
        <div className="flex-shrink-0">
          {!logoError ? (
            <img
              src="/logos/ExicimaaLogo.png"
              alt="EXCI-MAA Logo"
              className="h-auto w-auto object-contain"
              style={{ maxHeight: "70px", maxWidth: "130px" }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <div
              className="w-16 h-16 bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium text-center print:block"
              style={{ width: "70px", height: "70px" }}
            >
              Logo
            </div>
          )}
        </div>
      </div>

      {/* Company and Invoice Info */}
      <div className="grid grid-cols-2 gap-6 mb-4 pb-3 border-b border-slate-200">
        <div>
          <p className="font-semibold text-slate-800">{COMPANY_INFO.name}</p>
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase">
            EXPERTS COMPTABLES INTERNATIONAUX MANAGEMENT AUDIT ADVISORY
          </p>
          <p className="text-xs text-slate-600 mt-1">{COMPANY_INFO.tagline}</p>
          <p className="text-xs text-slate-600">{COMPANY_INFO.address}</p>
          <p className="text-xs text-slate-600 mt-1">{COMPANY_INFO.phone}</p>
          <p className="text-xs text-slate-600">{COMPANY_INFO.email}</p>
          {COMPANY_INFO.bp && (
            <p className="text-xs text-slate-600 mt-1">{COMPANY_INFO.bp}</p>
          )}
        </div>
        <div className="text-right">
          <div className="mb-3">
            <p className="text-xs font-medium text-slate-500 mb-1 uppercase">
              N° Facture
            </p>
            <p className="text-xl font-bold text-blue-600">
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

      {/* Client Info + Bank Details side by side with vertical divider */}
      <div className="grid grid-cols-2 gap-6 mb-4 pb-3 border-b border-slate-200">
        {/* Client Info */}
        <div>
          <p className="text-xs font-medium text-slate-500 mb-1 uppercase">
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

        {/* Vertical divider line */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200 -ml-3"></div>
          {/* Bank Details with light sky blue background */}
          <div className="bg-sky-50 p-3 rounded-lg">
            <p className="text-xs font-medium text-slate-500 mb-1 uppercase">
              Coordonnées Bancaires
            </p>
            {BANK_DETAILS && Object.keys(BANK_DETAILS).length > 0 ? (
              <>
                {BANK_DETAILS.bank && (
                  <p className="text-xs text-slate-600">{BANK_DETAILS.bank}</p>
                )}
                {BANK_DETAILS.account_number && (
                  <p className="text-xs text-slate-600">
                    N° Compte: {BANK_DETAILS.account_number}
                  </p>
                )}
                {BANK_DETAILS.iban && (
                  <p className="text-xs text-slate-600">
                    IBAN: {BANK_DETAILS.iban}
                  </p>
                )}
                {BANK_DETAILS.residenceFiscal && (
                  <p className="text-xs text-slate-600">
                    Résidence fiscale: {BANK_DETAILS.residenceFiscal}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-slate-500">
                Informations bancaires non disponibles
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Honoraires Section */}
      {honors.length > 0 && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-800 mb-2 uppercase">
            Honoraires
          </h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="text-left px-2 py-1 font-semibold text-slate-700 border border-slate-200">
                  MISSION
                </th>
                <th className="text-left px-2 py-1 font-semibold text-slate-700 border border-slate-200">
                  PRESTATION
                </th>
                <th className="text-left px-2 py-1 font-semibold text-slate-700 border border-slate-200">
                  HONORAIRES
                </th>
                <th className="text-center px-2 py-1 font-semibold text-slate-700 w-16 border border-slate-200">
                  Unité
                </th>
                <th className="text-center px-2 py-1 font-semibold text-slate-700 w-20 border border-slate-200">
                  Taux (%)
                </th>
                <th className="text-right px-2 py-1 font-semibold text-slate-700 w-24 border border-slate-200">
                  Montant ({invoice.currency})
                </th>
                <th className="text-left px-2 py-1 font-semibold text-slate-700 w-32 border border-slate-200">
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
                    <td className="px-2 py-1 text-slate-700 border border-slate-200">
                      {mission}
                    </td>
                    <td className="px-2 py-1 text-slate-700 border border-slate-200">
                      {prestation}
                    </td>
                    <td className="px-2 py-1 text-slate-700 border border-slate-200">
                      {honorairesText}
                    </td>
                    <td className="px-2 py-1 text-center text-slate-600 border border-slate-200">
                      {formatNumber(l.unite || 0)}
                    </td>
                    <td className="px-2 py-1 text-center text-slate-600 border border-slate-200">
                      {l.taux || 0}%
                    </td>
                    <td className="px-2 py-1 text-right text-slate-700 border border-slate-200">
                      {formatNumber(l.montant)}
                    </td>
                    <td className="px-2 py-1 text-slate-700 border border-slate-200">
                      {l.comments || "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex justify-end mt-1">
            <div className="w-64">
              <div className="flex justify-between items-center py-0.5 text-sm">
                <span className="font-semibold text-slate-700">Total HT :</span>
                <span className="font-semibold text-slate-800">
                  {formatNumber(total_ht)} {invoice.currency}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-sm text-slate-600">
                <span>TVA (19.25%) :</span>
                <span>
                  {formatNumber(tva_amount)} {invoice.currency}
                </span>
              </div>
              <div className="flex justify-between items-center py-0.5 text-sm font-bold border-t pt-0.5">
                <span>Total TTC :</span>
                <span className="text-blue-600">
                  {formatNumber(total_ttc)} {invoice.currency}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Retenues Section */}
      {retenues.length > 0 && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-800 mb-2 uppercase">
            Retenues
          </h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="text-left px-2 py-1 font-semibold text-slate-700 border border-slate-200">
                  Désignation
                </th>
                <th className="text-center px-2 py-1 font-semibold text-slate-700 w-16 border border-slate-200">
                  Unité
                </th>
                <th className="text-center px-2 py-1 font-semibold text-slate-700 w-20 border border-slate-200">
                  Taux (%)
                </th>
                <th className="text-right px-2 py-1 font-semibold text-slate-700 w-24 border border-slate-200">
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
                  <td className="px-2 py-1 text-slate-700 border border-slate-200">
                    {l.designation}
                  </td>
                  <td className="px-2 py-1 text-center text-slate-600 border border-slate-200">
                    {formatNumber(l.unite || 0)}
                  </td>
                  <td className="px-2 py-1 text-center text-slate-600 border border-slate-200">
                    {l.taux || 0}%
                  </td>
                  <td className="px-2 py-1 text-right text-slate-700 border border-slate-200">
                    {formatNumber(l.montant)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end mt-1">
            <div className="w-64">
              <div className="flex justify-between items-center py-0.5 text-sm">
                <span className="font-semibold text-slate-700">
                  Total Retenues :
                </span>
                <span className="font-semibold text-slate-800">
                  {formatNumber(retenus_total)} {invoice.currency}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Débours Section */}
      {debours.length > 0 && (
        <div className="mb-3">
          <h3 className="text-sm font-semibold text-slate-800 mb-2 uppercase">
            Débours
          </h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100 print:bg-slate-200">
                <th className="text-left px-2 py-1 font-semibold text-slate-700 border border-slate-200">
                  Désignation
                </th>
                <th className="text-center px-2 py-1 font-semibold text-slate-700 w-16 border border-slate-200">
                  Unité
                </th>
                <th className="text-center px-2 py-1 font-semibold text-slate-700 w-20 border border-slate-200">
                  Taux (%)
                </th>
                <th className="text-right px-2 py-1 font-semibold text-slate-700 w-24 border border-slate-200">
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
                  <td className="px-2 py-1 text-slate-700 border border-slate-200">
                    {l.designation}
                  </td>
                  <td className="px-2 py-1 text-center text-slate-600 border border-slate-200">
                    {formatNumber(l.unite || 0)}
                  </td>
                  <td className="px-2 py-1 text-center text-slate-600 border border-slate-200">
                    {l.taux || 0}%
                  </td>
                  <td className="px-2 py-1 text-right text-slate-700 border border-slate-200">
                    {formatNumber(l.montant)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Final totals section */}
      <div className="mb-4 pb-3 border-b border-slate-200">
        <div className="flex justify-end">
          <div className="w-72">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="font-semibold text-slate-700">
                Total Débours :
              </span>
              <span className="font-semibold text-slate-800">
                {formatNumber(debours_total)} {invoice.currency}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 text-base font-bold text-blue-600 bg-blue-50 px-3 rounded mt-2">
              <span>Montant TTC :</span>
              <span>
                {formatNumber(montant_ttc_final)} {invoice.currency}
              </span>
            </div>
            {invoice.payment_method && (
              <div className="flex justify-between items-center py-1 mt-1 border-t border-slate-300">
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

      {/* Signatures and Footer */}
      <div className="mt-4 flex justify-between text-left text-slate-700 text-sm">
        <div>
          <label className="block font-medium">Signature EXCI-MAA :</label>
          <div className="mt-1 border-b border-slate-300 w-40 h-5"></div>
        </div>
        <div>
          <label className="block font-medium">Signature du client :</label>
          <div className="mt-1 border-b border-slate-300 w-40 h-5"></div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 pt-3 border-t border-slate-200 mt-3">
        <p>Document généré automatiquement par EXCI-MAA</p>
        <p className="mt-1">Système de facturation professionnelle</p>
      </div>
    </div>
  );
};
