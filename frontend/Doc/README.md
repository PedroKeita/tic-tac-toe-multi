# 🎮 Tic-Tac-Toe Multiplayer — Frontend (Fase 5)

Este diretório contém a interface web desktop para o jogo da velha multiplayer, desenvolvida com **React**, **Vite** e **Tailwind CSS**, seguindo fielmente os layouts do Figma.

Como o backend ainda está em fase de conexão, todo o fluxo atual opera com **Mocks assíncronos** (simulação de autenticação e comunicação WebSocket via eventos no Console).

---

## 🚀 Como Executar o Projeto

### 1. Pré-requisitos
- **Node.js** (versão 18 ou superior instalada)
- **npm**

### 2. Passo a Passo
No terminal, certifique-se de estar dentro da pasta `frontend`:

```bash
# Entrar na pasta do frontend (se ainda estiver na raiz)
cd frontend

# Instalar dependências (caso ainda não tenha instalado)
npm install

# Iniciar o servidor de desenvolvimento
npm run dev
```

O terminal exibirá o endereço local, geralmente:
👉 **[http://localhost:5173/](http://localhost:5173/)**

Abra o link no navegador para testar a interface.

---

## 🧪 Roteiro de Testes: O Que e Como Testar Atualmente

Abra o **Console do Desenvolvedor** no seu navegador (`F12` ou `Ctrl + Shift + I` > aba **Console**) para acompanhar as mensagens dos mocks em tempo real.

### 1. Tela Inicial (`/`)
- **Visual:** Verifique o logotipo inclinado do jogo da velha com peças laranjas e azuis (fiel ao Figma) e o botão azul vibrante com sombra.
- **Ação:** Clique em **"Jogar"**.
  - Se você ainda não estiver logado, será redirecionado para `/login`.

---

### 2. Tela de Login (`/login`)
- **Validação de Campos:**
  - Tente clicar em **"Continue"** sem preencher nada: mensagens de erro obrigatório serão exibidas.
  - Digite um e-mail com formato inválido (ex: `teste`) para ver a validação de formato.
- **Fluxo de Autenticação (Mock):**
  - Preencha um e-mail válido (ex: `jogador@email.com`) e qualquer senha.
  - Clique em **"Continue"**: o botão exibirá o spinner de carregamento (*Loading state*) durante 1 segundo simulado.
  - Após 1 segundo, o login é concluído, o usuário é salvo no `localStorage` e você é redirecionado para o `/lobby`.
- **Navegação:**
  - O botão branco **"Criar uma conta"** leva para a tela de registro (`/register`).

---

### 3. Tela de Registro (`/register`)
- **Validação:**
  - Insira senhas diferentes nos campos *Password* e *Confirm Password* e clique em **"Continuar"** para verificar a validação de divergência.
  - Senhas com menos de 6 dígitos também alertam o usuário.
- **Cadastro (Mock):**
  - Preencha dados válidos e confirme. O sistema simula a criação com 1s de delay e salva o usuário autenticado.
- **Mock Social (Google):**
  - Clique no botão **"G"** para testar a ação simulada de login com o Google.
- **Link de Retorno:**
  - Clique em *"Já possui uma conta? Fazer login"* para voltar ao Login.

---

### 4. Tela de Lobby & WebSocket Mock (`/lobby`)
- **Proteção de Rota:**
  - Se você tentar acessar `/lobby` diretamente na URL sem estar autenticado, o sistema redirecionará automaticamente para `/login`.
- **Status do WebSocket:**
  - Observe a tag no topo: **"WebSocket: Conectado (Mock)"** com sinalizador verde pulsante.
  - No console do navegador (`F12`), você verá a mensagem `[MOCK SOCKET]: Conexão estabelecida.`
- **Buscar Partida Online:**
  - Clique em **"Buscar Partida Online"**.
  - No Console (`F12`), será emitido:  
    `[MOCK SOCKET EMIT]: find_match { playerId: '...', playerName: '...' }`
  - O botão entrará em estado de busca e, após 2 segundos, um evento de mock responderá simulando o pareamento com outro jogador.
- **Criar Sala Privada:**
  - Clique em **"Criar Sala Privada"** e observe o evento `create_room` no console.
- **Logout:**
  - Clique em **"Encerrar Sessão"** para limpar os dados do usuário e voltar ao Login.

---

## 📁 Estrutura de Arquivos

```text
frontend/
├── src/
│   ├── components/        # Componentes UI (Button, Input, Card, HeaderBar, Logo)
│   ├── context/           # AuthContext.jsx (Estado global e persistência)
│   ├── hooks/             # useGameSocket.js (Emissão e escuta de eventos WebSocket)
│   ├── pages/             # Telas da aplicação (Home, Login, Register, Lobby)
│   ├── routes/            # AppRoutes.jsx (Configuração de rotas e rotas protegidas)
│   ├── App.jsx            # Provedores de contexto e roteamento
│   ├── index.css          # Estilos do Tailwind CSS
│   └── main.jsx           # Ponto de montagem da aplicação
├── tailwind.config.js     # Cores e tipografia idênticas ao Figma
└── vite.config.js         # Configurações do Vite
```

---

## 🛠️ Próximos Passos (Fase de Integração com Backend)
Quando o backend estiver executando:
1. No `AuthContext.jsx`, substituir os `setTimeout` por chamadas `fetch` ou `axios` para as rotas da API (ex: `POST /api/auth/login`).
2. No `useGameSocket.js`, substituir o simulador pela conexão real de `socket.io-client` ou `new WebSocket('ws://...')`.
