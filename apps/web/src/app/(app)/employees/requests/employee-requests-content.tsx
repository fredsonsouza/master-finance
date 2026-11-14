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
  Employee,
  EmployeeRequestItem,
  EmployeeRequestsSummary,
} from '@/http/employees'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCheck2,
  FileDown,
  FilePlus2,
  FileText,
  Filter,
  IdCard,
  Loader2,
  PlayCircle,
  QrCode,
  Receipt,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  createEmployeeRequestAction,
  deleteEmployeeRequestAction,
  fetchEmployeeRequestsAction,
  updateEmployeeRequestStatusAction,
} from '../actions'
import { downloadEmployeeDocumentPdf } from './download-employee-document-pdf'

type RequestStatus = EmployeeRequestItem['status']
type DocumentType = EmployeeRequestItem['type']

interface Props {
  initialRequests: EmployeeRequestItem[]
  initialSummary: EmployeeRequestsSummary
  employees: Employee[]
  currentUser: {
    id: string
    name: string
    role: string
    registrationNumber: string | null
    employeeId: string | null
  }
}

const STATUS_CONFIG: Record<
  RequestStatus,
  {
    label: string
    badgeClass: string
  }
> = {
  OPEN: {
    label: 'Em Aberto',
    badgeClass:
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25',
  },
  IN_PROGRESS: {
    label: 'Em Elaboração',
    badgeClass:
      'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25',
  },
  COMPLETED: {
    label: 'Finalizado & Assinado',
    badgeClass:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25',
  },
  REJECTED: {
    label: 'Indeferido',
    badgeClass:
      'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25',
  },
}

const TYPE_CONFIG: Record<
  DocumentType,
  {
    label: string
    badgeClass: string
  }
> = {
  DECLARATION: {
    label: 'Declaração',
    badgeClass: 'bg-primary/10 text-primary border-primary/20',
  },
  WARNING: {
    label: 'Advertência / Disciplinar',
    badgeClass:
      'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
  },
  RECEIPT: {
    label: 'Recibo / Comprovante',
    badgeClass:
      'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
  },
}

interface DocumentTemplatePreset {
  key: string
  type: DocumentType
  title: string
  buildContent: (emp?: {
    fullName: string
    cpf: string
    registrationNumber: string
    roleTitle: string
  }) => string
}

