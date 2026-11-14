import type { Employee, WorkScheduleDay } from '@/http/employees'
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer'

export interface EmployeeRegistrationPdfProps {
  employee: Employee
}

const DEFAULT_SCHEDULE: WorkScheduleDay[] = [
  {
    day: 'Dom',
    type: 'DSR / Folga',
    entry: '-',
    breakStart: '-',
    breakEnd: '-',
    exit: '-',
  },
  {
    day: 'Seg',
    type: 'Normal',
    entry: '08:00',
    breakStart: '12:00',
    breakEnd: '14:00',
    exit: '18:00',
  },
  {
    day: 'Ter',
    type: 'Normal',
    entry: '08:00',
    breakStart: '12:00',
    breakEnd: '14:00',
    exit: '18:00',
  },
  {
    day: 'Qua',
    type: 'Normal',
    entry: '08:00',
    breakStart: '12:00',
    breakEnd: '14:00',
    exit: '18:00',
  },
  {
    day: 'Qui',
    type: 'Normal',
    entry: '08:00',
    breakStart: '12:00',
    breakEnd: '14:00',
    exit: '18:00',
  },
  {
    day: 'Sex',
    type: 'Normal',
    entry: '08:00',
    breakStart: '12:00',
    breakEnd: '14:00',
    exit: '18:00',
  },
  {
    day: 'Sab',
    type: 'Meio Período',
    entry: '08:00',
    breakStart: '-',
    breakEnd: '-',
    exit: '12:00',
  },
]

const styles = StyleSheet.create({
  page: {
    paddingHorizontal: 22,
    paddingVertical: 18,
    fontSize: 7.5,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  titleBox: {
    borderWidth: 1,
    borderColor: '#0f172a',
    borderRadius: 4,
    paddingVertical: 4,
    marginBottom: 4,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  titleText: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 4,
    gap: 4,
  },
  box: {
    borderWidth: 0.8,
    borderColor: '#1e293b',
    borderRadius: 3,
    padding: 3.5,
  },
  label: {
    fontSize: 6,
    color: '#475569',
    marginBottom: 1.5,
  },
  value: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  valueNormal: {
    fontSize: 7,
    color: '#0f172a',
  },
  sectionBanner: {
    borderWidth: 0.8,
    borderColor: '#1e293b',
    backgroundColor: '#f1f5f9',
    paddingVertical: 2,
    paddingHorizontal: 4,
    alignItems: 'center',
    marginBottom: 2,
    borderRadius: 2,
  },
  sectionBannerText: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cellBorderRight: {
    borderRightWidth: 0.8,
    borderRightColor: '#1e293b',
    paddingRight: 4,
  },
  cellBorderBottom: {
    borderBottomWidth: 0.8,
    borderBottomColor: '#1e293b',
    paddingBottom: 3,
    marginBottom: 3,
  },
  lineItem: {
    borderBottomWidth: 0.6,
    borderBottomColor: '#64748b',
    minHeight: 12,
    justifyContent: 'flex-end',
    paddingBottom: 1.5,
    marginBottom: 2,
  },
  scheduleTable: {
    width: '62%',
    borderWidth: 1,
    borderColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scheduleHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 0.8,
    borderBottomColor: '#0f172a',
  },
  scheduleRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.6,
    borderBottomColor: '#475569',
    minHeight: 18,
    alignItems: 'center',
  },
  scheduleCell: {
    paddingVertical: 3,
    paddingHorizontal: 4,
    textAlign: 'center',
    borderRightWidth: 0.6,
    borderRightColor: '#475569',
    fontSize: 7.5,
  },
})

function formatDate(val?: string | null) {
  if (!val) return ''
  try {
    const d = new Date(val)
    if (Number.isNaN(d.getTime())) return val
    return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
  } catch {
    return val
  }
}

