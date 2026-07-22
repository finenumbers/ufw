# Varredura de portas (guia do usuário)

Quando habilitada pelo administrador, o **painel de varredura de portas** em cada página de servidor descobre serviços TCP acessíveis externamente e os compara com suas regras UFW.

Administradores habilitam e ajustam a varredura via variáveis de ambiente — veja [Varredura externa de portas (implantação)](../deployment/port-scan.md).

## Quando o painel aparece

O painel é visível apenas quando `PORT_SCAN_ENABLED=true` no ambiente do app. Se desabilitado, a página do servidor mostra apenas regras UFW.

## Iniciar uma varredura

1. Abra o painel de um servidor.
2. Na barra de ferramentas do painel UFW, clique em **Scan ports** (ou use a seção de varredura abaixo da tabela de regras, se exibida).
3. Um banner de operações aparece com etapas: resolve target → discovery → enrichment → normalize.
4. Resultados populam a tabela quando a varredura conclui com sucesso.

A descoberta TCP completa (portas 1–65535) pode levar **30 minutos ou mais**. A varredura executa do container do app em direção ao hostname ou IP registrado do servidor — não via SSH.

## Estados da varredura

| Status | Significado | Comportamento da UI |
|--------|-------------|---------------------|
| **PENDING** | Job criado, ainda não iniciado | Mostra *Scanning…*; polling ativo |
| **RUNNING** | Naabu/Nmap em progresso | Progresso via banner de operações; tabela pode estar vazia ou mostrar resultados anteriores |
| **SUCCESS** | Varredura concluída | Tabela completa de findings; data e contagem de portas no cabeçalho do painel |
| **FAILED** | Erro ou timeout | Mensagem de erro; resultados bem-sucedidos anteriores podem ainda exibir |

## Retomar após atualizar a página

Desde v0.9.2, abrir a página do servidor carrega o **último scan de qualquer status** do banco — não apenas o último bem-sucedido. Se atualizar o navegador enquanto scan está `PENDING` ou `RUNNING`, o painel retoma polling e o banner de operações retoma a operação ativa.

## Tabela de resultados

| Coluna | Descrição |
|--------|-----------|
| **Port** | Número da porta TCP |
| **Proto** | Protocolo (tipicamente `tcp`) |
| **State** | Geralmente `open` para portas descobertas |
| **Service** | Nome do serviço do Nmap quando disponível |
| **Product / Version** | Produto e versão quando detectados |
| **UFW** | Cobertura relativa ao último snapshot UFW |

### Valores de cobertura UFW

A cobertura usa **semântica de varredura externa** — o que um cliente anônimo na internet veria:

| Valor | Significado |
|-------|-------------|
| **Allowed** | Inbound ALLOW/LIMIT de **any** cobre esta porta |
| **Not in UFW** | Porta aberta externamente mas não coberta por regra inbound allow pública — revisar |
| **Denied** | Inbound DENY/REJECT de **any** atinge esta porta |
| **Unknown** | UFW inativo ou snapshot indisponível |

Regras apenas whitelist (IP/CIDR específico, ou `To Port = any` sem allow público) **não** contam como *Allowed* para varredura externa.

## Sobreposição e limites de taxa

| Situação | Mensagem / comportamento |
|----------|--------------------------|
| Varredura já em execução neste servidor | *Já existe uma varredura de portas em andamento para este servidor.* — aguarde conclusão |
| Repetir varredura em 30 segundos | Mensagem de limite de taxa com contagem regressiva |

Apenas uma varredura ativa por servidor. Varredura de portas não bloqueia refresh UFW ou apply no mesmo servidor.

## Relação com estatísticas da lista de servidores

O card da **lista de servidores** pode mostrar contagem de portas abertas do último scan bem-sucedido. A linha de inventário do painel mostra data e contagem de findings quando existe scan bem-sucedido.

Contagens de regras salvas nos cards referem-se a **metadados locais de regra** (`ruleRecord`), não números de regras UFW remotas.

## Histórico de operações

Cada varredura cria entrada de log de operação tipo `port.scan`. Eventos de auditoria `PORT_SCAN_STARTED` e `PORT_SCAN_COMPLETED` são registrados no início e conclusão bem-sucedida.

Veja [Histórico de operações](./operations-history.md).

## Documentos relacionados

- [Varredura externa de portas (implantação)](../deployment/port-scan.md)
- [Operações e concorrência](../concepts/operations-and-concurrency.md)
- [Gerenciar servidores](./manage-servers.md)
