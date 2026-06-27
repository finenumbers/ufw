# Gerenciar servidores

Este guia percorre o ciclo de vida do servidor: adicionar, configurar UFW, atualizar, editar e excluir.

## Pré-requisitos

Crie pelo menos uma [identidade SSH](../concepts/ssh-identities.md) antes de adicionar um servidor.

## Adicionar um servidor

1. Barra lateral → **Servidores** ou clique em **Adicionar servidor**
2. Preencha nome, host, porta e selecione uma identidade
3. Clique em **Criar servidor** — o teste SSH é executado automaticamente
4. Em caso de sucesso, você chega ao painel do servidor

Se o teste SSH falhar, verifique acessibilidade do host, credenciais, firewall permitindo SSH do host Docker e [validação de host](../concepts/servers-and-ssh.md).

## Painel do servidor

O painel carrega o **estado UFW em cache** do último snapshot Postgres — sem SSH na primeira renderização. Isso mantém a página rápida.

| Status | Ações disponíveis |
|--------|-------------------|
| UFW não instalado | **Instalar UFW** |
| Instalado mas inativo | **Ativar UFW** |
| Instalado e ativo | **Regras**, atualizar, teste SSH |

Use **Atualizar** para obter o último estado UFW via SSH e sincronizar a tabela de regras.

Se o UFW estiver ativo mas o app **ainda não tiver snapshot** (primeira visita após ativação), uma sincronização automática em segundo plano é executada uma vez para preencher o cache.

## Editar um servidor

1. Abrir servidor → **Editar**
2. Alterar nome, host, porta ou identidade
3. Teste SSH necessário antes de salvar se os parâmetros de conexão mudaram

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
