# Servidores e SSH

Um registro de **servidor** representa um host Linux que você gerencia. A aplicação conecta via SSH para executar comandos UFW e ler o estado do firewall.

## Campos do servidor

| Campo | Finalidade |
|-------|---------|
| **Nome** | Rótulo de exibição na barra lateral |
| **Host** | Endereço IP ou nome DNS (validado antes de salvar) |
| **Porta** | Porta SSH (padrão 22) |
| **Identidade SSH** | Credenciais usadas na conexão |

## Validação de host (proteção SSRF)

Antes de salvar um servidor, o host é validado:

- Faixas de IP privado (10.x, 172.16–31, 192.168.x) são **bloqueadas** por padrão
- Endereços link-local e de metadados de cloud são bloqueados
- Endereços IPv6 mapeados para IPv4 privados são bloqueados
- Lista de permissão opcional: defina `SSH_ALLOWED_CIDRS` no `.env` (ex.: `10.0.0.0/8`) para redes internas

Isso impede que a aplicação seja usada como proxy para varrer redes internas.

## Verificação de resolução DNS

A validação ocorre em duas etapas:

1. **Ao salvar** — a string do hostname é verificada (literais privados, hosts de metadados, lista de permissão CIDR opcional).
2. **Antes de conectar** — o hostname é resolvido para um IP e o **endereço resolvido** é verificado com as mesmas regras.

Isso fecha lacunas de DNS rebinding em que um hostname público passa a resolver para um IP privado ou de metadados.

## Teste SSH antes de salvar

Criar ou atualizar um servidor (alteração de host, porta ou identidade) exige um **teste de conexão SSH** bem-sucedido. A interface bloqueia o salvamento até o teste passar.

## Fixação de chave host SSH

Na primeira conexão bem-sucedida, a impressão digital da chave host SSH do servidor é armazenada.

| Estado | Significado |
|-------|---------|
| **Verificada** | Chave registrada após teste SSH bem-sucedido ou operação normal |
| **Não verificada** | Chave importada do arquivo de configuração — execute Testar SSH para verificar |

Se a chave host remota mudar (reinstalação, MITM), a próxima conexão falha até você investigar.

## O que a exclusão de um servidor faz

Excluir um servidor remove **apenas dados locais**:

- Regras de rascunho, snapshots, sessões de apply e histórico de operações desse servidor

**Não** altera as regras UFW no host Linux remoto. O estado do firewall remoto permanece como está.

## Ciclo de vida do UFW em um servidor

No painel do servidor você pode:

1. **Detectar** UFW — instalado? ativo?
2. **Instalar UFW** se ausente
3. **Ativar** UFW e sincronizar regras

A edição de regras fica disponível somente quando o UFW está instalado **e** ativo.

## Documentação relacionada

- [Identidades SSH](./ssh-identities.md)
- [Gerenciar servidores](../user-guide/manage-servers.md)
- [Solução de problemas](../troubleshooting.md)
