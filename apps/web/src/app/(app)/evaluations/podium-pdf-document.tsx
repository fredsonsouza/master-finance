import type { PodiumItem } from '@/http/get-evaluations'
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')

export interface PodiumPdfDocumentProps {
  podium: PodiumItem[]
  unitName: string
  podiumMonth: string // YYYY-MM
  logoUrl?: string
  issuedAt?: string
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 32,
    paddingTop: 26,
    paddingBottom: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  // Header
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0284c7',
    paddingBottom: 10,
    marginBottom: 10,
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
  // Info Box
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 12,
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    fontSize: 8,
    marginRight: 4,
  },
  infoValue: {
    color: '#0f172a',
    fontSize: 8,
  },
  // Section Title
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0284c7',
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderLeftWidth: 3.5,
    borderLeftColor: '#0284c7',
    marginTop: 4,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  // Podium Cards
  cardContainer: {
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  cardGold: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  cardSilver: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  cardBronze: {
    backgroundColor: '#fff7ed',
    borderWidth: 1.5,
    borderColor: '#fdba74',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 6,
    marginBottom: 6,
  },
  cardTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeGold: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    borderWidth: 0.5,
    borderColor: '#f59e0b',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  badgeSilver: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    borderWidth: 0.5,
    borderColor: '#94a3b8',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  badgeBronze: {
    backgroundColor: '#ffedd5',
    color: '#9a3412',
    borderWidth: 0.5,
    borderColor: '#ea580c',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  sellerTitle: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  awardBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  awardLabel: {
    fontSize: 7.5,
    color: '#64748b',
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
  },
  awardValue: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 8,
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748b',
    marginRight: 4,
  },
  statValueHighlight: {
    fontFamily: 'Helvetica-Bold',
    color: '#059669',
    fontSize: 9,
  },
  statValueNormal: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  statDetails: {
    color: '#64748b',
    marginLeft: 3,
    fontSize: 7.5,
  },
  // Table
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 2,
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0284c7',
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    fontSize: 7.5,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 5,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#f8fafc',
  },
  colPos: { width: '14%', textAlign: 'center' },
  colCollab: { width: '36%' },
  colEvals: { width: '24%' },
  colSat: { width: '13%', textAlign: 'center' },
  colBonus: { width: '13%', textAlign: 'right' },
  // Empty State
  emptyState: {
    padding: 16,
    textAlign: 'center',
    color: '#64748b',
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    fontSize: 8.5,
  },
  // Signature
  signatureSection: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signatureLine: {
    width: 220,
    borderTopWidth: 1.5,
    borderTopColor: '#334155',
    marginBottom: 4,
  },
  signatureName: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  signatureRole: {
    fontSize: 8,
    color: '#475569',
    marginTop: 1,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 32,
    right: 32,
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

const bonusMap: Record<number, string> = {
  1: 'R$ 400,00',
  2: 'R$ 300,00',
  3: 'R$ 200,00',
}

export function PodiumPdfDocument({
  podium,
  unitName,
  podiumMonth,
  logoUrl,
  issuedAt,
}: PodiumPdfDocumentProps) {
  const formattedMonth = dayjs(podiumMonth).format('MMMM [de] YYYY')
  const capitalizedMonth =
    formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1)

  return (
    <Document
      title={`Pódio da Recepção - ${capitalizedMonth}`}
      author="Master Admin"
      subject="Pódio da Recepção e Premiação Oficial"
      creator="Master Admin"
    >
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Header fixo */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerLeft}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <View style={styles.headerTitles}>
              <Text style={styles.mainTitle}>Pódio da Recepção</Text>
              <Text style={styles.subTitle}>
                Destaques do Mês e Premiação Oficial da Unidade
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

        {/* Info Box */}
        <View style={styles.infoBox}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Unidade:</Text>
            <Text style={styles.infoValue}>{unitName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Mês de Referência:</Text>
            <Text style={styles.infoValue}>{capitalizedMonth}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Classificados:</Text>
            <Text style={styles.infoValue}>{podium.length}</Text>
          </View>
        </View>

        {/* Seção 1: Cards do Pódio */}
        <Text style={styles.sectionTitle}>
          Classificação Oficial e Premiação
        </Text>

        {podium.length === 0 ? (
          <Text style={styles.emptyState}>
            Nenhuma avaliação computada para esta unidade no mês selecionado.
          </Text>
        ) : (
          podium.map((item) => {
            let cardStyle = styles.cardBronze
            let badgeStyle = styles.badgeBronze
            let badgeText = '3º LUGAR — BRONZE'

            if (item.position === 1) {
              cardStyle = styles.cardGold
              badgeStyle = styles.badgeGold
              badgeText = '1º LUGAR — OURO'
            } else if (item.position === 2) {
              cardStyle = styles.cardSilver
              badgeStyle = styles.badgeSilver
              badgeText = '2º LUGAR — PRATA'
            }

            const bonus = bonusMap[item.position] || 'R$ 0,00'

            return (
              <View
                key={item.sellerId}
                style={[styles.cardContainer, cardStyle]}
                wrap={false}
              >
                <View style={styles.cardTopRow}>
                  <View style={styles.cardTopLeft}>
                    <Text style={badgeStyle}>{badgeText}</Text>
                    <Text style={styles.sellerTitle}>{item.sellerName}</Text>
                  </View>
                  <View style={styles.awardBox}>
                    <Text style={styles.awardLabel}>Premiação Oficial:</Text>
                    <Text style={styles.awardValue}>{bonus}</Text>
                  </View>
                </View>

                <View style={styles.cardBottomRow}>
                  <View style={styles.statGroup}>
                    <Text style={styles.statLabel}>Nível de Satisfação:</Text>
                    <Text style={styles.statValueHighlight}>
                      {item.satisfactionRate}%
                    </Text>
                  </View>
                  <View style={styles.statGroup}>
                    <Text style={styles.statLabel}>Total de Avaliações:</Text>
                    <Text style={styles.statValueNormal}>
                      {item.totalEvaluations}
                    </Text>
                    <Text style={styles.statDetails}>
                      ({item.excellentCount} ótimas, {item.goodCount} boas)
                    </Text>
                  </View>
                </View>
              </View>
            )
          })
        )}

        {/* Seção 2: Tabela Resumo */}
        <Text style={styles.sectionTitle}>Resumo Geral do Pódio</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colPos]}>Posição</Text>
            <Text style={[styles.tableHeaderCell, styles.colCollab]}>
              Colaborador(a)
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colEvals]}>
              Avaliações
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colSat]}>
              Satisfação
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colBonus]}>
              Premiação
            </Text>
          </View>

          {podium.length === 0 ? (
            <Text style={styles.emptyState}>Sem registros para o período.</Text>
          ) : (
            podium.map((item, index) => {
              const isEven = index % 2 === 0
              return (
                <View
                  key={item.sellerId}
                  style={[
                    styles.tableRow,
                    isEven ? styles.tableRowEven : styles.tableRowOdd,
                  ]}
                  wrap={false}
                >
                  <Text
                    style={[
                      styles.colPos,
                      { fontFamily: 'Helvetica-Bold', color: '#0f172a' },
                    ]}
                  >
                    {item.position}º
                  </Text>
                  <Text
                    style={[
                      styles.colCollab,
                      { fontFamily: 'Helvetica-Bold', color: '#0f172a' },
                    ]}
                  >
                    {item.sellerName}
                  </Text>
                  <Text style={[styles.colEvals, { color: '#475569' }]}>
                    {item.totalEvaluations} ({item.excellentCount} ótimas,{' '}
                    {item.goodCount} boas)
                  </Text>
                  <Text
                    style={[
                      styles.colSat,
                      { fontFamily: 'Helvetica-Bold', color: '#059669' },
                    ]}
                  >
                    {item.satisfactionRate}%
                  </Text>
                  <Text
                    style={[
                      styles.colBonus,
                      { fontFamily: 'Helvetica-Bold', color: '#059669' },
                    ]}
                  >
                    {bonusMap[item.position] || 'R$ 0,00'}
                  </Text>
                </View>
              )
            })
          )}
        </View>

        {/* Assinatura da Gerência */}
        <View style={styles.signatureSection} wrap={false}>
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
