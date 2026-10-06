import type { EvaluationItem, EvaluationMetrics } from '@/http/get-evaluations'
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

export interface EvaluationsPdfDocumentProps {
  evaluations: EvaluationItem[]
  metrics: EvaluationMetrics
  unitName?: string
  sellerName?: string
  period?: string
  logoUrl?: string
  issuedAt?: string
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 28,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  // Header section
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0284c7', // Primary brand blue
    paddingBottom: 10,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  logo: {
    width: 220,
    height: 54,
    objectFit: 'contain',
  },
  headerTitles: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 0.3,
  },
  subTitle: {
    fontSize: 8,
    color: '#64748b',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  issuedDate: {
    fontSize: 8,
    color: '#64748b',
  },
  systemTag: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0284c7',
    marginTop: 3,
  },
  // Filters bar
  filtersBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 8,
    gap: 12,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    fontSize: 7.5,
    marginRight: 3,
  },
  filterValue: {
    color: '#0f172a',
    fontSize: 7.5,
  },
  // Metrics grid
  metricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  metricLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  // Table
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    fontSize: 7.5,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 4.5,
    paddingHorizontal: 6,
    alignItems: 'flex-start',
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#f8fafc',
  },
  // Column widths
  colDate: { width: '12%' },
  colRating: { width: '10%' },
  colClient: { width: '18%' },
  colSeller: { width: '22%' },
  colComment: { width: '38%' },
  // Rating badges
  badgeExcellent: {
    backgroundColor: '#ecfdf5',
    color: '#047857',
    borderWidth: 0.5,
    borderColor: '#a7f3d0',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    alignSelf: 'flex-start',
  },
  badgeGood: {
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    borderWidth: 0.5,
    borderColor: '#bae6fd',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    alignSelf: 'flex-start',
  },
  badgeRegular: {
    backgroundColor: '#fffbeb',
    color: '#b45309',
    borderWidth: 0.5,
    borderColor: '#fde68a',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    alignSelf: 'flex-start',
  },
  badgeBad: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    borderWidth: 0.5,
    borderColor: '#fecaca',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    alignSelf: 'flex-start',
  },
  // Cell text styles
  textCell: {
    fontSize: 8,
    color: '#334155',
  },
  textClient: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  sellerContainer: {
    flexDirection: 'column',
  },
  sellerName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  sellerUnit: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 1,
  },
  textComment: {
    fontSize: 7.5,
    color: '#334155',
    lineHeight: 1.25,
  },
  textCommentEmpty: {
    fontSize: 7.5,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  emptyState: {
    padding: 18,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8.5,
  },
  // Signature section
  signatureContainer: {
    marginTop: 16,
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureLine: {
    width: 200,
    borderTopWidth: 1,
    borderTopColor: '#94a3b8',
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  signatureRole: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 1,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 28,
    right: 28,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
    paddingTop: 5,
    fontSize: 7,
    color: '#94a3b8',
  },
})

function formatDateTime(dateStr: string) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return dateStr
  }
}

export function EvaluationsPdfDocument({
  evaluations,
  metrics,
  unitName = 'Todas as Unidades',
  sellerName = 'Todos os Atendentes',
  period = 'Todo o Histórico',
  logoUrl,
  issuedAt,
}: EvaluationsPdfDocumentProps) {
  return (
    <Document
      title="Relatório de Avaliações"
      author="Master Admin"
      subject="Avaliações de Atendimento"
      creator="Master Admin"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header fixo em todas as páginas */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerLeft}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <View style={styles.headerTitles}>
              <Text style={styles.mainTitle}>Relatório de Avaliações</Text>
              <Text style={styles.subTitle}>
                Clínica Masterclin — Gestão e Controle de Atendimento
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.issuedDate}>
              Emissão: {issuedAt || new Date().toLocaleString('pt-BR')}
            </Text>
            <Text style={styles.systemTag}>MASTER ADMIN</Text>
          </View>
        </View>

        {/* Filters Summary Bar */}
        <View style={styles.filtersBar}>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Unidade:</Text>
            <Text style={styles.filterValue}>{unitName}</Text>
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Atendente:</Text>
            <Text style={styles.filterValue}>{sellerName}</Text>
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Período:</Text>
            <Text style={styles.filterValue}>{period}</Text>
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Registros:</Text>
            <Text style={styles.filterValue}>{evaluations.length}</Text>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{metrics.total}</Text>
            <Text style={styles.metricLabel}>Total de Avaliações</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: '#059669' }]}>
              {metrics.satisfactionRate}%
            </Text>
            <Text style={styles.metricLabel}>Taxa de Satisfação</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: '#0284c7' }]}>
              {metrics.excellentCount + metrics.goodCount}
            </Text>
            <Text style={styles.metricLabel}>Ótimo / Bom</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: '#dc2626' }]}>
              {metrics.regularCount + metrics.badCount}
            </Text>
            <Text style={styles.metricLabel}>Regular / Ruim</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>
              Data / Hora
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colRating]}>Nota</Text>
            <Text style={[styles.tableHeaderCell, styles.colClient]}>
              Cliente
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colSeller]}>
              Atendente / Unidade
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colComment]}>
              Comentário
            </Text>
          </View>

          {evaluations.length === 0 ? (
            <Text style={styles.emptyState}>
              Nenhuma avaliação encontrada com os filtros selecionados.
            </Text>
          ) : (
            evaluations.map((ev, index) => {
              const isEven = index % 2 === 0
              const comment = ev.observation || ev.presetComment

              let badgeStyle = styles.badgeRegular
              let badgeText = 'REGULAR'

              if (ev.rating === 'EXCELLENT') {
                badgeStyle = styles.badgeExcellent
                badgeText = 'ÓTIMO'
              } else if (ev.rating === 'GOOD') {
                badgeStyle = styles.badgeGood
                badgeText = 'BOM'
              } else if (ev.rating === 'BAD') {
                badgeStyle = styles.badgeBad
                badgeText = 'RUIM'
              }

              return (
                <View
                  key={ev.id}
                  style={[
                    styles.tableRow,
                    isEven ? styles.tableRowEven : styles.tableRowOdd,
                  ]}
                  wrap={false}
                >
                  <Text style={[styles.textCell, styles.colDate]}>
                    {formatDateTime(ev.createdAt)}
                  </Text>
                  <View style={styles.colRating}>
                    <Text style={badgeStyle}>{badgeText}</Text>
                  </View>
                  <Text style={[styles.textClient, styles.colClient]}>
                    {ev.clientName || 'Anônimo'}
                  </Text>
                  <View style={[styles.sellerContainer, styles.colSeller]}>
                    <Text style={styles.sellerName}>
                      {ev.seller?.name || '-'}
                    </Text>
                    {ev.unit?.name && (
                      <Text style={styles.sellerUnit}>{ev.unit.name}</Text>
                    )}
                  </View>
                  <View style={styles.colComment}>
                    {comment ? (
                      <Text style={styles.textComment}>{comment}</Text>
                    ) : (
                      <Text style={styles.textCommentEmpty}>
                        Sem comentário registrado
                      </Text>
                    )}
                  </View>
                </View>
              )
            })
          )}
        </View>

        {/* Manager Signature */}
        <View style={styles.signatureContainer} wrap={false}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>Lidaiana Alves</Text>
          <Text style={styles.signatureRole}>
            Gerência — Clínica Masterclin
          </Text>
        </View>

        {/* Dynamic Footer */}
        <View style={styles.footer} fixed>
          <Text>Master Admin — Sistema de Gestão Financeira Clínico</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  )
}
