# Editar e aplicar regras

Quando UFW está **instalado e ativo**, a **tabela de regras** no painel do servidor é a principal superfície de edição.

## Recursos da tabela de regras

| Recurso | Descrição |
|---------|-----------|
| **Busca** | Filtrar linhas visíveis |
| **Filtros de coluna** | Filtrar por grupo ou nome |
| **Seções de grupo** | Expandir/recolher linhas agrupadas |
| **Arrastar e soltar** | Reordenar regras (ordem afeta UFW) |
| **Cores de linha** | Indicadores de [estado de origem](../concepts/ufw-rules-and-states.md) |
| **Edição inline** | Duplo clique ou ação editar na linha |
| **Adicionar / excluir** | Barra de ferramentas e ações de linha |
| **Carregar mais** | Scroll infinito para grandes conjuntos de regras |

## Refresh do servidor

**Atualizar status** no painel (ou sync da barra de ferramentas):

1. Detectar estado UFW via SSH
2. Armazenar novo snapshot
3. Re-seed da tabela a partir de remoto + metadados locais

Use após alterações CLI manuais no servidor ou após apply parcial.

Edições de rascunho não salvas disparam diálogo de confirmação antes de recarregar.

## Ressincronização forçada do servidor

Quando a UI avisa sobre deriva ou apply parcial, use **Ressincronização forçada do servidor** para alinhar o rascunho ao snapshot remoto real antes de mais edições.

Disponível no diálogo de pré-visualização de apply e avisos relacionados — não substituto para re-preview quando remoto mudou entre preview e confirmar.

## Importar regras

Barra de ferramentas → importar **CSV**, **XLSX** ou **JSON**:

- Linhas mesclam no rascunho; duplicatas por fingerprint ignoradas ou mescladas conforme regras de importação
- Valide linhas na tabela antes da pré-visualização de apply
- Importação afeta apenas rascunho até apply

## Exportar regras

Exporte tabela atual para **XLSX** para revisão offline ou backup. Layout XLSX corresponde à ordem de colunas de importação para workflows round-trip.

## Fluxo de apply

1. Editar rascunho
2. **Apply preview** — revisar comandos planejados e contagens resumo
3. **Confirmar** — executa via SSH (rejeitado se remoto mudou desde preview)
4. Observe **banner de operações** para progresso por comando

**Salvar regras** / apply fica desabilitado até chave host SSH estar **verificada** — execute **Atualizar status** primeiro para servidores importados.

Veja [Fluxo de rascunho e aplicação](../concepts/draft-apply-workflow.md).

## Dicas de segurança

- Mantenha pelo menos uma regra permitindo SSH da sua rede admin antes de regras deny
- Execute preview em produção durante janela de manutenção
- Verifique **Histórico de operações** após apply para SUCESSO ou FALHA

## Documentos relacionados

- [Regras UFW e estados](../concepts/ufw-rules-and-states.md)
- [Histórico de operações](./operations-history.md)
