import { getPublicSeller } from '@/http/get-public-seller'
import { checkEvaluationAvailability } from '@/utils/evaluation-schedule'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EvaluateForm } from './evaluate-form'
import { EvaluationClosedCard } from './evaluation-closed-card'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ sellerId: string }>
}

export const metadata: Metadata = {
  title: 'Avaliação de Atendimento - Master Admin',
  description: 'Avalie a qualidade do atendimento da recepção.',
}

export default async function PublicEvaluationPage({ params }: Props) {
  const { sellerId } = await params

  let seller = null
  try {
    const res = await getPublicSeller(sellerId)
    seller = res.seller
  } catch (err) {
    notFound()
  }

  const availability = checkEvaluationAvailability()

  return (
    <main className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center p-4">
      {availability.isOpen ? (
        <EvaluateForm seller={seller} />
      ) : (
        <EvaluationClosedCard seller={seller} availability={availability} />
      )}
    </main>
  )
}
