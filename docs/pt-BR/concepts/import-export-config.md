# Importar e exportar configuração

Você pode exportar e importar a **configuração completa de servidores** (todos os servidores, identidades, metadados de regras) como JSON **v2**.

## Exportar

1. Na página **Servidores**, use **Salvar configuração**
2. Informe novamente sua **senha da conta** (autenticação step-up)
3. Baixe o arquivo JSON

### Aviso importante de segurança

O arquivo de exportação contém **senhas SSH e chaves privadas em texto plano**. Trate-o como um segredo:

- Armazene criptografado (cofre de gerenciador de senhas, disco criptografado)
- Nunca faça commit no git nem envie por canais não seguros
- Um evento de auditoria `CONFIG_EXPORT` é registrado quando a exportação tem sucesso

## Importar

1. Use **Carregar configuração** na página Servidores
2. Selecione o arquivo JSON v2
3. Revise o resumo: servidores a criar, atualizar, excluir
4. Confirme — a importação roda em uma transação (upsert primeiro, exclusão por último)

### Comportamento destrutivo

Servidores **ausentes** do arquivo de importação podem ser **excluídos** junto com todas as suas regras e snapshots. Leia o diálogo de confirmação com atenção.

Chaves host SSH importadas podem ser marcadas como **não verificadas** até você executar Testar SSH em cada servidor.

### Limites de importação

- Importações de regras (CSV, XLSX, JSON) são limitadas a **10 000 linhas** por arquivo.
- A **visualização** da importação de configuração é limitada a **10 tentativas por minuto** por usuário — aguarde e tente novamente se atingir o limite.

## Exportação vs backup do Postgres

| Método | Contém | Melhor para |
|--------|----------|----------|
| **Exportação de configuração (JSON)** | Config legível + segredos em texto plano | Migração entre instâncias, cópia de desastre |
| **Dump do Postgres** | Banco completo incluindo segredos criptografados | Restauração completa com o mesmo `APP_ENCRYPTION_KEY` |
| **Backup do `.env`** | Segredos em tempo de execução | Necessário para descriptografar credenciais do BD após restauração |

Para recuperação completa de desastre, faça backup **tanto** do Postgres quanto do `.env` — veja [Backup e restauração](../operations/backup-restore.md).

## Documentação relacionada

- [Log de auditoria e exportação](../administration/audit-log-and-export.md)
- [Identidades SSH](./ssh-identities.md)