const DOCUMENT_TEMPLATES: DocumentTemplatePreset[] = [
  {
    key: 'DECLARATION_VINCULO',
    type: 'DECLARATION',
    title: 'Declaração de Vínculo Empregatício',
    buildContent: (emp) =>
      `Declaramos para os devidos fins que ${emp?.fullName || '[NOME DO COLABORADOR]'}, inscrito(a) no CPF sob o nº ${emp?.cpf || '[CPF]'} e portador(a) da matrícula institucional ${emp?.registrationNumber || '[MATRÍCULA]'}, é colaborador(a) integrante do quadro efetivo da empresa GERENCIACLIN LTDA (CNPJ 35.676.026/0001-23), exercendo regularmente o cargo de ${emp?.roleTitle || '[CARGO]'}.\n\nPor ser expressão da verdade, firmamos a presente declaração eletronicamente para que produza seus efeitos legais.`,
  },
  {
    key: 'DECLARATION_HORARIO',
    type: 'DECLARATION',
    title: 'Declaração de Jornada e Horário de Trabalho',
    buildContent: (emp) =>
      `Declaramos para os devidos fins de comprovação junto a instituições de ensino, órgãos públicos ou terceiros que ${emp?.fullName || '[NOME DO COLABORADOR]'}, inscrito(a) no CPF sob o nº ${emp?.cpf || '[CPF]'} e matrícula ${emp?.registrationNumber || '[MATRÍCULA]'}, exerce a função de ${emp?.roleTitle || '[CARGO]'} na empresa GERENCIACLIN LTDA, cumprindo carga horária semanal de 44 (quarenta e quatro) horas presenciais.\n\nEsta declaração é emitida e assinada eletronicamente pelo Departamento de Recursos Humanos.`,
  },
  {
    key: 'WARNING_ESCRITA',
    type: 'WARNING',
    title: 'Advertência Disciplinar por Escrito',
    buildContent: (emp) =>
      `Pelo presente instrumento de Notificação Disciplinar, a empresa GERENCIACLIN LTDA aplica a ${emp?.fullName || '[NOME DO COLABORADOR]'}, matrícula ${emp?.registrationNumber || '[MATRÍCULA]'}, ocupante do cargo de ${emp?.roleTitle || '[CARGO]'}, a medida de ADVERTÊNCIA POR ESCRITO, nos termos do Art. 482 da Consolidação das Leis do Trabalho (CLT), em razão do descumprimento de normas internas e deveres contratuais verificados na presente data.\n\nSolicitamos que o(a) colaborador(a) observe rigorosamente os procedimentos operacionais da empresa, evitando a reincidência de faltas disciplinares que possam ensejar medidas mais severas.`,
  },
  {
    key: 'WARNING_SUSPENSAO',
    type: 'WARNING',
    title: 'Comunicado de Suspensão Disciplinar',
    buildContent: (emp) =>
      `Comunicamos a ${emp?.fullName || '[NOME DO COLABORADOR]'}, CPF ${emp?.cpf || '[CPF]'}, matrícula ${emp?.registrationNumber || '[MATRÍCULA]'}, que por motivo de reincidência em falta disciplinar no exercício da função de ${emp?.roleTitle || '[CARGO]'}, fica aplicada a penalidade de SUSPENSÃO DISCIPLINAR, nos termos do Art. 474 e Art. 482 da CLT.\n\nCiente da presente comunicação, o(a) colaborador(a) deverá retornar normalmente às suas atividades no primeiro dia útil subsequente ao término da suspensão.`,
  },
  {
    key: 'RECEIPT_PAGAMENTO',
    type: 'RECEIPT',
    title: 'Recibo de Pagamento / Adiantamento',
    buildContent: (emp) =>
      `Recebi da empresa GERENCIACLIN LTDA, inscrita no CNPJ sob o nº 35.676.026/0001-23, a importância discriminada neste comprovante, referente ao pagamento / adiantamento concedido a mim, ${emp?.fullName || '[NOME DO COLABORADOR]'}, CPF ${emp?.cpf || '[CPF]'}, matrícula ${emp?.registrationNumber || '[MATRÍCULA]'}.\n\nPelo presente recibo, dou plena, geral e irrevogável quitação do valor recebido para nada mais reclamar a esse título.`,
  },
  {
    key: 'RECEIPT_EPI',
    type: 'RECEIPT',
    title: 'Recibo de Entrega de Uniforme e EPI',
    buildContent: (emp) =>
      `Declaro que recebi gratuitamente da empresa GERENCIACLIN LTDA, em perfeito estado de conservação e funcionamento, os Equipamentos de Proteção Individual (EPIs) e/ou uniformes institucionais destinados ao exercício da função de ${emp?.roleTitle || '[CARGO]'} (${emp?.fullName || '[NOME DO COLABORADOR]'} — Matrícula ${emp?.registrationNumber || '[MATRÍCULA]'}).\n\nComprometo-me a utilizá-los exclusivamente durante a jornada de trabalho, zelando por sua guarda e conservação, nos termos da NR-06 do Ministério do Trabalho.`,
  },
]

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

