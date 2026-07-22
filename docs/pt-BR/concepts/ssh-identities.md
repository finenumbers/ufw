# Identidades SSH

Uma **identidade SSH** armazena credenciais de conexão reutilizáveis: nome de usuário, método de autenticação e segredos criptografados. Cada **servidor** referencia uma identidade.

## Métodos de autenticação

| Método | Segredo armazenado | Uso típico |
|--------|-------------------|------------|
| **Senha** | Senha SSH | Lab simples ou hosts legados |
| **Chave privada** | Chave privada PEM | Chaves de produção sem passphrase |
| **Chave privada + passphrase** | Chave e passphrase | Chaves privadas criptografadas |

Segredos são criptografados em repouso com **AES-256-GCM** usando `APP_ENCRYPTION_KEY`. São descriptografados apenas em memória ao abrir uma conexão SSH.

## Criar e editar

1. Barra lateral → **Identidades SSH**
2. **Adicionar identidade** ou abra uma linha existente → **Editar**
3. Campos obrigatórios: nome de exibição, usuário SSH, método de auth, segredo(s)

Na **edição**, deixar campos de senha/chave vazios mantém o segredo existente inalterado.

A validação rejeita nomes vazios e combinações de auth inválidas antes de salvar.

## Vincular a servidores

Ao criar ou editar um servidor, selecione uma identidade no dropdown. Alterar a identidade de um servidor dispara verificação SSH ao salvar se os parâmetros de conexão mudaram.

## Excluir uma identidade

A exclusão é bloqueada enquanto algum servidor ainda referencia a identidade. A interface lista servidores vinculados. Reatribua ou exclua esses servidores primeiro.

## Notas de segurança

- Segredos de identidade aparecem na **exportação de configuração** (JSON v2) após confirmação de senha — trate exportações como altamente sensíveis
- Rotacionar `APP_ENCRYPTION_KEY` sem reinserir segredos torna ciphertext existente ilegível — planeje rotação de chave com cuidado
- Uma identidade pode ser compartilhada por muitos servidores (mesmo usuário admin, mesma chave)

## Documentos relacionados

- [Servidores e SSH](./servers-and-ssh.md)
- [Importar e exportar configuração](./import-export-config.md)
- [Modelo de segurança](../administration/security-model.md)
