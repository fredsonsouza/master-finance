import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

export interface RegulationPdfDocumentProps {
  logoUrl?: string
}

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 36,
    paddingTop: 28,
    paddingBottom: 32,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    lineHeight: 1.35,
  },
  // Header
  header: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#0284c7',
    paddingBottom: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
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
    fontSize: 12.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  subTitle: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#0284c7',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  systemTag: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0284c7',
  },
  // Sections
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0284c7',
    backgroundColor: '#f1f5f9',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0284c7',
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  paragraph: {
    textAlign: 'justify',
    marginBottom: 4,
    color: '#334155',
  },
  bulletList: {
    marginBottom: 4,
    paddingLeft: 6,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 2.5,
  },
  bulletDot: {
    width: 10,
    fontSize: 8,
    color: '#0284c7',
  },
  bulletText: {
    flex: 1,
    textAlign: 'justify',
    color: '#334155',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  italicNotice: {
    fontSize: 7.5,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 2,
    marginBottom: 4,
  },
  // Table
  tableBonus: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 3,
    marginVertical: 5,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#0284c7',
    paddingVertical: 4,
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
    paddingVertical: 4,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  tableRowEven: {
    backgroundColor: '#ffffff',
  },
  tableRowOdd: {
    backgroundColor: '#f8fafc',
  },
  colBonusPos: { width: '34%' },
  colBonusDesc: { width: '42%' },
  colBonusVal: { width: '24%', textAlign: 'right' },
  // Termo Box
  termoBox: {
    borderWidth: 1.5,
    borderColor: '#0284c7',
    borderRadius: 5,
    padding: 8,
    marginTop: 10,
    backgroundColor: '#fafafa',
  },
  termoTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#0284c7',
    textAlign: 'center',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  fieldsContainer: {
    marginTop: 6,
    gap: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 7.5,
  },
  fieldRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7.5,
  },
  fieldLabel: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  fieldLine: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#64748b',
    flex: 1,
    marginLeft: 4,
    height: 10,
  },
  fieldShortLine: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#64748b',
    width: 140,
    marginLeft: 4,
    height: 10,
  },
  // Signatures
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    paddingHorizontal: 16,
  },
  signatureBox: {
    width: '44%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
    paddingTop: 4,
    fontSize: 6.5,
    color: '#94a3b8',
  },
})

