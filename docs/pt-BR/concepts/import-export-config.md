# Importar e exportar configuração

Você pode exportar e importar uma **configuração completa de servidores** (todos os servidores, identidades, metadados de regras) como JSON **v2**.

## Exportação

1. Na página **Servidores**, use **Salvar configuração**
2. Digite novamente sua **senha da conta** (autenticação step-up)
3. Baixe o arquivo JSON

### Aviso de segurança importante

O arquivo de exportação contém **senhas SSH e chaves privadas em texto plano**. Trate-o como um segredo:

- Armazene criptografado (cofre de gerenciador de senhas, disco criptografado)
- Nunca faça commit no git ou envie por canais não seguros
- Um evento de audit `CONFIG_EXPORT` é gravado quando a exportação tem sucesso

## Importação

1. Use **Carregar configuração** na página Servidores
2. Selecione arquivo JSON v2
3. Revise o resumo: servidores a criar, atualizar, excluir
4. Digite novamente sua **senha da conta** no diálogo de confirmação
5. Confirme — a importação roda em uma transação (upsert primeiro, exclusão por último)

A importação usa os mesmos limites de taxa da exportação (10 tentativas por minuto por usuário).

### Comportamento destrutivo

Servidores **ausentes** no arquivo de importação podem ser **excluídos** junto com todas as regras e snapshots. Leia o diálogo de confirmação com atenção.

Chaves host SSH importadas são marcadas como **não verificadas** — execute **Atualizar status** no painel de cada servidor antes de aplicar regras.

### Limites de importação

- Importações de regras (CSV, XLSX, JSON) são limitadas a **10 000 linhas** por arquivo.
- A **pré-visualização** de importação de configuração é limitada a **10 tentativas por minuto** por usuário — aguarde e tente novamente se atingir o limite.

## Exportação vs backup Postgres

| Método | Contém | Melhor para |
|--------|--------|-------------|
| **Exportação de configuração (JSON)** | Config legível + segredos em texto plano | Migração entre instâncias, cópia de disaster |
| **Dump Postgres** | Banco completo incluindo segredos criptografados | Restauração completa com a mesma `APP_ENCRYPTION_KEY` |
| **Backup `.env`** | Segredos de runtime | Necessário para descriptografar credenciais do DB após restauração |

Para disaster recovery completo, faça backup de **Postgres e `.env`** — veja [Backup e restauração](../operations/backup-restore.md).

## Documentação relacionada

- [Log de audit e exportação](../administration/audit-log-and-export.md)
- [Identidades SSH](./ssh-identities.md)
