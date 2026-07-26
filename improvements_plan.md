# Plano de Melhorias — GestãoApp Condomínio

> **Data:** 2026-07-26
> **Status:** 🎉 Todas as melhorias implementadas! Ver commits fc666f7..1cd5d24 e seguintes.
> **Encoding fixes:** Commits `254a25a`, `e3c08a1`, `101e9c7` — corrigida dupla codificação UTF-8 em app.js (acentos, setas, emoji).
> **Tema Claro/Escuro:** Commit `8a3b4db` — botão de alternância no header com persistência em localStorage.
> **PIN Proteção + Projeção + Lixeira:** Commits `8874b10`, `...` — PIN de proteção, projeção financeira, lixeira/recuperar transações.
> **Tema Claro/Escuro:** Commit `8a3b4db` — botão de alternância no header com persistência em localStorage.

---

## Melhorias Propostas

### 1. 📱 Status da Nuvem no Mobile (Prioridade: Média)
**Problema:** O badge "Modo Local / Nuvem Conectada" fica no `nav-footer` da sidebar, que é oculto (`display: none`) na versão mobile (<=768px). Usuários no celular não conseguem ver se o Turso está conectado.

**Solução:** Adicionar um mini-indicador no topo do `main-content` ou no `content-header` no mobile.

**Arquivos:** `style.css`, `app.js`

---

### 2. ✏️ Editar Lançamentos (Prioridade: Alta)
**Problema:** Hoje só é possível **excluir** uma transação. Se o usuário errou valor, categoria ou data, precisa apagar e criar de novo.

**Solução:** Adicionar botão de editar na tabela de transações. Ao clicar, preencher o formulário com os dados existentes para alteração.

**Arquivos:** `app.js` (função `loadTransactionsList` + handler de edição)

---

### 3. 📤 Extrato por Unidade / Compartilhar (Prioridade: Média)
**Problema:** O histórico da unidade já aparece no painel de detalhes, mas não há como compartilhar com o morador.

**Solução:** Botão "Compartilhar Extrato" no detalhe da unidade que gera uma mensagem via Web Share API ou WhatsApp com o resumo dos pagamentos do morador.

**Arquivos:** `app.js`

---

### 4. 📸 Recibo Vinculado à Transação (Prioridade: Baixa)
**Problema:** Quando o usuário tira foto de uma conta no chat e a IA registra a transação, a imagem é descartada.

**Solução:** Salvar a imagem Base64 no `localStorage` vinculada ao ID da transação, e exibir um ícone de "ver comprovante" na linha da transação.

**Arquivos:** `db.js`, `app.js`, `index.html`

---

### 5. 🎨 Modal Bonito no lugar de `confirm()` (Prioridade: Média)
**Problema:** O app usa `confirm()` e `alert()` do navegador para exclusão de transações e reset de dados, quebrando a imersão visual.

**Solução:** Substituir por modal customizado com o mesmo design glassmorphism do resto do app.

**Arquivos:** `index.html`, `style.css`, `app.js`

---

### 6. 🔗 Cobrança via WhatsApp / Pix (Prioridade: Alta)
**Problema:** O usuário precisa cobrar moradores inadimplentes manualmente.

**Solução:** Botão "Cobrar" no alerta de pendência que abre WhatsApp com mensagem pré-formatada:
```
Olá [Morador], o condomínio do Apto [N] no valor de R$ [X] referente a [mês] está pendente. 
Pix para pagamento: [chave]. Obrigado!
```
A chave Pix pode ser configurada nos Ajustes.

**Arquivos:** `app.js`, `index.html`

---

## Ordem Sugerida
1. 🔗 Cobrança via WhatsApp (rápido, alto impacto)
2. ✏️ Editar Lançamentos (funcionalidade importante)
3. 🎨 Modal bonito (melhora a experiência)
4. 📱 Status da Nuvem no Mobile
5. 📤 Extrato por Unidade
6. 📸 Recibo Vinculado
