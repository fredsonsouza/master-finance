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
  EmployeeSubmissionCategory,
  EmployeeSubmissionItem,
  EmployeeSubmissionStatus,
  EmployeeSubmissionsSummary,
} from '@/http/employee-submissions'
import type { Employee, PaginationMeta } from '@/http/employees'
import {
  type PreparedSubmissionPdf,
  formatFileSize,
  prepareSubmissionPdfFile,
} from '@/utils/employee-submission-file'
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileCheck2,
  FileDown,
  FileText,
  FileUp,
  Filter,
  IdCard,
  Loader2,
  Paperclip,
  PlayCircle,
  RotateCcw,
  Search,
  Stethoscope,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  createEmployeeSubmissionAction,
  deleteEmployeeSubmissionAction,
  fetchEmployeeSubmissionsAction,
  updateEmployeeSubmissionStatusAction,
} from './actions'

interface Props {
  initialSubmissions: EmployeeSubmissionItem[]
  initialSummary: EmployeeSubmissionsSummary
  initialPagination: PaginationMeta
  employees: Employee[]
  currentUser: {
    id: string
    name: string
    role: string
    isHrManager: boolean
    registrationNumber: string | null
    employeeId: string | null
  }
}

const STATUS_CONFIG: Record<
  EmployeeSubmissionStatus,
  { label: string; badgeClass: string }
> = {
  PENDING: {
    label: 'Pendente',
    badgeClass: 'bg-amber-500/15 text-amber-800 border-amber-600/30',
  },
  UNDER_REVIEW: {
    label: 'Em Análise',
    badgeClass: 'bg-sky-500/15 text-sky-800 border-sky-600/30',
  },
  APPROVED: {
    label: 'Validado',
    badgeClass: 'bg-emerald-700/15 text-emerald-800 border-emerald-700/30',
  },
  REJECTED: {
    label: 'Rejeitado',
    badgeClass: 'bg-rose-500/15 text-rose-800 border-rose-600/30',
  },
}

const CATEGORY_CONFIG: Record<
  EmployeeSubmissionCategory,
  { label: string; defaultTitle: string; badgeClass: string }
> = {
  MEDICAL_CERTIFICATE: {
    label: 'Atestado Médico',
    defaultTitle: 'Atestado Médico',
    badgeClass: 'bg-rose-500/10 text-rose-800 border-rose-600/25',
  },
  ATTENDANCE_DECLARATION: {
    label: 'Declaração de Comparecimento',
    defaultTitle: 'Declaração de Comparecimento Médico',
    badgeClass: 'bg-sky-500/10 text-sky-800 border-sky-600/25',
  },
  PERSONAL_DOCUMENT: {
    label: 'Documento Pessoal',
    defaultTitle: 'Comprovante / Documento Pessoal',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
  },
  OTHER: {
    label: 'Outro Documento',
    defaultTitle: 'Envio de Documento ao RH',
    badgeClass: 'bg-surface-container-high text-on-surface border-outline/25',
  },
}

const REJECTION_REASON_PRESETS = [
  'PDF ilegível — reenvie com melhor nitidez.',
  'Atestado sem carimbo, CRM ou assinatura do profissional.',
  'Data ou período informado diverge do documento anexado.',
  'Documento incompleto ou fora do prazo previsto em política interna.',
]

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

