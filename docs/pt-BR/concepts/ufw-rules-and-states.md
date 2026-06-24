# Regras UFW e estados

As regras são normalizadas em um modelo de linha unificado com campos **core** (o que o UFW considera) e campos de **interface** (nome, grupo, metadados de cor).

## Campos core da regra

Colunas típicas incluem ação (allow/deny/reject), direção, protocolo, portas, endereços de origem/destino e modo de log. O conjunto exato corresponde à sintaxe expressiva de regras do UFW — veja a tabela de regras na interface.

## Estados de sincronização (cores das linhas)

Cada linha tem um **estado** que mostra como os dados do rascunho local se relacionam com o último snapshot do servidor:

| Estado | Significado |
|-------|---------|
| **MATCHED** | Rascunho corresponde ao que o UFW reportou no servidor |
| **REMOTE_ONLY** | Existe no snapshot do servidor, mas não no seu rascunho local |
| **LOCAL_ONLY** | No seu rascunho, mas não no servidor (será adicionada na aplicação) |
| **DRAFT_ONLY** | Edição local ainda não aplicada; difere da linha de base correspondente |

As cores ajudam a identificar deriva antes de aplicar. Após **Ressincronização forçada do servidor**, o rascunho local realinha ao estado remoto.

## Impressões digitais

Cada regra tem uma impressão digital derivada dos campos core. Usada para corresponder linhas entre snapshots e detectar operações de reordenação/exclusão durante o planejamento da aplicação.

## Agrupamento e ordem

- **Grupos** — organizam regras visualmente; o nome do grupo é metadado da interface
- **Ordem** — a ordem das regras UFW importa; reordenar pode exigir excluir e recriar no servidor durante a aplicação

## Formatos de importação

Regras podem ser importadas de **CSV**, **XLSX** ou **JSON** pela barra de ferramentas de regras. Linhas importadas viram entradas de rascunho — ainda exigem aplicação para chegar ao servidor.

## Documentação relacionada

- [Fluxo de rascunho e aplicação](./draft-apply-workflow.md)
- [Editar e aplicar regras](../user-guide/edit-and-apply-rules.md)
