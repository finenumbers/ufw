# Gerenciar servidores

Este guia percorre o ciclo de vida do servidor: adicionar, configurar UFW, atualizar status, editar e excluir.

## Pré-requisitos

Crie pelo menos uma [identidade SSH](../concepts/ssh-identities.md) antes de adicionar um servidor.

## Adicionar um servidor

1. Barra lateral → **Servidores** ou clique em **Adicionar servidor**
2. Preencha nome, host, porta e selecione uma identidade
3. Clique em **Criar servidor** — o teste SSH roda automaticamente
4. Em caso de sucesso, você chega ao painel do servidor

Se o teste SSH falhar, verifique alcance do host, credenciais, firewall permitindo SSH do host Docker e [validação de host](../concepts/servers-and-ssh.md).

## Painel do servidor

O painel mostra o status do UFW:

| Status | Ações disponíveis |
|--------|-------------------|
| UFW não instalado | **Instalar UFW** |
| Instalado, mas inativo | Ativar UFW |
| Instalado e ativo | **Regras**, Atualizar status, Testar SSH |

Use **Atualizar status** para obter o estado UFW mais recente e sincronizar a tabela de regras.

## Editar um servidor

1. Abra o servidor → **Editar servidor**
2. Altere nome, host, porta ou identidade
3. Teste SSH obrigatório antes de salvar se os parâmetros de conexão mudaram

## Excluir um servidor

**Zona de perigo** na página de edição ou configurações do servidor:

- Exclui todas as regras locais, rascunhos e snapshots deste servidor
- **Não** modifica o UFW remoto

Confirme somente se pretende remover dados de gerenciamento, não para limpar regras de firewall remotas.

## Ferramentas da lista de servidores

Na página principal de servidores você pode:

- **Salvar configuração** / **Carregar configuração** — exportação/importação JSON completa (veja [Importar e exportar configuração](../concepts/import-export-config.md))

## Documentação relacionada

- [Servidores e SSH](../concepts/servers-and-ssh.md)
- [Editar e aplicar regras](./edit-and-apply-rules.md)
