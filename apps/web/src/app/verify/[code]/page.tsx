import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  type VerifiedDocumentResponse,
  verifyEmployeeDocumentPublic,
} from '@/http/employees'
import {
  Building2,
  CalendarCheck,
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  IdCard,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ code: string }>
}

export const metadata: Metadata = {
  title: 'Validação de Documento Assinado Eletronicamente — Masterclin',
  description:
    'Consulte a autenticidade e integridade criptográfica de declarações, advertências e recibos emitidos pelo RH da GERENCIACLIN LTDA.',
}

const TYPE_LABEL: Record<'DECLARATION' | 'WARNING' | 'RECEIPT', string> = {
  DECLARATION: 'Declaração Institucional',
  WARNING: 'Notificação / Advertência Disciplinar',
  RECEIPT: 'Recibo / Comprovante Oficial',
}

function formatDateTimePtBr(value?: string | null): string {
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

export default async function VerifyEmployeeDocumentPage({ params }: Props) {
  const { code } = await params
  const decodedCode = decodeURIComponent(code).trim().toUpperCase()

  let verification: VerifiedDocumentResponse | null = null

  try {
    verification = await verifyEmployeeDocumentPublic(decodedCode)
  } catch {
    verification = null
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <img
            src="/images/masterclin-logo.png"
            alt="Masterclin"
            className="h-14 w-auto object-contain"
          />
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Central Pública de Verificação e Autenticidade Documental
          </p>
        </div>

        {verification?.valid ? (
          <Card className="border-2 border-emerald-500/40 bg-white dark:bg-slate-900 shadow-lg overflow-hidden">
            <div className="bg-emerald-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-8 w-8 shrink-0" />
                <div>
                  <h1 className="text-lg font-bold tracking-tight">
                    DOCUMENTO AUTÊNTICO E VÁLIDO
                  </h1>
                  <p className="text-xs text-emerald-100">
                    Assinatura eletrônica conferida e íntegra na base oficial do
                    RH
                  </p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 font-mono text-xs font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                VERIFICADO
              </span>
            </div>

            <CardContent className="p-6 space-y-5">
              {/* Código e Categoria */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500">
                    Código de Verificação
                  </span>
                  <div className="font-mono text-sm font-bold text-sky-700 dark:text-sky-400 mt-0.5">
                    {verification.document.verificationCode}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase text-slate-500">
                    Categoria do Documento
                  </span>
                  <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1.5">
                    <FileCheck2 className="h-4 w-4 text-emerald-600" />
                    {TYPE_LABEL[verification.document.type]}
                  </div>
                </div>
              </div>

              {/* Título */}
              <div>
                <span className="text-xs font-bold uppercase text-slate-500">
                  Título Oficial do Documento
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {verification.document.title}
                </h2>
              </div>

              {/* Dados do Colaborador e Empregador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                    <IdCard className="h-3.5 w-3.5 text-sky-600" />
                    Colaborador Vinculado
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {verification.document.employee.fullName}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Matrícula:{' '}
                    <strong className="font-mono text-sky-700 dark:text-sky-400">
                      {verification.document.employee.registrationNumber}
                    </strong>{' '}
                    • CPF: {verification.document.employee.cpfMasked}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Cargo: {verification.document.employee.roleTitle}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-sky-600" />
                    Instituição Emissora
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {verification.document.employee.employerName}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    CNPJ: {verification.document.employee.employerCnpj}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Assinado por: {verification.document.issuedBy.name}
                  </p>
                </div>
              </div>

              {/* Hash Criptográfico e Data */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <CalendarCheck className="h-4 w-4 text-emerald-600" />
                    Data/Hora da Assinatura Eletrônica:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatDateTimePtBr(verification.document.signedAt)}
                  </span>
                </div>

                <div className="rounded-lg bg-slate-900 text-slate-100 p-3 font-mono text-[11px] break-all">
                  <div className="flex items-center gap-1.5 text-sky-400 font-sans font-bold uppercase text-[10px] mb-1">
                    <Fingerprint className="h-3.5 w-3.5" />
                    Hash Criptográfico de Integridade (SHA-256)
                  </div>
                  {verification.document.contentHash || 'N/A'}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-rose-500/40 bg-white dark:bg-slate-900 shadow-lg">
            <CardHeader className="bg-rose-600 text-white">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="h-6 w-6" />
                Documento Não Localizado ou Código Inválido
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3 text-sm text-slate-600 dark:text-slate-300">
              <p>
                Não foi encontrado nenhum documento finalizado e assinado
                eletronicamente correspondente ao código{' '}
                <strong className="font-mono text-rose-600">
                  {decodedCode}
                </strong>
                .
              </p>
              <p className="text-xs text-slate-500">
                Verifique se o código foi digitado corretamente (ex:{' '}
                <code>MC-DOC-20261114-XXXXXX</code>) ou entre em contato com o
                Departamento de Recursos Humanos da Masterclin.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
