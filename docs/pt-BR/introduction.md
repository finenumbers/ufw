# Introdução

**UFW Remote Manager** é uma aplicação web auto-hospedada para gerenciar **UFW (Uncomplicated Firewall)** em servidores Linux remotos via **SSH**. Você edita regras de firewall no navegador, visualiza alterações, confirma explicitamente e as aplica com segurança — com trilha de auditoria completa.

Repositório: [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw)

## Para quem é?

- **Administradores de sistemas** que gerenciam vários servidores Linux e preferem uma interface estruturada a sessões CLI `ufw` manuais
- **Pequenas equipes** que precisam de um lugar central para rascunhos de firewall, pré-visualizações de aplicação e histórico de operações
- **Self-hosters** que executam sua própria infraestrutura atrás de um proxy reverso (Nginx Proxy Manager recomendado)

## O que faz

- Conectar a servidores Linux via SSH (senha ou chave privada)
- Detectar, instalar e ativar UFW remotamente
- Carregar regras UFW ao vivo, editá-las em uma tabela (com grupos, nomes, busca, reordenação)
- Fluxo **rascunho → pré-visualização → confirmação → aplicação** com visualização de diff
- Carregamento rápido do painel do servidor a partir de snapshots UFW em cache (SSH ao vivo apenas na atualização)
- Importar regras de CSV, XLSX ou JSON; exportar/importar configuração completa de servidores
- Criptografar credenciais SSH em repouso; fixar chaves de host SSH; auditar ações sensíveis
- Interface multilíngue (inglês, alemão, francês, espanhol, italiano, português, russo)

## O que não faz

| Expectativa | Realidade |
|-------------|-----------|
| Substitui seu proxy reverso | **Não.** Nginx Proxy Manager (ou similar) termina HTTPS separadamente |
| Gerencia `iptables` bruto sem UFW | **Não.** Destinado a servidores onde UFW é o front-end do firewall |
| SaaS multi-tenant | **Não.** Self-hosted de instância única; uma conta admin após a configuração |
| Cluster de alta disponibilidade | **Não.** Projetado para **uma réplica do app** (limites de taxa em memória) |
| Alterações automáticas de firewall sem confirmação | **Não.** Aplicar sempre requer confirmação explícita do usuário |

## Requisitos

### Host de gestão (onde o Docker roda)

- Docker e Docker Compose
- Opcional: Portainer, instalação existente do Nginx Proxy Manager
- Acesso de rede do container do app aos servidores de destino via SSH (porta 22 ou personalizada)

### Servidores de destino (hosts Linux gerenciados)

- Linux com UFW disponível (`apt install ufw` ou equivalente)
- Acesso SSH com privilégios suficientes para executar comandos `ufw`
- Conectividade de saída do host de gestão para a porta SSH do servidor

### Produção

- URL **HTTPS** pública para a interface de administração (`APP_URL`)
- Segredos robustos em `.env` (nunca commitados no git)

## Próximos passos

- [Início rápido](./quick-start.md) — executar localmente no Docker
- [Arquitetura](./architecture.md) — como os componentes se encaixam
- [Visão geral de implantação](./deployment/overview.md) — produção atrás do NPM
