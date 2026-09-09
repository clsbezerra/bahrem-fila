# Bahrem Fila Pro — v3.7

Atualização para operação em monitor de 24"/Full HD e publicidade nas páginas dos clientes.

## Alterações
- Monitor usa a altura real da tela (`100dvh`) e não cria rolagem em tela cheia/F11.
- Monitor mantém visíveis: última chamada, publicidade, filas por categoria, últimas 3 chamadas e rodapé.
- Categoria **8+ pessoas** substitui **10+**.
- Banco migra automaticamente tickets antigos da categoria `10` para `8` e atualiza a restrição.
- Página inicial do cliente exibe a publicidade configurada.
- Página individual da senha também exibe a publicidade configurada.
- Player aceita YouTube, YouTube Shorts, Vimeo e arquivos MP4/WebM/OGG.
- Vídeo tenta iniciar automaticamente sem som; se o navegador bloquear, aparece botão para iniciar.

## Deploy
Substitua os arquivos pelo conteúdo desta versão e faça um novo deploy no Railway.
Depois, no navegador do monitor, abra `/display.html` e use Ctrl+F5. Pressione F11 para tela cheia.

## Publicidade
No painel Restaurante, informe o link público do vídeo e salve. O monitor e as páginas do cliente consultam `/api/config` automaticamente.