function formatDateTimeBr(value?: string | null): string {
  if (!value) return '-'
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

export function EmployeeSubmissionsContent({
  initialSubmissions,
  initialSummary,
  initialPagination,
  employees,
  currentUser,
}: Props) {
  const isHrManager = currentUser.isHrManager
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [submissions, setSubmissions] =
    useState<EmployeeSubmissionItem[]>(initialSubmissions)
  const [summary, setSummary] =
    useState<EmployeeSubmissionsSummary>(initialSummary)
  const [pagination, setPagination] =
    useState<PaginationMeta>(initialPagination)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | EmployeeSubmissionStatus
  >('ALL')
  const [categoryFilter, setCategoryFilter] = useState<
    'ALL' | EmployeeSubmissionCategory
  >('ALL')
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL')
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    currentUser.employeeId || employees[0]?.id || ''
  )
  const [category, setCategory] = useState<EmployeeSubmissionCategory>(
    'MEDICAL_CERTIFICATE'
  )
  const [title, setTitle] = useState('Atestado Médico')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [daysCount, setDaysCount] = useState('1')
  const [cid, setCid] = useState('')
  const [autoApprove, setAutoApprove] = useState(false)
  const [preparedPdf, setPreparedPdf] = useState<PreparedSubmissionPdf | null>(
    null
  )
  const [isReadingFile, setIsReadingFile] = useState(false)
  const [isSubmittingUpload, setIsSubmittingUpload] = useState(false)

  // Approve Modal State (HR)
  const [approvingSubmission, setApprovingSubmission] =
    useState<EmployeeSubmissionItem | null>(null)
  const [reviewNotesInput, setReviewNotesInput] = useState('')
  const [isSavingApprove, setIsSavingApprove] = useState(false)

  // Reject Modal State (HR)
  const [rejectingSubmission, setRejectingSubmission] =
    useState<EmployeeSubmissionItem | null>(null)
  const [rejectionReasonInput, setRejectionReasonInput] = useState('')
  const [isSavingReject, setIsSavingReject] = useState(false)

  async function loadSubmissions(overrides?: {
    search?: string
    status?: 'ALL' | EmployeeSubmissionStatus
    category?: 'ALL' | EmployeeSubmissionCategory
    employeeId?: string
    page?: number
  }) {
    setIsLoadingList(true)
    try {
      const targetSearch = overrides?.search ?? search
      const targetStatus = overrides?.status ?? statusFilter
      const targetCategory = overrides?.category ?? categoryFilter
      const targetEmp = overrides?.employeeId ?? employeeFilter
      const targetPage = overrides?.page ?? 1

      const res = await fetchEmployeeSubmissionsAction({
        search: targetSearch.trim() || undefined,
        status: targetStatus === 'ALL' ? undefined : targetStatus,
        category: targetCategory === 'ALL' ? undefined : targetCategory,
        employeeId: targetEmp === 'ALL' ? undefined : targetEmp,
        page: targetPage,
        perPage: 20,
      })

      if (res.success) {
        setSubmissions(res.submissions)
        setSummary(res.summary)
        setPagination(res.pagination)
      } else {
        toast.error(res.message || 'Erro ao carregar documentos enviados.')
      }
    } finally {
      setIsLoadingList(false)
    }
  }

  function openUploadModal() {
    const todayIso = new Date().toISOString().split('T')[0]
    setSelectedEmployeeId(currentUser.employeeId || employees[0]?.id || '')
    setCategory('MEDICAL_CERTIFICATE')
    setTitle(CATEGORY_CONFIG.MEDICAL_CERTIFICATE.defaultTitle)
    setDescription('')
    setStartDate(todayIso)
    setDaysCount('1')
    setCid('')
    setAutoApprove(false)
    setPreparedPdf(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setIsUploadOpen(true)
  }

  async function handleFileSelect(fileList: FileList | null) {
    const file = fileList?.[0]
    if (!file) return

    setIsReadingFile(true)
    try {
      const prepared = await prepareSubmissionPdfFile(file)
      setPreparedPdf(prepared)
      toast.success(
        `PDF "${prepared.fileName}" (${formatFileSize(prepared.sizeBytes)}) pronto para envio.`
      )
    } catch (err) {
      setPreparedPdf(null)
      toast.error(
        err instanceof Error
          ? err.message
          : 'Erro ao validar o arquivo PDF selecionado.'
      )
    } finally {
      setIsReadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSubmitUpload() {
    if (!title.trim() || title.trim().length < 2) {
      toast.error('Informe um título para o documento enviado.')
      return
    }
    if (isHrManager && !selectedEmployeeId) {
      toast.error('Selecione o colaborador vinculado ao documento.')
      return
    }
    if (!isHrManager && !currentUser.employeeId) {
      toast.error(
        'Seu usuário ainda não possui uma ficha de colaborador vinculada no RH.'
      )
      return
    }
    if (!preparedPdf) {
      toast.error('Anexe um arquivo em formato PDF (até 5 MB).')
      return
    }

    const isMedicalOrAttendance =
      category === 'MEDICAL_CERTIFICATE' ||
      category === 'ATTENDANCE_DECLARATION'

    const parsedDays =
      category === 'MEDICAL_CERTIFICATE' && daysCount.trim()
        ? Number.parseInt(daysCount, 10)
        : null

    if (
      category === 'MEDICAL_CERTIFICATE' &&
      parsedDays !== null &&
      (!Number.isFinite(parsedDays) || parsedDays < 1 || parsedDays > 365)
    ) {
      toast.error('Informe uma quantidade válida de dias (entre 1 e 365).')
      return
    }

    setIsSubmittingUpload(true)
    try {
      const res = await createEmployeeSubmissionAction({
        employeeId: isHrManager ? selectedEmployeeId : undefined,
        category,
        title: title.trim(),
        description: description.trim() || null,
        startDate: isMedicalOrAttendance && startDate ? startDate : null,
        daysCount: category === 'MEDICAL_CERTIFICATE' ? parsedDays : null,
        cid:
          category === 'MEDICAL_CERTIFICATE' && cid.trim()
            ? cid.trim().toUpperCase()
            : null,
        fileName: preparedPdf.fileName,
        mimeType: preparedPdf.mimeType,
        fileData: preparedPdf.fileData,
        status: isHrManager && autoApprove ? 'APPROVED' : 'PENDING',
      })

      if (res.success) {
        toast.success(
          res.submission.status === 'APPROVED'
            ? 'Documento PDF registrado e validado com sucesso!'
            : 'Documento PDF enviado ao RH com sucesso!'
        )
        setIsUploadOpen(false)
        await loadSubmissions({ page: 1 })
      } else {
        toast.error(res.message || 'Erro ao enviar o documento PDF.')
      }
    } finally {
      setIsSubmittingUpload(false)
    }
  }

  async function handleMarkUnderReview(item: EmployeeSubmissionItem) {
    setProcessingId(item.id)
    try {
      const res = await updateEmployeeSubmissionStatusAction(item.id, {
        status: 'UNDER_REVIEW',
      })
      if (res.success) {
        toast.success('Documento marcado como "Em Análise" pelo RH.')
        await loadSubmissions({ page: pagination.page })
      } else {
        toast.error(res.message || 'Não foi possível atualizar o status.')
      }
    } finally {
      setProcessingId(null)
    }
  }

  function openApproveModal(item: EmployeeSubmissionItem) {
    setApprovingSubmission(item)
    setReviewNotesInput(item.reviewNotes || '')
  }

  async function handleConfirmApprove() {
    if (!approvingSubmission) return
    setIsSavingApprove(true)
    try {
      const res = await updateEmployeeSubmissionStatusAction(
        approvingSubmission.id,
        {
          status: 'APPROVED',
          reviewNotes: reviewNotesInput.trim() || null,
        }
      )
      if (res.success) {
        toast.success(
          `Recebimento de "${approvingSubmission.title}" validado com sucesso!`
        )
        setApprovingSubmission(null)
        setReviewNotesInput('')
        await loadSubmissions({ page: pagination.page })
      } else {
        toast.error(res.message || 'Erro ao validar o documento.')
      }
    } finally {
      setIsSavingApprove(false)
    }
  }

  function openRejectModal(item: EmployeeSubmissionItem) {
    setRejectingSubmission(item)
    setRejectionReasonInput(item.rejectionReason || '')
  }

  async function handleConfirmReject() {
    if (!rejectingSubmission) return
    const trimmed = rejectionReasonInput.trim()
    if (trimmed.length < 5) {
      toast.error(
        'Informe o motivo da rejeição para o colaborador (mínimo de 5 caracteres).'
      )
      return
    }

    setIsSavingReject(true)
    try {
      const res = await updateEmployeeSubmissionStatusAction(
        rejectingSubmission.id,
        {
          status: 'REJECTED',
          rejectionReason: trimmed,
        }
      )
      if (res.success) {
        toast.success(
          `Documento de ${rejectingSubmission.employee.fullName} rejeitado.`
        )
        setRejectingSubmission(null)
        setRejectionReasonInput('')
        await loadSubmissions({ page: pagination.page })
      } else {
        toast.error(res.message || 'Erro ao rejeitar o documento.')
      }
    } finally {
      setIsSavingReject(false)
    }
  }

  async function handleDelete(item: EmployeeSubmissionItem) {
    setProcessingId(item.id)
    try {
      const res = await deleteEmployeeSubmissionAction(item.id)
      if (res.success) {
        toast.success('Envio removido com sucesso.')
        await loadSubmissions({ page: pagination.page })
      } else {
        toast.error(res.message || 'Não foi possível excluir este envio.')
      }
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border-outline-variant/20 bg-surface shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              Total de Envios
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileText className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-on-surface">
              {summary.totalCount}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Atestados e documentos PDF registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-surface shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              Pendentes
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-amber-600">
              {summary.pendingCount}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Aguardando conferência do RH
            </p>
          </CardContent>
        </Card>

        <Card className="border-sky-500/20 bg-surface shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              Em Análise
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600">
              <PlayCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-sky-600">
              {summary.underReviewCount}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Em verificação pela equipe de RH
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-surface shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              Validados
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <FileCheck2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-emerald-600">
              {summary.approvedCount}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Recebimento confirmado e arquivado
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-500/20 bg-surface shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              Rejeitados
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
              <XCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-rose-600">
              {summary.rejectedCount}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Devolvidos com motivo informado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2.5">
        {isHrManager && (
          <Link href="/employees">
            <Button variant="outline" className="gap-2 cursor-pointer">
              <Users className="h-4 w-4 text-primary" />
              Quadro de Colaboradores
            </Button>
          </Link>
        )}

        <Link href="/employees/requests">
          <Button variant="outline" className="gap-2 cursor-pointer">
            <FileText className="h-4 w-4 text-primary" />
            {isHrManager ? 'Solicitações & Documentos' : 'Minhas Solicitações'}
          </Button>
        </Link>

        <Button onClick={openUploadModal} className="gap-2 cursor-pointer">
          <Upload className="h-4 w-4" />
          Enviar Atestado / Documento (PDF)
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="border-outline-variant/20 bg-surface shadow-sm p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="h-4 w-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') loadSubmissions({ page: 1 })
              }}
              placeholder="Buscar por título, arquivo PDF, CID, nome ou matrícula..."
              className="pl-9 h-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              const val = e.target.value as 'ALL' | EmployeeSubmissionStatus
              setStatusFilter(val)
              loadSubmissions({ status: val, page: 1 })
            }}
            className="h-10 rounded-md border border-outline bg-surface px-3 text-sm text-on-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
          >
            <option value="ALL">Todos os Status</option>
            <option value="PENDING">Pendentes</option>
            <option value="UNDER_REVIEW">Em Análise</option>
            <option value="APPROVED">Validados</option>
            <option value="REJECTED">Rejeitados</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              const val = e.target.value as 'ALL' | EmployeeSubmissionCategory
              setCategoryFilter(val)
              loadSubmissions({ category: val, page: 1 })
            }}
            className="h-10 rounded-md border border-outline bg-surface px-3 text-sm text-on-surface focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
          >
            <option value="ALL">Todas as Categorias</option>
            <option value="MEDICAL_CERTIFICATE">Atestados Médicos</option>
            <option value="ATTENDANCE_DECLARATION">
              Declarações de Comparecimento
            </option>
            <option value="PERSONAL_DOCUMENT">Documentos Pessoais</option>
            <option value="OTHER">Outros Documentos</option>
          </select>

          {isHrManager && employees.length > 0 && (
            <select
              value={employeeFilter}
              onChange={(e) => {
                const val = e.target.value
                setEmployeeFilter(val)
                loadSubmissions({ employeeId: val, page: 1 })
              }}
              className="h-10 rounded-md border border-outline bg-surface px-3 text-sm text-on-surface max-w-[240px] focus-visible:outline-none focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary"
            >
              <option value="ALL">Todos os Colaboradores</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.registrationNumber} — {emp.fullName}
                </option>
              ))}
            </select>
          )}

          <Button
            variant="outline"
            onClick={() => loadSubmissions({ page: 1 })}
            disabled={isLoadingList}
            className="h-10 gap-1.5 cursor-pointer"
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
            categoryFilter !== 'ALL' ||
            employeeFilter !== 'ALL') && (
            <Button
              variant="ghost"
              onClick={() => {
                setSearch('')
                setStatusFilter('ALL')
                setCategoryFilter('ALL')
                setEmployeeFilter('ALL')
                loadSubmissions({
                  search: '',
                  status: 'ALL',
                  category: 'ALL',
                  employeeId: 'ALL',
                  page: 1,
                })
              }}
              className="h-10 gap-1.5 text-xs cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Limpar
            </Button>
          )}
        </div>
      </Card>

      {/* Submissions Table */}
      <Card className="border-outline-variant/20 bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container-low text-on-surface-variant text-xs uppercase border-b border-outline-variant/20">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Colaborador</th>
                <th className="py-3.5 px-4 font-semibold">
                  Documento & Anexo PDF
                </th>
                <th className="py-3.5 px-4 font-semibold">Status & Análise</th>
                <th className="py-3.5 px-4 font-semibold">Envio</th>
                <th className="py-3.5 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {submissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-on-surface-variant"
                  >
                    Nenhum atestado ou documento enviado encontrado.
                  </td>
                </tr>
              ) : (
                submissions.map((item) => {
                  const statusCfg = STATUS_CONFIG[item.status]
                  const catCfg = CATEGORY_CONFIG[item.category]
                  const canDelete =
                    isHrManager ||
                    (item.submittedById === currentUser.id &&
                      item.status === 'PENDING')
                  const viewUrl = `/api/employee-submissions/${item.id}/file`
                  const downloadUrl = `/api/employee-submissions/${item.id}/file?download=1`

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-surface-container-lowest/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-semibold text-on-surface">
                          {item.employee.fullName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="inline-flex whitespace-nowrap items-center gap-1 rounded bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-bold text-primary border border-primary/20">
                            <IdCard className="h-3 w-3 shrink-0" />
                            {item.employee.registrationNumber}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-semibold text-on-surface">
                          {item.title}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span
                            className={`inline-flex whitespace-nowrap items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${catCfg.badgeClass}`}
                          >
                            {item.category === 'MEDICAL_CERTIFICATE' ? (
                              <Stethoscope className="h-3 w-3 shrink-0" />
                            ) : (
                              <Paperclip className="h-3 w-3 shrink-0" />
                            )}
                            {catCfg.label}
                          </span>

                          <span className="inline-flex items-center gap-1 rounded bg-surface-container-low px-2 py-0.5 text-[11px] text-on-surface-variant font-mono">
                            {item.fileName} · {formatFileSize(item.sizeBytes)}
                          </span>
                        </div>

                        {(item.startDate || item.daysCount || item.cid) && (
                          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-on-surface-variant">
                            {item.startDate && (
                              <span className="inline-flex items-center gap-1">
                                <CalendarDays className="h-3.5 w-3.5 text-primary" />
                                Início: {formatDateBr(item.startDate)}
                              </span>
                            )}
                            {item.daysCount && (
                              <span>
                                · <strong>{item.daysCount}</strong>{' '}
                                {item.daysCount === 1 ? 'dia' : 'dias'}
                              </span>
                            )}
                            {item.cid && (
                              <span className="font-mono text-[11px] bg-surface-container px-1.5 py-0.5 rounded">
                                CID: {item.cid}
                              </span>
                            )}
                          </div>
                        )}

                        {item.description && (
                          <div className="text-xs text-on-surface-variant mt-1 max-w-md">
                            {item.description}
                          </div>
                        )}

                        {item.status === 'APPROVED' && item.reviewNotes && (
                          <div className="mt-1.5 rounded-md border border-emerald-600/25 bg-emerald-600/5 px-2.5 py-1.5 text-xs text-emerald-800 max-w-md">
                            <span className="font-semibold">Obs. do RH:</span>{' '}
                            {item.reviewNotes}
                          </div>
                        )}

                        {item.status === 'REJECTED' && item.rejectionReason && (
                          <div className="mt-1.5 rounded-md border border-rose-500/25 bg-rose-500/5 px-2.5 py-1.5 text-xs text-rose-700 max-w-md">
                            <span className="font-semibold">
                              Motivo da rejeição:
                            </span>{' '}
                            {item.rejectionReason}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <span
                          className={`inline-flex whitespace-nowrap items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusCfg.badgeClass}`}
                        >
                          {item.status === 'APPROVED' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          ) : item.status === 'REJECTED' ? (
                            <XCircle className="h-3.5 w-3.5 shrink-0" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                          )}
                          {statusCfg.label}
                        </span>
                        {item.reviewedBy && item.reviewedAt && (
                          <div className="text-[11px] text-on-surface-variant mt-1">
                            Por {item.reviewedBy.name} em{' '}
                            {formatDateTimeBr(item.reviewedAt)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-middle text-xs text-on-surface-variant whitespace-nowrap">
                        <div>{formatDateTimeBr(item.createdAt)}</div>
                        <div>Por: {item.submittedBy.name}</div>
                      </td>

                      <td className="py-3.5 px-4 align-middle text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1">
                          <a
                            href={viewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Visualizar PDF em nova aba"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Visualizar PDF"
                              className="h-8 w-8 text-primary hover:bg-primary/10 cursor-pointer"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </a>

                          <a
                            href={downloadUrl}
                            download={item.fileName}
                            title="Baixar PDF"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label="Baixar PDF"
                              className="h-8 w-8 text-on-surface hover:text-primary cursor-pointer"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                          </a>

                          {isHrManager && item.status === 'PENDING' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkUnderReview(item)}
                              disabled={processingId === item.id}
                              title="Marcar como Em Análise"
                              aria-label="Marcar como Em Análise"
                              className="h-8 w-8 text-sky-600 hover:text-sky-700 hover:bg-sky-500/10 cursor-pointer"
                            >
                              <PlayCircle className="h-4 w-4" />
                            </Button>
                          )}

                          {isHrManager && item.status !== 'APPROVED' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => openApproveModal(item)}
                              disabled={processingId === item.id}
                              title="Validar recebimento do documento"
                              aria-label="Validar documento"
                              className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 cursor-pointer"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}

                          {isHrManager &&
                            (item.status === 'PENDING' ||
                              item.status === 'UNDER_REVIEW') && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => openRejectModal(item)}
                                disabled={processingId === item.id}
                                title="Rejeitar documento informando o motivo"
                                aria-label="Rejeitar documento"
                                className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            )}

                          {canDelete && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item)}
                              disabled={processingId === item.id}
                              title="Excluir envio"
                              aria-label="Excluir envio"
                              className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação padrão do sistema */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-surface-container bg-surface-container-lowest text-xs text-on-surface-variant">
            <span>
              Página <strong>{pagination.page}</strong> de{' '}
              <strong>{pagination.totalPages}</strong> ({pagination.totalCount}{' '}
              envios)
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || isLoadingList}
                onClick={() => loadSubmissions({ page: pagination.page - 1 })}
                className="h-7 px-2 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  pagination.page >= pagination.totalPages || isLoadingList
                }
                onClick={() => loadSubmissions({ page: pagination.page + 1 })}
                className="h-7 px-2 cursor-pointer"
              >
                Próxima
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal: Upload PDF Document / Medical Certificate */}
      <Dialog
        open={isUploadOpen}
        onOpenChange={(open) => {
          if (!isSubmittingUpload) setIsUploadOpen(open)
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-display flex items-center gap-2">
              <FileUp className="h-5 w-5 text-primary" />
              Enviar Atestado ou Documento em PDF
            </DialogTitle>
            <DialogDescription>
              Envie exclusivamente arquivos no formato <strong>PDF</strong> (até{' '}
              <strong>5 MB</strong>). Os documentos ficam protegidos e visíveis
              apenas para você e para o setor de RH.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {isHrManager && (
              <div className="space-y-1">
                <Label>Colaborador *</Label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                >
                  <option value="">Selecione o colaborador...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.registrationNumber} — {emp.fullName} ({emp.roleTitle}
                      )
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Categoria do Documento *</Label>
                <select
                  value={category}
                  onChange={(e) => {
                    const nextCat = e.target.value as EmployeeSubmissionCategory
                    setCategory(nextCat)
                    setTitle(CATEGORY_CONFIG[nextCat].defaultTitle)
                  }}
                  className="w-full h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                >
                  <option value="MEDICAL_CERTIFICATE">Atestado Médico</option>
                  <option value="ATTENDANCE_DECLARATION">
                    Declaração de Comparecimento
                  </option>
                  <option value="PERSONAL_DOCUMENT">Documento Pessoal</option>
                  <option value="OTHER">Outro Documento</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label>Título / Identificação *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Atestado Médico - Consulta UPA"
                />
              </div>
            </div>

            {(category === 'MEDICAL_CERTIFICATE' ||
              category === 'ATTENDANCE_DECLARATION') && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Data de Início</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 bg-surface"
                  />
                </div>

                {category === 'MEDICAL_CERTIFICATE' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-xs">Dias de Afastamento</Label>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        value={daysCount}
                        onChange={(e) => setDaysCount(e.target.value)}
                        placeholder="Ex: 2"
                        className="h-9 bg-surface"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">CID (Opcional)</Label>
                      <Input
                        value={cid}
                        onChange={(e) => setCid(e.target.value)}
                        placeholder="Ex: J06"
                        maxLength={20}
                        className="h-9 bg-surface uppercase"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label>Observações para o RH (Opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Ex: Atestado referente ao atendimento de emergência realizado na manhã de hoje..."
              />
            </div>

            {/* PDF Dropzone */}
            <div className="space-y-1.5">
              <Label>Arquivo PDF (Somente .pdf, máx. 5 MB) *</Label>

              {preparedPdf ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-600/30 bg-emerald-500/5 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-emerald-500/15 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">
                        {preparedPdf.fileName}
                      </p>
                      <p className="text-xs text-emerald-700">
                        PDF validado · {formatFileSize(preparedPdf.sizeBytes)}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreparedPdf(null)}
                    title="Remover arquivo"
                    className="h-8 w-8 text-rose-600 hover:bg-rose-500/10 shrink-0 cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault()
                    handleFileSelect(e.dataTransfer.files)
                  }}
                  disabled={isReadingFile}
                  className="w-full border-2 border-dashed border-outline-variant/40 hover:border-primary/60 rounded-xl p-6 text-center cursor-pointer transition-colors bg-surface-container-lowest"
                >
                  <div className="mx-auto h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                    {isReadingFile ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <FileUp className="h-5 w-5" />
                    )}
                  </div>
                  <p className="text-sm font-semibold text-on-surface">
                    Clique para selecionar ou arraste o arquivo PDF aqui
                  </p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Apenas arquivos <strong>.pdf</strong> · Tamanho máximo:{' '}
                    <strong>5 MB</strong>
                  </p>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>

            {isHrManager && (
              <label className="flex items-center gap-2 rounded-lg border border-emerald-700/30 bg-emerald-700/10 p-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-xs font-semibold text-emerald-800">
                  Registrar já como Validado / Recebido pelo RH
                </span>
              </label>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsUploadOpen(false)}
              disabled={isSubmittingUpload}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmitUpload}
              disabled={isSubmittingUpload || !preparedPdf}
              className="gap-2 cursor-pointer"
            >
              {isSubmittingUpload ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Enviar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: HR Approve Submission */}
      <Dialog
        open={Boolean(approvingSubmission)}
        onOpenChange={(open) => {
          if (!open && !isSavingApprove) {
            setApprovingSubmission(null)
            setReviewNotesInput('')
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-display flex items-center gap-2 text-emerald-700">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              Validar Recebimento de Documento
            </DialogTitle>
            <DialogDescription>
              Confirme o recebimento do arquivo enviado por{' '}
              <strong>{approvingSubmission?.employee.fullName}</strong>.
            </DialogDescription>
          </DialogHeader>

          {approvingSubmission && (
            <div className="space-y-3 py-1">
              <div className="rounded-lg border border-outline-variant/25 bg-surface-container-low/60 p-3 text-xs space-y-1">
                <div className="font-semibold text-on-surface">
                  {approvingSubmission.title}
                </div>
                <div className="text-on-surface-variant font-mono">
                  {approvingSubmission.fileName} ·{' '}
                  {formatFileSize(approvingSubmission.sizeBytes)}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="review-notes-textarea">
                  Observação do RH (Opcional)
                </Label>
                <Textarea
                  id="review-notes-textarea"
                  value={reviewNotesInput}
                  onChange={(e) => setReviewNotesInput(e.target.value)}
                  rows={3}
                  placeholder="Ex: Atestado conferido e lançado na folha de ponto."
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setApprovingSubmission(null)
                setReviewNotesInput('')
              }}
              disabled={isSavingApprove}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmApprove}
              disabled={isSavingApprove}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
            >
              {isSavingApprove ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Confirmar Validação
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: HR Reject Submission */}
      <Dialog
        open={Boolean(rejectingSubmission)}
        onOpenChange={(open) => {
          if (!open && !isSavingReject) {
            setRejectingSubmission(null)
            setRejectionReasonInput('')
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-display flex items-center gap-2 text-rose-700">
              <XCircle className="h-5 w-5 shrink-0" />
              Rejeitar Documento Enviado
            </DialogTitle>
            <DialogDescription>
              O envio será marcado como <strong>Rejeitado</strong> e o motivo
              informado ficará visível para o colaborador.
            </DialogDescription>
          </DialogHeader>

          {rejectingSubmission && (
            <div className="space-y-4 py-1">
              <div className="rounded-lg border border-outline-variant/25 bg-surface-container-low/60 p-3 text-xs space-y-1">
                <div className="font-semibold text-on-surface">
                  {rejectingSubmission.title}
                </div>
                <div className="text-on-surface-variant">
                  Colaborador:{' '}
                  <strong className="text-on-surface">
                    {rejectingSubmission.employee.fullName}
                  </strong>{' '}
                  ({rejectingSubmission.employee.registrationNumber})
                </div>
                <div className="text-on-surface-variant font-mono">
                  Arquivo: {rejectingSubmission.fileName}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="submission-rejection-reason">
                  Motivo da rejeição *
                </Label>
                <Textarea
                  id="submission-rejection-reason"
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  rows={4}
                  placeholder="Explique o motivo pelo qual o atestado/documento foi rejeitado..."
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {REJECTION_REASON_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectionReasonInput(preset)}
                      className="text-[11px] px-2 py-1 rounded-md border border-outline-variant/30 bg-surface-container-lowest hover:border-rose-400 hover:bg-rose-500/5 text-on-surface-variant hover:text-rose-700 transition-colors cursor-pointer text-left"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRejectingSubmission(null)
                setRejectionReasonInput('')
              }}
              disabled={isSavingReject}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmReject}
              disabled={
                isSavingReject || rejectionReasonInput.trim().length < 5
              }
              className="gap-1.5 bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
            >
              {isSavingReject ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Confirmar Rejeição
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
