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
import { Textarea } from '@/components/ui/textarea'
import type { EmployeeBirthdayItem } from '@/http/employees'
import {
  AlertTriangle,
  Copy,
  Download,
  ImagePlus,
  Loader2,
  RotateCcw,
  Share2,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  BIRTHDAY_MESSAGE_PRESETS,
  type BirthdayCardFormat,
  type BirthdayCardTheme,
  MONTH_NAMES_PT,
  copyCanvasPngToClipboard,
  downloadCanvasPng,
  renderCollectiveBirthdayCard,
  renderIndividualBirthdayCard,
  shareCanvasPng,
  slugifyFilename,
} from './birthday-card-generator'

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024 // 8 MB in-memory only

interface IndividualDialogProps {
  mode: 'individual'
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: EmployeeBirthdayItem | null
}

interface CollectiveDialogProps {
  mode: 'collective'
  open: boolean
  onOpenChange: (open: boolean) => void
  month: number
  employees: EmployeeBirthdayItem[]
  filterLabel: string | null
}

type BirthdayCardDialogProps = IndividualDialogProps | CollectiveDialogProps

function suggestShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 2) return fullName.trim()
  const connectors = new Set(['da', 'de', 'do', 'das', 'dos', 'e'])
  if (connectors.has(parts[1].toLowerCase()) && parts.length >= 3) {
    return `${parts[0]} ${parts[1]} ${parts[2]}`
  }
  return `${parts[0]} ${parts[parts.length - 1]}`
}

