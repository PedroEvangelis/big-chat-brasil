# Teste Técnico - Big Chat Brasil (BCB)

Este repositório contém a implementação do **teste técnico para a Big Chat Brasil (BCB)**. O projeto visa simular um sistema simplificado de comunicação, permitindo o envio e visualização de mensagens entre empresas e seus clientes, com funcionalidades essenciais para gerenciamento de clientes, autenticação, controle de planos financeiros e processamento de mensagens em fila.

## Visão Geral do Projeto

A solução foi desenvolvida com foco em uma arquitetura modular e escalável, utilizando **NestJS** como framework principal, **PostgreSQL** para persistência de dados e **Redis** para gerenciamento de filas de mensagens.

### Principais Implementações:

-   **API de Autenticação e Gerenciamento de Clientes:** endpoints completos para autenticação (CPF/CNPJ), criação, listagem, consulta e atualização de clientes, incluindo verificação de saldo/limite.
-   **Fila em Memória para Processamento de Mensagens:** Utilização do **BullMQ** com **Redis** para um sistema de fila, realizando o processamento assíncrono mensagens.
-   **Validação Financeira de Plano:** Lógica para distinção e validação de clientes com planos pré ou pós-pagos.
-   **Histórico de Conversas:** Endpoints para listagem de conversas e mensagens de um cliente autenticado.
-   **Envio e Processamento de Mensagens:** Estrutura para o envio de novas mensagens e consulta de seu status.
-   **Autenticação JWT e Controle de Acesso:** Proteção de endpoints sensíveis com **JWT Token** e implementação de roles para controle de acesso (ex: administradores podem listar todos os clientes).
-   **Documentação Interativa:** Integração com **Swagger** para documentação automática dos endpoints, acessível em `/docs`.
-   **Testes Automatizados:** Cobertura de testes unitários por módulo para garantir a estabilidade e o correto funcionamento das funcionalidades.
-   **Tratamento de Concorrência:** Gerenciamento de operações concorrentes através do **BullMQ**.

## Tecnologias Utilizadas

-   **Backend:** [NestJS](https://nestjs.com/) (Framework Node.js)
-   **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/)
-   **Fila/Cache:** [Redis](https://redis.io/)
-   **ORM:** [TypeORM](https://typeorm.io/)
-   **Filas de Mensagens:** [BullMQ](https://docs.bullmq.io/)
-   **Autenticação:** [Passport.js](http://www.passportjs.org/) + [Passport JWT](https://www.npmjs.com/package/passport-jwt)
-   **Documentação de API:** [Swagger](https://swagger.io/)
-   **Logs:** [Winston](https://github.com/winstonjs/winston)
-   **Testes:** [Jest](https://jestjs.io/)
-   **Containerização:** [Docker](https://www.docker.com/)

## Estrutura do Projeto

O projeto segue uma **arquitetura em camadas** e uma **estrutura modular**, o que facilita a separação de responsabilidades, manutenção e escalabilidade.

```
big-chat-backend/
│
├── src/
│   ├── modules/             # Módulos de funcionalidades (Auth, Clients, Messages, Conversations, Queue)
│   │   ├── auth/
│   │   ├── clients/
│   │   ├── messages/
│   │   ├── conversations/
│   │   └── queue/
│   │
│   ├── database/            # Configurações do banco de dados
│   ├── common/              # Utilitários comuns (filtros, interceptors, pipes)
│   ├── main.ts              # Ponto de entrada da aplicação
│   ├── app.module.ts        # Módulo raiz
│   └── app.controller.ts
│
├── test/                    # Testes end-to-end
├── .env                     # Variáveis de ambiente
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md

```

## Como Rodar o Projeto

O projeto foi configurado para ser executado facilmente utilizando Docker.

1.  **Pré-requisitos:** Certifique-se de ter o [Docker](https://docs.docker.com/get-docker/) e [Docker Compose](https://docs.docker.com/compose/install/) instalados em sua máquina.
    
2.  **Variáveis de Ambiente:** Crie um arquivo `.env` na raiz do projeto (na mesma pasta do `docker-compose.yml`) com as seguintes variáveis:
    
    Exemplo de .env:
    
    ```
    DB_PASSWORD=mysecretpassword  # Senha do banco de dados PostgreSQL
    DB_DATABASE=my_database       # Nome do banco de dados PostgreSQL
    PORT=3000                     # Porta em que a API será executada
    MODE=DEV                      # Modo de execução (ex: DEV, PROD)
    REDIS_HOST=redis              # Host do Redis (nome do serviço no docker-compose)
    REDIS_PORT=6379               # Porta do Redis
    JWT_SECRET=your_jwt_secret_here # Chave secreta para JWT
    
    ```
    
    **Dica:** Você pode gerar uma chave JWT segura em [jwtsecret.com/generate](https://jwtsecret.com/generate).
    
3.  **Iniciar o Projeto:** No terminal, navegue até a raiz do projeto e execute o seguinte comando:
    
    Bash
    
    ```
    docker-compose up --build
    
    ```
    
    Este comando irá construir as imagens Docker, subir os contêineres do PostgreSQL, Redis e da aplicação NestJS.
    
4.  **Acesso à API:** Uma vez que os contêineres estejam em execução, a API estará acessível em `http://localhost:3000`.
    
5.  **Documentação da API:** A documentação interativa da API, gerada pelo Swagger, pode ser acessada em `http://localhost:3000/docs`.
    

## Testes Automatizados

Os testes automatizados podem ser executados após o setup do projeto, garantindo que todas as funcionalidades estejam operando conforme o esperado.

Para rodar os testes, execute:

Bash

```
npm run test
```