Estrutura inicial pretendida

big-chat-backend/
│
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.service.ts
│   │   │   └── dto/                # Data Transfer Objects
│   │   │       ├── login.dto.ts
│   │   ├── clients/
│   │   │   ├── clients.controller.ts
│   │   │   ├── clients.module.ts
│   │   │   ├── clients.service.ts
│   │   │   └── dto/
│   │   │       ├── create-client.dto.ts
│   │   │       ├── update-client.dto.ts
│   │   ├── messages/
│   │   │   ├── messages.controller.ts
│   │   │   ├── messages.module.ts
│   │   │   ├── messages.service.ts
│   │   │   └── dto/
│   │   │       ├── create-message.dto.ts
│   │   │       ├── update-message.dto.ts
│   │   ├── conversations/
│   │   │   ├── conversations.controller.ts
│   │   │   ├── conversations.module.ts
│   │   │   ├── conversations.service.ts
│   │   │   └── dto/
│   │   │       ├── create-conversation.dto.ts
│   │   │       ├── update-conversation.dto.ts
│   │   └── queue/
│   │       ├── queue.module.ts
│   │       ├── queue.service.ts
│   │       └── queue.controller.ts
│   │
│   ├── database/
│   │   ├── database.module.ts
│   │   └── database.providers.ts
│   │
│   ├── common/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   └── pipes/
│   │       └── validation.pipe.ts
│   │
│   ├── config/
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   └── jwt.config.ts
│   │
│   ├── main.ts
│   ├── app.module.ts
│   └── app.controller.ts
│
├── test/
│   ├── auth.e2e-spec.ts
│   ├── clients.e2e-spec.ts
│   ├── messages.e2e-spec.ts
│   └── conversations.e2e-spec.ts
│
├── .env                     # Arquivo de configuração de ambiente
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md