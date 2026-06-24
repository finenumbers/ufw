# Introdução

O **UFW Remote Manager** é uma aplicação web auto-hospedada para gerenciar o **UFW (Uncomplicated Firewall)** em servidores Linux remotos via **SSH**. Você edita regras de firewall no navegador, visualiza alterações, confirma explicitamente e as aplica com segurança — com trilha de auditoria completa.

Repositório: [github.com/finenumbers/ufw](https://github.com/finenumbers/ufw)

## Para quem é?

- **Administradores de sistemas** que gerenciam vários servidores Linux e preferem uma interface estruturada em vez de sessões manuais na CLI do `ufw`
- **Pequenas equipes** que precisam de um lugar central para rascunhos de firewall, visualização de aplicação e histórico de operações
- **Usuários de auto-hospedagem** que executam sua própria infraestrutura atrás de um proxy reverso (Nginx Proxy Manager recomendado)

## O que faz

- Conectar a servidores Linux via SSH (senha ou chave privada)
- Detectar, instalar e ativar o UFW remotamente
- Carregar regras UFW ativas, editá-las em uma tabela (com grupos, nomes, busca, reordenação)
- Fluxo **rascunho → visualizar → confirmar → aplicar** com visualização de diferenças
- Importar regras de CSV, XLSX ou JSON; exportar/importar configuração completa de servidores
- Criptografar credenciais SSH em repouso; fixar chaves host SSH; auditar ações sensíveis
- Interface multilíngue (inglês, alemão, francês, espanhol, italiano, português, russo)

## O que não faz

| Expectativa | Realidade |
|-------------|---------|
| Substitui seu proxy reverso | **Não.** O Nginx Proxy Manager (ou similar) termina HTTPS separadamente |
| Gerencia `iptables` bruto sem UFW | **Não.** Destina-se a servidores onde o UFW é a camada frontal do firewall |
| SaaS multi-tenant | **Não.** Auto-hospedado em instância única; uma conta de administrador após a configuração |
| Cluster de alta disponibilidade | **Não.** Projetado para **réplica única da aplicação** (limites de taxa em memória) |
| Alterações automáticas de firewall sem confirmação | **Não.** A aplicação sempre exige confirmação explícita do usuário |

## Requisitos

### Host de gerenciamento (onde o Docker roda)

- Docker e Docker Compose
- Opcional: Portainer, instalação existente do Nginx Proxy Manager
- Acesso de rede do container da aplicação aos servidores de destino na porta SSH (22 ou personalizada)

### Servidores de destino (hosts Linux gerenciados)

- Linux com UFW disponível (`apt install ufw` ou equivalente)
- Acesso SSH com privilégios suficientes para executar comandos `ufw`
- Conectividade de saída do host de gerenciamento até a porta SSH do servidor

### Produção

- URL pública **HTTPS** para a interface de administração (`APP_URL`)
- Segredos fortes no `.env` (nunca commitados no git)

## Próximos passos

- [Início rápido](./quick-start.md) — executar localmente no Docker
- [Arquitetura](./architecture.md) — como os componentes se integram
- [Visão geral da implantação](./deployment/overview.md) — produção atrás do NPM
