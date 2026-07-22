# Importar e exportar configuração

Exporte e importe um arquivo **JSON v2** contendo todos os servidores, identidades SSH (incluindo segredos descriptografados) e metadados relacionados. Use para backup, migração ou recuperação de desastres — não para edição diária de regras.

Importação/exportação em nível de regra (CSV, XLSX) é separada — veja [Editar e aplicar regras](../user-guide/edit-and-apply-rules.md).

## Fluxo de exportação

1. Lista **Servidores** → **Salvar configuração**
2. Informe a **senha** da conta (autenticação step-up)
3. Baixe arquivo JSON (`servers-config-YYYY-MM-DD.json`)

A exportação inclui segredos SSH descriptografados. Armazene o arquivo criptografado em repouso; exclua quando não for mais necessário.

Um token de curta duração protege a API de download após confirmação de senha.

Limite de taxa: 5 exportações por minuto por usuário.

## Fluxo de importação

1. **Carregar configuração** → selecione arquivo JSON
2. **Pré-visualização** mostra diff: servidores e identidades a criar, atualizar ou excluir
3. Confirme com senha → importação aplica alterações

A importação aguarda filas por servidor ficarem ociosas e bloqueia se operações destrutivas conflitarem com trabalho ativo.

## Formato JSON v2

| Seção | Conteúdo |
|-------|----------|
| **version** | `2` |
| **identities** | Nome, username, auth method, secrets |
| **servers** | Nome, host, port, referência de identidade, campos de chave host |

Arquivos legacy apenas array ou v1 são rejeitados.

Chaves duplicadas (mesmo host + port + identity) são rejeitadas no parse.

## Semântica de exclusão na importação

Servidores presentes no banco mas ausentes do arquivo importado aparecem no conjunto **delete** da pré-visualização. Confirme apenas se pretende remover esses registros de servidor e todas as regras, rascunhos e snapshots associados localmente.

O UFW remoto em registros de servidor excluídos **não** é modificado.

## Documentos relacionados

- [Identidades SSH](./ssh-identities.md)
- [Backup e restauração](../operations/backup-restore.md)
- [Log de auditoria e exportação](../administration/audit-log-and-export.md)
