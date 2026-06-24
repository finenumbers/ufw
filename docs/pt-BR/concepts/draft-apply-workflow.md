# Fluxo de rascunho e aplicação

O UFW Remote Manager nunca envia alterações de firewall silenciosamente. Toda mutação segue **editar → visualizar → confirmar → aplicar**.

![Fluxo de aplicação](../../assets/ufw-apply-workflow.svg)

## Etapas

### 1. Editar rascunho

Altere regras na tabela: adicionar, editar, excluir, reordenar, importar. As alterações ficam no **rascunho local** até serem aplicadas.

### 2. Visualizar aplicação

Clique em **Salvar regras**. A aplicação:

1. Carrega o estado UFW atual do servidor (snapshot SSH)
2. Calcula um **plano** — comandos que alinhariam o UFW ao seu rascunho
3. Mostra regras adicionadas, removidas e reordenadas

Revise a visualização com cuidado. Preste atenção a regras que podem bloquear seu acesso (ex.: bloquear SSH).

### 3. Confirmar

Confirme no diálogo. Somente então os comandos UFW são executados via SSH.

### 4. Execução da aplicação

Os comandos rodam sequencialmente no servidor (fila por servidor, concorrência 1). O progresso aparece no **banner de operação** com status passo a passo.

### 5. Sincronização pós-aplicação

Após o sucesso, a aplicação atualiza o snapshot e sincroniza os estados de origem do rascunho para que as cores das linhas reflitam a nova realidade.

## Diagrama de sequência

```mermaid
sequenceDiagram
  participant User
  participant App as ufw_app
  participant DB as Postgres
  participant Remote as Linux_UFW

  User->>App: Editar regras de rascunho
  User->>App: Salvar regras
  App->>Remote: Leitura snapshot SSH
  App->>App: Montar diff do plano
  User->>App: Confirmar aplicação
  App->>Remote: Comandos ufw via SSH
  App->>DB: Atualizar snapshot e auditoria
```

## Aplicação parcial e deriva

Se a aplicação falhar no meio do caminho, o UFW remoto pode diferir tanto do rascunho quanto do snapshot. A interface avisa e oferece **Ressincronização forçada do servidor** para realinhar o estado local às regras remotas reais antes de editar novamente.

**Nunca ignore avisos de aplicação parcial** — continuar às cegas pode causar regras duplicadas ou erros de ordem.

## Salvaguarda de acesso SSH

O planejador de aplicação inclui salvaguardas em torno de regras de acesso SSH quando configuradas — veja testes em `src/lib/ufw/commands.allow-ssh.test.ts`. Ainda assim, verifique a visualização manualmente em servidores de produção.

## Documentação relacionada

- [Regras UFW e estados](./ufw-rules-and-states.md)
- [Editar e aplicar regras](../user-guide/edit-and-apply-rules.md)
- [Histórico de operações](../user-guide/operations-history.md)
