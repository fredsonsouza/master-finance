'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type {
  BeneficiaryItem,
  Employee,
  EmployeesSummary,
  PaginationMeta,
  WorkScheduleDay,
} from '@/http/employees'
import type { Sector } from '@/http/get-sectors'
import type { Unit } from '@/http/get-units'
import type { User } from '@/http/get-users'
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Copy,
  FileDown,
  FileSpreadsheet,
  Filter,
  IdCard,
  Loader2,
  Pencil,
  Plus,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  changeEmployeeStatusAction,
  createEmployeeAction,
  fetchEmployeesAction,
  updateEmployeeAction,
} from './actions'
import { downloadEmployeeRegistrationPdf } from './download-employee-registration-pdf'

interface Props {
  initialEmployees: Employee[]
  initialSummary: EmployeesSummary
  initialPagination: PaginationMeta
  units: Unit[]
  sectors: Sector[]
  users: User[]
}

const DEFAULT_WORK_SCHEDULE: WorkScheduleDay[] = [
  {
    day: 'Seg',
    type: 'Normal',
    entry: '07:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    exit: '16:00',
  },
  {
    day: 'Ter',
    type: 'Normal',
    entry: '07:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    exit: '16:00',
  },
  {
    day: 'Qua',
    type: 'Normal',
    entry: '07:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    exit: '16:00',
  },
  {
    day: 'Qui',
    type: 'Normal',
    entry: '07:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    exit: '16:00',
  },
  {
    day: 'Sex',
    type: 'Normal',
    entry: '07:00',
    breakStart: '12:00',
    breakEnd: '13:00',
    exit: '16:00',
  },
  {
    day: 'Sab',
    type: 'Meio Período',
    entry: '07:00',
    breakStart: '',
    breakEnd: '',
    exit: '11:00',
  },
  {
    day: 'Dom',
    type: 'DSR / Folga',
    entry: '-',
    breakStart: '-',
    breakEnd: '-',
    exit: '-',
  },
]

const IGNORED_CONNECTORS = new Set([
  'DE',
  'DA',
  'DO',
  'DAS',
  'DOS',
  'E',
  'EM',
  'NA',
  'NO',
])

function previewInitialsFromName(name: string): string {
  const cleaned = name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, ' ')
    .trim()

  if (!cleaned) return 'EMP'

  const tokens = cleaned
    .split(/\s+/)
    .filter((token) => token.length > 0 && !IGNORED_CONNECTORS.has(token))

  if (tokens.length === 0) return 'EMP'

  const initials = tokens
    .slice(0, 4)
    .map((t) => t[0])
    .join('')

  return initials.length >= 2
    ? initials
    : (tokens[0]?.slice(0, 3) || 'EMP').padEnd(2, 'X')
}

function formatCpfInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