export function RegulationPdfDocument({ logoUrl }: RegulationPdfDocumentProps) {
  return (
    <Document
      title="Regulamento do Programa de Avaliação de Atendimento"
      author="Master Admin"
      subject="Regulamento Oficial do Programa de Avaliação de Atendimento"
      creator="Master Admin"
    >
      <Page size="A4" orientation="portrait" style={styles.page}>
        {/* Header fixo */}
        <View style={styles.header} fixed>
          <View style={styles.headerLeft}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <View style={styles.headerTitles}>
              <Text style={styles.mainTitle}>
                Regulamento do Programa de Avaliação
              </Text>
              <Text style={styles.subTitle}>
                Diretrizes de Atendimento, Ética, Apuração e Premiação
              </Text>
            </View>
          </View>
          <Text style={styles.systemTag}>MASTER ADMIN</Text>
        </View>

        {/* 1. OBJETIVO DO PROGRAMA */}
        <Text style={styles.sectionTitle}>1. Objetivo do Programa</Text>
        <Text style={styles.paragraph}>
          O presente regulamento estabelece as diretrizes institucionais, normas
          éticas e critérios de engajamento do{' '}
          <Text style={styles.bold}>
            Programa de Avaliação de Atendimento da Clínica Masterclin
          </Text>
          . O programa tem como objetivo mensurar a satisfação dos nossos
          clientes/pacientes, valorizar o bom atendimento e promover a melhoria
          contínua da experiência de recepção nas unidades.
        </Text>

        {/* 2. PARTICIPAÇÃO E CONDUTA ÉTICA */}
        <Text style={styles.sectionTitle}>2. Participação e Conduta Ética</Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>Espontaneidade Obrigatória:</Text> Cada
              avaliação deve refletir o feedback espontâneo e legítimo do
              cliente/paciente que foi efetivamente atendido na unidade.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>Vedação de Autoavaliação:</Text> É
              estritamente proibido ao colaborador realizar autoavaliações,
              solicitar que colegas, familiares ou amigos simulem atendimentos
              fictícios para gerar avaliações positivas.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>Proibição de Coação:</Text> É vedado
              induzir, coagir ou direcionar o cliente a atribuir notas
              específicas durante o processo de coleta de opinião.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              A participação no programa não gera direito adquirido à premiação,
              sendo a premiação condicionada ao cumprimento das regras deste
              Regulamento e à efetiva apuração dos resultados do respectivo
              período.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              A empresa poderá, a qualquer momento, mediante comunicação
              interna, alterar, suspender, modificar ou encerrar o programa,
              inclusive seus critérios, valores e condições de participação,
              conforme necessidade administrativa ou operacional.
            </Text>
          </View>
        </View>

        {/* 3. USO DOS LINKS E QR CODES */}
        <Text style={styles.sectionTitle}>
          3. Uso dos Links e QR Codes Individualizados
        </Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>Caráter Pessoal e Intransferível:</Text>{' '}
              O QR Code e o link de avaliação fornecidos são de uso exclusivo e
              intransferível de cada recepcionista/atendente.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>Exposição Autorizada:</Text> O QR Code
              deve permanecer visível apenas no guichê de atendimento do próprio
              colaborador responsável.
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>Compartilhamento Inadequado:</Text> É
              proibido utilizar o QR Code ou link próprio para coletar
              avaliações decorrentes do atendimento prestado por outro colega de
              trabalho.
            </Text>
          </View>
        </View>

        {/* 4. PENALIDADES E SANÇÕES DISCIPLINARES */}
        <Text style={styles.sectionTitle}>
          4. Penalidades e Sanções Disciplinares
        </Text>
        <Text style={styles.paragraph}>
          A violação deste Regulamento poderá resultar na perda da premiação e
          na aplicação das medidas disciplinares cabíveis, de acordo com a
          natureza, gravidade, consequências, circunstâncias e eventual
          reincidência da conduta, observada a legislação aplicável:
        </Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>a)</Text> Orientação formal ou
              advertência, quando cabível;
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>b)</Text> Exclusão do Programa e perda
              do direito à premiação do período apurado;
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>c)</Text> Outras medidas administrativas
              e disciplinares legalmente cabíveis.
            </Text>
          </View>
        </View>
        <Text style={styles.italicNotice}>
          Parágrafo único: A existência deste Programa não limita o poder
          diretivo e disciplinar da empresa nem impede a aplicação das medidas
          previstas em outros regulamentos internos ou na legislação
          trabalhista.
        </Text>

        {/* 5. PÓDIO DA RECEPÇÃO E PREMIAÇÃO */}
        <Text style={styles.sectionTitle}>
          5. Pódio da Recepção e Critérios de Premiação
        </Text>
        <Text style={styles.paragraph}>
          O reconhecimento do desempenho da equipe será apurado mensalmente e
          aplicado individualmente para cada unidade da Masterclin, não havendo
          ranking geral entre unidades distintas. Somente serão consideradas
          avaliações consideradas válidas após apuração da auditoria interna.
        </Text>

        {/* Tabela de Bonificação */}
        <View style={styles.tableBonus} wrap={false}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colBonusPos]}>
              Posição do Pódio
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colBonusDesc]}>
              Reconhecimento Oficial
            </Text>
            <Text style={[styles.tableHeaderCell, styles.colBonusVal]}>
              Premiação (R$)
            </Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={[styles.colBonusPos, styles.bold]}>
              1º Lugar (Ouro)
            </Text>
            <Text style={styles.colBonusDesc}>
              Atendente Destaque #1 da Unidade
            </Text>
            <Text
              style={[styles.colBonusVal, styles.bold, { color: '#059669' }]}
            >
              R$ 400,00
            </Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowOdd]}>
            <Text style={[styles.colBonusPos, styles.bold]}>
              2º Lugar (Prata)
            </Text>
            <Text style={styles.colBonusDesc}>
              Atendente Destaque #2 da Unidade
            </Text>
            <Text
              style={[styles.colBonusVal, styles.bold, { color: '#059669' }]}
            >
              R$ 300,00
            </Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowEven]}>
            <Text style={[styles.colBonusPos, styles.bold]}>
              3º Lugar (Bronze)
            </Text>
            <Text style={styles.colBonusDesc}>
              Atendente Destaque #3 da Unidade
            </Text>
            <Text
              style={[styles.colBonusVal, styles.bold, { color: '#059669' }]}
            >
              R$ 200,00
            </Text>
          </View>
        </View>

        <Text style={styles.paragraph}>
          A eventual premiação está condicionada ao cumprimento integral deste
          Regulamento e aos resultados validados pela empresa. O recebimento em
          determinado período não assegura recebimento em períodos futuros. A
          Administração poderá rever valores, critérios ou deixar de conceder
          premiações em caso de inconsistências ou ausência de colaboradores
          elegíveis.
        </Text>

        {/* 6. CRITÉRIOS DE DESEMPATE */}
        <Text style={styles.sectionTitle}>6. Critérios de Desempate</Text>
        <Text style={styles.paragraph}>
          Em caso de empate na pontuação mensal, serão observados
          sucessivamente:
        </Text>
        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>a)</Text> Maior quantidade total de
              avaliações válidas;
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>b)</Text> Maior percentual de avaliações
              ótimas e boas (satisfação);
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>c)</Text> Menor índice de avaliações
              desconsideradas ou canceladas por inconsistência;
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>
              <Text style={styles.bold}>d)</Text> Persistindo o empate, critério
              objetivo adicional definido pela Gerência Geral.
            </Text>
          </View>
        </View>

        {/* 7. CONFIDENCIALIDADE E PROTEÇÃO DE INFORMAÇÕES */}
        <Text style={styles.sectionTitle}>
          7. Confidencialidade e Proteção de Informações
        </Text>
        <Text style={styles.paragraph}>
          Os colaboradores que tiverem acesso a dados decorrentes do Programa
          deverão manter sigilo absoluto sobre informações de pacientes e
          métricas internas da empresa. É vedada a divulgação não autorizada
          desses dados para finalidades diversas das operacionais.
        </Text>

        {/* 8. DISPOSIÇÕES GERAIS */}
        <Text style={styles.sectionTitle}>8. Disposições Gerais</Text>
        <Text style={styles.paragraph}>
          A Administração/Gerência da Clínica Masterclin é responsável pela
          interpretação deste Regulamento. Casos omissos serão deliberados pela
          direção. O presente regulamento entra em vigor na data de sua
          publicação interna.
        </Text>

        {/* 9. TERMO DE CIÊNCIA E CONCORDÂNCIA */}
        <View style={styles.termoBox} wrap={false}>
          <Text style={styles.termoTitle}>
            9. Termo de Ciência e Concordância
          </Text>
          <Text style={styles.paragraph}>
            Declaro que recebi, li e compreendi o Regulamento do Programa de
            Avaliação de Atendimento da Masterclin, estando ciente das regras de
            participação, conduta ética, critérios de apuração, classificação e
            condições para concessão da premiação oficial. Comprometo-me a agir
            de forma ética e transparente em conformidade com estas diretrizes.
          </Text>

          <View style={styles.fieldsContainer}>
            <View style={styles.fieldRow}>
              <Text style={styles.fieldLabel}>Nome do Colaborador:</Text>
              <View style={styles.fieldLine} />
            </View>
            <View style={styles.fieldRowBetween}>
              <View style={[styles.fieldRow, { width: '48%' }]}>
                <Text style={styles.fieldLabel}>CPF:</Text>
                <View style={styles.fieldLine} />
              </View>
              <View style={[styles.fieldRow, { width: '48%' }]}>
                <Text style={styles.fieldLabel}>Cargo:</Text>
                <View style={styles.fieldLine} />
              </View>
            </View>
            <View style={styles.fieldRowBetween}>
              <View style={[styles.fieldRow, { width: '48%' }]}>
                <Text style={styles.fieldLabel}>Unidade:</Text>
                <View style={styles.fieldLine} />
              </View>
              <View style={[styles.fieldRow, { width: '48%' }]}>
                <Text style={styles.fieldLabel}>Data:</Text>
                <View style={styles.fieldLine} />
              </View>
            </View>
          </View>

          <View style={styles.signaturesContainer}>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>
                Assinatura do Colaborador
              </Text>
            </View>
            <View style={styles.signatureBox}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureLabel}>
                Assinatura da Gerência / Responsável
              </Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>
            Master Admin — Regulamento do Programa de Avaliação de Atendimento
          </Text>
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
