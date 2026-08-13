export function downloadRegulationPdf() {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const logoUrl = `${window.location.origin}/images/masterclin-logo.png`

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Regulamento do Programa de Avaliações - Clínica Masterclin</title>
        <style>
          @page {
            size: A4;
            margin: 15mm 20mm 20mm 20mm;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #1e293b;
            line-height: 1.5;
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-size: 11.5pt;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .logo {
            max-height: 75px;
            max-width: 280px;
            width: auto;
            margin: 0 auto 12px auto;
            display: block;
            object-fit: contain;
          }
          .title {
            font-size: 16pt;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 4px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 10.5pt;
            color: #0284c7;
            font-weight: 700;
            margin: 0;
            text-transform: uppercase;
          }
          .section-title {
            font-size: 11pt;
            font-weight: 700;
            color: #0284c7;
            background-color: #f1f5f9;
            padding: 6px 10px;
            border-left: 4px solid #0284c7;
            margin-top: 18px;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          p {
            margin-top: 0;
            margin-bottom: 10px;
            text-align: justify;
          }
          ul {
            margin-top: 4px;
            margin-bottom: 10px;
            padding-left: 22px;
          }
          li {
            margin-bottom: 6px;
            text-align: justify;
          }
          .alert-box {
            background-color: #fef2f2;
            border: 1px solid #fca5a5;
            border-radius: 6px;
            padding: 10px 14px;
            margin: 12px 0;
            color: #991b1b;
            font-size: 10.5pt;
          }
          .table-bonus {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            margin-bottom: 14px;
            font-size: 10.5pt;
          }
          .table-bonus th {
            background-color: #0284c7;
            color: #ffffff;
            padding: 8px 12px;
            text-align: left;
            font-weight: 700;
          }
          .table-bonus td {
            border: 1px solid #cbd5e1;
            padding: 8px 12px;
          }
          .signature-section {
            margin-top: 45px;
            text-align: center;
            page-break-inside: avoid;
          }
          .signature-line {
            width: 260px;
            border-top: 1.5px solid #334155;
            margin: 0 auto 8px auto;
          }
          .signature-name {
            font-size: 12pt;
            font-weight: 700;
            color: #0f172a;
            margin: 0;
          }
          .signature-role {
            font-size: 10.5pt;
            color: #475569;
            font-weight: 600;
            margin-top: 2px;
          }
          @media print {
            body { background: transparent; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" class="logo" alt="Masterclin Logo" />
          <h1 class="title">REGULAMENTO DO PROGRAMA DE AVALIAÇÃO</h1>
          <p class="subtitle">Diretrizes de Atendimento, Ética e Bonificação de Recepção</p>
        </div>

        <div class="section-title">1. OBJETIVO DO PROGRAMA</div>
        <p>
          O presente regulamento estabelece as diretrizes institucionais, normas éticas e critérios de engajamento do 
          <strong>Programa de Avaliação de Atendimento da Clínica Masterclin</strong>. O programa tem como objetivo mensurar a satisfação dos nossos clientes/pacientes, valorizar o bom atendimento e promover a melhoria contínua da experiência de recepção nas unidades.
        </p>

        <div class="section-title">2. CONDUTA ÉTICA E COLETA DE FEEDBACK</div>
        <ul>
          <li><strong>Espontaneidade Obrigatória:</strong> Cada avaliação deve refletir o feedback espontâneo e legítimo do cliente/paciente que foi efetivamente atendido na unidade.</li>
          <li><strong>Vedação de Autoavaliação:</strong> É estritamente proibido ao colaborador realizar autoavaliações, solicitar que colegas, familiares ou amigos simulem atendimentos fictícios para gerar avaliações positivas.</li>
          <li><strong>Proibição de Coação:</strong> É vedado induzir, coagir ou direcionar o cliente a atribuir notas específicas durante o processo de coleta de opinião.</li>
        </ul>

        <div class="section-title">3. USO DOS LINKS E QR CODES INDIVIDUALIZADOS</div>
        <ul>
          <li><strong>Caráter Pessoal e Intransferível:</strong> O QR Code e o link de avaliação fornecidos são de uso exclusivo e intransferível de cada recepcionista/atendente.</li>
          <li><strong>Exposição Autorizada:</strong> O QR Code deve permanecer visível apenas no guichê de atendimento do próprio colaborador responsável.</li>
          <li><strong>Compartilhamento Inadequado:</strong> É proibido utilizar o QR Code ou link próprio para coletar avaliações decorrentes do atendimento prestado por outro colega de trabalho.</li>
        </ul>

        <div class="section-title">4. PENALIDADES E SANÇÕES DISCIPLINARES</div>
        <div class="alert-box">
          <strong>Atenção:</strong> Práticas fraudulentas, adulterações ou compartilhamentos indevidos constituem falta grave e sujeitarão o colaborador responsável às seguintes sanções:
        </div>
        <ul>
          <li><strong>a) Advertência Formal:</strong> Registro de advertência em prontuário de recursos humanos por violação ética.</li>
          <li><strong>b) Desclassificação e Perda de Bonificação:</strong> Cancelamento imediato da participação no Pódio de Atendimento do mês corrente e perda do direito a qualquer tipo de premiação/bonificação vinculada.</li>
          <li><strong>c) Sanções Conforme a CLT:</strong> Em casos de reincidência ou conduta comprovadamente dolosa, aplicação das penalidades previstas na legislação trabalhista (suspensão disciplinar ou demissão por justa causa conforme Art. 482 da CLT).</li>
        </ul>

        <div class="section-title">5. PÓDIO DA RECEPÇÃO E CRITÉRIOS DE BONIFICAÇÃO</div>
        <p>
          O reconhecimento do desempenho da equipe será apurado mensalmente e aplicado <strong>individualmente para cada unidade</strong> da Masterclin (não havendo ranking geral entre unidades distintas).
        </p>

        <table class="table-bonus">
          <thead>
            <tr>
              <th>Posição do Pódio</th>
              <th>Reconhecimento</th>
              <th>Valor da Bonificação (R$)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1º Lugar (Ouro 🥇)</strong></td>
              <td>Atendente Destaque #1 da Unidade</td>
              <td><strong>R$ 0,00</strong> <em>(A ser definido pela Gerência)</em></td>
            </tr>
            <tr>
              <td><strong>2º Lugar (Prata 🥈)</strong></td>
              <td>Atendente Destaque #2 da Unidade</td>
              <td><strong>R$ 0,00</strong> <em>(A ser definido pela Gerência)</em></td>
            </tr>
            <tr>
              <td><strong>3º Lugar (Bronze 🥉)</strong></td>
              <td>Atendente Destaque #3 da Unidade</td>
              <td><strong>R$ 0,00</strong> <em>(A ser definido pela Gerência)</em></td>
            </tr>
          </tbody>
        </table>
        <p style="font-size: 10pt; color: #64748b;">
          * Nota: Os valores financeiros das bonificações estão temporariamente zerados e os critérios exatos de premiação serão divulgados oportunamente em aditivo oficial emitido pela Gerência.
        </p>

        <div class="section-title">6. DISPOSIÇÕES GERAIS</div>
        <p>
          A Gerência da Clínica Masterclin reserva-se o direito de auditar periodicamente todos os registros e IPs de envio de avaliações no sistema. Casos não previstos neste documento serão deliberados soberanamente pela administração geral.
        </p>

        <div class="signature-section">
          <div class="signature-line"></div>
          <p class="signature-name">Lidaiana Alves</p>
          <p class="signature-role">Gerência — Clínica Masterclin</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `)
  printWindow.document.close()
}
