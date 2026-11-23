import type { BeneficiaryItem, WorkScheduleDay } from '@/http/employees'

export interface PdfTextItem {
  str: string
  x: number
  y: number // Top-down baseline coordinate: viewport.height - transform[5]
  width: number
  height: number
}

export interface PdfPageData {
  pageNumber: number
  width: number
  height: number
  items: PdfTextItem[]
}

export interface ParsedEmployeeRecord {
  id: string // Temporary client-side row key
  sourcePages: number[]
  esocialCode: string | null
  employerName: string
  employerCnpj: string
  employerAddress: string

  fullName: string
  birthDate: string | null
  birthPlace: string | null
  nationality: string | null
  maritalStatus: string | null
  raceColor: string | null
  fatherName: string | null
  motherName: string | null
  address: string | null
  zipCode: string | null
  landlinePhone: string | null
  mobilePhone: string | null
  email: string | null
  beneficiaries: BeneficiaryItem[]

  cpf: string
  rgNumber: string | null
  rgIssueDate: string | null
  rgIssuer: string | null
  ctpsNumber: string | null
  ctpsSeries: string | null
  ctpsIssueDate: string | null
  ctpsState: string | null
  voterRegistration: string | null
  voterZone: string | null
  voterSection: string | null
  cnhNumber: string | null
  cnhCategory: string | null
  militaryDoc: string | null
  militaryCategory: string | null
  classCouncilNumber: string | null

  admissionDate: string // YYYY-MM-DD (or '' if missing)
  roleTitle: string
  cboCode: string | null
  salary: number
  paymentType: string | null
  workHoursSummary: string | null
  breakHoursSummary: string | null
  fgtsOptionDate: string | null
  fgtsRectificationDate: string | null
  fgtsBankAccount: string | null
  pisRegistrationDate: string | null
  pisNumber: string | null
  pisBankName: string | null
  pisBankNumber: string | null
  pisBankBranch: string | null
  pisBankAddress: string | null

  workSchedule: WorkScheduleDay[] | null
  generalObservations: string | null

  status: 'ACTIVE' | 'INACTIVE'
  terminationDate: string | null
  terminationType: string | null

  warnings: string[]
  errors: string[]
}

export interface PdfParseResult {
  employees: ParsedEmployeeRecord[]
  totalPages: number
  recognizedEmployeePages: number
  recognizedSchedulePages: number
  ignoredPages: number[]
  possibleScannedPdf: boolean
}

