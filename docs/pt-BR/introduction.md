# Introdução

**UFW Remote Manager** é uma aplicação web auto-hospedada para gerenciar **UFW (Uncomplicated Firewall)** em servidores Linux remotos via **SSH**. Você edita regras de firewall no navegador, visualiza alterações, confirma explicitamente e as aplica com segurança — com trilha de auditoria completa.

Repositório: [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw) · Versão atual: **v0.9.5**

## Para quem é?

- **Administradores de sistemas** que gerenciam vários servidores Linux e preferem uma interface estruturada a sessões CLI `ufw` repetidas
- **Pequenas equipes** que precisam de um lugar central para rascunhos de firewall, pré-visualizações de aplicação e histórico de operações
- **Self-hosters** que executam infraestrutura atrás de um proxy reverso (Nginx Proxy Manager recomendado)

## O que faz

| Capacidade | Descrição |
|------------|-------------|
| **Gestão SSH** | Conexão com senha ou chave privada; fixação de chave host na primeira conexão |
| **Ciclo de vida UFW** | Detectar, instalar e ativar UFW remotamente |
| **Tabela de regras** | Editar regras com grupos, nomes, busca, filtros, reordenação por arrastar e soltar |
| **Rascunho → aplicação** | Pré-visualizar diff, confirmar, executar comandos UFW via SSH |
| **Painéis rápidos** | Páginas de servidor carregam de snapshots Postgres em cache; SSH ao vivo apenas na atualização |
| **Importar / exportar** | Regras de CSV, XLSX, JSON; configuração completa de servidores + identidades como JSON v2 |
| **Varredura de portas (opcional)** | Varredura TCP externa com mapeamento de cobertura UFW |
| **Segurança** | Credenciais criptografadas em repouso; log de auditoria; senha step-up para exportação de configuração |
| **Idiomas** | Interface em inglês, alemão, francês, espanhol, italiano, português (Brasil), russo |

## O que não faz

| Expectativa | Realidade |
|-------------|-----------|
| Substitui seu proxy reverso | **Não.** Nginx Proxy Manager (ou similar) termina HTTPS separadamente |
| Gerencia `iptables` bruto sem UFW | **Não.** Destinado a servidores onde UFW é o front-end do firewall |
| Inventário / controle de containers Docker | **Não.** Removido na v0.9.0 — não faz parte do escopo atual |
| SaaS multi-tenant | **Não.** Self-hosted de instância única; uma conta admin após a configuração |
| Cluster de alta disponibilidade | **Não.** Projetado para **uma réplica do app** (limites de taxa em memória) |
| Alterações automáticas de firewall | **Não.** Aplicar sempre requer confirmação explícita do usuário |

## Inventário e estatísticas

Após a v0.9.0, **inventário** na lista de servidores significa:

- **Regras salvas** — contagem de regras armazenadas nos metadados locais (`ruleRecord`)
- **Portas abertas** — contagem da última varredura externa bem-sucedida (quando habilitada)

Não há painel de containers Docker nem monitoramento remoto de containers.

## Requisitos

### Host de gestão (onde o Docker roda)

- Docker e Docker Compose
- Opcional: Portainer, Nginx Proxy Manager existente
- Rede do container do app aos servidores de destino via SSH (porta 22 ou personalizada)
- Para varredura de portas: egress do host do app para portas TCP de destino (não apenas `:22`)

### Servidores de destino (hosts Linux gerenciados)

- Linux com UFW disponível (`apt install ufw` ou equivalente)
- Acesso SSH com privilégios para executar comandos `ufw`
- Porta SSH acessível a partir do host de gestão

### Produção

- URL **HTTPS** pública para a interface de administração (`APP_URL`)
- Segredos robustos em `.env` (nunca commitados no git)

## Próximos passos

- [Início rápido](./quick-start.md) — executar localmente no Docker
- [Arquitetura](./architecture.md) — componentes, fluxo de dados, concorrência
- [Visão geral de implantação](./deployment/overview.md) — produção atrás do NPM
