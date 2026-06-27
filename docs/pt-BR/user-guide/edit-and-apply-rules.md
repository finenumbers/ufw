# Editar e aplicar regras

Quando o UFW está **instalado e ativo** em um servidor, a **tabela de regras** no painel do servidor permite gerenciar regras de firewall.

## Tabela de regras

Recursos:

- Busca e filtros por coluna
- Seções de grupos com expandir/recolher
- Reordenação por arrastar e soltar (a ordem importa para o UFW)
- Cores de linha por [estado de sincronização](../concepts/ufw-rules-and-states.md)
- Adicionar linha, editar inline, excluir linha

## Atualizar do servidor

Use **Atualizar status** no painel (ou atualizar na barra de ferramentas de regras) para:

1. Detectar estado UFW via SSH
2. Carregar um novo snapshot do servidor
3. Reinicializar a tabela de regras a partir do remoto + metadados locais

Se houver **edições não salvas**, o app exibe um diálogo de confirmação antes de recarregar do servidor.

Use após alterações manuais na CLI do servidor ou após uma aplicação parcial.

## Ressincronização forçada

Se a interface alertar sobre drift ou aplicação parcial, use **Ressincronização forçada do servidor** para substituir o alinhamento local do rascunho pelo snapshot remoto real antes de continuar editando.

## Importar regras

Barra de ferramentas → importar CSV, XLSX ou JSON. Valide as linhas importadas na tabela antes da pré-visualização de aplicação.

## Fluxo de aplicação

1. Fazer edições no rascunho
2. **Pré-visualização de aplicação** — revisar comandos planejados e resumo de diff
3. **Confirmar** — executa via SSH (rejeitado se o UFW remoto mudou desde a pré-visualização — execute a pré-visualização novamente)
4. Acompanhe o banner de operação para o progresso

**Salvar regras** (pré-visualização de aplicação) fica desabilitado até a chave host SSH estar **verificada** — execute **Atualizar status** primeiro se o servidor foi importado da configuração.

Veja [Fluxo de rascunho e aplicação](../concepts/draft-apply-workflow.md) para detalhes.

## Dicas de segurança

- Sempre mantenha pelo menos uma regra permitindo SSH da sua rede de administração antes de aplicar regras deny
- Execute a pré-visualização em produção durante uma janela de manutenção
- Verifique o **Histórico de operações** após aplicar para status SUCCESS ou FAILED

## Documentação relacionada

- [Regras UFW e estados](../concepts/ufw-rules-and-states.md)
- [Histórico de operações](./operations-history.md)