export function BirthdayCardDialog(props: BirthdayCardDialogProps) {
  const { open, onOpenChange, mode } = props
  const employee = mode === 'individual' ? props.employee : null
  const collectiveMonth = mode === 'collective' ? props.month : null
  const collectiveEmployees = mode === 'collective' ? props.employees : null
  const collectiveFilterLabel = mode === 'collective' ? props.filterLabel : null

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [format, setFormat] = useState<BirthdayCardFormat>('square')
  const [theme, setTheme] = useState<BirthdayCardTheme>('masterclin')
  const [displayName, setDisplayName] = useState('')
  const [showRole, setShowRole] = useState(true)
  const [showUnit, setShowUnit] = useState(true)
  const [message, setMessage] = useState<string>(
    BIRTHDAY_MESSAGE_PRESETS[0].text
  )
  const [collectiveSubtitle, setCollectiveSubtitle] = useState(
    'Parabéns a todos os aniversariantes! Saúde, sucesso e muitas realizações.'
  )

  // In-memory custom photo (never saved to DB, never overwrites 3x4 registration photo)
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null)
  const [customPhotoName, setCustomPhotoName] = useState<string | null>(null)
  const [photoZoom, setPhotoZoom] = useState(1.0)
  const [photoOffsetY, setPhotoOffsetY] = useState(0)

  const [isExporting, setIsExporting] = useState(false)
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== 'undefined' && typeof navigator.share === 'function'
    )
  }, [])

  // Reset form state whenever dialog opens or target employee changes
  useEffect(() => {
    if (!open) return
    setFormat('square')
    setTheme('masterclin')
    setPhotoZoom(1.0)
    setPhotoOffsetY(0)

    if (mode === 'individual' && employee) {
      setDisplayName(employee.fullName)
      setShowRole(true)
      setShowUnit(true)
      setMessage(BIRTHDAY_MESSAGE_PRESETS[0].text)
      setCustomPhotoUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
        return null
      })
      setCustomPhotoName(null)
    }
  }, [open, mode, employee])

  // Revoke object URL on unmount / change
  useEffect(() => {
    return () => {
      if (customPhotoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(customPhotoUrl)
      }
    }
  }, [customPhotoUrl])

  const registeredPhotoUrl = employee?.photoUrl ?? null
  const effectivePhotoUrl = customPhotoUrl ?? registeredPhotoUrl
  const isIndividualBlockedByMissingPhoto =
    mode === 'individual' && !effectivePhotoUrl

  // Live Canvas preview rendering
  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return

    let cancelled = false

    async function draw() {
      if (!canvas) return
      const signal = { isCancelled: () => cancelled }
      if (mode === 'individual') {
        if (!employee || !effectivePhotoUrl) return
        await renderIndividualBirthdayCard(
          canvas,
          {
            displayName,
            roleTitle: employee.roleTitle,
            unitName: employee.unit?.name ?? null,
            departmentName: employee.department?.name ?? null,
            birthDay: employee.birthDay,
            birthMonth: employee.birthMonth,
            photoSrc: effectivePhotoUrl,
            photoZoom,
            photoOffsetY,
            showRole,
            showUnit,
            message,
            format,
            theme,
          },
          signal
        )
      } else {
        if (cancelled || collectiveMonth === null || !collectiveEmployees) {
          return
        }
        await renderCollectiveBirthdayCard(
          canvas,
          {
            month: collectiveMonth,
            employees: collectiveEmployees,
            filterLabel: collectiveFilterLabel,
            subtitle: collectiveSubtitle,
            format,
            theme,
          },
          signal
        )
      }
    }

    draw()
    return () => {
      cancelled = true
    }
  }, [
    open,
    mode,
    employee,
    effectivePhotoUrl,
    displayName,
    photoZoom,
    photoOffsetY,
    showRole,
    showUnit,
    message,
    format,
    theme,
    collectiveSubtitle,
    collectiveMonth,
    collectiveEmployees,
    collectiveFilterLabel,
  ])

  function handleCustomPhotoSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Formato inválido. Envie uma imagem JPG, PNG ou WEBP.')
      return
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error('A imagem excede o limite de 8 MB.')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setCustomPhotoUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return objectUrl
    })
    setCustomPhotoName(file.name)
    setPhotoZoom(1.0)
    setPhotoOffsetY(0)
  }

  function handleRemoveCustomPhoto() {
    setCustomPhotoUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return null
    })
    setCustomPhotoName(null)
    setPhotoZoom(1.0)
    setPhotoOffsetY(0)
  }

  function getExportFilename() {
    const dims = format === 'story' ? '1080x1920' : '1080x1080'
    if (mode === 'individual' && employee) {
      return `aniversario-${slugifyFilename(displayName || employee.fullName)}-${dims}.png`
    }
    const monthSlug = slugifyFilename(
      MONTH_NAMES_PT[(mode === 'collective' ? props.month : 1) - 1] ?? 'mes'
    )
    return `aniversariantes-${monthSlug}-${dims}.png`
  }

  async function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas || isIndividualBlockedByMissingPhoto) return

    setIsExporting(true)
    try {
      await downloadCanvasPng(canvas, getExportFilename())
      toast.success('Card PNG baixado com sucesso!')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao baixar imagem.'
      )
    } finally {
      setIsExporting(false)
    }
  }

  async function handleCopy() {
    const canvas = canvasRef.current
    if (!canvas || isIndividualBlockedByMissingPhoto) return

    setIsExporting(true)
    try {
      await copyCanvasPngToClipboard(canvas)
      toast.success(
        'Imagem copiada! Agora basta colar com Ctrl+V no WhatsApp Web.'
      )
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Não foi possível copiar a imagem.'
      )
    } finally {
      setIsExporting(false)
    }
  }

  async function handleShare() {
    const canvas = canvasRef.current
    if (!canvas || isIndividualBlockedByMissingPhoto) return

    setIsExporting(true)
    try {
      const title =
        mode === 'individual' && employee
          ? `Feliz Aniversário, ${displayName || employee.fullName}!`
          : `Aniversariantes de ${MONTH_NAMES_PT[(mode === 'collective' ? props.month : 1) - 1]}`
      const shared = await shareCanvasPng(canvas, getExportFilename(), title)
      if (!shared) {
        toast.info(
          'Compartilhamento nativo indisponível neste dispositivo. Use Baixar PNG ou Copiar.'
        )
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        toast.error('Erro ao compartilhar a imagem.')
      }
    } finally {
      setIsExporting(false)
    }
  }

  const titleText =
    mode === 'individual'
      ? 'Gerar Card de Aniversário'
      : `Card Coletivo — ${MONTH_NAMES_PT[(mode === 'collective' ? props.month : 1) - 1]}`

  const descriptionText =
    mode === 'individual'
      ? 'Personalize a homenagem e envie uma foto comemorativa (usada apenas nesta arte, sem alterar a foto 3×4 da ficha).'
      : 'Pôster editorial do mês pronto para compartilhar nos grupos e murais internos.'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] !flex flex-col gap-0 !p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-surface-container shrink-0">
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span>{titleText}</span>
          </DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Controls */}
            <div className="lg:col-span-5 space-y-4">
              {/* Format & Theme */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-on-surface-variant">
                    Formato
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFormat('square')}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        format === 'square'
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-surface-container bg-surface text-on-surface-variant hover:bg-surface-container/50'
                      }`}
                    >
                      1:1 Feed
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormat('story')}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        format === 'story'
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-surface-container bg-surface text-on-surface-variant hover:bg-surface-container/50'
                      }`}
                    >
                      9:16 Stories
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-on-surface-variant">
                    Tema Visual
                  </Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTheme('masterclin')}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        theme === 'masterclin'
                          ? 'border-primary bg-primary/10 text-primary font-semibold'
                          : 'border-surface-container bg-surface text-on-surface-variant hover:bg-surface-container/50'
                      }`}
                    >
                      Masterclin
                    </button>
                    <button
                      type="button"
                      onClick={() => setTheme('festive')}
                      className={`rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        theme === 'festive'
                          ? 'border-amber-500 bg-amber-50 text-amber-800 font-semibold'
                          : 'border-surface-container bg-surface text-on-surface-variant hover:bg-surface-container/50'
                      }`}
                    >
                      Dourado
                    </button>
                  </div>
                </div>
              </div>

              {mode === 'individual' && employee ? (
                <>
                  {/* Photo Section (Priority: custom in-memory upload -> registered 3x4 -> blocked) */}
                  <div
                    className={`rounded-xl border p-3.5 space-y-3 ${
                      isIndividualBlockedByMissingPhoto
                        ? 'border-amber-300 bg-amber-50/70'
                        : 'border-surface-container bg-surface-container/25'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-on-surface">
                          Foto do Card (em memória)
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          {customPhotoUrl
                            ? `Usando foto enviada: ${customPhotoName}`
                            : registeredPhotoUrl
                              ? 'Usando foto 3×4 da ficha como padrão.'
                              : 'Sem foto no cadastro — envie uma foto para liberar o card.'}
                        </p>
                      </div>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleCustomPhotoSelect}
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant={
                          isIndividualBlockedByMissingPhoto
                            ? 'default'
                            : 'outline'
                        }
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-1.5 text-xs"
                      >
                        <ImagePlus className="h-3.5 w-3.5" />
                        <span>
                          {customPhotoUrl
                            ? 'Trocar Foto'
                            : 'Enviar Foto Comemorativa'}
                        </span>
                      </Button>

                      {customPhotoUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveCustomPhoto}
                          className="gap-1.5 text-xs text-on-surface-variant"
                        >
                          {registeredPhotoUrl ? (
                            <>
                              <RotateCcw className="h-3.5 w-3.5" />
                              <span>Usar foto da ficha</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3.5 w-3.5 text-error" />
                              <span>Remover foto</span>
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    {effectivePhotoUrl && (
                      <div className="grid grid-cols-2 gap-3 pt-1 border-t border-surface-container/60">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                            <span>Zoom</span>
                            <span>{Math.round(photoZoom * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={2}
                            step={0.05}
                            value={photoZoom}
                            onChange={(e) =>
                              setPhotoZoom(Number(e.target.value))
                            }
                            className="w-full accent-primary cursor-pointer"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                            <span>Enquadramento</span>
                            <span>
                              {photoOffsetY > 0
                                ? `+${photoOffsetY}%`
                                : `${photoOffsetY}%`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={-100}
                            max={100}
                            step={5}
                            value={photoOffsetY}
                            onChange={(e) =>
                              setPhotoOffsetY(Number(e.target.value))
                            }
                            className="w-full accent-primary cursor-pointer"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Display Name */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="card-display-name"
                        className="text-xs font-semibold text-on-surface-variant"
                      >
                        Nome exibido no card
                      </Label>
                      {employee.fullName.trim().split(/\s+/).length > 2 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDisplayName(
                              displayName === employee.fullName
                                ? suggestShortName(employee.fullName)
                                : employee.fullName
                            )
                          }
                          className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                        >
                          {displayName === employee.fullName
                            ? 'Abreviar nome'
                            : 'Nome completo'}
                        </button>
                      )}
                    </div>
                    <Input
                      id="card-display-name"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Nome do colaborador"
                    />
                  </div>

                  {/* Toggles */}
                  <div className="flex flex-wrap gap-4 pt-0.5">
                    <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showRole}
                        onChange={(e) => setShowRole(e.target.checked)}
                        className="rounded border-surface-container accent-primary"
                      />
                      <span>Exibir cargo</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showUnit}
                        onChange={(e) => setShowUnit(e.target.checked)}
                        className="rounded border-surface-container accent-primary"
                      />
                      <span>Exibir unidade / setor</span>
                    </label>
                  </div>

                  {/* Message + Presets */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label
                        htmlFor="card-message"
                        className="text-xs font-semibold text-on-surface-variant"
                      >
                        Mensagem de felicitação
                      </Label>
                      <div className="flex items-center gap-1">
                        {BIRTHDAY_MESSAGE_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setMessage(preset.text)}
                            className="rounded-md bg-surface-container px-2 py-0.5 text-[10px] font-medium text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <Textarea
                      id="card-message"
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={220}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-surface-container bg-surface-container/25 p-3.5 text-xs text-on-surface-variant space-y-1">
                    <p className="font-semibold text-on-surface">
                      Layout Editorial (sem foto individual)
                    </p>
                    <p>
                      Lista todos os{' '}
                      <strong>
                        {mode === 'collective' ? props.employees.length : 0}
                      </strong>{' '}
                      aniversariantes do filtro atual ordenados por dia, com
                      identidade Masterclin.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label
                      htmlFor="collective-subtitle"
                      className="text-xs font-semibold text-on-surface-variant"
                    >
                      Frase do rodapé
                    </Label>
                    <Textarea
                      id="collective-subtitle"
                      rows={3}
                      value={collectiveSubtitle}
                      onChange={(e) => setCollectiveSubtitle(e.target.value)}
                      maxLength={180}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Live High-Res Canvas Preview */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center rounded-xl border border-surface-container bg-surface-container/35 p-4 min-h-[380px]">
              {isIndividualBlockedByMissingPhoto ? (
                <div className="flex flex-col items-center justify-center text-center max-w-sm py-12 space-y-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                    <AlertTriangle className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-bold text-on-surface">
                    Foto necessária para gerar o card
                  </h3>
                  <p className="text-xs text-on-surface-variant leading-relaxed">
                    <strong>{employee?.fullName}</strong> não possui foto 3×4
                    cadastrada na ficha. Envie uma foto comemorativa para
                    visualizar e exportar a arte — ela fica apenas em memória e
                    não altera o cadastro oficial.
                  </p>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2 mt-1"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span>Selecionar Foto Agora</span>
                  </Button>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-2">
                  <canvas
                    ref={canvasRef}
                    className={`rounded-lg shadow-lg border border-surface-container/70 bg-white ${
                      format === 'story'
                        ? 'max-h-[520px] w-auto aspect-[9/16]'
                        : 'max-h-[480px] w-full max-w-[480px] aspect-square'
                    }`}
                  />
                  <span className="text-[11px] text-on-surface-variant">
                    Resolução de exportação:{' '}
                    {format === 'story' ? '1080 × 1920 px' : '1080 × 1080 px'}{' '}
                    (PNG alta definição)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pinned Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-container bg-surface px-6 py-3.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            {canNativeShare && (
              <Button
                type="button"
                variant="outline"
                onClick={handleShare}
                disabled={isIndividualBlockedByMissingPhoto || isExporting}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span>Compartilhar</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              disabled={isIndividualBlockedByMissingPhoto || isExporting}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              <span>Copiar Imagem</span>
            </Button>

            <Button
              type="button"
              onClick={handleDownload}
              disabled={isIndividualBlockedByMissingPhoto || isExporting}
              className="gap-2"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>Baixar PNG</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
