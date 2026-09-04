# Bahrem Burger & Grill — Fila Pro 3.4.1

## Novidades da 3.4.1
- Cliente recebe token individual para acompanhar a senha.
- A senha é salva no navegador e pode ser recuperada após atualizar/fechar e reabrir a página.
- Página inicial mostra “Acompanhar minha senha” quando existe um atendimento salvo no aparelho.
- Página da senha mostra posição atual, quantidade de senhas à frente e total da categoria.
- Quando a posição chega a 1, aparece “VOCÊ É O PRÓXIMO A SER CHAMADO!”.
- A posição é recalculada no servidor e respeita prioridade + ordem de chegada dentro da categoria.
- Atualização automática a cada 2 segundos.
- Comprovante/QR Code individual continua disponível.
- Administração de usuários e bootstrap de credenciais continuam incluídos.
- Banco existente é preservado; as migrações necessárias são executadas na inicialização.

## Observação sobre a posição
O painel administrativo chama clientes por categoria (2–3, 4–5, 6–7 e 10+). Por isso a tela do cliente informa a posição dentro da sua categoria. Quando a posição é 1, a mensagem “Você é o próximo a ser chamado” é verdadeira para a próxima chamada daquela categoria.

## Railway
Variáveis mínimas:
- DATABASE_URL
- JWT_SECRET
- ADMIN_USER
- ADMIN_PASSWORD
- PUBLIC_URL (opcional, recomendado para o QR Code)
- ADMIN_BOOTSTRAP=true somente durante a recuperação de uma credencial existente; depois remova ou mude para false.
