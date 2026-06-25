# PetPelRS

PetPelRS é uma aplicação web voltada ao gerenciamento de animais, clientes, contatos e propostas de adoção. O sistema foi pensado para centralizar informações, facilitar a comunicação entre usuários e organização responsável, e oferecer um painel administrativo para acompanhamento das interações.

## Visão geral

O projeto é dividido em duas partes principais:

- **Frontend**: interface do usuário desenvolvida com React, Vite e TypeScript.
- **Backend**: API em Node.js, Express, TypeScript e Prisma, responsável pelas regras de negócio, autenticação e persistência dos dados.

A aplicação reúne funcionalidades de cadastro, consulta, envio de mensagens e administração, com foco em organização e facilidade de uso.

## Intuito do sistema

O PetPelRS foi criado para apoiar um fluxo de adoção e gestão de animais de forma estruturada. A ideia é reunir, em um único ambiente, os principais dados e interações necessários para:

- cadastrar clientes e administradores;
- cadastrar e consultar animais disponíveis;
- permitir contatos entre interessados e responsáveis;
- acompanhar propostas e mensagens recebidas;
- oferecer uma visão administrativa do sistema.

## Funcionalidades principais

- Cadastro e autenticação de clientes e administradores
- Inclusão, edição, listagem e busca de animais
- Sistema de propostas e contatos entre usuários
- Inbox para mensagens relacionadas aos animais
- Painel administrativo para gestão e acompanhamento
- Verificação de imagens e apoio ao envio de e-mails no backend
- Controle de acesso por perfil de usuário

## Tecnologias utilizadas

### Frontend

- React
- Vite
- TypeScript
- React Router DOM
- React Hook Form
- Zustand
- Sonner
- Victory

### Backend

- Node.js
- Express
- TypeScript
- Prisma
- PostgreSQL
- JSON Web Token
- Nodemailer
- Axios
- Zod

## Estrutura do projeto

- `api/` — backend da aplicação
  - `index.ts` — entrada principal da API
  - `routes/` — rotas de negócio
  - `middleware/` — middlewares de autenticação e apoio
  - `prisma/` — schema e migrações do banco
  - `utils/` — utilitários como e-mail e safe search

- `emergentes_aula1-main/` — frontend da aplicação
  - `src/` — código da interface
  - `src/components/` — componentes reutilizáveis
  - `src/routes/` — telas e páginas
  - `src/Admin/` — área administrativa
  - `src/context/` — contextos globais
  - `src/utils/` — tipos e utilitários

## Pré-requisitos

- Node.js 18 ou superior
- npm instalado
- PostgreSQL disponível para uso local
- Git, caso o projeto seja clonado para execução em outra máquina

## Como executar localmente

### 1. Clonar o repositório

```bash
git clone https://github.com/seu-usuario/petpelrs.git
cd petpelrs
```

### 2. Instalar dependências

Instale as dependências do backend e do frontend separadamente:

```bash
cd api
npm install
cd ..
cd emergentes_aula1-main
npm install
```

### 3. Configurar variáveis de ambiente

Crie os arquivos `.env` nas pastas `api/` e `emergentes_aula1-main/`.

Exemplo para o backend (`api/.env`):

```env
DATABASE_URL="postgresql://USER:PASS@HOST:5432/DATABASE?schema=public"
JWT_KEY=uma_chave_secreta_para_tokens
JWT_SECRET=uma_chave_secreta_para_tokens
GMAIL_USER=seuemail@gmail.com
GMAIL_APP_PASSWORD=senha_de_app_do_gmail
SIGHTENGINE_USER=seu_user_sightengine
SIGHTENGINE_SECRET=seu_secret_sightengine
```

Exemplo para o frontend (`emergentes_aula1-main/.env`):

```env
VITE_API_URL=http://localhost:3000
```

### 4. Preparar o banco de dados

Dentro da pasta `api/`, gere o Prisma Client e aplique as migrações:

```bash
cd api
npx prisma generate
npx prisma migrate dev
```

### 5. Iniciar o backend

```bash
cd api
npm run dev
```

O backend sobe, por padrão, na porta `3000`.

### 6. Iniciar o frontend

Em outro terminal:

```bash
cd emergentes_aula1-main
npm run dev
```

O frontend sobe, por padrão, em `http://localhost:5173`.

## Organização dos dados

O banco de dados é modelado com Prisma e inclui entidades como:

- clientes;
- animais;
- contatos;
- administradores.

Também há uso de relacionamentos e enumerações para representar tipos de animais e cidade.

## Observações importantes

- O frontend depende da variável `VITE_API_URL` para conversar com o backend.
- O backend depende de `DATABASE_URL`, `JWT_KEY` e credenciais de serviços externos para algumas funcionalidades.
- Algumas rotas e recursos podem exigir autenticação.
- O sistema foi pensado para uso controlado, com perfis diferentes de acesso.

## Problemas comuns

- **Banco não conecta**: verifique `DATABASE_URL` e se o PostgreSQL está em execução.
- **Login falha**: confirme se o banco foi populado corretamente e se `JWT_KEY` está configurada.
- **Frontend não encontra a API**: confirme se `VITE_API_URL` aponta para a porta correta.
- **E-mail não envia**: confira as credenciais do Gmail configuradas no backend.

## Licença

Este projeto está sob licença MIT.
