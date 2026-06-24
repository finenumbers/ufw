# FAQ

## Geral

**O que é o UFW Remote Manager?**  
Uma interface web auto-hospedada para gerenciar firewalls UFW em servidores Linux remotos via SSH, com fluxo de rascunho/aplicação e registro de auditoria.

**É gratuito?**  
Código aberto com licença MIT. Você fornece a infraestrutura (host Docker, domínio, SSL).

**Quem desenvolveu?**  
[Finenumbers](https://finenumbers.com) — veja [Sobre](./about.md).

## Contas

**Posso criar vários usuários administradores?**  
Não via auto-cadastro. Apenas uma conta é criada em `/setup`; novos cadastros são desabilitados.

**Esqueci minha senha.**  
A redefinição exige acesso ao banco de dados ou restauração a partir de backup. Não há redefinição por e-mail na configuração padrão.

## Implantação

**Preciso de uma imagem Docker própria por domínio?**  
Não. Defina `APP_URL` no `.env` em tempo de execução. Uma imagem GHCR funciona para qualquer domínio HTTPS.

**Isso inclui o Nginx Proxy Manager?**  
Não. O NPM (ou outro proxy reverso) deve ser instalado separadamente.

**Posso executar sem HTTPS?**  
O desenvolvimento local usa `http://localhost:8088`. A produção espera HTTPS para cookies seguros e HSTS.

## Operações de firewall

**Excluir um servidor remove as regras UFW remotas?**  
Não. Apenas os registros locais do banco de dados são excluídos.

**E se a aplicação falhar no meio do caminho?**  
O UFW remoto pode ficar parcialmente atualizado. Use **Ressincronização forçada do servidor** e revise o Histórico de operações. Veja [Fluxo de rascunho e aplicação](./concepts/draft-apply-workflow.md).

**Posso gerenciar servidores em IPs privados?**  
Sim, defina `SSH_ALLOWED_CIDRS` no `.env` para permitir suas faixas internas.

## Dados e segurança

**Onde as chaves SSH são armazenadas?**  
Criptografadas no Postgres com `APP_ENCRYPTION_KEY`. A chave do `.env` é obrigatória para descriptografia.

**A exportação de configuração é segura?**  
A exportação contém **segredos em texto plano**. É necessário informar a senha novamente; guarde as exportações com segurança.

## Suporte

Entre em contato com **[apps@finenumbers.com](mailto:apps@finenumbers.com)** para dúvidas sobre o produto.

Vulnerabilidades de segurança: veja [SECURITY.md](../../SECURITY.md) — não abra issues públicas no GitHub.
