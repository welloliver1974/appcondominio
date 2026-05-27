# Plano de Implementação: PWA para Administração de Condomínio

Este plano descreve a criação de um aplicativo web progressivo (PWA) de alto nível para gerenciamento de um condomínio de 4 apartamentos e área comum. O aplicativo apresentará uma interface visual espetacular com estética *premium* (glassmorphism, transições suaves, modo escuro refinado) e contará com um painel completo de controle financeiro, de moradores e interação inteligente orientada por IA.

## Perfil do Aplicativo & Design
* **Estilo Visual:** Dark mode futurista e refinado com efeito de vidro (Glassmorphic containers), tipografia moderna (Outfit ou Inter), gradientes fluidos e micro-interações animadas.
* **Componentes Principais:**
  1. **Dashboard Financeiro:** Caixa total, receitas mensais, despesas, gráfico interativo de fluxo de caixa (SVG responsivo) e balanço geral.
  2. **Registro de Transações:** Entrada rápida de receitas (pagamentos de condomínio) e despesas (água, luz, manutenção, consertos).
  3. **Gestão de Unidades/Moradores:** Visualização em grid dos 4 apartamentos (Apto 101, 102, 201, 202) e Área Comum, exibindo status de pagamento e nome dos moradores.
  4. **Assistente de IA Integrado:** Uma interface de chat/comando por voz inteligente. O usuário pode digitar comandos em linguagem natural (ex: *"Apto 101 pagou o condomínio de R$ 250 hoje"* ou *"Registrar despesa de R$ 120 com conserto do portão"*) e a inteligência artificial processará, confirmará e executará a ação de forma dinâmica!
  5. **Configuração Supabase:** Painel moderno para inserir credenciais do Supabase (URL e Key) para sincronização em nuvem instantânea. Por padrão, o app roda localmente (LocalStorage) de forma 100% funcional.

---

## Proposta de Arquitetura

Usaremos **HTML + CSS + Vanilla JS**. Como a diretriz prefere CSS Puro Premium para total flexibilidade e controle sem dependências pesadas, projetaremos uma folha de estilos `style.css` extremamente sofisticada e limpa usando variáveis CSS (Custom Properties) estruturadas, o que facilitará micro-animações e efeitos visuais estonteantes.

### Estrutura de Arquivos Proposta:
* `index.html` - Página única responsiva (SPA).
* `style.css` - Estilos globais, variáveis, sistema de design, glassmorphism e animações.
* `app.js` - Lógica da aplicação, gerenciamento de estado e renderização dos componentes.
* `db.js` - Driver de banco de dados híbrido (Supabase + LocalStorage Fallback).
* `ai.js` - Processador de Linguagem Natural / IA para os comandos de voz/texto.
* `manifest.json` e `sw.js` - Configurações PWA para instalação no celular e funcionamento offline.

---

## Alterações Propostas

### [NEW] [index.html](file:///c:/Users/welld/Desktop/appcondominio/index.html)
Estrutura semântica HTML5 completa, incluindo viewport PWA, fontes premium do Google Fonts, ícones do Boxicons/Lucide e seções estruturadas para o painel principal.

### [NEW] [style.css](file:///c:/Users/welld/Desktop/appcondominio/style.css)
Sistema de design baseado em CSS customizado de alta fidelidade:
* Fundo com gradiente animado suave.
* Cartões com efeito `backdrop-filter: blur(12px)` e bordas semi-transparentes.
* Tipografia limpa e moderna.
* Cores selecionadas (Emerald para saldo positivo, Rose para despesas, Violet para investimentos em melhorias).

### [NEW] [db.js](file:///c:/Users/welld/Desktop/appcondominio/db.js)
Camada de Abstração de Dados:
* Inicialização opcional do Supabase (utilizando `@supabase/supabase-js` via CDN).
* Sincronização automática e persistência local caso o Supabase não esteja configurado (rodando 100% via LocalStorage).
* Esquema de dados completo:
  - `apartamentos` (id, numero, morador, status_pagamento)
  - `transacoes` (id, data, tipo [receita/despesa], categoria [agua, luz, conserto, condominio, etc], valor, descricao, apto_id)
  - `caixa` (saldo_atual, fundo_reserva)

### [NEW] [ai.js](file:///c:/Users/welld/Desktop/appcondominio/ai.js)
Mecanismo de IA integrado:
* Processador inteligente de linguagem natural local para mapear comandos de texto para ações no banco de dados.
* Suporte opcional à API do Gemini para gerar relatórios inteligentes de desempenho financeiro e previsões de gastos do condomínio.

### [NEW] [app.js](file:///c:/Users/welld/Desktop/appcondominio/app.js)
Controlador principal:
* Manipulação do DOM.
* Gerenciador de abas (Dashboard, Transações, Apartamentos, IA/Chat, Configurações).
* Atualizações e renderizações de gráficos em tempo real.

### [NEW] [manifest.json](file:///c:/Users/welld/Desktop/appcondominio/manifest.json) & [sw.js](file:///c:/Users/welld/Desktop/appcondominio/sw.js)
Arquivos essenciais do PWA para que o administrador possa instalar o aplicativo diretamente na tela inicial de seu celular (iOS/Android) com suporte offline.

---

## Plano de Verificação

### Testes Manuais & Interface
1. **Instalação PWA:** Verificar a instalação e funcionamento offline através das ferramentas de desenvolvedor do navegador (Application > Service Workers / Manifest).
2. **Responsividade:** Garantir que o design fique perfeito em telas mobile (iPhone/Android) e computadores.
3. **Fluxo Financeiro:** Validar o registro de receitas e despesas e o impacto em tempo real no saldo do caixa.
4. **Comandos de IA:** Testar frases como *"Recebi 250 de condomínio do 102 hoje"* para validar o preenchimento automático.