function formatCurrencyBrl(value?: number | null): string {
  if (value === undefined || value === null) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatDateBr(value?: string | null): string {
  if (!value) return '-'
  const datePart = value.split('T')[0]
  if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const [y, m, d] = datePart.split('-')
    return `${d}/${m}/${y}`
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('pt-BR')
}

function toInputDate(value?: string | null): string {
  if (!value) return ''
  return value.split('T')[0] || ''
}

type FormTab = 'PERSONAL' | 'DOCUMENTS' | 'CONTRACT' | 'SCHEDULE' | 'ACCESS'

export function EmployeesContent({
  initialEmployees,
  initialSummary,
  initialPagination,
  units,
  sectors,
  users,
}: Props) {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [summary, setSummary] = useState(initialSummary)
  const [, setPagination] = useState(initialPagination)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'INACTIVE'
  >('ALL')
  const [unitFilter, setUnitFilter] = useState<string>('ALL')
  const [sectorFilter, setSectorFilter] = useState<string>('ALL')
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  // Create / Edit Dialog State
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<FormTab>('PERSONAL')
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Status Change Dialog State
  const [statusTarget, setStatusTarget] = useState<Employee | null>(null)
  const [terminationDate, setTerminationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  )
  const [terminationNotes, setTerminationNotes] = useState<string>('')
  const [terminationType, setTerminationType] = useState<string>(
    'Dispensa sem justa causa'
  )
  const [isChangingStatus, setIsChangingStatus] = useState(false)

  // Form Fields
  const [fullName, setFullName] = useState('')
  const [esocialCode, setEsocialCode] = useState('')
  const [cpf, setCpf] = useState('')
  const [rgNumber, setRgNumber] = useState('')
  const [rgIssuer, setRgIssuer] = useState('')
  const [rgIssueDate, setRgIssueDate] = useState('')
  const [ctpsNumber, setCtpsNumber] = useState('')
  const [ctpsSeries, setCtpsSeries] = useState('')
  const [ctpsState, setCtpsState] = useState('SC')
  const [ctpsIssueDate, setCtpsIssueDate] = useState('')
  const [pisNumber, setPisNumber] = useState('')
  const [pisRegistrationDate, setPisRegistrationDate] = useState('')
  const [pisBankName, setPisBankName] = useState('Caixa Econômica Federal')
  const [pisBankBranch, setPisBankBranch] = useState('')
  const [voterRegistration, setVoterRegistration] = useState('')
  const [voterZone, setVoterZone] = useState('')
  const [voterSection, setVoterSection] = useState('')
  const [militaryDoc, setMilitaryDoc] = useState('')
  const [militaryCategory, setMilitaryCategory] = useState('')
  const [cnhNumber, setCnhNumber] = useState('')
  const [cnhCategory, setCnhCategory] = useState('')
  const [classCouncilNumber, setClassCouncilNumber] = useState('')

  const [birthDate, setBirthDate] = useState('')
  const [maritalStatus, setMaritalStatus] = useState('Solteiro(a)')
  const [raceColor, setRaceColor] = useState('')
  const [nationality, setNationality] = useState('Brasileira')
  const [birthPlace, setBirthPlace] = useState('')
  const [fatherName, setFatherName] = useState('')
  const [motherName, setMotherName] = useState('')

  const [zipCode, setZipCode] = useState('')
  const [address, setAddress] = useState('')
  const [landlinePhone, setLandlinePhone] = useState('')
  const [mobilePhone, setMobilePhone] = useState('')
  const [email, setEmail] = useState('')

  const [employerName, setEmployerName] = useState('GERENCIACLIN LTDA')
  const [employerCnpj, setEmployerCnpj] = useState('35.676.026/0001-23')
  const [employerAddress, setEmployerAddress] = useState(
    'R GETULIO VARGAS, 2117, CENTRO - SÃO FRANCISCO DO SUL/SC'
  )
  const [roleTitle, setRoleTitle] = useState('')
  const [cboCode, setCboCode] = useState('')
  const [admissionDate, setAdmissionDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [workHoursSummary, setWorkHoursSummary] = useState('44h semanais')
  const [breakHoursSummary, setBreakHoursSummary] = useState('01:00h')
  const [workSchedule, setWorkSchedule] = useState<WorkScheduleDay[]>(
    DEFAULT_WORK_SCHEDULE
  )
  const [salary, setSalary] = useState('2000')
  const [paymentType, setPaymentType] = useState('Mensal')
  const [fgtsOptionDate, setFgtsOptionDate] = useState('')
  const [fgtsBankAccount, setFgtsBankAccount] = useState(
    'Caixa Econômica Federal'
  )

  const [unitId, setUnitId] = useState<string>('')
  const [sectorId, setSectorId] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  const [createUserAccount, setCreateUserAccount] = useState(true)
  const [accountPassword, setAccountPassword] = useState('')
  const [accountRole, setAccountRole] = useState<
    'EMPLOYEE' | 'HR' | 'COLLECTOR' | 'FISCAL' | 'MANAGER'
  >('EMPLOYEE')

  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryItem[]>([])
  const [generalObservations, setGeneralObservations] = useState('')

  const registrationPreview = useMemo(() => {
    if (editingEmployee) return editingEmployee.registrationNumber
    const initials = previewInitialsFromName(fullName)
    const nextSeq = String((summary.totalCount || 0) + 1).padStart(4, '0')
    return `MASTER-${initials}${nextSeq}`
  }, [editingEmployee, fullName, summary.totalCount])

  async function loadEmployees(overrides?: {
    search?: string
    status?: 'ALL' | 'ACTIVE' | 'INACTIVE'
    unitId?: string
    sectorId?: string
  }) {
    setIsLoadingList(true)
    try {
      const targetSearch = overrides?.search ?? search
      const targetStatus = overrides?.status ?? statusFilter
      const targetUnit = overrides?.unitId ?? unitFilter
      const targetSector = overrides?.sectorId ?? sectorFilter

      const res = await fetchEmployeesAction({
        search: targetSearch.trim() || undefined,
        status: targetStatus === 'ALL' ? undefined : targetStatus,
        unitId: targetUnit === 'ALL' ? undefined : targetUnit,
        sectorId: targetSector === 'ALL' ? undefined : targetSector,
        page: 1,
        perPage: 50,
      })

      if (res.success && res.employees) {
        setEmployees(res.employees)
        if (res.summary) setSummary(res.summary)
        if (res.pagination) setPagination(res.pagination)
      } else {
        toast.error(res.message || 'Erro ao filtrar colaboradores.')
      }
    } finally {
      setIsLoadingList(false)
    }
  }

  function handleResetFilters() {
    setSearch('')
    setStatusFilter('ALL')
    setUnitFilter('ALL')
    setSectorFilter('ALL')
    loadEmployees({
      search: '',
      status: 'ALL',
      unitId: 'ALL',
      sectorId: 'ALL',
    })
  }

  function openCreateDialog() {
    setEditingEmployee(null)
    setActiveTab('PERSONAL')
    setFullName('')
    setEsocialCode('')
    setCpf('')
    setRgNumber('')
    setRgIssuer('SSP/SC')
    setRgIssueDate('')
    setCtpsNumber('')
    setCtpsSeries('')
    setCtpsState('SC')
    setCtpsIssueDate('')
    setPisNumber('')
    setPisRegistrationDate('')
    setPisBankName('Caixa Econômica Federal')
    setPisBankBranch('')
    setVoterRegistration('')
    setVoterZone('')
    setVoterSection('')
    setMilitaryDoc('')
    setMilitaryCategory('')
    setCnhNumber('')
    setCnhCategory('')
    setClassCouncilNumber('')
    setBirthDate('')
    setMaritalStatus('Solteiro(a)')
    setRaceColor('')
    setNationality('Brasileira')
    setBirthPlace('')
    setFatherName('')
    setMotherName('')
    setZipCode('')
    setAddress('')
    setLandlinePhone('')
    setMobilePhone('')
    setEmail('')
    setEmployerName('GERENCIACLIN LTDA')
    setEmployerCnpj('35.676.026/0001-23')
    setEmployerAddress(
      'R GETULIO VARGAS, 2117, CENTRO - SÃO FRANCISCO DO SUL/SC'
    )
    setRoleTitle('')
    setCboCode('')
    setAdmissionDate(new Date().toISOString().split('T')[0])
    setWorkHoursSummary('44h semanais')
    setBreakHoursSummary('01:00h')
    setWorkSchedule(DEFAULT_WORK_SCHEDULE.map((item) => ({ ...item })))
    setSalary('2000')
    setPaymentType('Mensal')
    setFgtsOptionDate(new Date().toISOString().split('T')[0])
    setFgtsBankAccount('Caixa Econômica Federal')
    setUnitId('')
    setSectorId('')
    setUserId('')
    setCreateUserAccount(true)
    setAccountPassword('')
    setAccountRole('EMPLOYEE')
    setBeneficiaries([])
    setGeneralObservations('')
    setIsFormOpen(true)
  }

  function openEditDialog(emp: Employee) {
    setEditingEmployee(emp)
    setActiveTab('PERSONAL')
    setFullName(emp.fullName)
    setEsocialCode(emp.esocialCode || '')
    setCpf(emp.cpf)
    setRgNumber(emp.rgNumber || '')
    setRgIssuer(emp.rgIssuer || '')
    setRgIssueDate(toInputDate(emp.rgIssueDate))
    setCtpsNumber(emp.ctpsNumber || '')
    setCtpsSeries(emp.ctpsSeries || '')
    setCtpsState(emp.ctpsState || 'SC')
    setCtpsIssueDate(toInputDate(emp.ctpsIssueDate))
    setPisNumber(emp.pisNumber || '')
    setPisRegistrationDate(toInputDate(emp.pisRegistrationDate))
    setPisBankName(emp.pisBankName || 'Caixa Econômica Federal')
    setPisBankBranch(emp.pisBankBranch || '')
    setVoterRegistration(emp.voterRegistration || '')
    setVoterZone(emp.voterZone || '')
    setVoterSection(emp.voterSection || '')
    setMilitaryDoc(emp.militaryDoc || '')
    setMilitaryCategory(emp.militaryCategory || '')
    setCnhNumber(emp.cnhNumber || '')
    setCnhCategory(emp.cnhCategory || '')
    setClassCouncilNumber(emp.classCouncilNumber || '')
    setBirthDate(toInputDate(emp.birthDate))
    setMaritalStatus(emp.maritalStatus || '')
    setRaceColor(emp.raceColor || '')
    setNationality(emp.nationality || 'Brasileira')
    setBirthPlace(emp.birthPlace || '')
    setFatherName(emp.fatherName || '')
    setMotherName(emp.motherName || '')
    setZipCode(emp.zipCode || '')
    setAddress(emp.address || '')
    setLandlinePhone(emp.landlinePhone || '')
    setMobilePhone(emp.mobilePhone || '')
    setEmail(emp.email || '')
    setEmployerName(emp.employerName || 'GERENCIACLIN LTDA')
    setEmployerCnpj(emp.employerCnpj || '35.676.026/0001-23')
    setEmployerAddress(emp.employerAddress || '')
    setRoleTitle(emp.roleTitle || '')
    setCboCode(emp.cboCode || '')
    setAdmissionDate(toInputDate(emp.admissionDate))
    setWorkHoursSummary(emp.workHoursSummary || '44h semanais')
    setBreakHoursSummary(emp.breakHoursSummary || '01:00h')
    setWorkSchedule(
      Array.isArray(emp.workSchedule) && emp.workSchedule.length > 0
        ? emp.workSchedule.map((item) => ({ ...item }))
        : DEFAULT_WORK_SCHEDULE.map((item) => ({ ...item }))
    )
    setSalary(String(emp.salary ?? 0))
    setPaymentType(emp.paymentType || 'Mensal')
    setFgtsOptionDate(toInputDate(emp.fgtsOptionDate))
    setFgtsBankAccount(emp.fgtsBankAccount || '')
    setUnitId(emp.unitId || '')
    setSectorId(emp.sectorId || '')
    setUserId(emp.userId || '')
    setCreateUserAccount(false)
    setAccountPassword('')
    setAccountRole('EMPLOYEE')
    setBeneficiaries(
      Array.isArray(emp.beneficiaries)
        ? emp.beneficiaries.map((b) => ({ ...b }))
        : []
    )
    setGeneralObservations(emp.generalObservations || '')
    setIsFormOpen(true)
  }

  async function handleSaveEmployee() {
    if (!fullName.trim() || fullName.trim().length < 3) {
      toast.error('Informe o nome completo do colaborador.')
      setActiveTab('PERSONAL')
      return
    }
    if (cpf.replace(/\D/g, '').length < 11) {
      toast.error('Informe um CPF válido com 11 dígitos.')
      setActiveTab('DOCUMENTS')
      return
    }
    if (!roleTitle.trim()) {
      toast.error('Informe o cargo / função do colaborador.')
      setActiveTab('CONTRACT')
      return
    }
    if (!admissionDate) {
      toast.error('Informe a data de admissão.')
      setActiveTab('CONTRACT')
      return
    }

    setIsSaving(true)
    try {
      const payload: Record<string, unknown> = {
        fullName: fullName.trim(),
        esocialCode: esocialCode.trim() || null,
        cpf: formatCpfInput(cpf),
        rgNumber: rgNumber.trim() || null,
        rgIssuer: rgIssuer.trim() || null,
        rgIssueDate: rgIssueDate || null,
        ctpsNumber: ctpsNumber.trim() || null,
        ctpsSeries: ctpsSeries.trim() || null,
        ctpsState: ctpsState.trim() || null,
        ctpsIssueDate: ctpsIssueDate || null,
        pisNumber: pisNumber.trim() || null,
        pisRegistrationDate: pisRegistrationDate || null,
        pisBankName: pisBankName.trim() || null,
        pisBankBranch: pisBankBranch.trim() || null,
        voterRegistration: voterRegistration.trim() || null,
        voterZone: voterZone.trim() || null,
        voterSection: voterSection.trim() || null,
        militaryDoc: militaryDoc.trim() || null,
        militaryCategory: militaryCategory.trim() || null,
        cnhNumber: cnhNumber.trim() || null,
        cnhCategory: cnhCategory.trim() || null,
        classCouncilNumber: classCouncilNumber.trim() || null,
        birthDate: birthDate || null,
        maritalStatus: maritalStatus.trim() || null,
        raceColor: raceColor.trim() || null,
        nationality: nationality.trim() || 'Brasileira',
        birthPlace: birthPlace.trim() || null,
        fatherName: fatherName.trim() || null,
        motherName: motherName.trim() || null,
        zipCode: zipCode.trim() || null,
        address: address.trim() || null,
        landlinePhone: landlinePhone.trim() || null,
        mobilePhone: mobilePhone.trim() || null,
        email: email.trim() || null,
        employerName: employerName.trim() || 'GERENCIACLIN LTDA',
        employerCnpj: employerCnpj.trim() || '35.676.026/0001-23',
        employerAddress:
          employerAddress.trim() || 'R GETULIO VARGAS, 2117, CENTRO',
        roleTitle: roleTitle.trim(),
        cboCode: cboCode.trim() || null,
        admissionDate,
        workHoursSummary: workHoursSummary.trim() || '44h semanais',
        breakHoursSummary: breakHoursSummary.trim() || '01:00h',
        workSchedule,
        salary: Number(salary) || 0,
        paymentType: paymentType.trim() || 'Mensal',
        fgtsOptionDate: fgtsOptionDate || null,
        fgtsBankAccount: fgtsBankAccount.trim() || null,
        unitId: unitId || null,
        sectorId: sectorId || null,
        userId: userId || null,
        beneficiaries: beneficiaries.filter((b) => b.name.trim().length > 0),
        generalObservations: generalObservations.trim() || null,
      }

      if (!editingEmployee && createUserAccount && !userId) {
        const defaultPass =
          accountPassword.trim().length >= 4
            ? accountPassword.trim()
            : cpf.replace(/\D/g, '').slice(0, 6) || '123456'
        payload.createAccount = {
          password: defaultPass,
          role: accountRole,
        }
      }

      if (editingEmployee) {
        const res = await updateEmployeeAction(editingEmployee.id, payload)
        if (res.success) {
          toast.success(
            `Ficha de ${fullName} (${editingEmployee.registrationNumber}) atualizada com sucesso!`
          )
          setIsFormOpen(false)
          await loadEmployees()
        } else {
          toast.error(res.message || 'Não foi possível atualizar a ficha.')
        }
      } else {
        const res = await createEmployeeAction(payload)
        if (res.success && res.registrationNumber) {
          toast.success(
            `Colaborador registrado com sucesso! Matrícula gerada: ${res.registrationNumber}`
          )
          setIsFormOpen(false)
          await loadEmployees()
        } else {
          toast.error(res.message || 'Não foi possível salvar o colaborador.')
        }
      }
    } finally {
      setIsSaving(false)
    }
  }

  function openStatusDialog(emp: Employee) {
    setStatusTarget(emp)
    setTerminationDate(new Date().toISOString().split('T')[0])
    setTerminationNotes(emp.terminationNotes || '')
    setTerminationType(emp.terminationType || 'Dispensa sem justa causa')
  }

  async function handleConfirmStatusChange() {
    if (!statusTarget) return
    const nextStatus = statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'

    setIsChangingStatus(true)
    try {
      const res = await changeEmployeeStatusAction(statusTarget.id, {
        status: nextStatus,
        terminationDate: nextStatus === 'INACTIVE' ? terminationDate : null,
        terminationType:
          nextStatus === 'INACTIVE' ? terminationType.trim() || null : null,
        terminationNotes:
          nextStatus === 'INACTIVE' ? terminationNotes.trim() || null : null,
      })

      if (res.success) {
        toast.success(
          nextStatus === 'ACTIVE'
            ? `Colaborador ${statusTarget.registrationNumber} reativado com sucesso!`
            : `Colaborador ${statusTarget.registrationNumber} inativado com sucesso.`
        )
        setStatusTarget(null)
        await loadEmployees()
      } else {
        toast.error(res.message || 'Erro ao alterar status do colaborador.')
      }
    } finally {
      setIsChangingStatus(false)
    }
  }

  async function handleDownloadRegistrationPdf(emp: Employee) {
    setDownloadingId(emp.id)
    try {
      await downloadEmployeeRegistrationPdf(emp)
      toast.success(
        `Ficha de Registro (${emp.registrationNumber}) exportada em PDF!`
      )
    } catch (err) {
      console.error(err)
      toast.error('Erro ao gerar o PDF da Ficha de Registro.')
    } finally {
      setDownloadingId(null)
    }
  }

  function handleCopyRegistration(regNumber: string) {
    navigator.clipboard.writeText(regNumber)
    toast.success(`Matrícula ${regNumber} copiada!`)
  }

  function addBeneficiary() {
    setBeneficiaries((prev) => [
      ...prev,
      { name: '', birthDate: '', relationship: 'Filho(a)', cpf: '' },
    ])
  }

  function updateBeneficiary(
    index: number,
    field: keyof BeneficiaryItem,
    value: string
  ) {
    setBeneficiaries((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    )
  }

  function removeBeneficiary(index: number) {
    setBeneficiaries((prev) => prev.filter((_, i) => i !== index))
  }

  function updateScheduleRow(
    index: number,
    field: keyof WorkScheduleDay,
    value: string
  ) {
    setWorkSchedule((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-outline-variant/20 bg-surface shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              Total de Colaboradores
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-on-surface">
              {summary.totalCount}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Fichas registradas no livro eletrônico de empregados
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-surface shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              Colaboradores Ativos
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <UserCheck className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-emerald-600">
              {summary.activeCount}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Vínculo ativo e login por matrícula habilitado
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-500/20 bg-surface shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              Inativos / Desligados
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
              <UserX className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-rose-600">
              {summary.inactiveCount}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Histórico preservado com acesso bloqueado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar & Actions */}
      <Card className="border-outline-variant/20 bg-surface shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadEmployees()
                  }}
                  placeholder="Buscar por Matrícula (ex: MASTER-JSS0001), Nome ou CPF..."
                  className="pl-9"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  const val = e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE'
                  setStatusFilter(val)
                  loadEmployees({ status: val })
                }}
                className="h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm text-on-surface"
              >
                <option value="ALL">Todos os Status</option>
                <option value="ACTIVE">Somente Ativos</option>
                <option value="INACTIVE">Somente Inativos</option>
              </select>

              <select
                value={unitFilter}
                onChange={(e) => {
                  const val = e.target.value
                  setUnitFilter(val)
                  loadEmployees({ unitId: val })
                }}
                className="h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm text-on-surface"
              >
                <option value="ALL">Todas as Unidades</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>

              <select
                value={sectorFilter}
                onChange={(e) => {
                  const val = e.target.value
                  setSectorFilter(val)
                  loadEmployees({ sectorId: val })
                }}
                className="h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm text-on-surface"
              >
                <option value="ALL">Todos os Setores</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <Button
                variant="outline"
                onClick={() => loadEmployees()}
                disabled={isLoadingList}
                className="gap-1.5 cursor-pointer"
              >
                {isLoadingList ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Filter className="h-4 w-4" />
                )}
                Filtrar
              </Button>

              {(search ||
                statusFilter !== 'ALL' ||
                unitFilter !== 'ALL' ||
                sectorFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  onClick={handleResetFilters}
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpar
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link href="/employees/requests">
                <Button variant="outline" className="gap-2 cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 text-primary" />
                  Solicitações & Documentos
                </Button>
              </Link>
              <Button
                onClick={openCreateDialog}
                className="gap-2 cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                Novo Colaborador
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="border-outline-variant/20 bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container-low text-on-surface-variant text-xs uppercase border-b border-outline-variant/20">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Matrícula / Nº</th>
                <th className="py-3.5 px-4 font-semibold">Colaborador</th>
                <th className="py-3.5 px-4 font-semibold">Cargo & Lotação</th>
                <th className="py-3.5 px-4 font-semibold">
                  Admissão & Salário
                </th>
                <th className="py-3.5 px-4 font-semibold">Acesso ao Sistema</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 text-center text-on-surface-variant"
                  >
                    Nenhum colaborador encontrado com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-surface-container-lowest/60 transition-colors"
                  >
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 font-mono text-xs font-bold text-primary border border-primary/20">
                          <IdCard className="h-3.5 w-3.5" />
                          {emp.registrationNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyRegistration(emp.registrationNumber)
                          }
                          title="Copiar Matrícula"
                          className="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {emp.esocialCode && (
                        <div className="text-[11px] text-on-surface-variant mt-1">
                          eSocial: {emp.esocialCode}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-semibold text-on-surface">
                        {emp.fullName}
                      </div>
                      <div className="text-xs text-on-surface-variant">
                        CPF: {emp.cpf}
                        {emp.pisNumber ? ` • PIS: ${emp.pisNumber}` : ''}
                      </div>
                      {(emp.mobilePhone || emp.email) && (
                        <div className="text-[11px] text-on-surface-variant/80 mt-0.5">
                          {[emp.mobilePhone, emp.email]
                            .filter(Boolean)
                            .join(' • ')}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-medium text-on-surface flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-primary" />
                        {emp.roleTitle}
                      </div>
                      <div className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <Building2 className="h-3 w-3" />
                        {emp.unit?.name || 'Sem unidade'}
                        {emp.sector?.name ? ` • ${emp.sector.name}` : ''}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-medium text-on-surface">
                        {formatDateBr(emp.admissionDate)}
                      </div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                        {formatCurrencyBrl(emp.salary)} (
                        {emp.paymentType || 'Mensal'})
                      </div>
                      <div className="text-[11px] text-on-surface-variant">
                        {emp.workHoursSummary || '44h semanais'}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 align-middle">
                      {emp.user ? (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-700 dark:text-sky-300">
                            <ShieldCheck className="h-3 w-3" />@
                            {emp.user.username}
                          </span>
                          <div className="text-[11px] text-on-surface-variant mt-0.5">
                            Perfil: {emp.user.role}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-on-surface-variant italic">
                          Sem conta vinculada
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-middle">
                      {emp.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Ativo
                        </span>
                      ) : (
                        <div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
                            <UserX className="h-3.5 w-3.5" />
                            Inativo
                          </span>
                          {emp.terminationDate && (
                            <div className="text-[11px] text-rose-600 mt-0.5">
                              Saída: {formatDateBr(emp.terminationDate)}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 align-middle text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownloadRegistrationPdf(emp)}
                          disabled={downloadingId === emp.id}
                          title="Exportar Ficha Oficial de Registro de Empregado (PDF 2 Páginas)"
                          className="gap-1.5 text-xs cursor-pointer"
                        >
                          {downloadingId === emp.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <FileDown className="h-3.5 w-3.5 text-primary" />
                          )}
                          Ficha PDF
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(emp)}
                          title="Editar Ficha do Colaborador"
                          className="gap-1 text-xs cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Editar
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openStatusDialog(emp)}
                          title={
                            emp.status === 'ACTIVE'
                              ? 'Inativar / Desligar Colaborador'
                              : 'Reativar Colaborador'
                          }
                          className={`gap-1 text-xs cursor-pointer ${
                            emp.status === 'ACTIVE'
                              ? 'text-rose-600 hover:text-rose-700'
                              : 'text-emerald-600 hover:text-emerald-700'
                          }`}
                        >
                          <Power className="h-3.5 w-3.5" />
                          {emp.status === 'ACTIVE' ? 'Inativar' : 'Ativar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Employee Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center justify-between gap-3 text-xl font-display">
              <span>
                {editingEmployee
                  ? `Editar Ficha de Registro — ${editingEmployee.fullName}`
                  : 'Novo Registro de Empregado (Modelo Oficial RH)'}
              </span>
              <span className="inline-flex shrink-0 whitespace-nowrap items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1 font-mono text-xs font-bold text-primary border border-primary/20">
                <IdCard className="h-4 w-4 shrink-0" />
                {registrationPreview}
              </span>
            </DialogTitle>
            <DialogDescription>
              Preencha os dados conforme o modelo oficial de Registro de
              Empregado da GERENCIACLIN LTDA. A matrícula única padronizada é
              gerada automaticamente pelas iniciais do nome.
            </DialogDescription>
          </DialogHeader>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-1.5 border-b border-outline-variant/25 pb-2 mt-2">
            {(
              [
                { id: 'PERSONAL', label: '1. Dados Pessoais & Endereço' },
                { id: 'DOCUMENTS', label: '2. Documentos (CPF/CTPS/PIS)' },
                { id: 'CONTRACT', label: '3. Contrato, Lotação & FGTS' },
                { id: 'SCHEDULE', label: '4. Horário & Dependentes' },
                { id: 'ACCESS', label: '5. Acesso ao Sistema (Login)' },
              ] as { id: FormTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: DADOS PESSOAIS & ENDEREÇO */}
          {activeTab === 'PERSONAL' && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label>Nome Completo do Empregado *</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: JOÃO SILVA SANTOS"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>Estado Civil</Label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                  >
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="União Estável">União Estável</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Cor / Raça</Label>
                  <Input
                    value={raceColor}
                    onChange={(e) => setRaceColor(e.target.value)}
                    placeholder="Ex: Branca, Parda..."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Naturalidade (Cidade/UF)</Label>
                  <Input
                    value={birthPlace}
                    onChange={(e) => setBirthPlace(e.target.value)}
                    placeholder="Ex: Joinville/SC"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Nacionalidade</Label>
                  <Input
                    value={nationality}
                    onChange={(e) => setNationality(e.target.value)}
                    placeholder="Brasileira"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Filiação — Nome do Pai</Label>
                  <Input
                    value={fatherName}
                    onChange={(e) => setFatherName(e.target.value)}
                    placeholder="Nome completo do pai"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Filiação — Nome da Mãe</Label>
                  <Input
                    value={motherName}
                    onChange={(e) => setMotherName(e.target.value)}
                    placeholder="Nome completo da mãe"
                  />
                </div>
              </div>

              <div className="border-t border-outline-variant/20 pt-3">
                <h4 className="text-xs font-bold uppercase text-on-surface-variant mb-2">
                  Endereço Residencial & Contato
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label>CEP</Label>
                    <Input
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="89240-000"
                    />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label>
                      Endereço Completo (Rua, Nº, Bairro, Cidade/UF)
                    </Label>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Ex: Rua Getúlio Vargas, 100, Centro - São Francisco do Sul/SC"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div className="space-y-1">
                    <Label>Celular / WhatsApp</Label>
                    <Input
                      value={mobilePhone}
                      onChange={(e) => setMobilePhone(e.target.value)}
                      placeholder="(47) 99999-9999"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Telefone Fixo</Label>
                    <Input
                      value={landlinePhone}
                      onChange={(e) => setLandlinePhone(e.target.value)}
                      placeholder="(47) 3444-0000"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>E-mail</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="colaborador@masterclin.com.br"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTOS */}
          {activeTab === 'DOCUMENTS' && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>CPF *</Label>
                  <Input
                    value={cpf}
                    onChange={(e) => setCpf(formatCpfInput(e.target.value))}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Cédula de Identidade (RG)</Label>
                  <Input
                    value={rgNumber}
                    onChange={(e) => setRgNumber(e.target.value)}
                    placeholder="Número do RG"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Órgão Emissor / UF</Label>
                  <Input
                    value={rgIssuer}
                    onChange={(e) => setRgIssuer(e.target.value)}
                    placeholder="SSP/SC"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Emissão RG</Label>
                  <Input
                    type="date"
                    value={rgIssueDate}
                    onChange={(e) => setRgIssueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>CTPS (Carteira Profissional)</Label>
                  <Input
                    value={ctpsNumber}
                    onChange={(e) => setCtpsNumber(e.target.value)}
                    placeholder="Nº da CTPS"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Série CTPS</Label>
                  <Input
                    value={ctpsSeries}
                    onChange={(e) => setCtpsSeries(e.target.value)}
                    placeholder="Série"
                  />
                </div>
                <div className="space-y-1">
                  <Label>UF CTPS</Label>
                  <Input
                    value={ctpsState}
                    onChange={(e) => setCtpsState(e.target.value)}
                    maxLength={2}
                    placeholder="SC"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Expedição CTPS</Label>
                  <Input
                    type="date"
                    value={ctpsIssueDate}
                    onChange={(e) => setCtpsIssueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>PIS / PASEP (NIT)</Label>
                  <Input
                    value={pisNumber}
                    onChange={(e) => setPisNumber(e.target.value)}
                    placeholder="000.00000.00-0"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Data de Cadastro no PIS</Label>
                  <Input
                    type="date"
                    value={pisRegistrationDate}
                    onChange={(e) => setPisRegistrationDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Banco PIS</Label>
                  <Input
                    value={pisBankName}
                    onChange={(e) => setPisBankName(e.target.value)}
                    placeholder="Caixa Econômica Federal"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Agência PIS</Label>
                  <Input
                    value={pisBankBranch}
                    onChange={(e) => setPisBankBranch(e.target.value)}
                    placeholder="Agência"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Título de Eleitor</Label>
                  <Input
                    value={voterRegistration}
                    onChange={(e) => setVoterRegistration(e.target.value)}
                    placeholder="Nº do Título"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Zona Eleitoral</Label>
                  <Input
                    value={voterZone}
                    onChange={(e) => setVoterZone(e.target.value)}
                    placeholder="Zona"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Seção Eleitoral</Label>
                  <Input
                    value={voterSection}
                    onChange={(e) => setVoterSection(e.target.value)}
                    placeholder="Seção"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>Certificado Militar</Label>
                  <Input
                    value={militaryDoc}
                    onChange={(e) => setMilitaryDoc(e.target.value)}
                    placeholder="Nº Reservista"
                  />
                </div>
                <div className="space-y-1">
                  <Label>CNH (Habilitação)</Label>
                  <Input
                    value={cnhNumber}
                    onChange={(e) => setCnhNumber(e.target.value)}
                    placeholder="Nº Registro CNH"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Categoria CNH</Label>
                  <Input
                    value={cnhCategory}
                    onChange={(e) => setCnhCategory(e.target.value)}
                    placeholder="Ex: AB, B"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Conselho de Classe (COREN/CRF/etc.)</Label>
                  <Input
                    value={classCouncilNumber}
                    onChange={(e) => setClassCouncilNumber(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CONTRATO, LOTAÇÃO & FGTS */}
          {activeTab === 'CONTRACT' && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <Label>Cargo / Função Inicial *</Label>
                  <Input
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    placeholder="Ex: Recepcionista, Biomédico(a), Técnico de Enfermagem..."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Código CBO</Label>
                  <Input
                    value={cboCode}
                    onChange={(e) => setCboCode(e.target.value)}
                    placeholder="Ex: 4221-05"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Matrícula eSocial</Label>
                  <Input
                    value={esocialCode}
                    onChange={(e) => setEsocialCode(e.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label>Data de Admissão *</Label>
                  <Input
                    type="date"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Salário Inicial (R$) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                    placeholder="2500.00"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Tipo de Pagamento</Label>
                  <select
                    value={paymentType}
                    onChange={(e) => setPaymentType(e.target.value)}
                    className="w-full h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                  >
                    <option value="Mensal">Mensal</option>
                    <option value="Quinzenal">Quinzenal</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Horista">Horista</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Carga Horária Semanal</Label>
                  <Input
                    value={workHoursSummary}
                    onChange={(e) => setWorkHoursSummary(e.target.value)}
                    placeholder="44h semanais"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Unidade de Lotação</Label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                  >
                    <option value="">Selecione uma unidade...</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Setor / Departamento</Label>
                  <select
                    value={sectorId}
                    onChange={(e) => setSectorId(e.target.value)}
                    className="w-full h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                  >
                    <option value="">Selecione um setor...</option>
                    {sectors.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-outline-variant/20 pt-3">
                <h4 className="text-xs font-bold uppercase text-on-surface-variant mb-2">
                  Fundo de Garantia do Tempo de Serviço (FGTS) & Empregador
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Data de Opção FGTS</Label>
                    <Input
                      type="date"
                      value={fgtsOptionDate}
                      onChange={(e) => setFgtsOptionDate(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label>Banco Depositário FGTS</Label>
                    <Input
                      value={fgtsBankAccount}
                      onChange={(e) => setFgtsBankAccount(e.target.value)}
                      placeholder="Caixa Econômica Federal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div className="space-y-1">
                    <Label>Razão Social do Empregador</Label>
                    <Input
                      value={employerName}
                      onChange={(e) => setEmployerName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>CNPJ do Empregador</Label>
                    <Input
                      value={employerCnpj}
                      onChange={(e) => setEmployerCnpj(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Endereço do Empregador</Label>
                    <Input
                      value={employerAddress}
                      onChange={(e) => setEmployerAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HORÁRIO SEMANAL & DEPENDENTES */}
          {activeTab === 'SCHEDULE' && (
            <div className="space-y-4 py-2">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase text-on-surface-variant">
                    Quadro de Horário de Trabalho Semanal
                  </h4>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Intervalo Intrajornada:</Label>
                    <Input
                      value={breakHoursSummary}
                      onChange={(e) => setBreakHoursSummary(e.target.value)}
                      className="h-8 w-36 text-xs"
                    />
                  </div>
                </div>

                <div className="border border-outline-variant/25 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-surface-container-low text-on-surface-variant">
                      <tr>
                        <th className="py-2 px-3 text-left">Dia</th>
                        <th className="py-2 px-3 text-left">Tipo</th>
                        <th className="py-2 px-3 text-left">Entrada</th>
                        <th className="py-2 px-3 text-left">Saída Intervalo</th>
                        <th className="py-2 px-3 text-left">
                          Retorno Intervalo
                        </th>
                        <th className="py-2 px-3 text-left">Saída</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15">
                      {workSchedule.map((row, idx) => (
                        <tr key={row.day}>
                          <td className="py-1.5 px-3 font-medium">{row.day}</td>
                          <td className="py-1.5 px-2">
                            <Input
                              value={row.type}
                              onChange={(e) =>
                                updateScheduleRow(idx, 'type', e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              value={row.entry}
                              onChange={(e) =>
                                updateScheduleRow(idx, 'entry', e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              value={row.breakStart}
                              onChange={(e) =>
                                updateScheduleRow(
                                  idx,
                                  'breakStart',
                                  e.target.value
                                )
                              }
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              value={row.breakEnd}
                              onChange={(e) =>
                                updateScheduleRow(
                                  idx,
                                  'breakEnd',
                                  e.target.value
                                )
                              }
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="py-1.5 px-2">
                            <Input
                              value={row.exit}
                              onChange={(e) =>
                                updateScheduleRow(idx, 'exit', e.target.value)
                              }
                              className="h-8 text-xs"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dependentes / Beneficiários */}
              <div className="border-t border-outline-variant/20 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase text-on-surface-variant">
                    Relação de Beneficiários / Dependentes (Salário-Família /
                    IRRF)
                  </h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addBeneficiary}
                    className="gap-1 text-xs cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Dependente
                  </Button>
                </div>

                {beneficiaries.length === 0 ? (
                  <p className="text-xs text-on-surface-variant italic py-2">
                    Nenhum dependente cadastrado.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {beneficiaries.map((dep, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-surface-container-lowest p-2 rounded-lg border border-outline-variant/20"
                      >
                        <div className="sm:col-span-5">
                          <Input
                            value={dep.name}
                            onChange={(e) =>
                              updateBeneficiary(idx, 'name', e.target.value)
                            }
                            placeholder="Nome completo do dependente"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Input
                            type="date"
                            value={dep.birthDate || ''}
                            onChange={(e) =>
                              updateBeneficiary(
                                idx,
                                'birthDate',
                                e.target.value
                              )
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="sm:col-span-3">
                          <Input
                            value={dep.relationship}
                            onChange={(e) =>
                              updateBeneficiary(
                                idx,
                                'relationship',
                                e.target.value
                              )
                            }
                            placeholder="Parentesco (Ex: Filho(a))"
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="sm:col-span-1 flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBeneficiary(idx)}
                            className="text-rose-600 h-8 w-8 p-0 cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Observações Gerais */}
              <div className="space-y-1">
                <Label>Observações Gerais da Ficha de Registro</Label>
                <Textarea
                  value={generalObservations}
                  onChange={(e) => setGeneralObservations(e.target.value)}
                  rows={3}
                  placeholder="Anotações complementares do RH, treinamentos, ASO admissional..."
                />
              </div>
            </div>
          )}

          {/* TAB 5: ACESSO AO SISTEMA (LOGIN HÍBRIDO) */}
          {activeTab === 'ACCESS' && (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                  <ShieldCheck className="h-4 w-4" />
                  Autenticação Híbrida (Usuário ou Matrícula{' '}
                  {registrationPreview})
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  Ao vincular uma conta de usuário ao colaborador, ele poderá
                  acessar o sistema informando tanto seu{' '}
                  <strong>nome de usuário</strong> quanto sua{' '}
                  <strong>matrícula ({registrationPreview})</strong> para
                  solicitar declarações, recibos e baixar documentos assinados
                  pelo RH.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Vincular a um Usuário Existente (Opcional)</Label>
                <select
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value)
                    if (e.target.value) setCreateUserAccount(false)
                  }}
                  className="w-full h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                >
                  <option value="">Nenhum usuário existente selecionado</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (@{u.username} — {u.role})
                    </option>
                  ))}
                </select>
              </div>

              {!editingEmployee && !userId && (
                <div className="border border-outline-variant/25 rounded-xl p-4 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createUserAccount}
                      onChange={(e) => setCreateUserAccount(e.target.checked)}
                      className="h-4 w-4 rounded border-outline-variant"
                    />
                    <span className="text-sm font-semibold text-on-surface">
                      Criar automaticamente conta de acesso para este
                      colaborador
                    </span>
                  </label>

                  {createUserAccount && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <Label>Senha Inicial</Label>
                        <Input
                          type="password"
                          value={accountPassword}
                          onChange={(e) => setAccountPassword(e.target.value)}
                          placeholder="Padrão: 6 primeiros dígitos do CPF"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Perfil de Permissão (Role)</Label>
                        <select
                          value={accountRole}
                          onChange={(e) =>
                            setAccountRole(
                              e.target.value as
                                | 'EMPLOYEE'
                                | 'HR'
                                | 'COLLECTOR'
                                | 'FISCAL'
                                | 'MANAGER'
                            )
                          }
                          className="w-full h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                        >
                          <option value="EMPLOYEE">
                            Colaborador / Recepcionista (EMPLOYEE)
                          </option>
                          <option value="HR">Recursos Humanos (HR)</option>
                          <option value="COLLECTOR">
                            Coletador(a) (COLLECTOR)
                          </option>
                          <option value="FISCAL">Fiscal (FISCAL)</option>
                          <option value="MANAGER">Gerente (MANAGER)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-outline-variant/20 pt-4 mt-4">
            <div className="text-xs text-on-surface-variant">
              Matrícula:{' '}
              <strong className="font-mono text-primary">
                {registrationPreview}
              </strong>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={isSaving}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEmployee}
                disabled={isSaving}
                className="gap-2 cursor-pointer"
              >
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingEmployee
                  ? 'Salvar Alterações'
                  : 'Registrar Colaborador'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Activate / Inactivate Employee Modal */}
      <Dialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {statusTarget?.status === 'ACTIVE'
                ? 'Inativar / Desligar Colaborador'
                : 'Reativar Colaborador'}
            </DialogTitle>
            <DialogDescription>
              {statusTarget?.status === 'ACTIVE'
                ? `Ao inativar ${statusTarget?.fullName} (${statusTarget?.registrationNumber}), os dados de rescisão serão registrados na ficha e o login ao sistema será bloqueado.`
                : `Deseja reativar o vínculo de ${statusTarget?.fullName} (${statusTarget?.registrationNumber})?`}
            </DialogDescription>
          </DialogHeader>

          {statusTarget?.status === 'ACTIVE' && (
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label>Data de Saída / Demissão *</Label>
                <Input
                  type="date"
                  value={terminationDate}
                  onChange={(e) => setTerminationDate(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Tipo de Desligamento / Rescisão</Label>
                <select
                  value={terminationType}
                  onChange={(e) => setTerminationType(e.target.value)}
                  className="w-full h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                >
                  <option value="Dispensa sem justa causa">
                    Dispensa sem justa causa
                  </option>
                  <option value="Pedido de demissão">Pedido de demissão</option>
                  <option value="Término de contrato de experiência">
                    Término de contrato de experiência
                  </option>
                  <option value="Acordo comum (Art. 484-A CLT)">
                    Acordo comum (Art. 484-A CLT)
                  </option>
                  <option value="Dispensa por justa causa">
                    Dispensa por justa causa
                  </option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Observações do Desligamento</Label>
                <Textarea
                  value={terminationNotes}
                  onChange={(e) => setTerminationNotes(e.target.value)}
                  rows={2}
                  placeholder="Motivo, aviso prévio ou observações adicionais..."
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3">
            <Button
              variant="outline"
              onClick={() => setStatusTarget(null)}
              disabled={isChangingStatus}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmStatusChange}
              disabled={isChangingStatus}
              className={`gap-1.5 cursor-pointer ${
                statusTarget?.status === 'ACTIVE'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isChangingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
              {statusTarget?.status === 'ACTIVE'
                ? 'Confirmar Inativação'
                : 'Confirmar Reativação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
