PROXY PARA O CONECTOR DO SITE — API DE FUTEBOL

O que faz:
- Cria um endpoint /api/matches no formato { "matches": [...] }.
- Consulta jogos e odds da API-Football.
- Ativa CORS para o site conseguir consultar pelo navegador.
- Mantém a chave da API no servidor, não no campo público do site.

IMPORTANTE:
Você precisa de uma chave válida da API-Football e precisa publicar este projeto em um serviço de hospedagem. Este ZIP NÃO é, por si só, um endereço HTTPS público.

COMO PUBLICAR NO RENDER:
1. Descompacte este ZIP e envie os arquivos para um repositório GitHub.
2. No Render, crie um Web Service conectado a esse repositório.
3. Build Command: npm install
4. Start Command: npm start
5. Em Environment Variables, adicione:
   API_FOOTBALL_KEY = sua chave da API-Football
6. Depois de publicar, copie a URL HTTPS criada pelo Render e acrescente:
   /api/matches
7. Cole esse endereço completo no campo Endpoint JSON do seu site.

Exemplo de formato final (a URL real será a que o Render fornecer):
https://SEU-SERVICO.onrender.com/api/matches

Para testar uma data específica:
https://SEU-SERVICO.onrender.com/api/matches?date=2026-10-22

A disponibilidade de odds depende da sua assinatura/cobertura da API-Football. O conector pode mostrar jogos sem mercados se a API não devolver odds para eles. O endpoint transforma as odds 1X2 e algumas linhas de gols quando disponíveis; não garante mercados de escanteios/cartões se o provedor não os retornar neste endpoint.
