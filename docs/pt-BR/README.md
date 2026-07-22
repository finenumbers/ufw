# UFW Remote Manager — Documentação (Português Brasil)

Guia completo para administradores e operadores. Alinhado com **v0.9.2**.

## Primeiros passos

| Documento | Descrição |
|----------|-------------|
| [Introdução](./introduction.md) | Escopo do produto, requisitos, o que não faz |
| [Início rápido](./quick-start.md) | Configuração local com Docker em minutos |
| [Arquitetura](./architecture.md) | Componentes, SSR cache-first, modelo de dados, concorrência |

## Conceitos

| Documento | Descrição |
|----------|-------------|
| [Identidades SSH](./concepts/ssh-identities.md) | Credenciais reutilizáveis criptografadas |
| [Servidores e SSH](./concepts/servers-and-ssh.md) | Validação de host, chaves host, verificação |
| [Regras UFW e estados](./concepts/ufw-rules-and-states.md) | Modelo de regras e cores de estado de origem |
| [Fluxo de rascunho e aplicação](./concepts/draft-apply-workflow.md) | Editar, pré-visualizar, confirmar, aplicar via SSH |
| [Importar e exportar configuração](./concepts/import-export-config.md) | Backup completo JSON v2 |
| [Operações e concorrência](./concepts/operations-and-concurrency.md) | Banner, polling, filas, limites de taxa |

## Guia do usuário

| Documento | Descrição |
|----------|-------------|
| [Configuração inicial](./user-guide/initial-setup.md) | Primeira conta de administrador e login |
| [Gerenciar servidores](./user-guide/manage-servers.md) | Adicionar, editar, excluir; painel e sync |
| [Editar e aplicar regras](./user-guide/edit-and-apply-rules.md) | Edição em tabela, importação, pré-visualização de apply |
| [Histórico de operações](./user-guide/operations-history.md) | Banner de progresso e página de histórico |
| [Varredura de portas](./user-guide/port-scan.md) | Resultados de varredura externa e cobertura UFW |

## Administração

| Documento | Descrição |
|----------|-------------|
| [Modelo de segurança](./administration/security-model.md) | Criptografia, autenticação, exposição de rede |
| [Variáveis de ambiente](./administration/environment-variables.md) | Referência completa de configuração em tempo de execução |
| [Log de auditoria e exportação](./administration/audit-log-and-export.md) | Eventos de auditoria e exportação com step-up |

## Implantação

| Documento | Descrição |
|----------|-------------|
| [Visão geral](./deployment/overview.md) | Escolha um método de implantação |
| [GHCR + Compose](./deployment/ghcr-compose.md) | Baixar imagens pré-compiladas (recomendado) |
| [Portainer](./deployment/portainer.md) | Implantar via stack do Portainer |
| [Nginx Proxy Manager](./deployment/nginx-proxy-manager.md) | Checklist de proxy reverso HTTPS |
| [Varredura externa de portas](./deployment/port-scan.md) | Habilitar varredura, rede, timeouts |

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
| [Sobre a Finenumbers](./about.md) | Autor e contato |

---

Desenvolvido por **[Finenumbers](https://finenumbers.com)** — operadora de telefonia empresarial · [apps@finenumbers.com](mailto:apps@finenumbers.com)

Outros idiomas: [Central de documentação](../README.md)
