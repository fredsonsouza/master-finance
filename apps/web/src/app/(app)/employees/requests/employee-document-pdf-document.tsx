import type { EmployeeRequestItem } from '@/http/employees'
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

const TYPE_LABELS: Record<EmployeeRequestItem['type'], string> = {
  DECLARATION: 'DECLARAÇÃO INSTITUCIONAL',
  WARNING: 'NOTIFICAÇÃO / ADVERTÊNCIA DISCIPLINAR',
  RECEIPT: 'RECIBO / COMPROVANTE DE ENTREGA',
}

const TYPE_ACCENT_COLOR: Record<EmployeeRequestItem['type'], string> = {
  DECLARATION: '#0284c7',
  WARNING: '#b91c1c',
  RECEIPT: '#047857',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 38,
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#0284c7',
    paddingBottom: 12,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 115,
    height: 38,
    objectFit: 'contain',
  },
  companyInfo: {
    flexDirection: 'column',
  },
  companyName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  companyDetail: {
    fontSize: 7.5,
    color: '#475569',
    marginTop: 1.5,
  },
  protocolBadge: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'flex-end',
  },
  protocolLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  protocolValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0284c7',
    marginTop: 2,
  },
  titleBanner: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#0284c7',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  docCategoryTag: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0284c7',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  docTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  employeeCard: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    backgroundColor: '#f8fafc',
    padding: 10,
    marginBottom: 16,
  },
  employeeCardTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase',
    borderBottomWidth: 0.8,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
    marginBottom: 6,
  },
  employeeGridRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  employeeCol: {
    flex: 1,
    paddingRight: 8,
  },
  fieldLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 8.8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginTop: 1,
  },
  bodyBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 16,
    minHeight: 220,
    backgroundColor: '#ffffff',
    marginBottom: 16,
  },
  bodyParagraph: {
    fontSize: 10,
    lineHeight: 1.65,
    color: '#1e293b',
    textAlign: 'justify',
    marginBottom: 10,
  },
  highlightBox: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    padding: 10,
    marginTop: 8,
    marginBottom: 10,
  },
  highlightRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  highlightLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
  },
  highlightValue: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  dateLocationText: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    textAlign: 'right',
    marginTop: 14,
  },
  signaturesSection: {
    marginTop: 12,
    marginBottom: 14,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
    marginTop: 26,
  },
  signatureBlock: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 5,
    alignItems: 'center',
  },
  signatureName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  signatureSub: {
    fontSize: 7,
    color: '#475569',
    textAlign: 'center',
    marginTop: 1.5,
  },
  witnessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 24,
    marginTop: 22,
  },
  electronicSealBox: {
    borderWidth: 1.2,
    borderColor: '#0284c7',
    backgroundColor: '#f0f9ff',
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qrCodeImage: {
    width: 68,
    height: 68,
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    padding: 2,
  },
  sealInfoContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  sealTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0369a1',
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  sealText: {
    fontSize: 7.2,
    color: '#1e293b',
    lineHeight: 1.35,
    marginBottom: 2,
  },
  sealCodeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 3,
  },
  sealBadge: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    backgroundColor: '#e0f2fe',
    paddingVertical: 2,
    paddingHorizontal: 5,
    borderRadius: 2,
  },
  sealHash: {
    fontSize: 6.2,
    fontFamily: 'Courier',
    color: '#475569',
    marginTop: 3,
  },
})

function formatDatePtBr(value?: string | null): string {
  if (!value) return new Date().toLocaleDateString('pt-BR')
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('pt-BR')
}

