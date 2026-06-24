# Editar e aplicar regras

Quando o UFW está **instalado e ativo** em um servidor, abra a aba **Regras** para gerenciar regras de firewall.

## Tabela de regras

Recursos:

- Busca e filtros de coluna
- Seções de grupo com expandir/recolher
- Reordenação por arrastar e soltar (a ordem importa para o UFW)
- Cores das linhas por [estado de sincronização](../concepts/ufw-rules-and-states.md)
- Adicionar linha, editar inline, excluir linha

## Atualizar status a partir do servidor

Clique em **Atualizar status** (ou use a atualização no painel) para:

1. Detectar o estado do UFW
2. Carregar snapshot do servidor
3. Sincronizar estados de origem do rascunho

Use isso após alterações manuais na CLI do servidor ou após uma aplicação parcial.

## Ressincronização forçada

Se a interface avisar sobre deriva ou aplicação parcial, use **Ressincronização forçada do servidor** para substituir o alinhamento do rascunho local pelo snapshot remoto real antes de continuar editando.

## Importar regras

Barra de ferramentas → importar CSV, XLSX ou JSON. Valide as linhas importadas na tabela antes de Salvar regras.

## Fluxo de aplicação

1. Faça edições no rascunho
2. **Salvar regras** — revise os comandos planejados e o resumo de diferenças
3. **Confirmar** — executa via SSH
4. Acompanhe o banner de operação para ver o progresso

Veja [Fluxo de rascunho e aplicação](../concepts/draft-apply-workflow.md) para detalhes.

## Dicas de segurança

- Mantenha sempre pelo menos uma regra permitindo SSH da sua rede de administração antes de aplicar regras deny
- Execute a visualização em produção durante uma janela de manutenção
- Verifique o **Histórico de operações** após aplicar para status SUCESSO ou FALHA

## Documentação relacionada

- [Regras UFW e estados](../concepts/ufw-rules-and-states.md)
- [Histórico de operações](./operations-history.md)
