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

### 4. Seleção de Modos de Jogo (`/game-mode`)
- **Card Vermelho (SINGLE PLAYER):** Possui ilustração do Robô e linha divisória. Ao clicar, direciona para `/game/singleplayer`.
- **Card Azul (MULTIPLAYER):** Possui ilustração dos controles de videogame e linha divisória. Ao clicar, direciona para o `/lobby`.

---

### 5. Partida Single Player Contra o Bot (`/game/singleplayer`)
- **Cards Laterais:**
  - Card da esquerda (escuro): Mostra o jogador ("You" ou nome logado), avatar monstrinho roxo e o símbolo atribuído (**O** azul).
  - Card da direita (azul): Mostra o computador ("Computer"), avatar monstrinho laranja e o símbolo atribuído (**X** laranja).
  - Indicador pulsante e borda destacam de quem é a vez atual.
- **Quadro de Giz:**
  - Moldura de madeira realista com giz descansando na base direita.
  - Tabuleiro 3x3 com linhas brancas e símbolos de giz (**O** azul e **X** laranja).
- **Inteligência do Bot:**
  - Delay humanizado (600ms a 900ms) com indicação *"Pensando..."* no card.
  - Lógica tática: tenta vencer se tiver 2 peças alinhadas, bloqueia vitórias do jogador, prioriza o centro e cantos.
- **Overlays de Fim de Jogo (No Quadro):**
  - **Vitória:** Exibe avatar do jogador, texto pixel art em ciano `"Você ganhou Parabéns!!!"` e troféu dourado.
  - **Empate:** Exibe texto pixel art em amarelo `"Opppps! Temos um empate."` e badge de aperto de mãos com banner DRAW.
  - **Derrota:** Exibe texto pixel art em vermelho/laranja `"Viiiiiix! Você perdeu."` e emoji vermelho triste.
  - **Botão "Jogar novamente":** Limpa o tabuleiro e reinicia a partida.
  - **Botão "Sair":** Retorna para a seleção de modo (`/game-mode`).

---

### 6. Tela de Lobby & WebSocket Mock (`/lobby`)
- **Proteção de Rota:** Redireciona para o login se não autenticado.
- **Status do WebSocket:** Simulação ativa com eventos exibidos no console (`F12`).
- **Buscar Partida / Criar Sala:** Emite eventos mockados.

---

## 📁 Estrutura de Arquivos

```text
frontend/
├── src/
│   ├── components/
│   │   ├── Button.jsx            # Botões reutilizáveis
│   │   ├── Card.jsx              # Card arredondado da interface
│   │   ├── ChalkBoard.jsx        # Tabuleiro estilo lousa de giz com moldura de madeira
│   │   ├── GameResultOverlay.jsx # Overlays de Vitória, Empate e Derrota com pixel art
│   │   ├── HeaderBar.jsx         # Título serifado e barra bipartida
│   │   ├── Input.jsx             # Inputs estilizados
│   │   ├── LoadingSpinner.jsx    # Spinner animado
│   │   ├── PlayerGameCard.jsx    # Cards laterais do jogador e do bot
│   │   └── TicTacToeLogo.jsx     # Logo do jogo da velha inclinado da Home
│   ├── context/
│   │   └── AuthContext.jsx       # Autenticação e persistência
│   ├── hooks/
│   │   └── useGameSocket.js      # Gerenciamento de eventos WebSocket (Mock)
│   ├── pages/
│   │   ├── Home.jsx              # Tela Inicial (Print 1)
│   │   ├── Login.jsx             # Tela de Login (Print 2)
│   │   ├── Register.jsx          # Tela de Criação de Conta (Print 3)
│   │   ├── GameMode.jsx          # Tela de Seleção de Modos (Print 4)
│   │   ├── SinglePlayerGame.jsx  # Tela da Partida Single Player com Bot (Print 5 a 8)
│   │   └── Lobby.jsx             # Lobby Multiplayer
│   ├── routes/
│   │   └── AppRoutes.jsx         # Gerenciamento de rotas e proteção
│   ├── App.jsx                   # Provedor raiz
│   ├── index.css                 # Configurações do Tailwind
│   └── main.jsx                  # Ponto de entrada
├── tailwind.config.js
└── vite.config.js
```

---

## 🛠️ Próximos Passos (Fase de Integração com Backend)
Quando o backend estiver executando:
1. No `AuthContext.jsx`, substituir os `setTimeout` por chamadas `fetch` ou `axios` para as rotas da API (ex: `POST /api/auth/login`).
2. No `useGameSocket.js`, substituir o simulador pela conexão real de `socket.io-client` ou `new WebSocket('ws://...')`.
