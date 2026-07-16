'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { GetCollectionsReportsResponse } from '@/http/get-collections-reports'
import type { GetExecutiveReportsResponse } from '@/http/get-executive-reports'
import { Printer } from 'lucide-react'
import { useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useRouter, useSearchParams } from 'next/navigation'

interface Props {
  financialData: GetExecutiveReportsResponse
  collectionsData: GetCollectionsReportsResponse
  activeUnitName: string | null
  selectedMonth?: string
  currentUserRole: string
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#82ca9d',
  '#ffc658',
]

export function ReportsDashboard({
  financialData,
  collectionsData,
  activeUnitName,
  selectedMonth,
  currentUserRole,
}: Props) {
  const [activeTab, setActiveTab] = useState<'financial' | 'collections'>(
    currentUserRole === 'FISCAL' ? 'collections' : 'financial'
  )
  const printRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle:
      activeTab === 'financial'
        ? 'Relatorio_Financeiro'
        : 'Relatorio_Recoletas',
  })

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('month', e.target.value)
    } else {
      params.delete('month')
    }
    router.push(`?${params.toString()}`)
  }

  const formatMonthLabel = (m?: string) => {
    if (!m) return 'Geral (Todo o Período)'
    const [year, month] = m.split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    const monthName = date.toLocaleString('pt-BR', { month: 'long' })
    return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">
            Relatórios Executivos
          </h1>
          <p className="text-on-surface-variant">
            Gerencie e exporte a visão analítica da plataforma
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-on-surface">
              Mês de Referência:
            </span>
            <input
              type="month"
              value={selectedMonth || ''}
              onChange={handleMonthChange}
              className="border border-outline bg-surface rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>
          <Button
            onClick={() => handlePrint()}
            className="gap-2 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {currentUserRole !== 'FISCAL' && (
        <div className="flex gap-2 border-b border-surface-container mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('financial')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'financial'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Relatório Financeiro
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 cursor-pointer transition-colors ${
              activeTab === 'collections'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Relatório de Recoletas
          </button>
        </div>
      )}

      {/* View on Screen (Wraps A4 dimensions) */}
      <div className="flex justify-center w-full overflow-x-auto bg-surface-container-lowest rounded-xl border border-surface-container shadow-sm p-4 sm:p-8">
        {/* Printable Area - A4 Size (210mm x 297mm) */}
        <div
          ref={printRef}
          className="bg-white text-black p-8 shrink-0 relative overflow-hidden print:w-[210mm] print:h-[297mm] print:m-0 print:p-8"
          style={{
            width: '210mm',
            minHeight: '297mm',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          }}
        >
          {activeTab === 'financial' ? (
            <>
              {/* Header Executivo (Aparece no PDF) */}
              <div className="flex items-center justify-between border-b-2 border-gray-200 pb-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/logo.png"
                      alt="Logo da Clínica"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Relatório Financeiro - {activeUnitName || 'Global'}
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">
                      Mês referência: {formatMonthLabel(selectedMonth)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* 1. Fluxo Mensal de Entradas e Saídas */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">
                    Fluxo Mensal (Entradas vs Saídas)
                  </h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={financialData.monthlyFlow}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e7eb"
                        />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis
                          stroke="#6b7280"
                          tickFormatter={(value) => `R$ ${value / 1000}k`}
                        />
                        <Tooltip
                          formatter={(value: unknown) =>
                            formatCurrency(Number(value))
                          }
                        />
                        <Legend />
                        <Bar
                          dataKey="entries"
                          name="Entradas"
                          fill="#10b981"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="exits"
                          name="Saídas"
                          fill="#ef4444"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {/* 2. Top Itens (Maiores Custos) */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-amber-500 pl-3">
                      Top 5 Itens (Maior Custo)
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={financialData.topItems.slice(0, 5)}
                          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            stroke="#e5e7eb"
                          />
                          <XAxis type="number" stroke="#6b7280" />
                          <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#6b7280"
                            width={100}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip
                            formatter={(value: unknown) =>
                              formatCurrency(Number(value))
                            }
                          />
                          <Bar
                            dataKey="cost"
                            name="Custo Total"
                            fill="#f59e0b"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 3. Custos por Setor ou Unidade */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-purple-500 pl-3">
                      {activeUnitName
                        ? 'Custos por Setor'
                        : 'Custos por Unidade'}
                    </h3>
                    <div className="h-64 w-full flex justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={
                              activeUnitName
                                ? financialData.costBySector
                                : financialData.costByUnit
                            }
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="cost"
                            nameKey="name"
                          >
                            {(activeUnitName
                              ? financialData.costBySector
                              : financialData.costByUnit
                            ).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value: unknown) =>
                              formatCurrency(Number(value))
                            }
                          />
                          <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Tabela de Resumo */}
                <div className="pt-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-gray-500 pl-3">
                    Detalhamento Financeiro (Itens)
                  </h3>
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="p-3 border-b border-gray-200">Item</th>
                        <th className="p-3 border-b border-gray-200 text-right">
                          Quantidade Saídas
                        </th>
                        <th className="p-3 border-b border-gray-200 text-right">
                          Custo Acumulado
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialData.topItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="p-3 text-gray-800">{item.name}</td>
                          <td className="p-3 text-right text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="p-3 text-right font-semibold text-red-600">
                            {formatCurrency(item.cost)}
                          </td>
                        </tr>
                      ))}
                      {financialData.topItems.length === 0 && (
                        <tr>
                          <td
                            colSpan={3}
                            className="p-4 text-center text-gray-500"
                          >
                            Nenhum dado registrado para compor o relatório.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Header de Coletas */}
              <div className="flex items-center justify-between border-b-2 border-gray-200 pb-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/logo.png"
                      alt="Logo da Clínica"
                      className="h-full w-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Relatório de Recoletas - {activeUnitName || 'Global'}
                    </h2>
                    <p className="text-gray-500 text-sm font-medium">
                      Mês referência: {formatMonthLabel(selectedMonth)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                {/* 1. Histórico Mensal de Coletas */}
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-blue-500 pl-3">
                    Histórico Mensal de Recoletas
                  </h3>
                  {collectionsData.monthlyHistory.length > 0 && (
                    <div className="mb-6 border border-gray-200 rounded-md overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                          <tr>
                            <th className="p-2 pl-3">Mês</th>
                            <th className="p-2 pr-3 text-right">
                              Total de Recoletas
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {collectionsData.monthlyHistory.map((h, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="p-2 pl-3 text-gray-800">
                                {formatMonthLabel(h.month)}
                              </td>
                              <td className="p-2 pr-3 text-right text-gray-600 font-semibold">
                                {h.count}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={collectionsData.monthlyHistory}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e5e7eb"
                        />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip />
                        <Bar
                          dataKey="count"
                          name="Total de Recoletas"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  {/* 2. Top Coletadores */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-emerald-500 pl-3">
                      Top Coletadores
                    </h3>
                    {collectionsData.collectorRanking.length > 0 && (
                      <div className="mb-4 border border-gray-200 rounded-md overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                            <tr>
                              <th className="p-2 pl-3">Coletador</th>
                              <th className="p-2 pr-3 text-right">
                                Recoletas Realizadas
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {collectionsData.collectorRanking
                              .slice(0, 5)
                              .map((c, idx) => (
                                <tr
                                  key={idx}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="p-2 pl-3 text-gray-800">
                                    {c.name}
                                  </td>
                                  <td className="p-2 pr-3 text-right text-gray-600 font-semibold">
                                    {c.count}
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={collectionsData.collectorRanking.slice(0, 5)}
                          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            horizontal={false}
                            stroke="#e5e7eb"
                          />
                          <XAxis type="number" stroke="#6b7280" />
                          <YAxis
                            dataKey="name"
                            type="category"
                            stroke="#6b7280"
                            width={100}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip />
                          <Bar
                            dataKey="count"
                            name="Recoletas Realizadas"
                            fill="#10b981"
                            radius={[0, 4, 4, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 3. Proporção de Exames */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-indigo-500 pl-3">
                      Exames mais Recoletados
                    </h3>
                    <div className="h-64 w-full flex justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={collectionsData.topExams.slice(0, 5)}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="count"
                            nameKey="name"
                          >
                            {collectionsData.topExams
                              .slice(0, 5)
                              .map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={COLORS[index % COLORS.length]}
                                />
                              ))}
                          </Pie>
                          <Tooltip />
                          <Legend
                            layout="horizontal"
                            verticalAlign="bottom"
                            align="center"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Detalhamento de Exames */}
                <div className="pt-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-gray-500 pl-3">
                    Detalhamento de Exames Recoletados
                  </h3>
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="p-3 border-b border-gray-200">Exame</th>
                        <th className="p-3 border-b border-gray-200 text-right">
                          Quantidade de Recoletas
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {collectionsData.topExams.map((exam, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="p-3 text-gray-800">{exam.name}</td>
                          <td className="p-3 text-right text-gray-600 font-semibold">
                            {exam.count}
                          </td>
                        </tr>
                      ))}
                      {collectionsData.topExams.length === 0 && (
                        <tr>
                          <td
                            colSpan={2}
                            className="p-4 text-center text-gray-500"
                          >
                            Nenhum dado registrado para compor o relatório.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
