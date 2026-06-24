# UFW Remote Manager — Documentação (Português Brasil)

Guia completo para administradores e operadores.

## Primeiros passos

| Documento | Descrição |
|----------|-------------|
| [Introdução](./introduction.md) | O que é o produto e para quem se destina |
| [Início rápido](./quick-start.md) | Configuração local com Docker em minutos |
| [Arquitetura](./architecture.md) | Componentes, fluxo de dados e limites de segurança |

## Conceitos

| Documento | Descrição |
|----------|-------------|
| [Identidades SSH](./concepts/ssh-identities.md) | Credenciais reutilizáveis criptografadas |
| [Servidores e SSH](./concepts/servers-and-ssh.md) | Validação de host, chaves host, testes de conexão |
| [Regras UFW e estados](./concepts/ufw-rules-and-states.md) | Modelo de regras e estados de sincronização com código de cores |
| [Fluxo de rascunho e aplicação](./concepts/draft-apply-workflow.md) | Editar localmente, visualizar, confirmar, aplicar via SSH |
| [Importar e exportar configuração](./concepts/import-export-config.md) | Backup completo da configuração de servidores (JSON v2) |

## Guia do usuário

| Documento | Descrição |
|----------|-------------|
| [Configuração inicial](./user-guide/initial-setup.md) | Primeira conta de administrador e login |
| [Gerenciar servidores](./user-guide/manage-servers.md) | Adicionar, editar, excluir servidores; instalar/ativar UFW |
| [Editar e aplicar regras](./user-guide/edit-and-apply-rules.md) | Edição em tabela, importação, visualização da aplicação |
| [Histórico de operações](./user-guide/operations-history.md) | Banner de progresso e página de histórico |

## Administração

| Documento | Descrição |
|----------|-------------|
| [Modelo de segurança](./administration/security-model.md) | Criptografia, autenticação, exposição de rede |
| [Variáveis de ambiente](./administration/environment-variables.md) | Toda a configuração em tempo de execução |
| [Log de auditoria e exportação](./administration/audit-log-and-export.md) | Eventos de auditoria e exportação com step-up |

## Implantação

| Documento | Descrição |
|----------|-------------|
| [Visão geral](./deployment/overview.md) | Escolha um método de implantação |
| [GHCR + Compose](./deployment/ghcr-compose.md) | Baixar imagens pré-compiladas (recomendado) |
| [Portainer](./deployment/portainer.md) | Implantar via stack do Portainer |
| [Nginx Proxy Manager](./deployment/nginx-proxy-manager.md) | Checklist de proxy reverso HTTPS |

## Operações

| Documento | Descrição |
|----------|-------------|
| [Backup e restauração](./operations/backup-restore.md) | Backups do Postgres e do `.env` |
| [Atualização e rollback](./operations/upgrade-rollback.md) | Atualizações de versão e recuperação |
| [Testes de fumaça](./operations/smoke-tests.md) | Verificação pós-implantação |

## Referência

| Documento | Descrição |
|----------|-------------|
| [FAQ](./faq.md) | Perguntas frequentes |
| [Solução de problemas](./troubleshooting.md) | Sintoma → causa → correção |
| [Sobre a Finenumbers](./about.md) | Autor do produto e contato |

---

Desenvolvido por **[Finenumbers](https://finenumbers.com)** — operadora de telefonia empresarial · [apps@finenumbers.com](mailto:apps@finenumbers.com)

Outros idiomas: [Central de documentação](../README.md)
