# Configuração inicial

Na primeira execução, o UFW Remote Manager **não tem usuários**. Você deve criar a conta de administrador uma vez.

## Página de configuração (`/setup`)

1. Abra a URL da aplicação (ex.: `http://localhost:8088` ou seu `APP_URL`)
2. Você é redirecionado para `/setup` automaticamente
3. Informe nome, e-mail, senha e confirmação de senha
4. Clique em **Concluir configuração**

Após o sucesso, você entra logado e é redirecionado para a lista de servidores.

## Política de administrador único

O cadastro é **desabilitado** após a primeira conta existir. Não há auto-cadastro para usuários adicionais na versão atual.

Para incluir outra pessoa, ela usaria as credenciais de administrador compartilhadas (não recomendado) ou você opera com uma conta de administrador por instância.

## Sessão e login

- Sessões duram **7 dias** com renovação deslizante
- Saia pela opção **Sair** na barra lateral
- Página de login: `/login`

## Primeira execução em produção

Após implantar atrás de HTTPS:

1. Configure o Proxy Host no NPM → `ufw-app:8088`
2. Defina `APP_URL=https://your-domain.example` no `.env`
3. Abra `https://your-domain.example/setup`
4. Conclua a configuração antes de expor a URL amplamente

Execute o teste de fumaça após a configuração:

```bash
./scripts/smoke-production.sh --env-file .env --ghcr --app-url "$APP_URL"
```

## Documentação relacionada

- [Início rápido](../quick-start.md)
- [Modelo de segurança](../administration/security-model.md)