function formatDateTimePtBr(value?: string | null): string {
  if (!value) return new Date().toLocaleString('pt-BR')
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatCurrencyBrl(value?: number | null): string {
  if (value === undefined || value === null) return ''
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export interface EmployeeDocumentPdfProps {
  request: EmployeeRequestItem
  logoUrl?: string
  qrCodeDataUrl?: string
  verificationUrl?: string
}

export function EmployeeDocumentPdfDocument({
  request,
  logoUrl,
  qrCodeDataUrl,
  verificationUrl,
}: EmployeeDocumentPdfProps) {
  const accentColor = TYPE_ACCENT_COLOR[request.type] || '#0284c7'
  const payload = (request.templateData || {}) as Record<string, unknown>

  const documentParagraphs = (request.description || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)

  return (
    <Document title={`${request.title} - ${request.employee.fullName}`}>
      <Page size="A4" style={styles.page}>
        <View>
          {/* CABEÇALHO INSTITUCIONAL */}
          <View
            style={[styles.headerContainer, { borderBottomColor: accentColor }]}
          >
            <View style={styles.headerLeft}>
              {logoUrl ? <Image src={logoUrl} style={styles.logo} /> : null}
              <View style={styles.companyInfo}>
                <Text style={styles.companyName}>
                  GERENCIACLIN LTDA — MASTERCLIN
                </Text>
                <Text style={styles.companyDetail}>
                  CNPJ: 35.676.026/0001-23 • R. Getúlio Vargas, 2117, Centro —
                  São Francisco do Sul/SC
                </Text>
                <Text style={styles.companyDetail}>
                  Departamento de Recursos Humanos & Gestão de Pessoas
                </Text>
              </View>
            </View>

            <View style={styles.protocolBadge}>
              <Text style={styles.protocolLabel}>Código de Autenticidade</Text>
              <Text style={[styles.protocolValue, { color: accentColor }]}>
                {request.verificationCode || 'RASCUNHO'}
              </Text>
            </View>
          </View>

          {/* TÍTULO DO DOCUMENTO */}
          <View style={[styles.titleBanner, { borderLeftColor: accentColor }]}>
            <Text style={[styles.docCategoryTag, { color: accentColor }]}>
              {TYPE_LABELS[request.type]}
            </Text>
            <Text style={styles.docTitle}>{request.title}</Text>
          </View>

          {/* IDENTIFICAÇÃO DO COLABORADOR */}
          <View style={styles.employeeCard}>
            <Text style={styles.employeeCardTitle}>
              Identificação do Colaborador
            </Text>
            <View style={styles.employeeGridRow}>
              <View style={[styles.employeeCol, { flex: 2.2 }]}>
                <Text style={styles.fieldLabel}>Nome Completo</Text>
                <Text style={styles.fieldValue}>
                  {request.employee.fullName}
                </Text>
              </View>
              <View style={[styles.employeeCol, { flex: 1.2 }]}>
                <Text style={styles.fieldLabel}>Matrícula</Text>
                <Text style={[styles.fieldValue, { color: '#0284c7' }]}>
                  {request.employee.registrationNumber}
                </Text>
              </View>
              <View style={[styles.employeeCol, { flex: 1.2 }]}>
                <Text style={styles.fieldLabel}>CPF</Text>
                <Text style={styles.fieldValue}>{request.employee.cpf}</Text>
              </View>
            </View>
            <View style={[styles.employeeGridRow, { marginBottom: 0 }]}>
              <View style={[styles.employeeCol, { flex: 2.2 }]}>
                <Text style={styles.fieldLabel}>Cargo / Função</Text>
                <Text style={styles.fieldValue}>
                  {request.employee.roleTitle}
                </Text>
              </View>
              <View style={[styles.employeeCol, { flex: 1.2 }]}>
                <Text style={styles.fieldLabel}>Empregador</Text>
                <Text style={styles.fieldValue}>GERENCIACLIN LTDA</Text>
              </View>
              <View style={[styles.employeeCol, { flex: 1.2 }]}>
                <Text style={styles.fieldLabel}>Data de Emissão</Text>
                <Text style={styles.fieldValue}>
                  {formatDatePtBr(request.signedAt || request.createdAt)}
                </Text>
              </View>
            </View>
          </View>

          {/* CORPO DO DOCUMENTO */}
          <View style={styles.bodyBox}>
            {request.type === 'WARNING' &&
              (Boolean(payload.occurrenceDate) ||
                Boolean(payload.reason) ||
                Boolean(payload.cltArticle)) && (
                <View style={styles.highlightBox}>
                  {payload.occurrenceDate ? (
                    <View style={styles.highlightRow}>
                      <Text style={styles.highlightLabel}>
                        Data da Ocorrência:
                      </Text>
                      <Text style={styles.highlightValue}>
                        {String(payload.occurrenceDate)}
                      </Text>
                    </View>
                  ) : null}
                  {payload.reason ? (
                    <View style={styles.highlightRow}>
                      <Text style={styles.highlightLabel}>
                        Motivo / Enquadramento:
                      </Text>
                      <Text style={styles.highlightValue}>
                        {String(payload.reason)}
                      </Text>
                    </View>
                  ) : null}
                  {payload.cltArticle ? (
                    <View style={[styles.highlightRow, { marginBottom: 0 }]}>
                      <Text style={styles.highlightLabel}>
                        Fundamentação Legal:
                      </Text>
                      <Text style={styles.highlightValue}>
                        {String(payload.cltArticle)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

            {request.type === 'RECEIPT' &&
              (request.amount !== null || Boolean(payload.referenceItem)) && (
                <View style={styles.highlightBox}>
                  {request.amount !== null ? (
                    <View style={styles.highlightRow}>
                      <Text style={styles.highlightLabel}>
                        Valor / Quantia:
                      </Text>
                      <Text style={styles.highlightValue}>
                        {formatCurrencyBrl(request.amount)}
                      </Text>
                    </View>
                  ) : null}
                  {payload.referenceItem ? (
                    <View style={[styles.highlightRow, { marginBottom: 0 }]}>
                      <Text style={styles.highlightLabel}>
                        Referente a / Item Entregue:
                      </Text>
                      <Text style={styles.highlightValue}>
                        {String(payload.referenceItem)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}

            {documentParagraphs.length > 0 ? (
              documentParagraphs.map((paragraph, idx) => (
                <Text key={idx} style={styles.bodyParagraph}>
                  {paragraph}
                </Text>
              ))
            ) : (
              <Text style={styles.bodyParagraph}>
                Declaramos para os devidos fins que {request.employee.fullName},
                inscrito(a) no CPF sob o nº {request.employee.cpf} e
                registrado(a) sob a matrícula{' '}
                {request.employee.registrationNumber}, exerce a função de{' '}
                {request.employee.roleTitle} junto à empresa GERENCIACLIN LTDA
                (CNPJ 35.676.026/0001-23).
              </Text>
            )}

            <Text style={styles.dateLocationText}>
              São Francisco do Sul/SC,{' '}
              {formatDatePtBr(request.signedAt || request.createdAt)}.
            </Text>
          </View>

          {/* QUADRO DE ASSINATURAS */}
          <View style={styles.signaturesSection}>
            <View style={styles.signatureRow}>
              <View style={styles.signatureBlock}>
                <Text style={styles.signatureName}>GERENCIACLIN LTDA</Text>
                <Text style={styles.signatureSub}>
                  {request.issuedBy?.name
                    ? `Emitido por: ${request.issuedBy.name} (RH)`
                    : 'Departamento de Recursos Humanos'}
                </Text>
              </View>
              <View style={styles.signatureBlock}>
                <Text style={styles.signatureName}>
                  {request.employee.fullName}
                </Text>
                <Text style={styles.signatureSub}>
                  Colaborador(a) • Matrícula{' '}
                  {request.employee.registrationNumber} • CPF{' '}
                  {request.employee.cpf}
                </Text>
              </View>
            </View>

            {request.type === 'WARNING' && (
              <View style={styles.witnessRow}>
                <View style={styles.signatureBlock}>
                  <Text style={styles.signatureName}>1ª Testemunha</Text>
                  <Text style={styles.signatureSub}>Nome / CPF</Text>
                </View>
                <View style={styles.signatureBlock}>
                  <Text style={styles.signatureName}>2ª Testemunha</Text>
                  <Text style={styles.signatureSub}>Nome / CPF</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* SELO DE ASSINATURA ELETRÔNICA E VALIDAÇÃO VIA QR CODE */}
        <View style={styles.electronicSealBox}>
          {qrCodeDataUrl ? (
            <Image src={qrCodeDataUrl} style={styles.qrCodeImage} />
          ) : null}
          <View style={styles.sealInfoContainer}>
            <Text style={styles.sealTitle}>
              Selo de Assinatura Eletrônica & Autenticidade Documental
            </Text>
            <Text style={styles.sealText}>
              Este documento foi emitido e assinado eletronicamente pelo Sistema
              Integrado de Recursos Humanos da Masterclin. A autenticidade pode
              ser conferida a qualquer momento escaneando o QR Code ao lado ou
              acessando:
            </Text>
            {verificationUrl ? (
              <Text
                style={[
                  styles.sealText,
                  { fontFamily: 'Helvetica-Bold', color: '#0369a1' },
                ]}
              >
                {verificationUrl}
              </Text>
            ) : null}
            <View style={styles.sealCodeRow}>
              <Text style={styles.sealBadge}>
                Código: {request.verificationCode || 'PENDENTE'}
              </Text>
              <Text style={styles.sealBadge}>
                Assinado em:{' '}
                {formatDateTimePtBr(request.signedAt || request.updatedAt)}
              </Text>
              {request.issuedBy?.name ? (
                <Text style={styles.sealBadge}>
                  Emissor: {request.issuedBy.name}
                </Text>
              ) : null}
            </View>
            {request.contentHash ? (
              <Text style={styles.sealHash}>
                Hash SHA-256: {request.contentHash}
              </Text>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  )
}
