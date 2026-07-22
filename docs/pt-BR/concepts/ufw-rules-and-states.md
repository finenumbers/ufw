# Regras UFW e estados

A tabela de regras mostra uma **visão unificada**: regras UFW remotas, metadados locais e suas edições de rascunho. As **cores** das linhas refletem como cada linha se relaciona com o servidor e o banco de dados.

## Estrutura da regra

Cada linha possui:

| Camada | Campos |
|--------|--------|
| **Núcleo** | action, direction, protocol, addresses, ports, interface, app profile, log mode, comment, IPv6 |
| **Metadados UI** | group, name, notes (armazenados localmente, não enviados ao UFW exceto em comment) |
| **Origem** | estado de sync que define a cor da linha |

Fingerprints identificam regras entre recargas remotas e edições locais.

## Estados de origem

| Estado | Significado da cor | Situação típica |
|--------|-------------------|-----------------|
| **MATCHED** | Remoto e metadados locais concordam | Regra sincronizada estável |
| **REMOTE_ONLY** | No servidor, não nos metadados locais | Nova regra remota após refresh |
| **LOCAL_ONLY** | No BD local, não no servidor | Add pendente ou removida remotamente |
| **DRAFT_ONLY** | Edição de rascunho ainda não aplicada | Linha nova ou campos núcleo alterados |
| **CONFLICT** | Mesmo fingerprint, campos núcleo diferentes | Deriva — revisar antes de apply |
| **DELETED** | Marcada excluída no rascunho | Será removida no apply |

Cores ajudam a detectar deriva **antes** de aplicar. Após **Ressincronização forçada do servidor**, o rascunho realinha ao snapshot remoto.

## Destaque de endereços sobrepostos

Regras diferentes podem cobrir o mesmo tráfego mesmo com fingerprints distintas — por exemplo `95.163.183.223` dentro de `95.163.183.192/26`, ou um `/24` mais amplo cobrindo um `/26` existente.

Linhas envolvidas em pelo menos um par assim são destacadas em **violeta** na tabela. Essa cor tem prioridade sobre verde/amarelo/vermelho de origem. **Ambas** as linhas do par são destacadas.

A legenda acima da tabela inclui uma amostra violeta: **Faixas IP ou CIDR sobrepostas**.

A sobreposição é calculada a partir do rascunho atual (mesma direction, mesma família IP, endereços não `anywhere`). É **apenas um aviso** — importação e apply não são bloqueados. Remova ou ajuste endereços até o destaque violeta desaparecer.

Típico após importar: um novo host ou CIDR sobrepõe uma regra já no servidor. Revise a ordem — o UFW usa a primeira regra correspondente.

## Duas contagens de regras

A UI mostra contagens diferentes em lugares diferentes:

| Local | Rótulo | Conta |
|-------|--------|-------|
| Card da **lista de servidores** | regras salvas | Linhas em `ruleRecord` (metadados locais) |
| Badge do **painel** | na tabela | Linhas na tabela da sessão de rascunho ativa |

Estas diferem durante edição, importação ou sync. O badge do painel corresponde ao comprimento da tabela visível.

## Ordem importa

O UFW avalia regras em ordem. A tabela suporta reordenação por arrastar e soltar. Apply pode emitir operações de resync de ordem quando a numeração remota diverge da ordem do rascunho.

## Metadados remotos vs locais

- **Campos núcleo remotos** vêm de saída parseada de `ufw status numbered`
- **Group, name, notes** existem apenas no UFW Remote Manager, salvo se copiados para comentários de regra UFW
- Apply grava campos núcleo no servidor; metadados UI permanecem no Postgres

## Documentos relacionados

- [Fluxo de rascunho e aplicação](./draft-apply-workflow.md)
- [Editar e aplicar regras](../user-guide/edit-and-apply-rules.md)
