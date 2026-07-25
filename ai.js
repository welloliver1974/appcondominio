/**
 * GestãoApp - Real AI Assistant (OpenAI Compatible)
 */

class CondoAI {
  constructor(db) {
    this.db = db;
  }

  async processCommand(text, imageBase64 = null, onChunk = null) {
    const apiUrl = localStorage.getItem('llm_url');
    const apiKey = localStorage.getItem('llm_key');
    const model = localStorage.getItem('llm_model');

    if (!apiUrl || !apiKey || !model) {
      return {
        message: "🤖 **Atenção:** A Inteligência Artificial ainda não foi configurada. Por favor, vá na aba de **Configurações**, na seção 'Inteligência Artificial (LLM)', e insira sua Base URL, Modelo e API Key.",
        actionExecuted: false
      };
    }

    // Gather context from DB
    const transactions = await this.db.getTransactions();
    const residents = await this.db.getResidents();
    const reserva = this.db.getFundoReserva();
    
    let totalReceitas = 0;
    let totalDespesas = 0;
    transactions.forEach(t => {
      if (t.tipo === "receita") totalReceitas += t.valor;
      else totalDespesas += t.valor;
    });
    const saldo = totalReceitas - totalDespesas;

    const pendentes = residents.filter(r => r.status_pagamento !== "pago");
    const pendentesList = pendentes.length > 0 
      ? pendentes.map(r => `Apto ${r.apto} (${r.morador}, R$ ${r.valor})`).join(", ")
      : "Nenhum (Todos em dia)";

    const todayDate = new Date().toISOString().split("T")[0];

    // Calculate average of last 3 months for variable bills (smart suggestions)
    function calcAverage(categoria) {
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const relevant = transactions.filter(t =>
        t.categoria === categoria &&
        t.tipo === "despesa" &&
        new Date(t.data) >= threeMonthsAgo &&
        new Date(t.data) <= now
      );
      if (relevant.length === 0) return null;
      const sum = relevant.reduce((acc, t) => acc + t.valor, 0);
      return sum / relevant.length;
    }
    const mediaAgua = calcAverage("agua");
    const mediaLuz = calcAverage("luz");
    let sugestaoMedia = "";
    if (mediaAgua || mediaLuz) {
      sugestaoMedia = "\n- Média de Gastos (últimos 3 meses):";
      if (mediaAgua) sugestaoMedia += ` Água ~R$ ${mediaAgua.toFixed(2)}`;
      if (mediaLuz) sugestaoMedia += ` Luz ~R$ ${mediaLuz.toFixed(2)}`;
    }

    // Build System Prompt
    const systemPrompt = `Você é o GestãoApp AI, o assistente inteligente de gestão do condomínio.

INFORMAÇÕES ATUAIS DO CONDOMÍNIO (HOJE: ${todayDate}):
- Saldo em Caixa: R$ ${saldo.toFixed(2)}
- Fundo de Reserva: R$ ${reserva.toFixed(2)}
- Unidades Pendentes de Pagamento: ${pendentesList}${sugestaoMedia}

INSTRUÇÕES:
1. Responda de forma amigável, direta e profissional. Formate os valores em Reais (R$).
2. Se o usuário estiver apenas perguntando sobre saldos, relatórios ou pendências, apenas responda em Markdown.
3. Se o usuário pedir para REGISTRAR, ADICIONAR, LANÇAR ou PAGAR alguma despesa ou receita (ou se ele enviar uma FOTO de conta/boleto e informar que pagou ou quer lançar), você deve analisar os dados, e além do seu texto de resposta, você DEVE retornar um bloco JSON delimitado por \`\`\`json ... \`\`\` com os dados estruturados da transação.

FORMATO DO JSON (apenas se for lançar algo):
\`\`\`json
{
  "action": "addTransaction",
  "payload": {
    "data": "YYYY-MM-DD",
    "tipo": "receita" | "despesa",
    "categoria": "agua" | "luz" | "limpeza" | "conserto" | "condominio" | "area_comum" | "reserva" | "outro",
    "valor": 150.00,
    "descricao": "Breve descrição",
    "apto_id": "101" | "102" | "201" | "202" | "comum"
  }
}
\`\`\`
Dica para leitura de contas via FOTO:
	- Extraia o valor TOTAL exato (procure "Total a Pagar", "Valor", "R$").
	- Identifique o tipo: se for conta de LUZ/energia → categoria "luz". Se for conta de ÁGUA/sabesp/caesb → "agua". Limpeza → "limpeza". Outros → "outro".
	- Use a data de vencimento da conta no campo "data" do JSON.
	- Se o usuário disser "paguei" ou "foi paga", marque a data como a atual ou a de vencimento.
	- Contas de água, luz e limpeza são do condomínio inteiro → use apto_id "comum".
	- Contas de condomínio (receita) sempre vinculadas ao apto do morador.
Nunca retorne o JSON se não for para salvar/alterar o banco.`;

    // Construct Messages array (OpenAI Format)
    let userContent = [];
    if (text) {
      userContent.push({ type: "text", text: text });
    } else if (imageBase64) {
      userContent.push({ type: "text", text: "Por favor, analise a conta/documento nesta imagem." });
    }
    
    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: { url: imageBase64 }
      });
    }

    const bodyPayload = {
      model: model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent }
      ],
      temperature: 0.1,
      stream: onChunk ? true : false
    };

    // Make the API Request
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(bodyPayload)
    });

    if (!response.ok) {
      throw new Error(`API HTTP Error: ${response.status}`);
    }

    let assistantMessage;

    if (onChunk) {
      // Streaming response — read SSE chunks
      assistantMessage = await this._readStream(response, onChunk);
    } else {
      // Regular response
      const resultData = await response.json();
      assistantMessage = resultData.choices[0].message.content;
    }

    // Check if there is a JSON block to execute
    const jsonMatch = assistantMessage.match(/```json\s*([\s\S]*?)\s*```/);
    
    if (jsonMatch) {
      try {
        const jsonBlock = JSON.parse(jsonMatch[1]);
        if (jsonBlock.action === "addTransaction" && jsonBlock.payload) {
          // Execute the DB action
          await this.db.addTransaction(jsonBlock.payload);
          
          // Remove the JSON block from the message shown to the user
          const cleanMessage = assistantMessage.replace(/```json\s*[\s\S]*?\s*```/, "").trim();
          
          return {
            message: cleanMessage || "🤖 Transação registrada com sucesso!",
            actionExecuted: true,
            payload: jsonBlock.payload
          };
        }
      } catch (e) {
        console.error("Erro ao fazer parse do JSON da IA:", e);
      }
    }

    // Normal response
    return {
      message: assistantMessage,
      actionExecuted: false
    };
  }

  /**
   * Read an SSE stream from the API response, calling onChunk(text) for each content delta.
   * Returns the full accumulated message text.
   */
  async _readStream(response, onChunk) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith("data: ")) continue;
        const data = trimmed.slice(6);
        if (data === "[DONE]") continue;

        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullText += delta;
            onChunk(fullText);
          }
        } catch (e) {
          // Skip malformed chunks
        }
      }
    }

    if (buffer.trim() && buffer.trim().startsWith("data: ")) {
      const data = buffer.trim().slice(6);
      if (data !== "[DONE]") {
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) fullText += delta;
        } catch (e) {}
      }
    }

    return fullText;
  }
}

window.condoAi = new CondoAI(window.condoDb);
