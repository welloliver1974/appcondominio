/**
 * CondoAdmin Pro - AI Natural Language Processing Assistant
 */

class CondoAI {
  constructor(db) {
    this.db = db;
  }

  /**
   * Process a message or command in natural language and execute db action if needed
   * @param {string} text - User input text
   * @returns {Promise<{message: string, actionExecuted: boolean, payload: any}>}
   */
  async processCommand(text) {
    const rawText = text.toLowerCase().trim();
    
    // Normalize some words
    const cleanText = rawText
      .replace(/apto/g, "apartamento")
      .replace(/apt/g, "apartamento")
      .replace(/r\$/g, "")
      .replace(/reais/g, "");

    // 1. QUESTION: Current balance or reserves?
    if (cleanText.includes("saldo") || cleanText.includes("caixa") || cleanText.includes("quanto temos") || cleanText.includes("financeiro")) {
      const transactions = await this.db.getTransactions();
      const reserva = this.db.getFundoReserva();
      
      let totalReceitas = 0;
      let totalDespesas = 0;
      transactions.forEach(t => {
        if (t.tipo === "receita") totalReceitas += t.valor;
        else totalDespesas += t.valor;
      });
      const saldo = totalReceitas - totalDespesas;
      
      return {
        message: `🤖 **Relatório de Caixa Atual:**\n\n* **Saldo em Caixa:** R$ ${saldo.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n* **Fundo de Reserva:** R$ ${reserva.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n* **Total de Entradas:** R$ ${totalReceitas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n* **Total de Saídas:** R$ ${totalDespesas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n\nO caixa está saudável e pronto para novas operações!`,
        actionExecuted: false
      };
    }

    // 2. QUESTION: Pending units?
    if (cleanText.includes("pendente") || cleanText.includes("quem deve") || cleanText.includes("atrasado") || cleanText.includes("devedor")) {
      const residents = await this.db.getResidents();
      const pendentes = residents.filter(r => r.status_pagamento !== "pago");
      
      if (pendentes.length === 0) {
        return {
          message: "🤖 **Excelente notícia!** Todos os 4 apartamentos estão com os pagamentos de condomínio em dia para este período. Parabéns aos moradores!",
          actionExecuted: false
        };
      }
      
      let list = pendentes.map(r => `* **Apto ${r.apto}**: ${r.morador} (R$ ${r.valor.toFixed(2)})`).join("\n");
      return {
        message: `🤖 **Unidades com Condomínio Pendente:**\n\n${list}\n\nVocê pode cobrá-los amigavelmente ou registrar o pagamento assim que receber.`,
        actionExecuted: false
      };
    }

    // 3. ACTION: Register Receipt / Condominium fee
    // Match "101", "102", "201", "202" or similar
    const aptoMatch = cleanText.match(/(?:apartamento|unidade)\s*(101|102|201|202)/) || cleanText.match(/\b(101|102|201|202)\b/);
    const valueMatch = cleanText.match(/(?:valor de|de|pagou|recebi)\s*([0-9]+(?:[.,][0-9]{2})?)/) || cleanText.match(/\b([0-9]+(?:[.,][0-9]{2})?)\b/);
    
    const isReceita = cleanText.includes("pagou") || cleanText.includes("recebi") || cleanText.includes("pagamento") || cleanText.includes("entrada") || cleanText.includes("receita");
    const isDespesa = cleanText.includes("despesa") || cleanText.includes("paguei") || cleanText.includes("gasto") || cleanText.includes("luz") || cleanText.includes("agua") || cleanText.includes("conserto") || cleanText.includes("saida") || cleanText.includes("manutencao");

    if (isReceita && aptoMatch) {
      const apto = aptoMatch[1];
      const residents = await this.db.getResidents();
      const resident = residents.find(r => r.apto === apto);
      
      let valor = resident ? resident.valor : 250.00;
      if (valueMatch && parseFloat(valueMatch[1].replace(",", ".")) > 5) {
        valor = parseFloat(valueMatch[1].replace(",", "."));
      }

      const today = new Date().toISOString().split("T")[0];
      const transObj = {
        data: today,
        tipo: "receita",
        categoria: "condominio",
        valor: valor,
        descricao: `Condomínio Apto ${apto} - Pago via Comando Inteligente`,
        apto_id: apto
      };

      await this.db.addTransaction(transObj);
      
      return {
        message: `🤖 **Sucesso!** Registrei a receita do **Apto ${apto}** (${resident ? resident.morador : 'Morador'}) no valor de **R$ ${valor.toFixed(2)}**. O status do apartamento foi atualizado para **Pago**!`,
        actionExecuted: true,
        payload: transObj
      };
    }

    // 4. ACTION: Register Expense
    if (isDespesa) {
      let categoria = "outro";
      let desc = "Despesa registrada via Comando Inteligente";
      
      if (cleanText.includes("agua")) {
        categoria = "agua";
        desc = "Conta de Água Geral";
      } else if (cleanText.includes("luz") || cleanText.includes("energia")) {
        categoria = "luz";
        desc = "Conta de Luz Comum";
      } else if (cleanText.includes("conserto") || cleanText.includes("manutencao") || cleanText.includes("reforma") || cleanText.includes("predio")) {
        categoria = "conserto";
        desc = "Manutenção e Conserto predial";
      }

      // Check specific details or cost matches
      let valor = 100.00; // Default
      if (valueMatch) {
        valor = parseFloat(valueMatch[1].replace(",", "."));
      }

      // Detect optional specific description
      const descMatch = text.match(/(?:para|com|referente a)\s+([^,.\n]+)/i);
      if (descMatch) {
        desc = descMatch[1].trim();
      }

      const today = new Date().toISOString().split("T")[0];
      const transObj = {
        data: today,
        tipo: "despesa",
        categoria: categoria,
        valor: valor,
        descricao: desc,
        apto_id: aptoMatch ? aptoMatch[1] : "comum"
      };

      await this.db.addTransaction(transObj);

      return {
        message: `🤖 **Registrado com Sucesso!** Lançada despesa de **R$ ${valor.toFixed(2)}** sob a categoria **${categoria.toUpperCase()}** (${desc}). Os saldos já foram atualizados.`,
        actionExecuted: true,
        payload: transObj
      };
    }

    // 5. Help Prompt fallback
    return {
      message: `🤖 Desculpe, não entendi perfeitamente o seu comando. Como administrador, você pode:\n\n1. **Receber pagamentos:** *"Registrar pagamento do apto 102"* ou *"Recebi R$ 250 do 201"*\n2. **Registrar despesas:** *"Lançar conta de luz de R$ 145"* ou *"Registrar conserto de portão de R$ 300"*\n3. **Consultar caixa:** *"Quanto temos em caixa?"* ou *"Quem ainda está pendente?"*\n\nTente formular o comando com palavras-chave claras!`,
      actionExecuted: false
    };
  }
}

window.condoAi = new CondoAI(window.condoDb);
