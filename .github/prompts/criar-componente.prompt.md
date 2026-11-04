---
description: Cria um componente React do frontend integrado à API do DMS via services.
name: criar-componente
argument-hint: nome do componente (ex. DocumentFilter)
agent: agent
---

# Criar componente do frontend

Crie o componente `${input:componente:nome do componente}` em
`frontend/src/components` seguindo as convenções do projeto.

Requisitos:

- Use componente funcional com React Hooks (`useState`, `useEffect` etc.).
- Toda comunicação com o backend passa pelo cliente de API em
  `frontend/src/services/documentsApi.js` (fetch com prefixo `/api`).
  Não chame `fetch` diretamente no componente; se precisar de um novo
  endpoint, adicione a função correspondente no serviço.
- Reutilize as classes CSS existentes em `frontend/src/styles.css`
  (`card`, `btn btn-primary`, `btn-outline`, `input`, `alert-error`,
  `badge`, `muted`). Crie novas classes apenas se necessário, no mesmo
  arquivo, usando as variáveis CSS de `:root`.
- Trate estados de carregamento e erro com mensagens em português.
- Receba dados e callbacks via props; evite estado global e duplicação
  com os componentes existentes (`UploadComponent`, `DocumentList`,
  `DownloadButton`).
- Integre o componente em `frontend/src/App.jsx` quando fizer sentido.
- Valide com `npm run build` no diretório `frontend`.
