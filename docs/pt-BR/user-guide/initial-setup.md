# Configuração inicial

O primeiro lançamento cria a única conta de administrador. Depois disso, o registro é permanentemente desabilitado.

## Página de setup (`/setup`)

Disponível quando **não existe usuário** no banco de dados:

1. Abra `http://localhost:8088/setup` (ou seu `APP_URL/setup`)
2. Informe e-mail e senha
3. Envie — você entra e é redirecionado ao app

Se já existir usuário, `/setup` redireciona para `/login`.

## Login (`/login`)

Use o e-mail e senha do setup. Sessões são gerenciadas pelo Better Auth (cookies HTTP-only).

Logout: barra lateral → **Sair**.

## Modelo de admin único

Não há interface de gestão de usuários. Uma conta por instalação. Para acesso compartilhado, use gerenciador de senhas de equipe e procedimentos operacionais — não usuários separados no app.

## Limite de taxa de setup

Tentativas de setup limitadas a **5 por minuto por IP do cliente** para desacelerar brute force em instalações novas.

Quando o app roda atrás do Nginx Proxy Manager em produção, defina:

```env
TRUST_PROXY=1
```

Sem isso, limites de taxa usam um bucket compartilhado e podem ser menos precisos atrás de proxy.

## Primeira visita em produção

1. Implante a stack — veja [Visão geral de implantação](../deployment/overview.md)
2. Abra `https://your-domain/setup` (deve corresponder a `APP_URL`)
3. Conclua setup antes de expor a URL amplamente
4. Execute [testes de fumaça](../operations/smoke-tests.md)

## Documentos relacionados

- [Início rápido](../quick-start.md)
- [Modelo de segurança](../administration/security-model.md)