function formatCpf(cpf?: string | null) {
  if (!cpf) return ''
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return cpf
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`
}

function formatCurrency(val?: number | null) {
  if (val === undefined || val === null) return '0,00'
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
}

export function EmployeeRegistrationPdfDocument({
  employee,
}: EmployeeRegistrationPdfProps) {
  const beneficiaries = Array.isArray(employee.beneficiaries)
    ? employee.beneficiaries
    : []
  const salaryHistory = Array.isArray(employee.salaryRoleHistory)
    ? employee.salaryRoleHistory
    : []
  const vacationsHistory = Array.isArray(employee.vacationsHistory)
    ? employee.vacationsHistory
    : []
  const healthHistory = Array.isArray(employee.occupationalHealthHistory)
    ? employee.occupationalHealthHistory
    : []
  const unionHistory = Array.isArray(employee.unionContributions)
    ? employee.unionContributions
    : []
  const schedule: WorkScheduleDay[] =
    Array.isArray(employee.workSchedule) && employee.workSchedule.length > 0
      ? employee.workSchedule
      : DEFAULT_SCHEDULE

  const completedWarnings = (employee.requests || []).filter(
    (r) => r.type === 'WARNING' && r.status === 'COMPLETED'
  )

  return (
    <Document
      title={`Ficha de Registro - ${employee.fullName}`}
      author="Master Admin"
      subject="Registro de Empregado"
      creator="Master Admin"
    >
      {/* ==================== PÁGINA 1: FICHA DE REGISTRO ==================== */}
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View style={styles.titleBox}>
          <Text style={styles.titleText}>REGISTRO DE EMPREGADO</Text>
        </View>

        {/* Bloco 1: Autenticar + Dados do Empregador + Nº Matrícula */}
        <View style={styles.row}>
          <View style={[styles.box, { width: '24%', minHeight: 62 }]}>
            <Text style={[styles.label, { textAlign: 'center' }]}>
              Autenticar
            </Text>
          </View>

          <View style={{ width: '76%', gap: 3 }}>
            <View style={{ flexDirection: 'row', gap: 3 }}>
              <View style={[styles.box, { width: '78%' }]}>
                <Text style={styles.label}>Matrícula eSocial</Text>
                <Text style={styles.value}>{employee.esocialCode || '-'}</Text>
              </View>
              <View style={[styles.box, { width: '22%' }]}>
                <Text style={styles.label}>Nº</Text>
                <Text style={[styles.value, { color: '#0284c7' }]}>
                  {employee.registrationNumber}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 3 }}>
              <View style={[styles.box, { width: '72%' }]}>
                <Text style={styles.label}>Empregador</Text>
                <Text style={styles.value}>{employee.employerName}</Text>
              </View>
              <View style={[styles.box, { width: '28%' }]}>
                <Text style={styles.label}>CNPJ</Text>
                <Text style={styles.value}>{employee.employerCnpj}</Text>
              </View>
            </View>

            <View style={styles.box}>
              <Text style={styles.label}>Endereço</Text>
              <Text style={styles.value}>{employee.employerAddress}</Text>
            </View>
          </View>
        </View>

        {/* Bloco 2: Empregado / Residência + Beneficiários */}
        <View style={styles.row}>
          <View style={{ width: '50%', gap: 3 }}>
            <View style={styles.box}>
              <Text style={styles.label}>Empregado</Text>
              <Text style={[styles.value, { fontSize: 8.5 }]}>
                {employee.fullName}
              </Text>
            </View>
            <View style={[styles.box, { minHeight: 34 }]}>
              <Text style={styles.label}>Residência</Text>
              <Text style={styles.valueNormal}>{employee.address || '-'}</Text>
              <Text style={[styles.value, { marginTop: 3 }]}>
                CEP: {employee.zipCode || '-'}
              </Text>
            </View>
          </View>

          <View style={[styles.box, { width: '50%', minHeight: 62 }]}>
            <Text style={styles.label}>Beneficiários</Text>
            {beneficiaries.length === 0 ? (
              <Text style={styles.valueNormal}>
                Nenhum beneficiário declarado.
              </Text>
            ) : (
              beneficiaries.slice(0, 4).map((b, i) => (
                <Text key={i} style={styles.valueNormal}>
                  • {b.name} ({b.relationship})
                  {b.birthDate ? ` - Nasc.: ${formatDate(b.birthDate)}` : ''}
                </Text>
              ))
            )}
          </View>
        </View>

        {/* Bloco 3: Foto 3x4 + Dados Pessoais e Documentos */}
        <View style={styles.row}>
          <View
            style={[
              styles.box,
              {
                width: '16%',
                minHeight: 132,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            {employee.photoUrl ? (
              <Image
                src={employee.photoUrl}
                style={{ width: '100%', height: 120, objectFit: 'cover' }}
              />
            ) : (
              <Text style={[styles.label, { textAlign: 'center' }]}>
                FOTO 3x4
              </Text>
            )}
          </View>

          <View style={{ width: '84%', gap: 2.5 }}>
            {/* Linha 1: Nascimento, Naturalidade, Nacionalidade, Estado Civil */}
            <View style={[styles.box, { flexDirection: 'row' }]}>
              <View style={[styles.cellBorderRight, { width: '20%' }]}>
                <Text style={styles.label}>Data de nascimento</Text>
                <Text style={styles.value}>
                  {formatDate(employee.birthDate) || '-'}
                </Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '34%', paddingLeft: 4 },
                ]}
              >
                <Text style={styles.label}>Local do nascimento</Text>
                <Text style={styles.value}>{employee.birthPlace || '-'}</Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '24%', paddingLeft: 4 },
                ]}
              >
                <Text style={styles.label}>Nacionalidade</Text>
                <Text style={styles.value}>{employee.nationality || '-'}</Text>
              </View>
              <View style={{ width: '22%', paddingLeft: 4 }}>
                <Text style={styles.label}>Estado civil</Text>
                <Text style={styles.value}>
                  {employee.maritalStatus || '-'}
                </Text>
              </View>
            </View>

            {/* Linha 2: Filiação */}
            <View
              style={[
                styles.box,
                { flexDirection: 'row', alignItems: 'center' },
              ]}
            >
              <View style={[styles.cellBorderRight, { width: '14%' }]}>
                <Text style={styles.label}>FILIAÇÃO</Text>
              </View>
              <View style={{ width: '86%', paddingLeft: 4 }}>
                <Text style={styles.valueNormal}>
                  Pai: {employee.fatherName || '-'}
                </Text>
                <Text style={styles.valueNormal}>
                  Mãe: {employee.motherName || '-'}
                </Text>
              </View>
            </View>

            {/* Linha 3: RG, Título Eleitoral, Órgão de Classe */}
            <View style={[styles.box, { flexDirection: 'row' }]}>
              <View style={[styles.cellBorderRight, { width: '22%' }]}>
                <Text style={styles.label}>Cédula de Identidade</Text>
                <Text style={styles.value}>{employee.rgNumber || '-'}</Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '15%', paddingLeft: 4 },
                ]}
              >
                <Text style={styles.label}>Data de emissão</Text>
                <Text style={styles.value}>
                  {formatDate(employee.rgIssueDate) || '-'}
                </Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '15%', paddingLeft: 4 },
                ]}
              >
                <Text style={styles.label}>Órgão/UF emissor</Text>
                <Text style={styles.value}>{employee.rgIssuer || '-'}</Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '18%', paddingLeft: 4 },
                ]}
              >
                <Text style={styles.label}>Título Eleitoral</Text>
                <Text style={styles.value}>
                  {employee.voterRegistration || '-'}
                </Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '7%', paddingLeft: 3 },
                ]}
              >
                <Text style={styles.label}>Zona</Text>
                <Text style={styles.value}>{employee.voterZone || '-'}</Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '7%', paddingLeft: 3 },
                ]}
              >
                <Text style={styles.label}>Seção</Text>
                <Text style={styles.value}>{employee.voterSection || '-'}</Text>
              </View>
              <View style={{ width: '16%', paddingLeft: 4 }}>
                <Text style={styles.label}>Inscr. Órgão de Classe</Text>
                <Text style={styles.value}>
                  {employee.classCouncilNumber || '-'}
                </Text>
              </View>
            </View>

            {/* Linha 4: CTPS, CPF, CNH */}
            <View style={[styles.box, { flexDirection: 'row' }]}>
              <View style={[styles.cellBorderRight, { width: '16%' }]}>
                <Text style={styles.label}>CTPS</Text>
                <Text style={styles.value}>{employee.ctpsNumber || '-'}</Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '10%', paddingLeft: 4 },
                ]}
              >
                <Text style={styles.label}>Série</Text>
                <Text style={styles.value}>{employee.ctpsSeries || '-'}</Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '18%', paddingLeft: 4 },
                ]}
              >
                <Text style={styles.label}>Data de expedição</Text>
                <Text style={styles.value}>
                  {formatDate(employee.ctpsIssueDate) || '-'}
                </Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '8%', paddingLeft: 3 },
                ]}
              >
                <Text style={styles.label}>UF CTPS</Text>
                <Text style={styles.value}>{employee.ctpsState || 'RR'}</Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '20%', paddingLeft: 4 },
                ]}
              >
                <Text style={styles.label}>CPF</Text>
                <Text style={styles.value}>{formatCpf(employee.cpf)}</Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '18%', paddingLeft: 4 },
                ]}
              >
                <Text style={styles.label}>Cart. Nac. Habilitação</Text>
                <Text style={styles.value}>{employee.cnhNumber || '-'}</Text>
              </View>
              <View style={{ width: '10%', paddingLeft: 4 }}>
                <Text style={styles.label}>Categoria</Text>
                <Text style={styles.value}>{employee.cnhCategory || '-'}</Text>
              </View>
            </View>

            {/* Linha 5: Doc Militar, Cor, Telefones, Função e CBO */}
            <View style={[styles.box, { flexDirection: 'row' }]}>
              <View style={[styles.cellBorderRight, { width: '15%' }]}>
                <Text style={styles.label}>Doc. militar</Text>
                <Text style={styles.value}>{employee.militaryDoc || '-'}</Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '10%', paddingLeft: 3 },
                ]}
              >
                <Text style={styles.label}>Cor</Text>
                <Text style={styles.value}>{employee.raceColor || '-'}</Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '18%', paddingLeft: 4 },
                ]}
              >
                <Text style={styles.label}>Telefone Residencial</Text>
                <Text style={styles.value}>
                  {employee.landlinePhone || '-'}
                </Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '19%', paddingLeft: 4 },
                ]}
              >
                <Text style={styles.label}>Telefone Celular</Text>
                <Text style={styles.value}>{employee.mobilePhone || '-'}</Text>
              </View>
              <View
                style={[
                  styles.cellBorderRight,
                  { width: '26%', paddingLeft: 4 },
                ]}
              >
                <Text style={styles.label}>Função</Text>
                <Text style={styles.value}>{employee.roleTitle}</Text>
              </View>
              <View style={{ width: '12%', paddingLeft: 4 }}>
                <Text style={styles.label}>C.B.O.</Text>
                <Text style={styles.value}>{employee.cboCode || '-'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bloco 4: Admissão, Salário, Horário de Trabalho e Intervalo */}
        <View style={styles.row}>
          <View style={[styles.box, { width: '16%' }]}>
            <Text style={styles.label}>Data de Admissão</Text>
            <Text style={styles.value}>
              {formatDate(employee.admissionDate)}
            </Text>
          </View>
          <View style={[styles.box, { width: '18%' }]}>
            <Text style={styles.label}>Salário</Text>
            <Text style={styles.value}>
              R$ {formatCurrency(employee.salary)}
            </Text>
          </View>
          <View style={[styles.box, { width: '13%' }]}>
            <Text style={styles.label}>Por</Text>
            <Text style={styles.value}>{employee.paymentType || 'Mensal'}</Text>
          </View>
          <View style={[styles.box, { width: '29%' }]}>
            <Text style={styles.label}>Horário de Trabalho</Text>
            <Text style={styles.value}>
              {employee.workHoursSummary || 'Vide Página 2'}
            </Text>
          </View>
          <View style={[styles.box, { width: '24%' }]}>
            <Text style={styles.label}>Horário de Intervalo</Text>
            <Text style={styles.value}>
              {employee.breakHoursSummary || 'Vide Página 2'}
            </Text>
          </View>
        </View>

        {/* Bloco 5: FGTS */}
        <View style={styles.row}>
          <View
            style={[
              styles.box,
              {
                width: '10%',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f8fafc',
              },
            ]}
          >
            <Text style={styles.value}>FGTS</Text>
          </View>
          <View style={[styles.box, { width: '18%' }]}>
            <Text style={styles.label}>Opção em</Text>
            <Text style={styles.value}>
              {formatDate(employee.fgtsOptionDate) ||
                formatDate(employee.admissionDate)}
            </Text>
          </View>
          <View style={[styles.box, { width: '50%' }]}>
            <Text style={styles.label}>Conta vinculada no banco</Text>
            <Text style={styles.value}>{employee.fgtsBankAccount || '-'}</Text>
          </View>
          <View style={[styles.box, { width: '22%' }]}>
            <Text style={styles.label}>Data da Retificação</Text>
            <Text style={styles.value}>
              {formatDate(employee.fgtsRectificationDate) || '-'}
            </Text>
          </View>
        </View>

        {/* Bloco 6: PROGRAMA DE INTEGRAÇÃO SOCIAL - PIS */}
        <View style={[styles.box, { marginBottom: 4 }]}>
          <View
            style={{
              borderBottomWidth: 0.8,
              borderBottomColor: '#1e293b',
              paddingBottom: 2,
              marginBottom: 3,
              alignItems: 'center',
            }}
          >
            <Text style={styles.sectionBannerText}>
              PROGRAMA DE INTEGRAÇÃO SOCIAL - PIS
            </Text>
          </View>
          <View style={[styles.cellBorderBottom, { flexDirection: 'row' }]}>
            <View style={[styles.cellBorderRight, { width: '16%' }]}>
              <Text style={styles.label}>Cadastrado em</Text>
              <Text style={styles.value}>
                {formatDate(employee.pisRegistrationDate) || '-'}
              </Text>
            </View>
            <View
              style={[styles.cellBorderRight, { width: '22%', paddingLeft: 4 }]}
            >
              <Text style={styles.label}>Sob nº</Text>
              <Text style={styles.value}>{employee.pisNumber || '-'}</Text>
            </View>
            <View style={{ width: '62%', paddingLeft: 4 }}>
              <Text style={styles.label}>Domicílio bancário</Text>
              <Text style={styles.value}>{employee.pisBankName || '-'}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={[styles.cellBorderRight, { width: '16%' }]}>
              <Text style={styles.label}>Nº banco</Text>
              <Text style={styles.value}>{employee.pisBankNumber || '-'}</Text>
            </View>
            <View
              style={[styles.cellBorderRight, { width: '22%', paddingLeft: 4 }]}
            >
              <Text style={styles.label}>Agência código</Text>
              <Text style={styles.value}>{employee.pisBankBranch || '-'}</Text>
            </View>
            <View style={{ width: '62%', paddingLeft: 4 }}>
              <Text style={styles.label}>End. da agência</Text>
              <Text style={styles.value}>{employee.pisBankAddress || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Bloco 7: ALTERAÇÕES DE SALÁRIO, CARGO E/OU FUNÇÃO */}
        <View style={[styles.box, { minHeight: 56, marginBottom: 4 }]}>
          <View
            style={{
              borderBottomWidth: 0.8,
              borderBottomColor: '#1e293b',
              paddingBottom: 2,
              marginBottom: 3,
              alignItems: 'center',
            }}
          >
            <Text style={styles.sectionBannerText}>
              ALTERAÇÕES DE SALÁRIO, CARGO E/OU FUNÇÃO
            </Text>
          </View>
          {salaryHistory.length === 0 ? (
            <Text style={[styles.label, { marginTop: 4 }]}>
              Sem alterações registradas até a presente data.
            </Text>
          ) : (
            salaryHistory.slice(0, 4).map((s, i) => (
              <Text key={i} style={styles.valueNormal}>
                • {formatDate(s.date)} — Função: {s.roleTitle} — Salário: R${' '}
                {formatCurrency(s.salary)} {s.reason ? `(${s.reason})` : ''}
              </Text>
            ))
          )}
        </View>

        {/* Bloco 8: FÉRIAS + Obs (Advertências, Suspensões, Transferências) */}
        <View style={styles.row}>
          <View style={[styles.box, { width: '52%', minHeight: 74 }]}>
            <View
              style={{
                flexDirection: 'row',
                borderBottomWidth: 0.8,
                borderBottomColor: '#1e293b',
                paddingBottom: 2,
                marginBottom: 3,
              }}
            >
              <Text
                style={[
                  styles.label,
                  { width: '34%', fontFamily: 'Helvetica-Bold' },
                ]}
              >
                FÉRIAS - PER. AQUISITIVO
              </Text>
              <Text
                style={[
                  styles.label,
                  { width: '33%', fontFamily: 'Helvetica-Bold' },
                ]}
              >
                FÉRIAS - PER. DE GOZO
              </Text>
              <Text
                style={[
                  styles.label,
                  { width: '33%', fontFamily: 'Helvetica-Bold' },
                ]}
              >
                ABONO PECUNIÁRIO
              </Text>
            </View>
            {vacationsHistory.length === 0 ? (
              <Text style={styles.label}>Nenhum período registrado.</Text>
            ) : (
              vacationsHistory.slice(0, 4).map((v, i) => (
                <View key={i} style={{ flexDirection: 'row', marginBottom: 2 }}>
                  <Text style={[styles.valueNormal, { width: '34%' }]}>
                    {v.acquisitivePeriod}
                  </Text>
                  <Text style={[styles.valueNormal, { width: '33%' }]}>
                    {v.enjoymentPeriod}
                  </Text>
                  <Text style={[styles.valueNormal, { width: '33%' }]}>
                    {v.pecuniaryAllowance || '-'}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View style={[styles.box, { width: '48%', minHeight: 74 }]}>
            <View
              style={{
                borderBottomWidth: 0.8,
                borderBottomColor: '#1e293b',
                paddingBottom: 2,
                marginBottom: 3,
              }}
            >
              <Text style={[styles.label, { fontFamily: 'Helvetica-Bold' }]}>
                Obs.: (Anotar advertências, suspensões, transferências, etc.)
              </Text>
            </View>
            {completedWarnings.length > 0 ? (
              completedWarnings.slice(0, 3).map((w) => (
                <View key={w.id} style={styles.lineItem}>
                  <Text style={{ fontSize: 6.5 }}>
                    {formatDate(w.referenceDate)} - {w.title} (
                    {w.verificationCode})
                  </Text>
                </View>
              ))
            ) : (
              <>
                <View style={styles.lineItem} />
                <View style={styles.lineItem} />
                <View style={styles.lineItem} />
              </>
            )}
          </View>
        </View>

        {/* Bloco 9: Acidentes/Doenças + Rescisão de Contrato */}
        <View style={styles.row}>
          <View style={[styles.box, { width: '58%', minHeight: 62 }]}>
            <View
              style={{
                borderBottomWidth: 0.8,
                borderBottomColor: '#1e293b',
                paddingBottom: 2,
                marginBottom: 3,
                alignItems: 'center',
              }}
            >
              <Text style={styles.sectionBannerText}>
                ACIDENTES DE TRABALHO, DOENÇAS OU DOENÇAS PROFISSIONAIS
              </Text>
            </View>
            {healthHistory.length === 0 ? (
              <Text style={styles.label}>Nada consta.</Text>
            ) : (
              healthHistory.slice(0, 3).map((h, i) => (
                <Text key={i} style={styles.valueNormal}>
                  • {formatDate(h.date)}: {h.description}
                </Text>
              ))
            )}
          </View>

          <View style={[styles.box, { width: '42%', minHeight: 62 }]}>
            <View
              style={{
                borderBottomWidth: 0.8,
                borderBottomColor: '#1e293b',
                paddingBottom: 2,
                marginBottom: 3,
                alignItems: 'center',
              }}
            >
              <Text style={styles.sectionBannerText}>
                RESCISÃO DE CONTRATO DE TRABALHO
              </Text>
            </View>
            <View style={[styles.cellBorderBottom, { minHeight: 18 }]}>
              <Text style={styles.label}>
                Data da saída:{' '}
                <Text style={styles.value}>
                  {formatDate(employee.terminationDate) || ''}
                </Text>
              </Text>
            </View>
            <View style={{ minHeight: 18 }}>
              <Text style={styles.label}>
                Tipo do desligamento:{' '}
                <Text style={styles.value}>
                  {employee.terminationType || ''}
                </Text>
              </Text>
            </View>
          </View>
        </View>

        {/* Bloco 10: Contribuição Sindical + Assinatura Empregador */}
        <View style={styles.row}>
          <View style={[styles.box, { width: '58%', minHeight: 60 }]}>
            <View
              style={{
                borderBottomWidth: 0.8,
                borderBottomColor: '#1e293b',
                paddingBottom: 2,
                marginBottom: 3,
                alignItems: 'center',
              }}
            >
              <Text style={styles.sectionBannerText}>
                CONTRIBUIÇÃO SINDICAL
              </Text>
            </View>
            {unionHistory.length === 0 ? (
              <Text style={styles.label}>Nada consta.</Text>
            ) : (
              unionHistory.slice(0, 3).map((u, i) => (
                <Text key={i} style={styles.valueNormal}>
                  • Ano {u.year}: R$ {formatCurrency(u.amount)}
                </Text>
              ))
            )}
          </View>

          <View
            style={{
              width: '42%',
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingBottom: 6,
            }}
          >
            <View
              style={{
                width: '90%',
                borderTopWidth: 0.8,
                borderTopColor: '#0f172a',
                paddingTop: 3,
                alignItems: 'center',
              }}
            >
              <Text style={styles.value}>{employee.employerName}</Text>
            </View>
          </View>
        </View>

        {/* Observações Finais */}
        <View
          style={{
            borderTopWidth: 0.8,
            borderTopColor: '#0f172a',
            paddingTop: 2,
            alignItems: 'center',
          }}
        >
          <Text style={styles.sectionBannerText}>OBSERVAÇÕES</Text>
          {employee.generalObservations ? (
            <Text style={[styles.valueNormal, { marginTop: 2 }]}>
              {employee.generalObservations}
            </Text>
          ) : null}
        </View>
      </Page>

      {/* ==================== PÁGINA 2: DISCRIMINAÇÃO DO HORÁRIO ==================== */}
      <Page size="A4" orientation="portrait" style={styles.page}>
        <View
          style={[
            styles.box,
            {
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 6,
              paddingHorizontal: 8,
              marginBottom: 8,
            },
          ]}
        >
          <View style={{ gap: 3 }}>
            <Text style={styles.value}>REGISTRO DE EMPREGADO</Text>
            <Text style={styles.value}>{employee.employerName}</Text>
          </View>
          <View style={{ gap: 3, alignItems: 'flex-end' }}>
            <Text style={styles.value}>Nº: {employee.registrationNumber}</Text>
            <Text style={styles.value}>CNPJ: {employee.employerCnpj}</Text>
          </View>
        </View>

        <View
          style={[
            styles.box,
            { padding: 0, minHeight: 210, overflow: 'hidden' },
          ]}
        >
          <View
            style={{
              borderBottomWidth: 0.8,
              borderBottomColor: '#0f172a',
              paddingVertical: 4,
              alignItems: 'center',
              backgroundColor: '#f8fafc',
            }}
          >
            <Text style={styles.sectionBannerText}>
              DISCRIMINAÇÃO DO HORÁRIO DE TRABALHO
            </Text>
          </View>

          <View style={{ padding: 6 }}>
            <View style={styles.scheduleTable}>
              <View
                style={{
                  flexDirection: 'row',
                  padding: 4,
                  borderBottomWidth: 0.8,
                  borderBottomColor: '#0f172a',
                  gap: 24,
                }}
              >
                <Text style={styles.valueNormal}>
                  Data:{' '}
                  <Text style={styles.value}>
                    {formatDate(employee.admissionDate)}
                  </Text>
                </Text>
                <Text style={styles.valueNormal}>
                  Nome: <Text style={styles.value}>{employee.fullName}</Text>
                </Text>
              </View>

              <View style={styles.scheduleHeaderRow}>
                <Text
                  style={[
                    styles.scheduleCell,
                    { width: '14%', fontFamily: 'Helvetica-Bold' },
                  ]}
                >
                  Dia
                </Text>
                <Text
                  style={[
                    styles.scheduleCell,
                    { width: '22%', fontFamily: 'Helvetica-Bold' },
                  ]}
                >
                  Tipo
                </Text>
                <Text
                  style={[
                    styles.scheduleCell,
                    { width: '16%', fontFamily: 'Helvetica-Bold' },
                  ]}
                >
                  Entrada
                </Text>
                <Text
                  style={[
                    styles.scheduleCell,
                    { width: '16%', fontFamily: 'Helvetica-Bold' },
                  ]}
                >
                  S. Intervalo
                </Text>
                <Text
                  style={[
                    styles.scheduleCell,
                    { width: '16%', fontFamily: 'Helvetica-Bold' },
                  ]}
                >
                  E. Intervalo
                </Text>
                <Text
                  style={[
                    styles.scheduleCell,
                    {
                      width: '16%',
                      borderRightWidth: 0,
                      fontFamily: 'Helvetica-Bold',
                    },
                  ]}
                >
                  Saída
                </Text>
              </View>

              {schedule.map((row, idx) => (
                <View key={idx} style={styles.scheduleRow}>
                  <Text
                    style={[
                      styles.scheduleCell,
                      { width: '14%', fontFamily: 'Helvetica-Bold' },
                    ]}
                  >
                    {row.day}
                  </Text>
                  <Text style={[styles.scheduleCell, { width: '22%' }]}>
                    {row.type || '-'}
                  </Text>
                  <Text style={[styles.scheduleCell, { width: '16%' }]}>
                    {row.entry || '-'}
                  </Text>
                  <Text style={[styles.scheduleCell, { width: '16%' }]}>
                    {row.breakStart || '-'}
                  </Text>
                  <Text style={[styles.scheduleCell, { width: '16%' }]}>
                    {row.breakEnd || '-'}
                  </Text>
                  <Text
                    style={[
                      styles.scheduleCell,
                      { width: '16%', borderRightWidth: 0 },
                    ]}
                  >
                    {row.exit || '-'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
