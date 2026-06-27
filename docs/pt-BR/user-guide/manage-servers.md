# Gerenciar servidores

Este guia percorre o ciclo de vida do servidor: adicionar, configurar UFW, atualizar, editar e excluir.

## Pré-requisitos

Crie pelo menos uma [identidade SSH](../concepts/ssh-identities.md) antes de adicionar um servidor.

## Adicionar um servidor

1. Barra lateral → **Servidores** ou clique em **Adicionar servidor**
2. Preencha nome, host, porta e selecione uma identidade
3. Clique em **Criar servidor** — a conexão SSH é verificada automaticamente ao enviar
4. Em caso de sucesso, você chega ao painel do servidor

Se a verificação falhar, verifique acessibilidade do host, credenciais, firewall permitindo SSH do host Docker e [validação de host](../concepts/servers-and-ssh.md).

## Painel do servidor

O painel carrega o **estado UFW em cache** do último snapshot Postgres — sem SSH na primeira renderização. Os painéis de port scan e Docker também carregam os últimos resultados em cache do Postgres, quando disponíveis.

| Status | Ações disponíveis |
|--------|-------------------|
| UFW não instalado | **Atualizar status**, depois **Instalar UFW** (após atualização que confirma ausência de UFW) |
| Instalado mas inativo | Apenas **Atualizar status** — UFW já está instalado; use a atualização para detectar estado ativo/inativo |
| Instalado e ativo | **Adicionar regra**, **Salvar regras**, **Atualizar status** |

Clique primeiro em **Atualizar status** para verificar SSH e detectar se o UFW está instalado. **Instalar UFW** permanece desabilitado até uma atualização bem-sucedida indicar ausência de UFW.

Até executar **Atualizar status**, o badge UFW pode mostrar um rótulo ativo/inativo **em cache** do último snapshot.

Use **Atualizar status** para obter o último estado UFW via SSH e sincronizar a tabela de regras. Se houver **edições não salvas** nas regras, o app pede confirmação antes de recarregar do servidor.

Se o app **ainda não tiver snapshot UFW** no Postgres (servidor novo, nunca atualizado, etc.), uma sincronização automática em segundo plano é executada uma vez para preencher o cache.

## Contagem de regras

Dois contadores diferentes aparecem na interface:

| Local | Rótulo | Significado |
|-------|--------|-------------|
| Cartão na **lista de servidores** | regras salvas | Contagem de regras armazenadas nos metadados locais (`ruleRecord`) |
| Badge do **painel** abaixo de Adicionar regra | na tabela | Contagem de linhas na tabela de regras (sessão de rascunho ativa) |

Esses números podem diferir durante edição, sincronização ou importação. O badge do painel corresponde ao total da tabela de regras.

## Editar um servidor

1. Abrir servidor → **Editar**
2. Alterar nome, host, porta ou identidade
3. A conexão SSH é verificada automaticamente ao enviar se os parâmetros de conexão mudaram

A página de edição mostra a impressão digital da chave host armazenada e um aviso **não verificada** quando aplicável — não há botão de teste separado.

## Excluir um servidor

**Zona de perigo** na página de edição ou configurações do servidor:

- Exclui todas as regras locais, rascunhos e snapshots deste servidor
- **Não modifica** o UFW remoto

Confirme apenas se pretende remover dados de gestão, não para limpar regras de firewall remotas.

## Ferramentas da lista de servidores

Na página principal de servidores você pode:

- **Salvar configuração** / **Carregar configuração** — exportação/importação JSON completa (veja [Importar e exportar configuração](../concepts/import-export-config.md))

## Documentação relacionada

- [Servidores e SSH](../concepts/servers-and-ssh.md)
- [Editar e aplicar regras](./edit-and-apply-rules.md)
