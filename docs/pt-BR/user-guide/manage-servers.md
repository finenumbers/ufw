# Gerenciar servidores

Este guia cobre o ciclo de vida do servidor: adicionar, painel, refresh, instalar UFW, editar, excluir e estatísticas da lista.

## Pré-requisitos

Crie pelo menos uma [identidade SSH](../concepts/ssh-identities.md) antes de adicionar um servidor.

## Adicionar um servidor

1. Barra lateral → **Servidores** → **Adicionar servidor**
2. Preencha nome, host, porta, selecione identidade
3. **Criar servidor** — SSH verificado automaticamente no envio
4. Em sucesso, abra o painel do servidor

Se a verificação falhar, verifique reachability, credenciais, firewall permitindo SSH do host Docker e [validação de host](../concepts/servers-and-ssh.md).

## Painel do servidor

O painel carrega **estado UFW em cache** do último snapshot Postgres — sem SSH na primeira renderização.

Quando varredura de portas está habilitada, o painel de scan carrega o **último scan de qualquer status** do Postgres (incluindo scans em andamento desde v0.9.2).

| Status UFW | Ações |
|------------|-------|
| Não instalado | **Atualizar status**, depois **Instalar UFW** (após refresh confirmar ausência) |
| Instalado mas inativo | **Atualizar status** — botão install oculto se UFW existe mas inativo |
| Instalado e ativo | **Adicionar regra**, **Salvar regras**, **Atualizar status**, **Scan ports** opcional |

**Atualizar status** executa SSH ao vivo, atualiza snapshot e sincroniza a tabela de regras. **Instalar UFW** permanece desabilitado até refresh confirmar que UFW não está instalado.

Até refresh, o badge UFW pode mostrar rótulo **cache** do último snapshot.

### Aviso de edições não salvas

Se houver alterações de rascunho não salvas, refresh pede confirmação antes de recarregar do servidor.

### Sync inicial automático

Quando **não existe snapshot UFW** no Postgres (servidor novo, nunca atualizado), uma operação de sync em segundo plano executa uma vez para popular o cache. Observe o banner de operações.

## Estatísticas de regras e portas

| Local | Métrica | Significado |
|-------|---------|-------------|
| Card da **lista de servidores** | regras salvas | Contagem local `ruleRecord` |
| Card da **lista de servidores** | portas abertas | Findings do último scan bem-sucedido (quando habilitado) |
| Badge do **painel** | na tabela | Contagem de linhas visíveis na tabela de regras |

*Na tabela* no painel pode diferir de *regras salvas* durante edição ou antes de apply.

## Editar um servidor

1. Página do servidor → **Editar servidor**
2. Altere nome, host, porta ou identidade
3. SSH verificado no envio quando parâmetros de conexão mudaram

A página de edição mostra impressão digital da chave host e aviso **não verificada** quando aplicável.

## Excluir um servidor

**Zona de perigo** na página de edição:

- Remove regras locais, rascunhos, snapshots, scans deste servidor
- **Não** altera UFW remoto

Confirme apenas ao remover dados de gestão, não ao limpar regras de firewall remotas.

## Ferramentas de configuração na lista de servidores

- **Salvar configuração** / **Carregar configuração** — exportação/importação JSON v2 completa — veja [Importar e exportar configuração](../concepts/import-export-config.md)

## Documentos relacionados

- [Servidores e SSH](../concepts/servers-and-ssh.md)
- [Editar e aplicar regras](./edit-and-apply-rules.md)
- [Varredura de portas](./port-scan.md)
