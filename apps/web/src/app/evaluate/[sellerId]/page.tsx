import { getPublicSeller } from '@/http/get-public-seller'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EvaluateForm } from './evaluate-form'

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

  return (
    <main className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center p-4">
      <EvaluateForm seller={seller} />
    </main>
  )
}
