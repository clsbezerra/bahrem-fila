# Bahrem Burger & Grill — Fila Pro

## Incluído
- Aplicativo web do cliente.
- Categorias 2–3, 4–5, 6–7 e 10+.
- Quantidade exata para 10+.
- Atendimento preferencial para 60+ e pessoa com deficiência/necessidade especial.
- Banco PostgreSQL permanente.
- Login administrativo.
- Painel do restaurante.
- Chamada por categoria.
- Ordem de prioridade: preferenciais primeiro dentro da categoria; entre pessoas do mesmo status, vale a ordem de chegada.
- Monitor/TV com última senha e últimas 3 chamadas.
- Tempo decorrido atualizado a cada segundo.
- Alerta sonoro no monitor após interação inicial.
- QR Code fixo gerado pelo servidor.
- Docker Compose para executar app + PostgreSQL.
- Página de QR Code pronta para impressão.

## Rodar localmente com Docker
1. Instale Docker Desktop.
2. Copie `.env.example` para `.env` se quiser.
3. Ajuste `JWT_SECRET`, `ADMIN_USER`, `ADMIN_PASSWORD` e `PUBLIC_URL`.
4. Execute `docker compose up --build`.
5. Cliente: http://localhost:3000/
6. Admin: http://localhost:3000/admin.html
7. Monitor: http://localhost:3000/display.html
8. QR Code: http://localhost:3000/qr.html

## Credenciais iniciais
Definidas por `ADMIN_USER` e `ADMIN_PASSWORD`. Troque a senha antes de colocar na internet.

## Publicação
O projeto está preparado para hospedagem que suporte Node.js + PostgreSQL e WebSocket. Em produção, use HTTPS e configure `DATABASE_URL`, `JWT_SECRET` e `PUBLIC_URL` com os valores do servidor.

## Voz
A versão atual usa alerta sonoro no monitor. A chamada por voz pode ser adicionada com SpeechSynthesis do navegador, sem serviço externo, caso desejado.

## Observação
O sistema apenas registra o status informado pelo cliente. A administração do estabelecimento deve validar a utilização da prioridade conforme a legislação e as regras internas aplicáveis.
