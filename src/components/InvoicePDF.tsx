import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { InvoiceLine, InvoiceTotals } from "../lib/invoiceUtils";
import { COMPANY_INFO, BANK_DETAILS } from "../lib/constants";

// Register fonts if needed
// Font.register({ family: 'Inter', src: '/fonts/Inter-Regular.ttf' });

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    borderBottomColor: "#000",
    paddingBottom: 10,
  },
  companyInfo: {
    marginBottom: 10,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 8,
    color: "#666",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  invoiceDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  detailSection: {
    width: "48%",
  },
  detailLabel: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  detailValue: {
    marginBottom: 3,
  },
  table: {
    marginTop: 20,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    padding: 5,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    padding: 5,
    borderBottom: 0.5,
    borderBottomColor: "#ccc",
  },
  colDesignation: { width: "40%" },
  colUnite: { width: "15%", textAlign: "right" },
  colTaux: { width: "15%", textAlign: "right" },
  colMontant: { width: "20%", textAlign: "right" },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 5,
  },
  totals: {
    marginTop: 20,
    marginBottom: 20,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 5,
  },
  totalLabel: {
    width: "30%",
    textAlign: "right",
    paddingRight: 10,
  },
  totalValue: {
    width: "20%",
    textAlign: "right",
    fontWeight: "bold",
  },
  signatures: {
    marginTop: 40,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "45%",
    border: 1,
    borderColor: "#000",
    padding: 20,
    minHeight: 60,
  },
  signatureLabel: {
    fontSize: 9,
    marginBottom: 10,
    textAlign: "center",
  },
  signatureText: {
    fontSize: 10,
    textAlign: "center",
  },
  bankDetails: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#f9f9f9",
  },
  bankTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
  },
  bankRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  bankLabel: {
    width: "25%",
    fontWeight: "bold",
  },
  bankValue: {
    width: "75%",
  },
});

