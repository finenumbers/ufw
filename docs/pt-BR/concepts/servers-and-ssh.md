# Servidores e SSH

Um registro de **servidor** representa um host Linux que você gerencia. O app conecta via SSH para executar comandos UFW e ler o estado do firewall.

## Campos do servidor

| Campo | Propósito |
|-------|-----------|
| **Nome** | Rótulo exibido na barra lateral |
| **Host** | Endereço IP ou nome DNS (validado antes de salvar) |
| **Porta** | Porta SSH (padrão 22) |
| **Identidade SSH** | Credenciais usadas para conexão |

## Validação de host (proteção SSRF)

Antes de um servidor ser salvo, o host é validado:

- Faixas de IP privadas (10.x, 172.16–31, 192.168.x) são **bloqueadas** por padrão
- Endereços link-local e de metadados de cloud são bloqueados
- Endereços IPv6 privados mapeados para IPv4 são bloqueados
- Allowlist opcional: defina `SSH_ALLOWED_CIDRS` em `.env` (ex.: `10.0.0.0/8`) para redes internas

Isso impede que a aplicação seja usada como proxy para escanear redes internas.

## Verificação de resolução DNS

A validação ocorre em duas etapas:

1. **Ao salvar** — a string do hostname é verificada (literais privados, hosts de metadados, allowlist CIDR opcional).
2. **Antes de conectar** — o hostname é resolvido para um IP e o **endereço resolvido** é verificado com as mesmas regras.

Isso fecha lacunas de DNS rebinding onde um hostname público depois resolve para um IP privado ou de metadados.

## Verificação SSH ao salvar

Criar ou atualizar um servidor (host, porta ou mudança de identidade) executa um **teste de conexão SSH automaticamente ao enviar**. Não há botão de teste separado — o salvamento fica bloqueado até a verificação passar.

Na primeira verificação bem-sucedida, a impressão digital da chave host é armazenada e o servidor é marcado como **verificado**.

## Fixação de chave host SSH

| Estado | Significado |
|--------|-------------|
| **Verificada** | Chave registrada após salvamento create/update bem-sucedido ou **Atualizar status** |
| **Não verificada** | Chave importada da configuração — execute **Atualizar status** no painel do servidor para verificar |

A página de edição mostra a impressão digital e um aviso não verificado, mas não executa verificação até você salvar configurações de conexão alteradas ou usar **Atualizar status** no painel.

Se a chave host remota mudar (reinstalação, MITM), a próxima conexão falha até você investigar.

## O que a exclusão de um servidor faz

Excluir um servidor remove **apenas** dados locais:

- Rascunhos de regras, snapshots, sessões de apply, histórico de operações desse servidor

**Não** altera regras UFW no host Linux remoto. O estado do firewall remoto permanece como está.

## Ciclo de vida UFW em um servidor

No painel do servidor você pode:

1. **Atualizar status** — detectar se UFW está instalado e ativo (usa snapshot em cache até a atualização)
2. **Instalar UFW** se ausente — instalação e ativação ocorrem juntas em uma operação
3. Editar e aplicar regras quando UFW está instalado **e** ativo

A edição de regras está disponível apenas quando UFW está instalado **e** ativo.

## Documentação relacionada

- [Identidades SSH](./ssh-identities.md)
- [Gerenciar servidores](../user-guide/manage-servers.md)
- [Solução de problemas](../troubleshooting.md)
