# Editar e aplicar regras

Quando o UFW está **instalado e ativo** em um servidor, abra a aba **Regras** para gerenciar regras de firewall.

## Tabela de regras

Recursos:

- Busca e filtros por coluna
- Seções de grupos com expandir/recolher
- Reordenação por arrastar e soltar (a ordem importa para o UFW)
- Cores de linha por [estado de sincronização](../concepts/ufw-rules-and-states.md)
- Adicionar linha, editar inline, excluir linha

## Atualizar do servidor

Clique em **Atualizar** (ou use a atualização do painel) para:

1. Detectar o estado UFW
2. Carregar snapshot do servidor
3. Sincronizar estados de origem do rascunho

Use após alterações manuais na CLI do servidor ou após aplicação parcial.

## Ressincronização forçada

Se a interface alertar sobre drift ou aplicação parcial, use **Ressincronização forçada do servidor** para substituir o alinhamento local do rascunho pelo snapshot remoto real antes de continuar editando.

## Importar regras

Barra de ferramentas → importar CSV, XLSX ou JSON. Valide as linhas importadas na tabela antes da pré-visualização de aplicação.

## Fluxo de aplicação

1. Fazer edições no rascunho
2. **Pré-visualização de aplicação** — revisar comandos planejados e resumo de diff
3. **Confirmar** — executa via SSH (rejeitado se o UFW remoto mudou desde a pré-visualização — execute a pré-visualização novamente)
4. Acompanhe o banner de operação para o progresso

Veja [Fluxo de rascunho e aplicação](../concepts/draft-apply-workflow.md) para detalhes.

## Dicas de segurança

- Mantenha pelo menos uma regra permitindo SSH da sua rede de administração antes de aplicar regras deny
- Execute a pré-visualização em produção durante uma janela de manutenção
- Verifique o **Histórico de operações** após aplicar o status SUCCESS ou FAILED

## Documentação relacionada

- [Regras UFW e estados](../concepts/ufw-rules-and-states.md)
- [Histórico de operações](./operations-history.md)
