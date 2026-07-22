# Servidores e SSH

Um registro de **servidor** armazena nome de exibição, host, porta, identidade SSH e impressão digital opcional da chave host. Todo trabalho UFW remoto passa por este registro.

## Validação de host

Antes de salvar, o app valida o host de destino:

| Verificação | Comportamento padrão |
|-------------|---------------------|
| Faixas de IP privado | **Rejeitadas** (RFC1918, loopback, link-local) |
| IPs metadata de cloud | **Rejeitados** |
| Hostnames / IPs públicos | Permitidos |
| Lista de permissão personalizada | Defina `SSH_ALLOWED_CIDRS` para faixas privadas específicas (lab/VPN) |

A resolução DNS é validada quando aplicável para que erros de digitação falhem cedo.

## Verificação de conexão

**Criar servidor** e **Editar servidor** (quando host, porta ou identidade mudam) executam teste de conexão SSH automaticamente. Não há botão separado *Testar conexão* no formulário de edição.

Mensagens de falha apontam para reachability, credenciais, firewall ou validação de host — veja [Solução de problemas](../troubleshooting.md).

## Chaves host SSH (trust on first use)

Na primeira conexão bem-sucedida, a impressão digital da chave host é armazenada e marcada como **verificada**.

| Estado | UI | Aplicar regras |
|--------|-----|----------------|
| **Verificada** | Impressão digital na página de edição | Permitido após refresh |
| **Não verificada** | Aviso no painel e na página de edição | **Salvar regras** (apply) bloqueado até **Atualizar status** ter sucesso |

Isso reduz risco MITM na primeira conexão. Para confiar em nova chave após rebuild do servidor, atualize o servidor ou limpe e reverifique via refresh.

Servidores importados da configuração podem chegar com impressões digitais armazenadas — verifique com **Atualizar status** antes de aplicar regras.

## Sudo e UFW

Comandos remotos assumem que o usuário SSH pode executar `ufw` — tipicamente via sudo sem senha para `ufw` ou root. O app envolve comandos apt install em `sudo` quando necessário para **Instalar UFW**.

Garanta que `/etc/sudoers` permita os comandos necessários para seu usuário escolhido.

## Servidores duplicados

A mesma combinação host + porta + identidade não pode ser registrada duas vezes. Use nomes distintos se gerenciar intencionalmente o mesmo host por contas diferentes (identidades diferentes).

## Documentos relacionados

- [Identidades SSH](./ssh-identities.md)
- [Gerenciar servidores](../user-guide/manage-servers.md)
- [Variáveis de ambiente](../administration/environment-variables.md) — `SSH_ALLOWED_CIDRS`
