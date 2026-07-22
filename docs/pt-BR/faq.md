# FAQ

## Geral

### O que é o UFW Remote Manager?

Uma aplicação web auto-hospedada para gerenciar firewalls UFW em servidores Linux remotos via SSH, com fluxo rascunho/apply e trilha de auditoria.

### Substitui o Nginx Proxy Manager?

Não. O NPM (ou similar) termina HTTPS para a interface de administração. O UFW Remote Manager gerencia **firewalls de servidores remotos**, não seu proxy reverso.

### Posso gerenciar containers Docker?

Não. O monitoramento de containers Docker foi **removido na v0.9.0**. O app gerencia apenas regras UFW e varreduras externas de portas opcionais.

### Quantos usuários admin?

Uma conta após a configuração inicial em `/setup`. Sem interface multi-usuário.

### Posso executar várias réplicas do app?

Não recomendado. Limites de taxa e filas são em memória (design de réplica única).

## SSH e servidores

### Por que IP privado é rejeitado?

Segurança padrão — bloqueia RFC1918 e endereços metadata. Defina `SSH_ALLOWED_CIDRS` para alvos lab/VPN.

### Por que apply está desabilitado?

A chave host SSH pode estar **não verificada**. Execute **Atualizar status** com sucesso primeiro.

### Excluir servidor altera o UFW remoto?

Não. Excluir remove apenas dados locais de gestão.

## Regras e apply

### Pré-visualização vs confirmar?

A pré-visualização mostra alterações planejadas sem executar. Confirmar executa comandos UFW via SSH.

### Remoto mudou desde a pré-visualização?

Apply rejeitado — execute **Apply preview** novamente. Não use ressincronização forçada neste caso.

### Apply parcial?

Veja [Fluxo de rascunho e aplicação](./concepts/draft-apply-workflow.md). Use **Ressincronização forçada do servidor** quando indicado.

### Por que as contagens de regras diferem?

**Regras salvas** (card da lista) vs **na tabela** (painel) contam coisas diferentes — veja [Regras UFW e estados](./concepts/ufw-rules-and-states.md).

## Interface de operações

### Banner preso em EM EXECUÇÃO?

Atualize a página. O sweeper limpa operações obsoletas em ~30–60 minutos.

### Regras não atualizam após sync?

Desde v0.9.2, o fim da operação deve disparar atualização da página. Tente atualizar o navegador manualmente uma vez.

## Varredura de portas

### Botão de scan ausente?

`PORT_SCAN_ENABLED` não definido como `true` no ambiente do app.

### Scan já em execução?

Apenas um scan ativo por servidor. Aguarde ou verifique o histórico de operações.

### Scan bloqueia refresh UFW?

Não (desde v0.9.2). O scan executa fora da fila SSH.

## Implantação

### Onde executar migrations?

No container **migrate** / **ufw-migrate** — não dentro do **ufw-app**. Veja [Visão geral de implantação](./deployment/overview.md).

### EACCES ao executar prisma no container app?

Esperado — use `docker compose run --rm migrate`.

## Documentos relacionados

- [Solução de problemas](./troubleshooting.md)
- [Introdução](./introduction.md)
