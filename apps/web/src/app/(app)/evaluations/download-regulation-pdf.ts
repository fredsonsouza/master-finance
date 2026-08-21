export function downloadRegulationPdf() {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  const logoUrl = `${window.location.origin}/images/masterclin-logo.png`

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <title>Regulamento do Programa de Avaliação de Atendimento - Masterclin</title>
        <style>
          @page {
            size: A4;
            margin: 12mm 18mm 15mm 18mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            color: #1e293b;
            line-height: 1.45;
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-size: 10pt;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #0284c7;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .logo {
            max-height: 60px;
            max-width: 250px;
            width: auto;
            margin: 0 auto 8px auto;
            display: block;
            object-fit: contain;
          }
          .title {
            font-size: 13.5pt;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 4px 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .subtitle {
            font-size: 9pt;
            color: #0284c7;
            font-weight: 700;
            margin: 0;
            text-transform: uppercase;
          }
          .section-title {
            font-size: 10pt;
            font-weight: 700;
            color: #0284c7;
            background-color: #f1f5f9;
            padding: 4px 8px;
            border-left: 4px solid #0284c7;
            margin-top: 12px;
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          p {
            margin-top: 0;
            margin-bottom: 6px;
            text-align: justify;
          }
          ul {
            margin-top: 4px;
            margin-bottom: 6px;
            padding-left: 20px;
          }
          li {
            margin-bottom: 4px;
            text-align: justify;
          }
          .table-bonus {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            margin-bottom: 10px;
            font-size: 9.5pt;
          }
          .table-bonus th {
            background-color: #0284c7;
            color: #ffffff;
            padding: 6px 10px;
            text-align: left;
            font-weight: 700;
          }
          .table-bonus td {
            border: 1px solid #cbd5e1;
            padding: 6px 10px;
          }
          .termo-box {
            border: 1.5px solid #0284c7;
            border-radius: 6px;
            padding: 12px;
            margin-top: 14px;
            background-color: #fafafa;
            page-break-inside: avoid;
          }
          .termo-title {
            font-size: 10.5pt;
            font-weight: 800;
            color: #0284c7;
            text-align: center;
            margin: 0 0 8px 0;
            text-transform: uppercase;
          }
          .fields-grid {
            margin-top: 12px;
            font-size: 9.5pt;
            line-height: 1.8;
          }
          .signatures-container {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            padding: 0 15px;
            page-break-inside: avoid;
          }
          .signature-box {
            width: 45%;
            text-align: center;
          }
          .signature-line {
            border-top: 1.5px solid #334155;
            margin-bottom: 5px;
          }
          .signature-label {
            font-size: 9pt;
            font-weight: 700;
            color: #0f172a;
            text-transform: uppercase;
          }
          @media print {
            body { background: transparent; }
            .section-title { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .table-bonus th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .termo-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${logoUrl}" class="logo" alt="Masterclin Logo" />
          <h1 class="title">REGULAMENTO DO PROGRAMA DE AVALIAÇÃO DE ATENDIMENTO</h1>
          <p class="subtitle">DIRETRIZES DE ATENDIMENTO, ÉTICA, PARTICIPAÇÃO, APURAÇÃO E BONIFICAÇÃO</p>
        </div>

        <div class="section-title">1. OBJETIVO DO PROGRAMA</div>
        <p>
          O presente regulamento estabelece as diretrizes institucionais, normas éticas e critérios de engajamento do 
          <strong>Programa de Avaliação de Atendimento da Clínica Masterclin</strong>. O programa tem como objetivo mensurar a satisfação dos nossos clientes/pacientes, valorizar o bom atendimento e promover a melhoria contínua da experiência de recepção nas unidades.
        </p>

        <div class="section-title">2. PARTICIPAÇÃO E CONDUTA ÉTICA</div>
        <ul>
          <li>A participação no programa não gera direito adquirido à bonificação, sendo a premiação condicionada ao cumprimento das regras deste Regulamento e à efetiva apuração dos resultados do respectivo período.</li>
          <li>A empresa poderá, a qualquer momento, mediante comunicação interna, alterar, suspender, modificar ou encerrar o programa, inclusive seus critérios, valores e condições de participação, conforme necessidade administrativa ou operacional.</li>
        </ul>

        <div class="section-title">3. USO DOS LINKS E QR CODES INDIVIDUALIZADOS</div>
        <ul>
          <li><strong>Caráter Pessoal e Intransferível:</strong> O QR Code e o link de avaliação fornecidos são de uso exclusivo e intransferível de cada recepcionista/atendente.</li>
          <li><strong>Exposição Autorizada:</strong> O QR Code deve permanecer visível apenas no guichê de atendimento do próprio colaborador responsável.</li>
          <li><strong>Compartilhamento Inadequado:</strong> É proibido utilizar o QR Code ou link próprio para coletar avaliações decorrentes do atendimento prestado por outro colega de trabalho.</li>
        </ul>

        <div class="section-title">4. PENALIDADES E SANÇÕES DISCIPLINARES</div>
        <p>
          A violação deste Regulamento poderá resultar na perda da bonificação e na aplicação das medidas disciplinares cabíveis, de acordo com a natureza, gravidade, consequências, circunstâncias e eventual reincidência da conduta, observada a legislação aplicável.
        </p>
        <ul>
          <li><strong>a)</strong> Orientação formal, quando cabível;</li>
          <li><strong>d)</strong> Exclusão do Programa e perda do direito à bonificação do período;</li>
          <li><strong>e)</strong> Outras medidas administrativas e disciplinares legalmente cabíveis.</li>
        </ul>
        <p style="font-size: 9pt; color: #475569; font-style: italic;">
          <strong>Parágrafo único:</strong> A existência deste Programa não limita o poder diretivo e disciplinar da empresa nem impede a aplicação das medidas previstas em outros regulamentos internos ou na legislação.
        </p>

        <div class="section-title">5. PÓDIO DA RECEPÇÃO E CRITÉRIOS DE BONIFICAÇÃO</div>
        <p>
          O reconhecimento do desempenho da equipe será apurado mensalmente e aplicado individualmente para cada unidade da Masterclin, não havendo ranking geral entre unidades distintas.
        </p>
        <p>
          Somente serão consideradas, para fins de classificação, as avaliações consideradas válidas após a apuração realizada pela empresa.
        </p>

        <table class="table-bonus">
          <thead>
            <tr>
              <th>Posição do Pódio</th>
              <th>Reconhecimento</th>
              <th>Bonificação (R$)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>1º Lugar (Ouro 🥇)</strong></td>
              <td>Atendente Destaque #1 da Unidade</td>
              <td><strong>R$ 400,00</strong></td>
            </tr>
            <tr>
              <td><strong>2º Lugar (Prata 🥈)</strong></td>
              <td>Atendente Destaque #2 da Unidade</td>
              <td><strong>R$ 300,00</strong></td>
            </tr>
            <tr>
              <td><strong>3º Lugar (Bronze 🥉)</strong></td>
              <td>Atendente Destaque #3 da Unidade</td>
              <td><strong>R$ 200,00</strong></td>
            </tr>
          </tbody>
        </table>

        <p>
          A eventual bonificação está condicionada ao cumprimento integral deste Regulamento e aos resultados validados pela empresa. O recebimento em determinado período não assegura recebimento em períodos futuros.
        </p>
        <p>
          Os valores, critérios, quantidade de premiados e demais condições poderão ser revistos pela Administração mediante comunicação interna.
        </p>
        <p>
          A Administração poderá deixar de conceder determinada premiação quando não houver colaboradores elegíveis, quando os resultados não atenderem aos critérios estabelecidos ou quando forem identificadas irregularidades que comprometam a apuração.
        </p>

        <div class="section-title">6. CRITÉRIOS DE DESEMPATE</div>
        <p>Em caso de empate, serão observados sucessivamente:</p>
        <ul>
          <li><strong>a)</strong> Maior quantidade de avaliações válidas;</li>
          <li><strong>b)</strong> Maior média das avaliações válidas;</li>
          <li><strong>c)</strong> Menor quantidade de avaliações desconsideradas por inconsistência;</li>
          <li><strong>d)</strong> Persistindo o empate, será aplicado critério objetivo adicional definido pela Administração para o respectivo período.</li>
        </ul>

        <div class="section-title">7. CONFIDENCIALIDADE E PROTEÇÃO DE INFORMAÇÕES</div>
        <p>
          Os colaboradores que tiverem acesso a informações decorrentes do Programa deverão manter sigilo sobre dados de clientes/pacientes e informações internas da empresa.
        </p>
        <p>
          É vedada a divulgação, reprodução, compartilhamento ou utilização dessas informações para finalidade diversa daquela autorizada pela empresa, observadas as normas internas e a legislação aplicável.
        </p>

        <div class="section-title">8. DISPOSIÇÕES GERAIS</div>
        <p>
          A Administração/Gerência da Clínica Masterclin será responsável pela interpretação e aplicação deste Regulamento e pela condução da apuração.
        </p>
        <p>
          Casos omissos ou situações não previstas serão analisados e deliberados pela Administração, considerando este Regulamento, as demais normas internas e a legislação aplicável.
        </p>
        <p>
          A empresa poderá, mediante comunicação interna, alterar, suspender, modificar ou encerrar o Programa, inclusive seus critérios, valores e condições, conforme necessidade administrativa, operacional ou estratégica.
        </p>
        <p>
          O presente Regulamento entra em vigor na data de sua divulgação interna e permanecerá vigente até que seja substituído, alterado ou revogado pela Administração.
        </p>

        <div class="termo-box">
          <div class="termo-title">9. TERMO DE CIÊNCIA E CONCORDÂNCIA</div>
          <p>
            Declaro que recebi, li e compreendi o Regulamento do Programa de Avaliação de Atendimento da Masterclin, estando ciente das regras de participação, conduta, utilização dos mecanismos de avaliação, critérios de apuração, auditoria, classificação e condições para eventual concessão de bonificação.
          </p>
          <p>
            Declaro, ainda, estar ciente de que eventual bonificação está condicionada ao cumprimento integral das regras e aos resultados validados pela empresa, não constituindo garantia de recebimento em períodos futuros.
          </p>
          <p>
            Comprometo-me a agir de forma ética, transparente e em conformidade com este Regulamento, reconhecendo que o descumprimento das regras poderá resultar na perda do direito à bonificação e na adoção das medidas administrativas e disciplinares cabíveis.
          </p>

          <div class="fields-grid">
            <div><strong>Nome do colaborador:</strong> ____________________________________________________________________</div>
            <div style="display: flex; justify-content: space-between; margin-top: 6px;">
              <span><strong>CPF:</strong> ____________________________________</span>
              <span><strong>Cargo:</strong> ___________________________________</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 6px;">
              <span><strong>Unidade:</strong> ________________________________</span>
              <span><strong>Data:</strong> ______/______/____________</span>
            </div>
          </div>

          <div class="signatures-container">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Assinatura do Colaborador</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Assinatura da Gerência / Responsável</div>
            </div>
          </div>
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