interface Box {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

const DEFAULT_EMPLOYER_NAME = 'GERENCIACLIN LTDA'
const DEFAULT_EMPLOYER_CNPJ = '59.162.564/0001-73'
const DEFAULT_EMPLOYER_ADDRESS =
  'Rua IVONE PINHEIRO, 1590, SALA 08, TANCREDO NEVES, BOA VISTA, RR'

function normalizeSpaces(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function cleanCpfDigits(value: string): string {
  return value.replace(/\D/g, '')
}

export function isValidCpfDigits(cpf: string): boolean {
  const digits = cleanCpfDigits(cpf)
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number(digits[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  if (remainder !== Number(digits[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number(digits[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10) remainder = 0
  return remainder === Number(digits[10])
}

export function formatCpfMask(cpf: string): string {
  const d = cleanCpfDigits(cpf)
  if (d.length !== 11) return cpf.trim()
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`
}

export function parseBrDateToIso(
  raw: string | null | undefined
): string | null {
  if (!raw) return null
  const text = raw.trim()
  const brMatch = text.match(/(\d{2})[/.-](\d{2})[/.-](\d{4})/)
  if (brMatch) {
    const [, dd, mm, yyyy] = brMatch
    const day = Number(dd)
    const month = Number(mm)
    const year = Number(yyyy)
    if (
      day >= 1 &&
      day <= 31 &&
      month >= 1 &&
      month <= 12 &&
      year >= 1900 &&
      year <= 2100
    ) {
      return `${yyyy}-${mm}-${dd}`
    }
  }
  const isoMatch = text.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
  }
  return null
}

export function parseBrSalary(raw: string | null | undefined): number {
  if (!raw) return 0
  const cleaned = raw
    .replace(/R\$/gi, '')
    .replace(/\s+/g, '')
    .replace(/[^\d.,-]/g, '')
  if (!cleaned) return 0

  // Brazilian format: 2.500,50 or 1500,00
  if (cleaned.includes(',')) {
    const normalized = cleaned.replace(/\./g, '').replace(',', '.')
    const num = Number.parseFloat(normalized)
    return Number.isFinite(num) && num >= 0 ? num : 0
  }

  // Dot-only format: could be 2.500 (thousands) or 2500.50 (decimal)
  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    const num = Number.parseFloat(cleaned.replace(/\./g, ''))
    return Number.isFinite(num) && num >= 0 ? num : 0
  }

  const num = Number.parseFloat(cleaned)
  return Number.isFinite(num) && num >= 0 ? num : 0
}

function getBoxItems(items: PdfTextItem[], box: Box, dy = 0): PdfTextItem[] {
  const yMin = box.yMin + dy
  const yMax = box.yMax + dy
  return items
    .filter((item) => {
      if (!item.str || !item.str.trim()) return false
      const xCenter = item.x + Math.min(item.width * 0.25, 8)
      return (
        xCenter >= box.xMin &&
        xCenter <= box.xMax &&
        item.y >= yMin &&
        item.y <= yMax
      )
    })
    .sort((a, b) => {
      if (Math.abs(a.y - b.y) > 3.5) return a.y - b.y
      return a.x - b.x
    })
}

function joinLineItems(items: PdfTextItem[]): string {
  if (items.length === 0) return ''
  let out = ''
  let prev: PdfTextItem | null = null
  for (const item of items) {
    const chunk = item.str.trim()
    if (!chunk) continue
    if (!prev) {
      out = chunk
    } else {
      const sameLine = Math.abs(item.y - prev.y) <= 3.5
      if (!sameLine) {
        out += ` ${chunk}`
      } else {
        const gap = item.x - (prev.x + prev.width)
        out += gap > 1.2 ? ` ${chunk}` : chunk
      }
    }
    prev = item
  }
  return normalizeSpaces(out)
}

function readBox(items: PdfTextItem[], box: Box, dy = 0): string {
  return joinLineItems(getBoxItems(items, box, dy))
}

function readBoxLines(items: PdfTextItem[], box: Box, dy = 0): string[] {
  const matched = getBoxItems(items, box, dy)
  if (matched.length === 0) return []

  const lines: PdfTextItem[][] = []
  for (const item of matched) {
    const lastLine = lines[lines.length - 1]
    if (!lastLine || Math.abs(item.y - lastLine[0].y) > 4.2) {
      lines.push([item])
    } else {
      lastLine.push(item)
    }
  }

  return lines
    .map((line) => joinLineItems(line.sort((a, b) => a.x - b.x)))
    .filter((line) => line.length > 0)
}

function parseBeneficiariesLines(lines: string[]): BeneficiaryItem[] {
  const result: BeneficiaryItem[] = []
  for (const rawLine of lines) {
    const line = normalizeSpaces(rawLine)
    if (!line || /^benefici[áa]rios?$/i.test(line)) continue

    const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})/)
    const cpfMatch = line.match(/(\d{3}\.?\d{3}\.?\d{3}-?\d{2})/)

    let cleaned = line
    if (dateMatch) cleaned = cleaned.replace(dateMatch[0], ' ')
    if (cpfMatch) cleaned = cleaned.replace(cpfMatch[0], ' ')

    const parts = cleaned
      .split(/[-–—|;/]+/)
      .map((p) => normalizeSpaces(p))
      .filter(Boolean)

    const name = parts[0] || line
    const relationship = parts[1] || 'Dependente'

    if (name.length >= 2) {
      result.push({
        name,
        relationship,
        birthDate: dateMatch
          ? parseBrDateToIso(dateMatch[1]) || undefined
          : undefined,
        cpf: cpfMatch ? formatCpfMask(cpfMatch[1]) : undefined,
      })
    }
  }
  return result
}

function isEmployeeMainPage(page: PdfPageData): boolean {
  const fullText = page.items
    .map((i) => i.str)
    .join(' ')
    .toUpperCase()
  return (
    fullText.includes('REGISTRO DE EMPREGADO') &&
    fullText.includes('EMPREGADOR') &&
    (fullText.includes('EMPREGADO') || fullText.includes('DATA DE ADMISS'))
  )
}

function isWorkSchedulePage(page: PdfPageData): boolean {
  const fullText = page.items
    .map((i) => i.str)
    .join(' ')
    .toUpperCase()
  return (
    fullText.includes('DISCRIMINA') &&
    fullText.includes('HOR') &&
    fullText.includes('TRABALHO')
  )
}

function detectPage1YOffset(items: PdfTextItem[]): number {
  // Expected label baselines measured from official GERENCIACLIN accounting template
  const anchors: Array<{ match: (s: string) => boolean; expectedY: number }> = [
    { match: (s) => /^Data de Admiss/i.test(s), expectedY: 301.8 },
    { match: (s) => /^Empregador$/i.test(s), expectedY: 77.4 },
    { match: (s) => /^CPF$/i.test(s), expectedY: 236.6 },
  ]

  const deltas: number[] = []
  for (const anchor of anchors) {
    const found = items.find((i) => anchor.match(i.str.trim()))
    if (found) {
      const delta = found.y - anchor.expectedY
      if (Math.abs(delta) <= 18) {
        deltas.push(delta)
      }
    }
  }

  if (deltas.length === 0) return 0
  return deltas.reduce((acc, d) => acc + d, 0) / deltas.length
}

function extractFallbackCpf(
  items: PdfTextItem[],
  employerCnpj: string
): string {
  const cnpjDigits = cleanCpfDigits(employerCnpj)
  const upperItems = items.filter((i) => i.y >= 115 && i.y <= 380)
  for (const item of upperItems) {
    const m = item.str.match(/\b(\d{3}\.\d{3}\.\d{3}-\d{2})\b/)
    if (m) {
      const digits = cleanCpfDigits(m[1])
      if (digits.length === 11 && !cnpjDigits.includes(digits)) {
        return digits
      }
    }
  }
  return ''
}

function parsePage1Employee(
  page: PdfPageData,
  index: number
): ParsedEmployeeRecord {
  const items = page.items
  const dy = detectPage1YOffset(items)

  // Header / Employer
  const rawEsocial = readBox(
    items,
    { xMin: 165, xMax: 500, yMin: 50, yMax: 71.5 },
    dy
  )
    .replace(/(Matr[íi]cu)?la\s*eSocial/gi, '')
    .replace(/\beSocial\b/gi, '')
    .trim()

  const employerName =
    readBox(items, { xMin: 165, xMax: 458, yMin: 80.5, yMax: 93.5 }, dy) ||
    DEFAULT_EMPLOYER_NAME
  const employerCnpj =
    readBox(items, { xMin: 458, xMax: 565, yMin: 80.5, yMax: 93.5 }, dy) ||
    DEFAULT_EMPLOYER_CNPJ
  const rawEmployerAddress = readBox(
    items,
    { xMin: 165, xMax: 565, yMin: 102.5, yMax: 117.0 },
    dy
  ).replace(/,\s*$/, '')
  const employerAddress = rawEmployerAddress || DEFAULT_EMPLOYER_ADDRESS

  // Personal Identification & Address
  const fullName = readBox(
    items,
    { xMin: 30, xMax: 294, yMin: 126.8, yMax: 139.0 },
    dy
  )
  let address = readBox(
    items,
    { xMin: 30, xMax: 294, yMin: 146.0, yMax: 157.0 },
    dy
  )
  const cepLine = readBox(
    items,
    { xMin: 30, xMax: 294, yMin: 157.0, yMax: 167.5 },
    dy
  )
  const cepMatch = cepLine.match(/(\d{5}-?\d{3})/)
  const zipCode = cepMatch
    ? cepMatch[1].replace(/^(\d{5})(\d{3})$/, '$1-$2')
    : null
  const extraAddressAfterCep = cepLine
    .replace(/CEP\s*:?/gi, '')
    .replace(/\d{5}-?\d{3}/g, '')
    .replace(/^[\s,-]+|[\s,-]+$/g, '')
    .trim()
  if (extraAddressAfterCep) {
    address = address
      ? `${address} - ${extraAddressAfterCep}`
      : extraAddressAfterCep
  }

  const beneficiaryLines = readBoxLines(
    items,
    { xMin: 295, xMax: 565, yMin: 126.8, yMax: 167.5 },
    dy
  )
  const beneficiaries = parseBeneficiariesLines(beneficiaryLines)

  const birthDate = parseBrDateToIso(
    readBox(items, { xMin: 115, xMax: 206, yMin: 178.0, yMax: 189.0 }, dy)
  )
  const birthPlace =
    readBox(items, { xMin: 206, xMax: 399, yMin: 178.0, yMax: 189.0 }, dy) ||
    null
  const nationality =
    readBox(items, { xMin: 399, xMax: 485, yMin: 178.0, yMax: 189.0 }, dy) ||
    'Brasileira'
  const maritalStatus =
    readBox(items, { xMin: 485, xMax: 565, yMin: 178.0, yMax: 189.0 }, dy) ||
    null

  const fatherName =
    readBox(items, { xMin: 155, xMax: 565, yMin: 189.0, yMax: 202.5 }, dy)
      .replace(/^Pai\s*:\s*/i, '')
      .trim() || null
  const motherName =
    readBox(items, { xMin: 155, xMax: 565, yMin: 202.5, yMax: 216.5 }, dy)
      .replace(/^M[ãa]e\s*:\s*/i, '')
      .trim() || null

  // Legal Documents Row 1 (RG, Voter, Class Council)
  const rgNumber =
    readBox(items, { xMin: 115, xMax: 205, yMin: 223.2, yMax: 232.0 }, dy) ||
    null
  const rgIssueDate = parseBrDateToIso(
    readBox(items, { xMin: 205, xMax: 261, yMin: 223.2, yMax: 232.0 }, dy)
  )
  const rgIssuer =
    readBox(items, { xMin: 261, xMax: 328, yMin: 223.2, yMax: 232.0 }, dy) ||
    null
  const voterRegistration =
    readBox(items, { xMin: 328, xMax: 424, yMin: 223.2, yMax: 232.0 }, dy) ||
    null
  const voterZone =
    readBox(items, { xMin: 424, xMax: 454, yMin: 223.2, yMax: 232.0 }, dy) ||
    null
  const voterSection =
    readBox(items, { xMin: 454, xMax: 485, yMin: 223.2, yMax: 232.0 }, dy) ||
    null
  const classCouncilNumber =
    readBox(items, { xMin: 485, xMax: 565, yMin: 223.2, yMax: 232.0 }, dy) ||
    null

  // Legal Documents Row 2 (CTPS, CPF, CNH)
  const ctpsNumber =
    readBox(items, { xMin: 115, xMax: 164, yMin: 238.5, yMax: 247.5 }, dy) ||
    null
  const ctpsSeries =
    readBox(items, { xMin: 164, xMax: 212, yMin: 238.5, yMax: 247.5 }, dy) ||
    null
  const ctpsIssueDate = parseBrDateToIso(
    readBox(items, { xMin: 212, xMax: 290, yMin: 238.5, yMax: 247.5 }, dy)
  )
  const ctpsState =
    readBox(items, { xMin: 290, xMax: 328, yMin: 238.5, yMax: 247.5 }, dy) ||
    'RR'
  const rawCpf = readBox(
    items,
    { xMin: 328, xMax: 415, yMin: 238.5, yMax: 247.5 },
    dy
  )
  const cpfDigits =
    cleanCpfDigits(rawCpf).length === 11
      ? cleanCpfDigits(rawCpf)
      : extractFallbackCpf(items, employerCnpj)
  const cnhNumber =
    readBox(items, { xMin: 415, xMax: 514, yMin: 238.5, yMax: 247.5 }, dy) ||
    null
  const cnhCategory =
    readBox(items, { xMin: 514, xMax: 565, yMin: 238.5, yMax: 247.5 }, dy) ||
    null

  // Documents Row 3 (Military, Race/Color)
  const militaryDoc =
    readBox(items, { xMin: 115, xMax: 188, yMin: 253.5, yMax: 263.0 }, dy) ||
    null
  const militaryCategory =
    readBox(items, { xMin: 188, xMax: 248, yMin: 253.5, yMax: 263.0 }, dy) ||
    null
  const raceColor =
    readBox(items, { xMin: 248, xMax: 565, yMin: 253.5, yMax: 263.0 }, dy) ||
    null

  // Phones
  const landlinePhone =
    readBox(items, { xMin: 299, xMax: 427, yMin: 269.0, yMax: 278.0 }, dy) ||
    null
  const mobilePhone =
    readBox(items, { xMin: 427, xMax: 565, yMin: 269.0, yMax: 278.0 }, dy) ||
    null

  // Role & CBO
  const roleTitle = readBox(
    items,
    { xMin: 317, xMax: 503, yMin: 284.0, yMax: 296.5 },
    dy
  )
  const cboCode =
    readBox(items, { xMin: 503, xMax: 565, yMin: 284.0, yMax: 296.5 }, dy) ||
    null

  // Admission, Salary, Schedule Summary
  const admissionDate =
    parseBrDateToIso(
      readBox(items, { xMin: 30, xMax: 117, yMin: 304.0, yMax: 314.5 }, dy)
    ) || ''
  const salary = parseBrSalary(
    readBox(items, { xMin: 117, xMax: 212, yMin: 304.0, yMax: 314.5 }, dy)
  )
  const paymentType =
    readBox(items, { xMin: 212, xMax: 273, yMin: 304.0, yMax: 314.5 }, dy) ||
    'Mensal'
  const workHoursSummary =
    readBox(items, { xMin: 273, xMax: 424, yMin: 304.0, yMax: 314.5 }, dy) ||
    null
  const breakHoursSummary =
    readBox(items, { xMin: 424, xMax: 565, yMin: 304.0, yMax: 314.5 }, dy) ||
    null

  // FGTS
  const fgtsOptionDate = parseBrDateToIso(
    readBox(items, { xMin: 74, xMax: 163, yMin: 322.0, yMax: 333.5 }, dy)
  )
  const fgtsBankAccount =
    readBox(items, { xMin: 163, xMax: 454, yMin: 322.0, yMax: 333.5 }, dy) ||
    null
  const fgtsRectificationDate = parseBrDateToIso(
    readBox(items, { xMin: 454, xMax: 565, yMin: 322.0, yMax: 333.5 }, dy)
  )

  // PIS
  const pisRegistrationDate = parseBrDateToIso(
    readBox(items, { xMin: 30, xMax: 94, yMin: 349.5, yMax: 359.0 }, dy)
  )
  const pisNumber =
    readBox(items, { xMin: 94, xMax: 195, yMin: 349.5, yMax: 359.0 }, dy) ||
    null
  const pisBankName =
    readBox(items, { xMin: 195, xMax: 565, yMin: 349.5, yMax: 359.0 }, dy) ||
    null
  const pisBankNumber =
    readBox(items, { xMin: 30, xMax: 94, yMin: 365.0, yMax: 376.0 }, dy) || null
  const pisBankBranch =
    readBox(items, { xMin: 94, xMax: 170, yMin: 365.0, yMax: 376.0 }, dy) ||
    null
  const pisBankAddress =
    readBox(items, { xMin: 170, xMax: 565, yMin: 365.0, yMax: 376.0 }, dy) ||
    null

  // Rescisão (auto-detect terminated employees)
  const rawTerminationDate = readBox(
    items,
    { xMin: 360, xMax: 565, yMin: 565.0, yMax: 590.0 },
    dy
  ).replace(/Data da sa[íi]da\s*:?/gi, '')
  const terminationDate = parseBrDateToIso(rawTerminationDate)

  const rawTerminationType = readBox(
    items,
    { xMin: 360, xMax: 565, yMin: 590.0, yMax: 635.0 },
    dy
  )
    .replace(/Tipo do desligamento\s*:?/gi, '')
    .trim()
  const terminationType = rawTerminationType || null

  const status: 'ACTIVE' | 'INACTIVE' = terminationDate ? 'INACTIVE' : 'ACTIVE'

  // General Observations
  const generalObservations =
    readBoxLines(
      items,
      { xMin: 30, xMax: 565, yMin: 743.0, yMax: 825.0 },
      dy
    ).join('\n') || null

  const record: ParsedEmployeeRecord = {
    id: `pdf-emp-${page.pageNumber}-${index}`,
    sourcePages: [page.pageNumber],
    esocialCode: rawEsocial || null,
    employerName,
    employerCnpj,
    employerAddress,
    fullName,
    birthDate,
    birthPlace,
    nationality,
    maritalStatus,
    raceColor,
    fatherName,
    motherName,
    address: address || null,
    zipCode,
    landlinePhone,
    mobilePhone,
    email: null,
    beneficiaries,
    cpf: cpfDigits,
    rgNumber,
    rgIssueDate,
    rgIssuer,
    ctpsNumber,
    ctpsSeries,
    ctpsIssueDate,
    ctpsState,
    voterRegistration,
    voterZone,
    voterSection,
    cnhNumber,
    cnhCategory,
    militaryDoc,
    militaryCategory,
    classCouncilNumber,
    admissionDate,
    roleTitle,
    cboCode,
    salary,
    paymentType,
    workHoursSummary,
    breakHoursSummary,
    fgtsOptionDate,
    fgtsRectificationDate,
    fgtsBankAccount,
    pisRegistrationDate,
    pisNumber,
    pisBankName,
    pisBankNumber,
    pisBankBranch,
    pisBankAddress,
    workSchedule: null,
    generalObservations,
    status,
    terminationDate,
    terminationType,
    warnings: [],
    errors: [],
  }

  return validateParsedEmployee(record)
}

const SCHEDULE_DAYS: Array<{ day: string; defaultY: number }> = [
  { day: 'Dom', defaultY: 132.0 },
  { day: 'Seg', defaultY: 145.9 },
  { day: 'Ter', defaultY: 159.7 },
  { day: 'Qua', defaultY: 173.5 },
  { day: 'Qui', defaultY: 187.3 },
  { day: 'Sex', defaultY: 201.1 },
  { day: 'Sab', defaultY: 214.9 },
]

function parsePage2WorkSchedule(page: PdfPageData): WorkScheduleDay[] | null {
  const items = page.items
  const domLabel = items.find(
    (i) => /^Dom$/i.test(i.str.trim()) && i.x >= 30 && i.x <= 75
  )
  const dy =
    domLabel && Math.abs(domLabel.y - 132.0) <= 25 ? domLabel.y - 132.0 : 0

  const schedule: WorkScheduleDay[] = []
  let hasAnyValue = false

  for (const { day, defaultY } of SCHEDULE_DAYS) {
    const exactLabel = items.find(
      (i) =>
        i.str.trim().toLowerCase() === day.toLowerCase() &&
        i.x >= 30 &&
        i.x <= 75 &&
        Math.abs(i.y - (defaultY + dy)) <= 12
    )
    const rowY = exactLabel ? exactLabel.y : defaultY + dy
    const yMin = rowY - 6.5
    const yMax = rowY + 6.5

    const type = readBox(items, { xMin: 75, xMax: 119, yMin, yMax })
    const entry = readBox(items, { xMin: 119, xMax: 160, yMin, yMax })
    const breakStart = readBox(items, { xMin: 160, xMax: 202, yMin, yMax })
    const breakEnd = readBox(items, { xMin: 202, xMax: 245, yMin, yMax })
    const exit = readBox(items, { xMin: 245, xMax: 288, yMin, yMax })

    if (type || entry || breakStart || breakEnd || exit) {
      hasAnyValue = true
    }

    schedule.push({
      day,
      type: type || '',
      entry: entry || '',
      breakStart: breakStart || '',
      breakEnd: breakEnd || '',
      exit: exit || '',
    })
  }

  return hasAnyValue ? schedule : null
}

export function validateParsedEmployee(
  record: ParsedEmployeeRecord
): ParsedEmployeeRecord {
  const errors: string[] = []
  const warnings: string[] = []

  if (!record.fullName || record.fullName.trim().length < 2) {
    errors.push('Nome completo ausente')
  }

  const cpfDigits = cleanCpfDigits(record.cpf)
  if (cpfDigits.length !== 11) {
    errors.push('CPF ausente ou incompleto')
  } else if (!isValidCpfDigits(cpfDigits)) {
    warnings.push('Dígito verificador do CPF merece conferência')
  }

  if (!record.admissionDate) {
    errors.push('Data de admissão ausente')
  }

  if (!record.roleTitle || record.roleTitle.trim().length < 2) {
    errors.push('Função/cargo ausente')
  }

  if (record.salary <= 0) {
    warnings.push('Salário zerado ou não identificado')
  }

  if (record.status === 'INACTIVE' && record.terminationDate) {
    warnings.push(`Desligamento detectado (${record.terminationDate})`)
  }

  return {
    ...record,
    cpf: cpfDigits,
    errors,
    warnings,
  }
}

export function parseEmployeePdfPages(pages: PdfPageData[]): PdfParseResult {
  const employees: ParsedEmployeeRecord[] = []
  const ignoredPages: number[] = []
  let recognizedEmployeePages = 0
  let recognizedSchedulePages = 0
  let totalTextItems = 0

  for (const page of pages) {
    totalTextItems += page.items.length

    if (isEmployeeMainPage(page)) {
      recognizedEmployeePages += 1
      const parsed = parsePage1Employee(page, employees.length)
      employees.push(parsed)
      continue
    }

    if (isWorkSchedulePage(page) && employees.length > 0) {
      recognizedSchedulePages += 1
      const lastEmployee = employees[employees.length - 1]
      lastEmployee.sourcePages.push(page.pageNumber)
      const schedule = parsePage2WorkSchedule(page)
      if (schedule && !lastEmployee.workSchedule) {
        lastEmployee.workSchedule = schedule
      }
      continue
    }

    ignoredPages.push(page.pageNumber)
  }

  // Flag duplicate CPFs inside the same PDF
  const cpfCounts = new Map<string, number>()
  for (const emp of employees) {
    if (emp.cpf.length === 11) {
      cpfCounts.set(emp.cpf, (cpfCounts.get(emp.cpf) ?? 0) + 1)
    }
  }
  for (const emp of employees) {
    if (emp.cpf.length === 11 && (cpfCounts.get(emp.cpf) ?? 0) > 1) {
      emp.warnings = [
        ...emp.warnings,
        'CPF aparece duplicado neste mesmo PDF (revisar)',
      ]
    }
  }

  const possibleScannedPdf =
    pages.length > 0 && totalTextItems < pages.length * 5

  return {
    employees,
    totalPages: pages.length,
    recognizedEmployeePages,
    recognizedSchedulePages,
    ignoredPages,
    possibleScannedPdf,
  }
}

export async function extractEmployeesFromPdfFile(
  file: File,
  onProgress?: (currentPage: number, totalPages: number) => void
): Promise<PdfParseResult> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

  const buffer = await file.arrayBuffer()
  const loadingTask = pdfjs.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
  })
  const doc = await loadingTask.promise

  const pages: PdfPageData[] = []

  try {
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber)
      const viewport = page.getViewport({ scale: 1 })
      const textContent = await page.getTextContent()

      const items: PdfTextItem[] = []
      for (const rawItem of textContent.items) {
        if (!('str' in rawItem) || !rawItem.str || !rawItem.str.trim()) continue
        items.push({
          str: rawItem.str,
          x: rawItem.transform[4],
          y: viewport.height - rawItem.transform[5],
          width: rawItem.width,
          height: rawItem.height,
        })
      }

      pages.push({
        pageNumber,
        width: viewport.width,
        height: viewport.height,
        items,
      })

      page.cleanup()
      onProgress?.(pageNumber, doc.numPages)
    }
  } finally {
    await loadingTask.destroy()
  }

  return parseEmployeePdfPages(pages)
}