interface InvoicePDFProps {
  invoiceData: {
    ref_pf: string;
    date_emission: string;
    date_contrat?: string;
    client_details_snapshot: any;
    lines: InvoiceLine[];
    totals: InvoiceTotals;
    signature_company: string;
    signature_client: string;
    payment_method: string;
    currency: string;
    tva: number;
  };
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoiceData }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  const honoraireLines = invoiceData.lines.filter(
    (l) => l.section === "HONORAIRES",
  );
  const retenuLines = invoiceData.lines.filter((l) => l.section === "RETENUS");
  const debourLines = invoiceData.lines.filter((l) => l.section === "DEBOURS");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{COMPANY_INFO.name}</Text>
            <Text style={styles.companyDetails}>{COMPANY_INFO.tagline}</Text>
            <Text style={styles.companyDetails}>{COMPANY_INFO.address}</Text>
            <Text style={styles.companyDetails}>
              {COMPANY_INFO.phone} | {COMPANY_INFO.email}
            </Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>FACTURE</Text>

        {/* Invoice Details */}
        <View style={styles.invoiceDetails}>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Client:</Text>
            <Text style={styles.detailValue}>
              {invoiceData.client_details_snapshot.name}
            </Text>
            <Text style={styles.detailValue}>
              {invoiceData.client_details_snapshot.address_bp}
            </Text>
            <Text style={styles.detailValue}>
              NUI: {invoiceData.client_details_snapshot.nui}
            </Text>
            <Text style={styles.detailValue}>
              RCCM: {invoiceData.client_details_snapshot.rccm}
            </Text>
          </View>
          <View style={styles.detailSection}>
            <Text style={styles.detailValue}>Réf: {invoiceData.ref_pf}</Text>
            <Text style={styles.detailValue}>
              Date d'émission: {formatDate(invoiceData.date_emission)}
            </Text>
            {invoiceData.date_contrat && (
              <Text style={styles.detailValue}>
                Date contrat: {formatDate(invoiceData.date_contrat)}
              </Text>
            )}
          </View>
        </View>

        {/* Honoraires Table */}
        {honoraireLines.length > 0 && (
          <View style={styles.table}>
            <Text style={styles.sectionTitle}>HONORAIRES</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.colDesignation}>Désignation</Text>
              <Text style={styles.colUnite}>Unité</Text>
              <Text style={styles.colTaux}>Taux (%)</Text>
              <Text style={styles.colMontant}>
                Montant ({invoiceData.currency})
              </Text>
            </View>
            {honoraireLines.map((line, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colDesignation}>{line.designation}</Text>
                <Text style={styles.colUnite}>{line.unite || 0}</Text>
                <Text style={styles.colTaux}>{line.taux || 0}%</Text>
                <Text style={styles.colMontant}>
                  {formatCurrency(line.montant)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Retenues Table */}
        {retenuLines.length > 0 && (
          <View style={styles.table}>
            <Text style={styles.sectionTitle}>RETENUES</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.colDesignation}>Désignation</Text>
              <Text style={styles.colUnite}></Text>
              <Text style={styles.colTaux}>Taux (%)</Text>
              <Text style={styles.colMontant}>
                Montant ({invoiceData.currency})
              </Text>
            </View>
            {retenuLines.map((line, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colDesignation}>{line.designation}</Text>
                <Text style={styles.colUnite}></Text>
                <Text style={styles.colTaux}>{(line.taux || 0) * 100}%</Text>
                <Text style={styles.colMontant}>
                  {formatCurrency(line.montant)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Debours Table */}
        {debourLines.length > 0 && (
          <View style={styles.table}>
            <Text style={styles.sectionTitle}>DÉBOURS</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.colDesignation}>Désignation</Text>
              <Text style={styles.colUnite}>Unité</Text>
              <Text style={styles.colTaux}>Qté/Taux</Text>
              <Text style={styles.colMontant}>
                Montant ({invoiceData.currency})
              </Text>
            </View>
            {debourLines.map((line, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colDesignation}>{line.designation}</Text>
                <Text style={styles.colUnite}>{line.unite || 0}</Text>
                <Text style={styles.colTaux}>{line.taux || 0}</Text>
                <Text style={styles.colMontant}>
                  {formatCurrency(line.montant)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoiceData.totals.totalHT)}{" "}
              {invoiceData.currency}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA (19.25%):</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoiceData.totals.tva)} {invoiceData.currency}
            </Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total TTC:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoiceData.totals.totalTTC)}{" "}
              {invoiceData.currency}
            </Text>
          </View>
          {invoiceData.totals.totalRetenues !== 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Retenues:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoiceData.totals.totalRetenues)}{" "}
                {invoiceData.currency}
              </Text>
            </View>
          )}
          {invoiceData.totals.totalDebours !== 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Débours:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoiceData.totals.totalDebours)}{" "}
                {invoiceData.currency}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total général à payer:</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(invoiceData.totals.totalGeneral)}{" "}
              {invoiceData.currency}
            </Text>
          </View>
        </View>

        {/* Payment Method */}
        <Text style={styles.sectionTitle}>
          Mode de paiement: {invoiceData.payment_method}
        </Text>

        {/* Bank Details */}
        <View style={styles.bankDetails}>
          <Text style={styles.bankTitle}>Détails bancaires</Text>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Banque:</Text>
            <Text style={styles.bankValue}>{BANK_DETAILS.bank}</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>IBAN:</Text>
            <Text style={styles.bankValue}>{BANK_DETAILS.iban}</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>RCCM:</Text>
            <Text style={styles.bankValue}>{BANK_DETAILS.rccm}</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>NIU:</Text>
            <Text style={styles.bankValue}>{BANK_DETAILS.nui}</Text>
          </View>
          <View style={styles.bankRow}>
            <Text style={styles.bankLabel}>Résidence fiscale:</Text>
            <Text style={styles.bankValue}>{BANK_DETAILS.residenceFiscal}</Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Signature EXCI-MAA</Text>
            <Text style={styles.signatureText}>
              {invoiceData.signature_company}
            </Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Signature Client</Text>
            <Text style={styles.signatureText}>
              {invoiceData.signature_client}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};
