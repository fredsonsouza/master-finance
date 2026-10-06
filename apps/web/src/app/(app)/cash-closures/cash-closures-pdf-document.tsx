import type { CashClosure } from '@/http/cash-closures'
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

export interface CashClosuresPdfFilters {
  unitName?: string
  statusLabel?: string
  startDate?: string
  endDate?: string
  search?: string
}

export interface CashClosuresPdfDocumentProps {
  closures: CashClosure[]
  totalValue: number
  filters: CashClosuresPdfFilters
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
    borderBottomColor: '#0284c7', // Primary brand color
    paddingBottom: 10,
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 150,
    height: 40,
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
    marginBottom: 10,
    gap: 10,
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
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#f8fafc',
  },
  // Columns width
  colDate: { width: '11%' },
  colCollab: { width: '21%' },
  colUnit: { width: '16%' },
  colStatus: { width: '12%' },
  colObs: { width: '26%' },
  colValue: { width: '14%', textAlign: 'right' },
  // Status badges
  badgeClosed: {
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
  badgeOpen: {
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
  textCell: {
    fontSize: 8,
    color: '#334155',
  },
  textValue: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  textObs: {
    fontSize: 7.5,
    color: '#64748b',
  },
  emptyState: {
    padding: 18,
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 8.5,
  },
  // Summary section
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
  },
  summaryCount: {
    fontSize: 8.5,
    color: '#475569',
  },
  summaryTotalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryTotalLabel: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  summaryTotalValue: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#047857', // Forest green
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

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val)
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  } catch {
    return dateStr
  }
}

export function CashClosuresPdfDocument({
  closures,
  totalValue,
  filters,
  logoUrl,
  issuedAt,
}: CashClosuresPdfDocumentProps) {
  const periodText =
    filters.startDate && filters.endDate
      ? `${formatDate(filters.startDate)} até ${formatDate(filters.endDate)}`
      : filters.startDate
        ? `A partir de ${formatDate(filters.startDate)}`
        : filters.endDate
          ? `Até ${formatDate(filters.endDate)}`
          : 'Todo o Histórico'

  return (
    <Document
      title="Relatório de Fechamentos de Caixa"
      author="Master Admin"
      subject="Fechamentos de Caixa"
      creator="Master Admin"
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Header (Fixo em todas as páginas) */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerLeft}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <View style={styles.headerTitles}>
              <Text style={styles.mainTitle}>
                Relatório de Fechamentos de Caixa
              </Text>
              <Text style={styles.subTitle}>
                Controle financeiro e conferência de caixa por unidade
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
            <Text style={styles.filterLabel}>Período:</Text>
            <Text style={styles.filterValue}>{periodText}</Text>
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Unidade:</Text>
            <Text style={styles.filterValue}>
              {filters.unitName || 'Todas as Unidades'}
            </Text>
          </View>
          <View style={styles.filterItem}>
            <Text style={styles.filterLabel}>Status:</Text>
            <Text style={styles.filterValue}>
              {filters.statusLabel || 'Todos os Status'}
            </Text>
          </View>
          {filters.search ? (
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Busca:</Text>
              <Text style={styles.filterValue}>"{filters.search}"</Text>
            </View>
          ) : null}
        </View>

        {/* Table */}
        <View style={styles.table}>
          {/* Table Header (repete caso o documento quebre página) */}
          <View style={styles.tableHeader} fixed>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>
              Data do Caixa
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colCollab]}>
              Colaborador
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colUnit]}>
              Unidade
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colStatus]}>
              Status
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colObs]}>
              Observação
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colValue]}>Valor</Text>
          </View>

          {/* Table Rows */}
          {closures.length === 0 ? (
            <Text style={styles.emptyState}>
              Nenhum fechamento de caixa encontrado com os filtros selecionados.
            </Text>
          ) : (
            closures.map((c, index) => {
              const isEven = index % 2 === 0
              return (
                <View
                  key={c.id}
                  style={[
                    styles.tableRow,
                    isEven ? styles.tableRowEven : styles.tableRowOdd,
                  ]}
                  wrap={false}
                >
                  <Text style={[styles.textCell, styles.colDate]}>
                    {formatDate(c.cashDate)}
                  </Text>
                  <Text style={[styles.textCell, styles.colCollab]}>
                    {c.user?.name || '-'}
                  </Text>
                  <Text style={[styles.textCell, styles.colUnit]}>
                    {c.unit?.name || '-'}
                  </Text>
                  <View style={styles.colStatus}>
                    <Text
                      style={
                        c.status === 'CLOSED'
                          ? styles.badgeClosed
                          : styles.badgeOpen
                      }
                    >
                      {c.status === 'CLOSED' ? 'FECHADO' : 'EM ABERTO'}
                    </Text>
                  </View>
                  <Text style={[styles.textObs, styles.colObs]}>
                    {c.observation || '-'}
                  </Text>
                  <Text style={[styles.textValue, styles.colValue]}>
                    {formatCurrency(c.value)}
                  </Text>
                </View>
              )
            })
          )}
        </View>

        {/* Consolidated Summary */}
        <View style={styles.summaryContainer} wrap={false}>
          <Text style={styles.summaryCount}>
            Total de registros:{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {closures.length}
            </Text>
          </Text>
          <View style={styles.summaryTotalBox}>
            <Text style={styles.summaryTotalLabel}>
              Valor Total no Período:
            </Text>
            <Text style={styles.summaryTotalValue}>
              {formatCurrency(totalValue)}
            </Text>
          </View>
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