export function EmployeeRequestsContent({
  initialRequests,
  initialSummary,
  employees,
  currentUser,
}: Props) {
  const isHrManager =
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'MANAGER' ||
    currentUser.role === 'HR'

  const [requests, setRequests] =
    useState<EmployeeRequestItem[]>(initialRequests)
  const [summary, setSummary] = useState(initialSummary)

  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | RequestStatus>('ALL')
  const [typeFilter, setTypeFilter] = useState<'ALL' | DocumentType>('ALL')
  const [employeeFilter, setEmployeeFilter] = useState<string>('ALL')
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Create Request / Issue Document Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(
    currentUser.employeeId || employees[0]?.id || ''
  )
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(
    'DECLARATION_VINCULO'
  )
  const [reqType, setReqType] = useState<DocumentType>('DECLARATION')
  const [reqTitle, setReqTitle] = useState<string>(
    'Declaração de Vínculo Empregatício'
  )
  const [reqDescription, setReqDescription] = useState<string>('')
  const [reqDocumentContent, setReqDocumentContent] = useState<string>('')
  const [reqAutoComplete, setReqAutoComplete] = useState<boolean>(isHrManager)
  const [extraAmount, setExtraAmount] = useState<string>('')
  const [extraReferenceItem, setExtraReferenceItem] = useState<string>('')
  const [extraOccurrenceDate, setExtraOccurrenceDate] = useState<string>('')
  const [extraReason, setExtraReason] = useState<string>('')
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false)

  // HR Elaborate / Finalize Modal State
  const [managingRequest, setManagingRequest] =
    useState<EmployeeRequestItem | null>(null)
  const [manageStatus, setManageStatus] = useState<RequestStatus>('COMPLETED')
  const [manageTitle, setManageTitle] = useState<string>('')
  const [manageContent, setManageContent] = useState<string>('')
  const [manageRejectionReason, setManageRejectionReason] = useState<string>('')
  const [isSavingManage, setIsSavingManage] = useState(false)

  async function loadRequests(overrides?: {
    search?: string
    status?: 'ALL' | RequestStatus
    type?: 'ALL' | DocumentType
    employeeId?: string
  }) {
    setIsLoadingList(true)
    try {
      const targetSearch = overrides?.search ?? search
      const targetStatus = overrides?.status ?? statusFilter
      const targetType = overrides?.type ?? typeFilter
      const targetEmp = overrides?.employeeId ?? employeeFilter

      const res = await fetchEmployeeRequestsAction({
        search: targetSearch.trim() || undefined,
        status: targetStatus === 'ALL' ? undefined : targetStatus,
        type: targetType === 'ALL' ? undefined : targetType,
        employeeId: targetEmp === 'ALL' ? undefined : targetEmp,
      })

      if (res.success && res.requests) {
        setRequests(res.requests)
        if (res.summary) setSummary(res.summary)
      } else {
        toast.error(res.message || 'Erro ao carregar solicitações.')
      }
    } finally {
      setIsLoadingList(false)
    }
  }

  function applyTemplatePreset(templateKey: string, empId: string) {
    const preset = DOCUMENT_TEMPLATES.find((t) => t.key === templateKey)
    if (!preset) return

    const emp = employees.find((e) => e.id === empId)
    setSelectedTemplateKey(preset.key)
    setReqType(preset.type)
    setReqTitle(preset.title)
    setReqDocumentContent(preset.buildContent(emp))
  }

  function openCreateModal() {
    const defaultEmpId = currentUser.employeeId || employees[0]?.id || ''
    setSelectedEmployeeId(defaultEmpId)
    setReqDescription('')
    setExtraAmount('')
    setExtraReferenceItem('')
    setExtraOccurrenceDate(new Date().toLocaleDateString('pt-BR'))
    setExtraReason('')
    setReqAutoComplete(isHrManager)
    applyTemplatePreset('DECLARATION_VINCULO', defaultEmpId)
    setIsCreateOpen(true)
  }

  async function handleCreateSubmit() {
    if (!reqTitle.trim() || reqTitle.trim().length < 3) {
      toast.error('Informe o título do documento ou solicitação.')
      return
    }
    if (isHrManager && !selectedEmployeeId) {
      toast.error('Selecione o colaborador vinculado ao documento.')
      return
    }

    setIsSubmittingCreate(true)
    try {
      const templateData: Record<string, unknown> = {
        templateKey: selectedTemplateKey,
      }
      if (reqDescription.trim()) {
        templateData.notes = reqDescription.trim()
      }
      if (reqType === 'RECEIPT') {
        if (extraReferenceItem.trim())
          templateData.referenceItem = extraReferenceItem.trim()
      }
      if (reqType === 'WARNING') {
        if (extraOccurrenceDate.trim())
          templateData.occurrenceDate = extraOccurrenceDate.trim()
        if (extraReason.trim()) templateData.reason = extraReason.trim()
        templateData.cltArticle = 'Art. 482 da CLT'
      }

      const finalDescription = isHrManager
        ? reqDocumentContent.trim() || reqDescription.trim() || reqTitle.trim()
        : reqDescription.trim() || reqTitle.trim()

      const parsedAmount =
        reqType === 'RECEIPT' && extraAmount.trim()
          ? Number(extraAmount.replace(',', '.')) || null
          : null

      const res = await createEmployeeRequestAction({
        employeeId: isHrManager ? selectedEmployeeId : undefined,
        type: reqType,
        subtype: selectedTemplateKey,
        title: reqTitle.trim(),
        description: finalDescription,
        amount: parsedAmount,
        templateData,
        status: isHrManager && reqAutoComplete ? 'COMPLETED' : 'OPEN',
      })

      if (res.success && res.request) {
        toast.success(
          res.request.status === 'COMPLETED'
            ? `Documento emitido e assinado eletronicamente! Código: ${res.request.verificationCode}`
            : 'Solicitação registrada com sucesso!'
        )
        setIsCreateOpen(false)
        await loadRequests()
      } else {
        toast.error(res.message || 'Erro ao criar solicitação/documento.')
      }
    } finally {
      setIsSubmittingCreate(false)
    }
  }

  async function handleQuickStartProgress(req: EmployeeRequestItem) {
    setProcessingId(req.id)
    try {
      const res = await updateEmployeeRequestStatusAction(req.id, {
        status: 'IN_PROGRESS',
      })
      if (res.success) {
        toast.success('Solicitação marcada como "Em Elaboração" pelo RH!')
        await loadRequests()
      } else {
        toast.error(res.message || 'Não foi possível atualizar o status.')
      }
    } finally {
      setProcessingId(null)
    }
  }

  function openManageModal(req: EmployeeRequestItem) {
    setManagingRequest(req)
    setManageStatus('COMPLETED')
    setManageTitle(req.title)
    setManageRejectionReason(req.rejectionReason || '')

    if (req.description && req.description.trim().length > 35) {
      setManageContent(req.description)
    } else {
      const matchingPreset =
        DOCUMENT_TEMPLATES.find((t) => t.type === req.type) ||
        DOCUMENT_TEMPLATES[0]
      setManageContent(matchingPreset.buildContent(req.employee))
    }
  }

  async function handleSaveManageStatus() {
    if (!managingRequest) return

    if (manageStatus === 'COMPLETED' && !manageContent.trim()) {
      toast.error(
        'Preencha o texto oficial do documento antes de finalizar e assinar.'
      )
      return
    }
    if (manageStatus === 'REJECTED' && !manageRejectionReason.trim()) {
      toast.error('Informe o motivo do indeferimento para o colaborador.')
      return
    }

    setIsSavingManage(true)
    try {
      const res = await updateEmployeeRequestStatusAction(managingRequest.id, {
        status: manageStatus,
        title: manageTitle.trim() || managingRequest.title,
        description: manageContent.trim() || managingRequest.description,
        rejectionReason:
          manageStatus === 'REJECTED' ? manageRejectionReason.trim() : null,
      })

      if (res.success && res.request) {
        toast.success(
          manageStatus === 'COMPLETED'
            ? `Documento finalizado e assinado eletronicamente (${res.request.verificationCode})!`
            : manageStatus === 'REJECTED'
              ? 'Solicitação indeferida.'
              : 'Status atualizado!'
        )
        setManagingRequest(null)
        await loadRequests()
      } else {
        toast.error(res.message || 'Erro ao atualizar a solicitação.')
      }
    } finally {
      setIsSavingManage(false)
    }
  }

  async function handleDownloadPdf(req: EmployeeRequestItem) {
    setDownloadingId(req.id)
    try {
      await downloadEmployeeDocumentPdf(req)
      toast.success(
        `PDF assinado (${req.verificationCode || req.title}) exportado com sucesso!`
      )
    } catch (err) {
      console.error(err)
      toast.error('Erro ao gerar o PDF assinado.')
    } finally {
      setDownloadingId(null)
    }
  }

  async function handleDeleteRequest(req: EmployeeRequestItem) {
    setProcessingId(req.id)
    try {
      const res = await deleteEmployeeRequestAction(req.id)
      if (res.success) {
        toast.success('Solicitação removida com sucesso.')
        await loadRequests()
      } else {
        toast.error(res.message || 'Não foi possível excluir a solicitação.')
      }
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-outline-variant/20 bg-surface shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              Total de Solicitações
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
              Histórico completo de requisições e emissões
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-surface shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              Em Aberto
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-amber-600">
              {summary.openCount}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Aguardando triagem do RH
            </p>
          </CardContent>
        </Card>

        <Card className="border-sky-500/20 bg-surface shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              Em Elaboração
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-600">
              <PlayCircle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-sky-600">
              {summary.inProgressCount}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Em preparação pela equipe de RH
            </p>
          </CardContent>
        </Card>

        <Card className="border-emerald-500/20 bg-surface shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-on-surface-variant">
              Finalizados & Assinados
            </CardTitle>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <FileCheck2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-display font-bold text-emerald-600">
              {summary.completedCount}
            </div>
            <p className="text-xs text-on-surface-variant mt-1">
              Disponíveis para download em PDF com QR Code
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar & Actions */}
      <Card className="border-outline-variant/20 bg-surface shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="h-4 w-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadRequests()
                  }}
                  placeholder="Buscar por título, matrícula (MASTER-XXXX) ou código MC-DOC..."
                  className="pl-9"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => {
                  const val = e.target.value as 'ALL' | RequestStatus
                  setStatusFilter(val)
                  loadRequests({ status: val })
                }}
                className="h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
              >
                <option value="ALL">Todos os Status</option>
                <option value="OPEN">Em Aberto</option>
                <option value="IN_PROGRESS">Em Elaboração</option>
                <option value="COMPLETED">Finalizados & Assinados</option>
                <option value="REJECTED">Indeferidos</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => {
                  const val = e.target.value as 'ALL' | DocumentType
                  setTypeFilter(val)
                  loadRequests({ type: val })
                }}
                className="h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
              >
                <option value="ALL">Todos os Tipos</option>
                <option value="DECLARATION">Declarações</option>
                <option value="WARNING">Advertências / Disciplinar</option>
                <option value="RECEIPT">Recibos / Comprovantes</option>
              </select>

              {isHrManager && employees.length > 0 && (
                <select
                  value={employeeFilter}
                  onChange={(e) => {
                    const val = e.target.value
                    setEmployeeFilter(val)
                    loadRequests({ employeeId: val })
                  }}
                  className="h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm max-w-[220px]"
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
                onClick={() => loadRequests()}
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
                typeFilter !== 'ALL' ||
                employeeFilter !== 'ALL') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('ALL')
                    setTypeFilter('ALL')
                    setEmployeeFilter('ALL')
                    loadRequests({
                      search: '',
                      status: 'ALL',
                      type: 'ALL',
                      employeeId: 'ALL',
                    })
                  }}
                  className="gap-1.5 text-xs cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Limpar
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {isHrManager && (
                <Link href="/employees">
                  <Button variant="outline" className="gap-2 cursor-pointer">
                    <Users className="h-4 w-4 text-primary" />
                    Quadro de Colaboradores
                  </Button>
                </Link>
              )}

              <Button
                onClick={openCreateModal}
                className="gap-2 cursor-pointer"
              >
                <FilePlus2 className="h-4 w-4" />
                {isHrManager
                  ? 'Emitir / Registrar Documento'
                  : 'Solicitar Documento ao RH'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="border-outline-variant/20 bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-surface-container-low text-on-surface-variant text-xs uppercase border-b border-outline-variant/20">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Colaborador</th>
                <th className="py-3.5 px-4 font-semibold">
                  Tipo & Documento Solicitado
                </th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">
                  Assinatura Eletrônica / QR Code
                </th>
                <th className="py-3.5 px-4 font-semibold">Data</th>
                <th className="py-3.5 px-4 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/15">
              {requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-on-surface-variant"
                  >
                    Nenhuma solicitação ou documento encontrado.
                  </td>
                </tr>
              ) : (
                requests.map((req) => {
                  const statusCfg = STATUS_CONFIG[req.status]
                  const typeCfg = TYPE_CONFIG[req.type]

                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-surface-container-lowest/60 transition-colors"
                    >
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-semibold text-on-surface">
                          {req.employee.fullName}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-primary">
                            <IdCard className="h-3 w-3" />
                            {req.employee.registrationNumber}
                          </span>
                          <span className="text-xs text-on-surface-variant">
                            {req.employee.roleTitle}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold ${typeCfg.badgeClass}`}
                        >
                          {req.type === 'WARNING' ? (
                            <AlertTriangle className="h-3 w-3" />
                          ) : req.type === 'RECEIPT' ? (
                            <Receipt className="h-3 w-3" />
                          ) : (
                            <FileText className="h-3 w-3" />
                          )}
                          {typeCfg.label}
                        </span>
                        <div className="font-semibold text-on-surface mt-1">
                          {req.title}
                        </div>
                        {req.description && (
                          <div className="text-xs text-on-surface-variant line-clamp-2 mt-0.5">
                            {req.description}
                          </div>
                        )}
                        {req.status === 'REJECTED' && req.rejectionReason && (
                          <div className="text-xs text-rose-600 font-medium mt-1">
                            Motivo do Indeferimento: {req.rejectionReason}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusCfg.badgeClass}`}
                        >
                          {req.status === 'COMPLETED' ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : req.status === 'REJECTED' ? (
                            <XCircle className="h-3.5 w-3.5" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                          {statusCfg.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 align-middle">
                        {req.status === 'COMPLETED' && req.verificationCode ? (
                          <div>
                            <Link
                              href={`/verify/${req.verificationCode}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline"
                            >
                              <QrCode className="h-3.5 w-3.5" />
                              {req.verificationCode}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                            <div className="text-[11px] text-on-surface-variant mt-0.5">
                              Assinado por {req.issuedBy?.name || 'RH'} em{' '}
                              {formatDateTimeBr(req.signedAt)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-on-surface-variant italic">
                            Aguardando assinatura eletrônica
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-middle text-xs text-on-surface-variant">
                        <div>Solicitado: {formatDateTimeBr(req.createdAt)}</div>
                        <div>Por: {req.requestedBy.name}</div>
                      </td>

                      <td className="py-3.5 px-4 align-middle text-right">
                        <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                          {req.status === 'COMPLETED' && (
                            <Button
                              size="sm"
                              onClick={() => handleDownloadPdf(req)}
                              disabled={downloadingId === req.id}
                              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                            >
                              {downloadingId === req.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <FileDown className="h-3.5 w-3.5" />
                              )}
                              Baixar PDF Assinado
                            </Button>
                          )}

                          {isHrManager && req.status === 'OPEN' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleQuickStartProgress(req)}
                              disabled={processingId === req.id}
                              className="gap-1 text-xs text-sky-600 cursor-pointer"
                            >
                              <PlayCircle className="h-3.5 w-3.5" />
                              Assumir
                            </Button>
                          )}

                          {isHrManager && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openManageModal(req)}
                              className="gap-1 text-xs cursor-pointer"
                            >
                              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                              {req.status === 'COMPLETED'
                                ? 'Reemitir / Editar'
                                : 'Elaborar & Assinar'}
                            </Button>
                          )}

                          {(isHrManager || req.status === 'OPEN') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteRequest(req)}
                              disabled={processingId === req.id}
                              title="Excluir Solicitação"
                              className="text-rose-600 hover:text-rose-700 h-8 w-8 p-0 cursor-pointer"
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
      </Card>

      {/* Modal: Create Request (Collaborator) OR Direct Document Emission (HR) */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">
              {isHrManager
                ? 'Emitir / Registrar Documento Oficial de RH'
                : 'Nova Solicitação de Documento ao RH'}
            </DialogTitle>
            <DialogDescription>
              {isHrManager
                ? 'Selecione um modelo pré-pronto (Declaração, Advertência ou Recibo), revise os dados e assine eletronicamente com QR Code verificável.'
                : 'Escolha o documento desejado. Assim que o RH finalizar e assinar eletronicamente, o botão de download em PDF ficará disponível.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {isHrManager && (
              <div className="space-y-1">
                <Label>Colaborador Destinatário *</Label>
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => {
                    const nextEmpId = e.target.value
                    setSelectedEmployeeId(nextEmpId)
                    applyTemplatePreset(selectedTemplateKey, nextEmpId)
                  }}
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
                <Label>Modelo Pré-Pronto (Template)</Label>
                <select
                  value={selectedTemplateKey}
                  onChange={(e) =>
                    applyTemplatePreset(e.target.value, selectedEmployeeId)
                  }
                  className="w-full h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                >
                  {DOCUMENT_TEMPLATES.filter((t) =>
                    isHrManager ? true : t.type !== 'WARNING'
                  ).map((tpl) => (
                    <option key={tpl.key} value={tpl.key}>
                      {tpl.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label>Categoria do Documento *</Label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value as DocumentType)}
                  className="w-full h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                >
                  <option value="DECLARATION">Declaração Institucional</option>
                  {isHrManager && (
                    <option value="WARNING">
                      Advertência / Medida Disciplinar
                    </option>
                  )}
                  <option value="RECEIPT">Recibo / Comprovante</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Título do Documento *</Label>
              <Input
                value={reqTitle}
                onChange={(e) => setReqTitle(e.target.value)}
                placeholder="Ex: Declaração de Vínculo Empregatício"
              />
            </div>

            {isHrManager && reqType === 'WARNING' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-rose-500/5 border border-rose-500/20 p-3 rounded-lg">
                <div className="space-y-1">
                  <Label>Data da Ocorrência</Label>
                  <Input
                    value={extraOccurrenceDate}
                    onChange={(e) => setExtraOccurrenceDate(e.target.value)}
                    placeholder="Ex: 14/11/2026"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Motivo / Enquadramento</Label>
                  <Input
                    value={extraReason}
                    onChange={(e) => setExtraReason(e.target.value)}
                    placeholder="Ex: Descumprimento de horário / normas"
                  />
                </div>
              </div>
            )}

            {reqType === 'RECEIPT' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-lg">
                <div className="space-y-1">
                  <Label>Valor em R$ (Opcional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={extraAmount}
                    onChange={(e) => setExtraAmount(e.target.value)}
                    placeholder="Ex: 450.00"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Referente a / Item Entregue</Label>
                  <Input
                    value={extraReferenceItem}
                    onChange={(e) => setExtraReferenceItem(e.target.value)}
                    placeholder="Ex: Vale-Transporte / Uniforme / EPI"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label>
                {isHrManager
                  ? 'Observações Internas / Finalidade (Opcional)'
                  : 'Finalidade / Observações para o RH'}
              </Label>
              <Textarea
                value={reqDescription}
                onChange={(e) => setReqDescription(e.target.value)}
                rows={2}
                placeholder="Ex: Necessário para matrícula na faculdade / comprovação de vínculo..."
              />
            </div>

            {isHrManager && (
              <>
                <div className="space-y-1">
                  <Label>
                    Texto Formal do Documento (Será impresso no PDF) *
                  </Label>
                  <Textarea
                    value={reqDocumentContent}
                    onChange={(e) => setReqDocumentContent(e.target.value)}
                    rows={6}
                  />
                </div>

                <label className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reqAutoComplete}
                    onChange={(e) => setReqAutoComplete(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    Finalizar e Assinar Eletronicamente agora (gera Código de
                    Verificação + Hash SHA-256 + QR Code imediatamente)
                  </span>
                </label>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={isSubmittingCreate}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={isSubmittingCreate}
              className="gap-2 cursor-pointer"
            >
              {isSubmittingCreate && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {isHrManager && reqAutoComplete
                ? 'Emitir & Assinar Eletronicamente'
                : 'Registrar Solicitação'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: HR Elaborate & Sign Request */}
      <Dialog
        open={Boolean(managingRequest)}
        onOpenChange={(open) => !open && setManagingRequest(null)}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-display">
              Elaboração & Assinatura Eletrônica de Documento
            </DialogTitle>
            <DialogDescription>
              Colaborador:{' '}
              <strong>
                {managingRequest?.employee.fullName} (
                {managingRequest?.employee.registrationNumber})
              </strong>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Novo Status da Solicitação *</Label>
                <select
                  value={manageStatus}
                  onChange={(e) =>
                    setManageStatus(e.target.value as RequestStatus)
                  }
                  className="w-full h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                >
                  <option value="COMPLETED">
                    Finalizado & Assinado Eletronicamente (Liberar Download PDF)
                  </option>
                  <option value="IN_PROGRESS">Em Elaboração pelo RH</option>
                  <option value="REJECTED">Indeferir Solicitação</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label>Carregar Modelo Pré-Pronto</Label>
                <select
                  defaultValue=""
                  onChange={(e) => {
                    const tpl = DOCUMENT_TEMPLATES.find(
                      (t) => t.key === e.target.value
                    )
                    if (tpl && managingRequest) {
                      setManageTitle(tpl.title)
                      setManageContent(
                        tpl.buildContent(managingRequest.employee)
                      )
                    }
                  }}
                  className="w-full h-10 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 text-sm"
                >
                  <option value="">Manter texto atual...</option>
                  {DOCUMENT_TEMPLATES.map((tpl) => (
                    <option key={tpl.key} value={tpl.key}>
                      {tpl.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Título Oficial no Documento *</Label>
              <Input
                value={manageTitle}
                onChange={(e) => setManageTitle(e.target.value)}
              />
            </div>

            {manageStatus === 'REJECTED' ? (
              <div className="space-y-1">
                <Label>Motivo do Indeferimento *</Label>
                <Textarea
                  value={manageRejectionReason}
                  onChange={(e) => setManageRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="Informe o motivo pelo qual a solicitação não pôde ser atendida..."
                />
              </div>
            ) : (
              <div className="space-y-1">
                <Label>Conteúdo Formal do Documento (Corpo do PDF) *</Label>
                <Textarea
                  value={manageContent}
                  onChange={(e) => setManageContent(e.target.value)}
                  rows={7}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20">
            <Button
              variant="outline"
              onClick={() => setManagingRequest(null)}
              disabled={isSavingManage}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveManageStatus}
              disabled={isSavingManage}
              className="gap-2 cursor-pointer"
            >
              {isSavingManage && <Loader2 className="h-4 w-4 animate-spin" />}
              {manageStatus === 'COMPLETED'
                ? 'Assinar Eletronicamente & Liberar PDF'
                : 'Salvar Status'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
