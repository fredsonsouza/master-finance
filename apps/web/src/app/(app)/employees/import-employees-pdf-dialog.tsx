'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  type ParsedEmployeeRecord,
  cleanCpfDigits,
  extractEmployeesFromPdfFile,
  formatCpfMask,
  validateParsedEmployee,
} from '@/utils/employee-pdf-parser'
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Loader2,
  Pencil,
  Search,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  checkEmployeeCpfsBatchAction,
  importEmployeesBatchAction,
} from './actions'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => Promise<void> | void
}

type PreviewFilter = 'ALL' | 'READY' | 'ISSUES' | 'EXISTING' | 'INACTIVE'

interface ImportSummary {
  importedCount: number
  updatedCount: number
  skippedCount: number
  errorCount: number
  errors: Array<{ fullName: string; cpf: string; reason: string }>
}

const CHUNK_SIZE = 20

function formatDateBr(iso?: string | null): string {
  if (!iso) return '-'
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return iso
  return `${m[3]}/${m[2]}/${m[1]}`
}

function formatBrl(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0)
}

export function ImportEmployeesPdfDialog({
  open,
  onOpenChange,
  onImported,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [isParsing, setIsParsing] = useState(false)
  const [parseProgress, setParseProgress] = useState({
    fileName: '',
    currentPage: 0,
    totalPages: 0,
  })
  const [possibleScanned, setPossibleScanned] = useState(false)
  const [metaStats, setMetaStats] = useState<{
    totalPages: number
    employeePages: number
    schedulePages: number
  } | null>(null)

  const [records, setRecords] = useState<ParsedEmployeeRecord[]>([])
  const [existingCpfs, setExistingCpfs] = useState<Set<string>>(new Set())
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [skipExisting, setSkipExisting] = useState(true)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [filter, setFilter] = useState<PreviewFilter>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  const [editingRecord, setEditingRecord] =
    useState<ParsedEmployeeRecord | null>(null)

  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({
    currentBatch: 0,
    totalBatches: 0,
    processed: 0,
    total: 0,
  })
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  function resetState() {
    setIsParsing(false)
    setParseProgress({ fileName: '', currentPage: 0, totalPages: 0 })
    setPossibleScanned(false)
    setMetaStats(null)
    setRecords([])
    setExistingCpfs(new Set())
    setSelectedIds(new Set())
    setFilter('ALL')
    setSearchTerm('')
    setEditingRecord(null)
    setIsImporting(false)
    setImportProgress({
      currentBatch: 0,
      totalBatches: 0,
      processed: 0,
      total: 0,
    })
    setSummary(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleClose(nextOpen: boolean) {
    if (isParsing || isImporting) return
    if (!nextOpen) {
      resetState()
    }
    onOpenChange(nextOpen)
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return

    const pdfFiles = Array.from(fileList).filter(
      (f) =>
        f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    )
    if (pdfFiles.length === 0) {
      toast.error('Selecione pelo menos um arquivo PDF válido.')
      return
    }

    setIsParsing(true)
    setSummary(null)
    setPossibleScanned(false)
    setRecords([])
    setSelectedIds(new Set())

    try {
      const allEmployees: ParsedEmployeeRecord[] = []
      let totalPages = 0
      let employeePages = 0
      let schedulePages = 0
      let anyScanned = false

      for (const file of pdfFiles) {
        setParseProgress({ fileName: file.name, currentPage: 0, totalPages: 0 })
        const result = await extractEmployeesFromPdfFile(
          file,
          (currentPage, total) => {
            setParseProgress({
              fileName: file.name,
              currentPage,
              totalPages: total,
            })
          }
        )

        totalPages += result.totalPages
        employeePages += result.recognizedEmployeePages
        schedulePages += result.recognizedSchedulePages
        if (result.possibleScannedPdf) anyScanned = true

        // Ensure unique IDs across multiple files
        for (const emp of result.employees) {
          allEmployees.push({
            ...emp,
            id: `${file.name}-${emp.id}-${allEmployees.length}`,
          })
        }
      }

      setMetaStats({ totalPages, employeePages, schedulePages })
      setPossibleScanned(anyScanned)

      if (allEmployees.length === 0) {
        toast.warning(
          anyScanned
            ? 'Nenhuma ficha legível encontrada. O PDF parece ser escaneado (imagem).'
            : 'Nenhuma ficha no padrão REGISTRO DE EMPREGADO foi encontrada no PDF.'
        )
        return
      }

      // Check existing CPFs in database in chunks of 400
      const uniqueCpfs = Array.from(
        new Set(
          allEmployees
            .map((e) => cleanCpfDigits(e.cpf))
            .filter((c) => c.length === 11)
        )
      )

      const existingSet = new Set<string>()
      for (let i = 0; i < uniqueCpfs.length; i += 400) {
        const chunk = uniqueCpfs.slice(i, i + 400)
        const checkRes = await checkEmployeeCpfsBatchAction(chunk)
        if (checkRes.success) {
          for (const cpf of checkRes.existingCpfs) {
            existingSet.add(cpf)
          }
        }
      }

      setExistingCpfs(existingSet)
      setRecords(allEmployees)

      // Auto-select valid records (including existing ones when updateExisting is enabled)
      const initialSelected = new Set<string>()
      const seenInSelection = new Set<string>()
      for (const emp of allEmployees) {
        const cpf = cleanCpfDigits(emp.cpf)
        const isExisting = cpf.length === 11 && existingSet.has(cpf)
        const isDuplicateInPdf = cpf.length === 11 && seenInSelection.has(cpf)
        if (
          emp.errors.length === 0 &&
          (updateExisting || !isExisting) &&
          !isDuplicateInPdf
        ) {
          initialSelected.add(emp.id)
          seenInSelection.add(cpf)
        }
      }
      setSelectedIds(initialSelected)

      toast.success(
        `${allEmployees.length} ficha(s) identificada(s) em ${totalPages} página(s).`
      )
    } catch (err) {
      console.error(err)
      toast.error(
        'Não foi possível ler o arquivo PDF. Verifique se o arquivo não está corrompido ou protegido por senha.'
      )
    } finally {
      setIsParsing(false)
    }
  }

  const counts = useMemo(() => {
    let ready = 0
    let issues = 0
    let existing = 0
    let inactive = 0

    for (const rec of records) {
      const isExisting = rec.cpf.length === 11 && existingCpfs.has(rec.cpf)
      if (isExisting) existing += 1
      if (rec.errors.length > 0) issues += 1
      if (rec.errors.length === 0 && !isExisting) ready += 1
      if (rec.status === 'INACTIVE') inactive += 1
    }

    return {
      all: records.length,
      ready,
      issues,
      existing,
      inactive,
    }
  }, [records, existingCpfs])

  const filteredRecords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    const qDigits = q.replace(/\D/g, '')

    return records.filter((rec) => {
      const isExisting = rec.cpf.length === 11 && existingCpfs.has(rec.cpf)

      if (filter === 'READY' && (rec.errors.length > 0 || isExisting)) {
        return false
      }
      if (filter === 'ISSUES' && rec.errors.length === 0) {
        return false
      }
      if (filter === 'EXISTING' && !isExisting) {
        return false
      }
      if (filter === 'INACTIVE' && rec.status !== 'INACTIVE') {
        return false
      }

      if (!q) return true
      return (
        rec.fullName.toLowerCase().includes(q) ||
        rec.roleTitle.toLowerCase().includes(q) ||
        (qDigits.length > 0 && rec.cpf.includes(qDigits))
      )
    })
  }, [records, existingCpfs, filter, searchTerm])

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAllFiltered() {
    const selectable = filteredRecords.filter((rec) => {
      const isExisting = rec.cpf.length === 11 && existingCpfs.has(rec.cpf)
      return (
        rec.errors.length === 0 &&
        (updateExisting || !(skipExisting && isExisting))
      )
    })
    const allSelected =
      selectable.length > 0 && selectable.every((r) => selectedIds.has(r.id))

    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const r of selectable) {
        if (allSelected) next.delete(r.id)
        else next.add(r.id)
      }
      return next
    })
  }

  function handleRemoveRecord(id: string) {
    setRecords((prev) => prev.filter((r) => r.id !== id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  function handleSaveEditedRecord() {
    if (!editingRecord) return
    const validated = validateParsedEmployee({
      ...editingRecord,
      status: editingRecord.terminationDate ? 'INACTIVE' : editingRecord.status,
    })

    setRecords((prev) =>
      prev.map((r) => (r.id === validated.id ? validated : r))
    )

    const isExisting =
      validated.cpf.length === 11 && existingCpfs.has(validated.cpf)
    if (validated.errors.length === 0 && !isExisting) {
      setSelectedIds((prev) => new Set(prev).add(validated.id))
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        next.delete(validated.id)
        return next
      })
    }

    setEditingRecord(null)
    toast.success('Registro atualizado na pré-visualização.')
  }

  async function handleStartImport() {
    const toImport = records.filter(
      (r) => selectedIds.has(r.id) && r.errors.length === 0
    )

    if (toImport.length === 0) {
      toast.error('Nenhum colaborador válido selecionado para importação.')
      return
    }

    setIsImporting(true)
    const totalBatches = Math.ceil(toImport.length / CHUNK_SIZE)
    setImportProgress({
      currentBatch: 0,
      totalBatches,
      processed: 0,
      total: toImport.length,
    })

    let totalImported = 0
    let totalUpdated = 0
    let totalSkipped = 0
    let totalErrors = 0
    const allErrors: Array<{ fullName: string; cpf: string; reason: string }> =
      []

    try {
      for (let i = 0; i < toImport.length; i += CHUNK_SIZE) {
        const batchIndex = Math.floor(i / CHUNK_SIZE) + 1
        const chunk = toImport.slice(i, i + CHUNK_SIZE)

        setImportProgress({
          currentBatch: batchIndex,
          totalBatches,
          processed: i,
          total: toImport.length,
        })

        const payloadItems = chunk.map((rec) => ({
          esocialCode: rec.esocialCode,
          employerName: rec.employerName,
          employerCnpj: rec.employerCnpj,
          employerAddress: rec.employerAddress,
          fullName: rec.fullName,
          birthDate: rec.birthDate,
          birthPlace: rec.birthPlace,
          nationality: rec.nationality,
          maritalStatus: rec.maritalStatus,
          raceColor: rec.raceColor,
          gender: rec.gender,
          educationLevel: rec.educationLevel,
          fatherName: rec.fatherName,
          motherName: rec.motherName,
          address: rec.address,
          zipCode: rec.zipCode,
          landlinePhone: rec.landlinePhone,
          mobilePhone: rec.mobilePhone,
          email: rec.email,
          beneficiaries: rec.beneficiaries,
          cpf: rec.cpf,
          rgNumber: rec.rgNumber,
          rgIssueDate: rec.rgIssueDate,
          rgIssuer: rec.rgIssuer,
          ctpsNumber: rec.ctpsNumber,
          ctpsSeries: rec.ctpsSeries,
          ctpsIssueDate: rec.ctpsIssueDate,
          ctpsState: rec.ctpsState,
          voterRegistration: rec.voterRegistration,
          voterZone: rec.voterZone,
          voterSection: rec.voterSection,
          cnhNumber: rec.cnhNumber,
          cnhCategory: rec.cnhCategory,
          militaryDoc: rec.militaryDoc,
          militaryCategory: rec.militaryCategory,
          classCouncilNumber: rec.classCouncilNumber,
          admissionDate: rec.admissionDate,
          roleTitle: rec.roleTitle,
          cboCode: rec.cboCode,
          salary: rec.salary,
          paymentType: rec.paymentType,
          workHoursSummary: rec.workHoursSummary,
          breakHoursSummary: rec.breakHoursSummary,
          fgtsOptionDate: rec.fgtsOptionDate,
          fgtsRectificationDate: rec.fgtsRectificationDate,
          fgtsBankAccount: rec.fgtsBankAccount,
          pisRegistrationDate: rec.pisRegistrationDate,
          pisNumber: rec.pisNumber,
          pisBankName: rec.pisBankName,
          pisBankNumber: rec.pisBankNumber,
          pisBankBranch: rec.pisBankBranch,
          pisBankAddress: rec.pisBankAddress,
          workSchedule: rec.workSchedule,
          generalObservations: rec.generalObservations,
          status: rec.status,
          terminationDate: rec.terminationDate,
          terminationType: rec.terminationType,
        }))

        const res = await importEmployeesBatchAction({
          skipExisting,
          updateExisting,
          employees: payloadItems,
        })

        if (res.success) {
          totalImported += res.result.importedCount
          totalUpdated += res.result.updatedCount
          totalSkipped += res.result.skippedCount
          totalErrors += res.result.errorCount
          allErrors.push(...res.result.errors)
        } else {
          totalErrors += chunk.length
          for (const rec of chunk) {
            allErrors.push({
              fullName: rec.fullName,
              cpf: rec.cpf,
              reason: res.message,
            })
          }
        }
      }

      setImportProgress({
        currentBatch: totalBatches,
        totalBatches,
        processed: toImport.length,
        total: toImport.length,
      })

      setSummary({
        importedCount: totalImported,
        updatedCount: totalUpdated,
        skippedCount: totalSkipped,
        errorCount: totalErrors,
        errors: allErrors,
      })

      if (totalImported > 0 || totalUpdated > 0) {
        toast.success(
          `Concluído: ${totalImported} novo(s) cadastrado(s) e ${totalUpdated} atualizado(s)!`
        )
        await onImported()
      } else if (totalErrors > 0) {
        toast.error(
          `Nenhum colaborador foi importado. ${totalErrors} erro(s) encontrado(s).`
        )
      } else {
        toast.info(
          'Todos os colaboradores selecionados já estavam cadastrados.'
        )
      }
    } finally {
      setIsImporting(false)
    }
  }

  function handleFillMissingRoles() {
    const nextRecords = records.map((rec) => {
      if (rec.roleTitle && rec.roleTitle.trim().length >= 2) return rec
      return validateParsedEmployee({
        ...rec,
        roleTitle: 'A definir (RH)',
      })
    })
    setRecords(nextRecords)

    const nextSelected = new Set(selectedIds)
    const seenCpfs = new Set<string>()
    for (const rec of nextRecords) {
      const cpf = cleanCpfDigits(rec.cpf)
      const isExisting = cpf.length === 11 && existingCpfs.has(cpf)
      const isDup = cpf.length === 11 && seenCpfs.has(cpf)
      if (rec.errors.length === 0 && !isExisting && !isDup) {
        nextSelected.add(rec.id)
        seenCpfs.add(cpf)
      }
    }
    setSelectedIds(nextSelected)
    toast.success(
      'Funções vazias preenchidas como "A definir (RH)" para revisão posterior.'
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] !flex flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 px-6 pt-5 pb-3.5 border-b border-outline-variant/20">
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle className="text-lg font-display">
              Importar Fichas de Registro via PDF
            </DialogTitle>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 border border-amber-500/30">
              Migração Temporária · Admin
            </span>
          </div>
          <DialogDescription className="text-xs sm:text-sm">
            Leitura calibrada para o PDF padrão{' '}
            <strong>REGISTRO DE EMPREGADO</strong> (GERENCIACLIN LTDA). Unidade,
            departamento e conta de acesso permanecem vazios para revisão
            posterior do RH.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Upload Zone (initial or re-upload) */}
          {records.length === 0 && !isParsing && !summary && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  handleFilesSelected(e.dataTransfer.files)
                }}
                className="w-full border-2 border-dashed border-outline-variant/40 hover:border-primary/60 rounded-xl p-10 text-center cursor-pointer transition-colors bg-surface-container-lowest"
              >
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <FileUp className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-on-surface">
                  Clique para selecionar ou arraste o arquivo PDF das fichas
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Suporta arquivo único consolidado (~200 páginas / vários MB)
                  ou múltiplos PDFs individuais. O processamento ocorre no
                  navegador.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFilesSelected(e.target.files)}
                />
              </button>

              <div className="rounded-lg border border-outline-variant/20 bg-surface-container-low/50 p-3.5 text-xs text-on-surface-variant space-y-1.5">
                <p className="font-semibold text-on-surface">
                  Como funciona a migração segura:
                </p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    Cada colaborador com{' '}
                    <strong>Rescisão → Data da saída</strong> preenchida é
                    detectado automaticamente como <strong>Inativo</strong>.
                  </li>
                  <li>
                    CPFs já cadastrados no banco são sinalizados na prévia e
                    ignorados automaticamente para evitar duplicidade.
                  </li>
                  <li>
                    Nenhum usuário de login é criado automaticamente; Unidade e
                    Departamento ficam em branco para conferência do RH.
                  </li>
                  <li>
                    Os envios são divididos automaticamente em lotes leves de{' '}
                    {CHUNK_SIZE} colaboradores por requisição.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Parsing Progress */}
          {isParsing && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  Analisando PDF no navegador...
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  {parseProgress.fileName}
                  {parseProgress.totalPages > 0
                    ? ` — página ${parseProgress.currentPage} de ${parseProgress.totalPages}`
                    : ''}
                </p>
              </div>
              {parseProgress.totalPages > 0 && (
                <div className="w-full max-w-md h-2 rounded-full bg-surface-container-high overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-150"
                    style={{
                      width: `${Math.round(
                        (parseProgress.currentPage / parseProgress.totalPages) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Final Summary */}
          {summary && !isImporting && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="flex items-center gap-2 text-emerald-700 text-xs font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Novos cadastrados
                  </div>
                  <p className="text-2xl font-display font-bold text-emerald-700 mt-1">
                    {summary.importedCount}
                  </p>
                </div>

                <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4">
                  <div className="flex items-center gap-2 text-sky-700 text-xs font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Atualizados
                  </div>
                  <p className="text-2xl font-display font-bold text-sky-700 mt-1">
                    {summary.updatedCount}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <div className="flex items-center gap-2 text-amber-700 text-xs font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    Ignorados
                  </div>
                  <p className="text-2xl font-display font-bold text-amber-700 mt-1">
                    {summary.skippedCount}
                  </p>
                </div>

                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                  <div className="flex items-center gap-2 text-rose-700 text-xs font-medium">
                    <XCircle className="h-4 w-4" />
                    Erros
                  </div>
                  <p className="text-2xl font-display font-bold text-rose-700 mt-1">
                    {summary.errorCount}
                  </p>
                </div>
              </div>

              {summary.errors.length > 0 && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-2">
                  <p className="text-xs font-semibold text-rose-700">
                    Detalhes dos erros ({summary.errors.length}):
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
                    {summary.errors.map((err, idx) => (
                      <div
                        key={`${err.cpf}-${idx}`}
                        className="flex items-center justify-between gap-2 py-1 border-b border-rose-500/10 last:border-0"
                      >
                        <span className="font-medium text-on-surface">
                          {err.fullName} ({formatCpfMask(err.cpf)})
                        </span>
                        <span className="text-rose-700">{err.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetState}
                  className="cursor-pointer"
                >
                  Importar outro PDF
                </Button>
                <Button
                  type="button"
                  onClick={() => handleClose(false)}
                  className="cursor-pointer"
                >
                  Concluir
                </Button>
              </div>
            </div>
          )}

          {/* Importing Progress */}
          {isImporting && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div>
                <p className="text-sm font-semibold text-on-surface">
                  Importando colaboradores...
                </p>
                <p className="text-xs text-on-surface-variant mt-1">
                  Lote {importProgress.currentBatch} de{' '}
                  {importProgress.totalBatches} ({importProgress.processed} de{' '}
                  {importProgress.total} enviados)
                </p>
              </div>
              <div className="w-full max-w-md h-2 rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-200"
                  style={{
                    width: `${
                      importProgress.total > 0
                        ? Math.round(
                            (importProgress.processed / importProgress.total) *
                              100
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Preview & Inline Edit */}
          {records.length > 0 && !isParsing && !isImporting && !summary && (
            <div className="space-y-3">
              {possibleScanned && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  Algumas páginas possuem pouco texto selecionável (possível
                  trecho escaneado). Revise os registros marcados com atenção.
                </div>
              )}

              {/* Stats & Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      ['ALL', `Todos (${counts.all})`],
                      ['READY', `Prontos (${counts.ready})`],
                      ['ISSUES', `Com erro (${counts.issues})`],
                      ['EXISTING', `Já cadastrados (${counts.existing})`],
                      ['INACTIVE', `Desligados (${counts.inactive})`],
                    ] as Array<[PreviewFilter, string]>
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter(key)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        filter === key
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative w-56">
                    <Search className="h-3.5 w-3.5 text-on-surface-variant absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filtrar nome, CPF ou função..."
                      className="h-8 pl-8 text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetState}
                    className="h-8 text-xs cursor-pointer"
                  >
                    Trocar PDF
                  </Button>
                </div>
              </div>

              {metaStats && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-on-surface-variant">
                  <span>
                    {metaStats.totalPages} páginas lidas ·{' '}
                    {metaStats.employeePages} fichas principais ·{' '}
                    {metaStats.schedulePages} grades de horário vinculadas
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    {records.some(
                      (r) => !r.roleTitle || r.roleTitle.trim().length < 2
                    ) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleFillMissingRoles}
                        className="h-7 text-[11px] border-amber-500/40 text-amber-800 hover:bg-amber-500/10 cursor-pointer"
                      >
                        Preencher funções vazias como &ldquo;A definir
                        (RH)&rdquo;
                      </Button>
                    )}
                    <label
                      className="flex items-center gap-1.5 cursor-pointer select-none font-medium text-primary"
                      title="Atualiza os dados extraídos do PDF preservando matrícula, unidade, departamento, foto e usuário"
                    >
                      <input
                        type="checkbox"
                        checked={updateExisting}
                        onChange={(e) => {
                          const enabled = e.target.checked
                          setUpdateExisting(enabled)
                          if (enabled) {
                            const nextSelected = new Set<string>()
                            const seenCpfs = new Set<string>()
                            for (const rec of records) {
                              const cpf = cleanCpfDigits(rec.cpf)
                              if (
                                rec.errors.length === 0 &&
                                !seenCpfs.has(cpf)
                              ) {
                                nextSelected.add(rec.id)
                                if (cpf.length === 11) seenCpfs.add(cpf)
                              }
                            }
                            setSelectedIds(nextSelected)
                          } else {
                            setSelectedIds((prev) => {
                              const next = new Set(prev)
                              for (const rec of records) {
                                if (
                                  rec.cpf.length === 11 &&
                                  existingCpfs.has(rec.cpf)
                                ) {
                                  next.delete(rec.id)
                                }
                              }
                              return next
                            })
                          }
                        }}
                        className="rounded border-outline-variant"
                      />
                      Atualizar colaboradores já cadastrados (mesmo CPF)
                    </label>
                    {!updateExisting && (
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={skipExisting}
                          onChange={(e) => setSkipExisting(e.target.checked)}
                          className="rounded border-outline-variant"
                        />
                        Ignorar automaticamente CPFs já cadastrados
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Edit Panel */}
              {editingRecord && (
                <div className="rounded-xl border border-primary/40 bg-primary/5 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-primary">
                      Editando registro (pág.{' '}
                      {editingRecord.sourcePages.join(', ')})
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingRecord(null)}
                      className="h-7 text-xs cursor-pointer"
                    >
                      Cancelar
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs">Nome Completo *</Label>
                      <Input
                        value={editingRecord.fullName}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            fullName: e.target.value,
                          })
                        }
                        className="h-8 text-xs bg-surface"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">CPF (11 dígitos) *</Label>
                      <Input
                        value={editingRecord.cpf}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            cpf: e.target.value,
                          })
                        }
                        className="h-8 text-xs bg-surface"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Admissão *</Label>
                      <Input
                        type="date"
                        value={editingRecord.admissionDate}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            admissionDate: e.target.value,
                          })
                        }
                        className="h-8 text-xs bg-surface"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <Label className="text-xs">Função / Cargo *</Label>
                      <Input
                        value={editingRecord.roleTitle}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            roleTitle: e.target.value,
                          })
                        }
                        className="h-8 text-xs bg-surface"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Salário (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={editingRecord.salary}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            salary: Number(e.target.value) || 0,
                          })
                        }
                        className="h-8 text-xs bg-surface"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Status</Label>
                      <select
                        value={editingRecord.status}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            status: e.target.value as 'ACTIVE' | 'INACTIVE',
                            terminationDate:
                              e.target.value === 'ACTIVE'
                                ? null
                                : editingRecord.terminationDate,
                          })
                        }
                        className="w-full h-8 rounded-md border border-input bg-surface px-2 text-xs"
                      >
                        <option value="ACTIVE">Ativo</option>
                        <option value="INACTIVE">Inativo / Desligado</option>
                      </select>
                    </div>
                    {editingRecord.status === 'INACTIVE' && (
                      <>
                        <div className="space-y-1">
                          <Label className="text-xs">Data de Saída</Label>
                          <Input
                            type="date"
                            value={editingRecord.terminationDate || ''}
                            onChange={(e) =>
                              setEditingRecord({
                                ...editingRecord,
                                terminationDate: e.target.value || null,
                              })
                            }
                            className="h-8 text-xs bg-surface"
                          />
                        </div>
                        <div className="sm:col-span-3 space-y-1">
                          <Label className="text-xs">
                            Tipo do Desligamento
                          </Label>
                          <Input
                            value={editingRecord.terminationType || ''}
                            onChange={(e) =>
                              setEditingRecord({
                                ...editingRecord,
                                terminationType: e.target.value || null,
                              })
                            }
                            className="h-8 text-xs bg-surface"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {editingRecord.debugRoleArea &&
                    editingRecord.debugRoleArea.length > 0 && (
                      <details className="text-[11px] text-on-surface-variant">
                        <summary className="cursor-pointer select-none font-medium hover:text-on-surface">
                          Ver texto bruto da área de cargo/função (calibração)
                        </summary>
                        <pre className="mt-1.5 max-h-32 overflow-auto rounded-md bg-surface p-2 font-mono text-[10px] border border-outline-variant/20">
                          {editingRecord.debugRoleArea.join('\n')}
                        </pre>
                      </details>
                    )}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveEditedRecord}
                      className="h-8 text-xs cursor-pointer"
                    >
                      Aplicar alterações
                    </Button>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="rounded-xl border border-outline-variant/20 overflow-hidden">
                <div className="max-h-[44vh] overflow-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface-container-low text-on-surface-variant sticky top-0 z-10 border-b border-outline-variant/20">
                      <tr>
                        <th className="p-2.5 w-9 text-center">
                          <input
                            type="checkbox"
                            onChange={toggleSelectAllFiltered}
                            checked={
                              filteredRecords.some((r) => {
                                const isEx =
                                  r.cpf.length === 11 && existingCpfs.has(r.cpf)
                                return (
                                  r.errors.length === 0 &&
                                  !(skipExisting && isEx)
                                )
                              }) &&
                              filteredRecords
                                .filter((r) => {
                                  const isEx =
                                    r.cpf.length === 11 &&
                                    existingCpfs.has(r.cpf)
                                  return (
                                    r.errors.length === 0 &&
                                    !(skipExisting && isEx)
                                  )
                                })
                                .every((r) => selectedIds.has(r.id))
                            }
                          />
                        </th>
                        <th className="p-2.5 font-semibold">Colaborador</th>
                        <th className="p-2.5 font-semibold">CPF</th>
                        <th className="p-2.5 font-semibold">Função</th>
                        <th className="p-2.5 font-semibold">Admissão</th>
                        <th className="p-2.5 font-semibold text-right">
                          Salário
                        </th>
                        <th className="p-2.5 font-semibold">Vínculo</th>
                        <th className="p-2.5 font-semibold">Validação</th>
                        <th className="p-2.5 font-semibold text-right">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/15">
                      {filteredRecords.map((rec) => {
                        const isExisting =
                          rec.cpf.length === 11 && existingCpfs.has(rec.cpf)
                        const hasErrors = rec.errors.length > 0
                        const isChecked = selectedIds.has(rec.id)

                        return (
                          <tr
                            key={rec.id}
                            className={`hover:bg-surface-container-lowest/80 ${
                              hasErrors ? 'bg-rose-500/5' : ''
                            }`}
                          >
                            <td className="p-2.5 text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={hasErrors}
                                onChange={() => toggleSelect(rec.id)}
                              />
                            </td>
                            <td className="p-2.5">
                              <div className="font-medium text-on-surface">
                                {rec.fullName || (
                                  <span className="text-rose-600 italic">
                                    Sem nome
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-on-surface-variant">
                                Pág. {rec.sourcePages.join(', ')}
                                {rec.workSchedule ? ' · Horário OK' : ''}
                                {rec.beneficiaries.length > 0
                                  ? ` · ${rec.beneficiaries.length} dep.`
                                  : ''}
                              </div>
                            </td>
                            <td className="p-2.5 font-mono text-[11px]">
                              {rec.cpf ? formatCpfMask(rec.cpf) : '-'}
                            </td>
                            <td className="p-2.5 max-w-[180px] truncate">
                              {rec.roleTitle || '-'}
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              {formatDateBr(rec.admissionDate)}
                            </td>
                            <td className="p-2.5 text-right whitespace-nowrap">
                              {formatBrl(rec.salary)}
                            </td>
                            <td className="p-2.5 whitespace-nowrap">
                              {rec.status === 'INACTIVE' ? (
                                <span
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-700"
                                  title={
                                    rec.terminationDate
                                      ? `Saída: ${formatDateBr(rec.terminationDate)}`
                                      : undefined
                                  }
                                >
                                  Inativo
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700">
                                  Ativo
                                </span>
                              )}
                            </td>
                            <td className="p-2.5">
                              {hasErrors ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] text-rose-700 font-medium"
                                  title={rec.errors.join(' | ')}
                                >
                                  <XCircle className="h-3.5 w-3.5 shrink-0" />
                                  {rec.errors[0]}
                                </span>
                              ) : isExisting ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-800">
                                  Já cadastrado
                                </span>
                              ) : rec.warnings.length > 0 ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[11px] text-amber-700"
                                  title={rec.warnings.join(' | ')}
                                >
                                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                  {rec.warnings[0]}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                                  Pronto
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingRecord(rec)}
                                  title="Corrigir registro"
                                  className="h-7 w-7 p-0 cursor-pointer"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveRecord(rec.id)}
                                  title="Remover da lista"
                                  className="h-7 w-7 p-0 text-rose-600 hover:text-rose-700 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}

                      {filteredRecords.length === 0 && (
                        <tr>
                          <td
                            colSpan={9}
                            className="p-6 text-center text-xs text-on-surface-variant"
                          >
                            Nenhum registro corresponde ao filtro atual.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {records.length > 0 && !isParsing && !isImporting && !summary && (
          <div className="shrink-0 px-6 py-3.5 border-t border-outline-variant/20 bg-surface-container-lowest flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-on-surface-variant">
              <strong>{selectedIds.size}</strong> colaborador(es) selecionado(s)
              para importação em lotes de {CHUNK_SIZE}.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleClose(false)}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                disabled={selectedIds.size === 0}
                onClick={handleStartImport}
                className="gap-2 cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                Importar {selectedIds.size} Colaborador(es)
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
