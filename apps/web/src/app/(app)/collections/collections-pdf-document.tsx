import type { Collection } from '@/http/collections'
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

export interface CollectionsPdfFilters {
  unitName?: string
  collectorName?: string
  search?: string
}

export interface CollectionsPdfDocumentProps {
  collections: Collection[]
  filters: CollectionsPdfFilters
  logoUrl?: string
  issuedAt?: string
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 28,
    paddingTop: 24,
    paddingBottom: 32,
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
    borderBottomColor: '#0284c7',
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
    fontSize: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: 'flex-start',
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#f8fafc',
  },
  // Columns width (sum = 100%)
  colDate: { width: '9%', paddingRight: 4 },
  colCode: { width: '9%', paddingRight: 4 },
  colPatient: { width: '17%', paddingRight: 6 },
  colUnit: { width: '12%', paddingRight: 6 },
  colCollector: { width: '13%', paddingRight: 6 },
  colExams: { width: '16%', paddingRight: 6 },
  colReason: { width: '14%', paddingRight: 6 },
  colStatus: { width: '10%' },
  // Cell text styles
  textCell: {
    fontSize: 7.5,
    color: '#334155',
  },
  textBold: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  examsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2.5,
  },
  examBadge: {
    backgroundColor: '#f0f9ff',
    color: '#0369a1',
    borderWidth: 0.5,
    borderColor: '#bae6fd',
    borderRadius: 2.5,
    paddingHorizontal: 3.5,
    paddingVertical: 1,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
  },
  textReason: {
    fontSize: 7,
    color: '#475569',
    lineHeight: 1.25,
  },
  statusLine: {
    fontSize: 7,
    color: '#475569',
    marginBottom: 1.5,
  },
  statusLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  emptyState: {
    padding: 18,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8.5,
  },
  // Footer section
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

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  } catch {
    return dateStr
  }
}

export function CollectionsPdfDocument({
  collections,
  filters,
  logoUrl,
  issuedAt,
}: CollectionsPdfDocumentProps) {
  const totalExams = collections.reduce(
    (acc, item) => acc + (item.exams?.length || 0),
    0
  )
  const uniqueUnitsCount = new Set(
    collections.map((item) => item.unit?.id).filter(Boolean)
  ).size
  const uniqueCollectorsCount = new Set(
    collections.map((item) => item.collector?.id).filter(Boolean)
  ).size

  return (
    <Document
      title="Relatório de Recoletas"
      author="Master Admin"
      subject="Solicitações de Recoletas de Exames"
      creator="Master Admin"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header fixo em todas as páginas */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerLeft}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <View style={styles.headerTitles}>
              <Text style={styles.mainTitle}>Relatório de Recoletas</Text>
              <Text style={styles.subTitle}>
                Clínica Masterclin — Controle e Gestão de Recoletas de Exames
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
            <Text style={styles.filterValue}>
              {filters.unitName || 'Todas as Unidades'}
            </Text>
          </View>
          {filters.collectorName && (
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Coletador:</Text>
              <Text style={styles.filterValue}>{filters.collectorName}</Text>
            </View>
          )}
          {filters.search ? (
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Busca:</Text>
              <Text style={styles.filterValue}>"{filters.search}"</Text>
            </View>
          ) : null}
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Registros Exportados:</Text>
            <Text style={styles.filterValue}>{collections.length}</Text>
          </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{collections.length}</Text>
            <Text style={styles.metricLabel}>Total de Recoletas</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricValue, { color: '#0284c7' }]}>
              {totalExams}
            </Text>
            <Text style={styles.metricLabel}>Exames Solicitados</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{uniqueCollectorsCount}</Text>
            <Text style={styles.metricLabel}>Coletadores Envolvidos</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{uniqueUnitsCount}</Text>
            <Text style={styles.metricLabel}>Unidades com Registros</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>
              Data Solic.
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colCode]}>
              Cód. Atend.
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colPatient]}>
              Paciente
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>
              Unidade
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colCollector]}>
              Coletador
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colExams]}>
              Exames
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colReason]}>
              Motivo
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colStatus]}>
              Pend. / Avisado
            </Text>
          </View>

          {collections.length === 0 ? (
            <Text style={styles.emptyState}>
              Nenhuma recoleta encontrada com os filtros selecionados.
            </Text>
          ) : (
            collections.map((item, index) => {
              const isEven = index % 2 === 0
              return (
                <View
                  key={item.id}
                  style={[
                    styles.tableRow,
                    isEven ? styles.tableRowEven : styles.tableRowOdd,
                  ]}
                  wrap={false}
                >
                  <Text style={[styles.textCell, styles.colDate]}>
                    {formatDate(item.requestDate)}
                  </Text>
                  <Text style={[styles.textBold, styles.colCode]}>
                    {item.patientCode || '-'}
                  </Text>
                  <Text style={[styles.textBold, styles.colPatient]}>
                    {item.patientName || '-'}
                  </Text>
                  <Text style={[styles.textCell, styles.colUnit]}>
                    {item.unit?.name || '-'}
                  </Text>
                  <Text style={[styles.textCell, styles.colCollector]}>
                    {item.collector?.name || '-'}
                  </Text>
                  <View style={[styles.examsWrapper, styles.colExams]}>
                    {item.exams && item.exams.length > 0 ? (
                      item.exams.map((exam, idx) => (
                        <Text key={idx} style={styles.examBadge}>
                          {exam}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.textCell}>-</Text>
                    )}
                  </View>
                  <Text style={[styles.textReason, styles.colReason]}>
                    {item.reason || '-'}
                  </Text>
                  <View style={styles.colStatus}>
                    <Text style={styles.statusLine}>
                      <Text style={styles.statusLabel}>P: </Text>
                      {item.pendingBy || '-'}
                    </Text>
                    <Text style={styles.statusLine}>
                      <Text style={styles.statusLabel}>A: </Text>
                      {item.notifiedBy || '-'}
                    </Text>
                  </View>
                </View>
              )
            })
          )}
        </View>

        {/* Footer com Numeração de Página Dinâmica */}
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
