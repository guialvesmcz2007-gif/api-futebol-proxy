import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_FOOTBALL_KEY;

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    endpoint: "/api/matches",
    message: "Configure API_FOOTBALL_KEY nas variáveis de ambiente do servidor."
  });
});

app.get("/api/matches", async (req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ error: "Falta configurar API_FOOTBALL_KEY no servidor." });
  }

  const date = /^\d{4}-\d{2}-\d{2}$/.test(req.query.date || "")
    ? req.query.date
    : new Date().toISOString().slice(0, 10);

  try {
    const base = "https://apiv3.apifootball.com/";
    const eventsUrl = new URL(base);
    eventsUrl.searchParams.set("action", "get_events");
    eventsUrl.searchParams.set("from", date);
    eventsUrl.searchParams.set("to", date);
    eventsUrl.searchParams.set("APIkey", API_KEY);

    const oddsUrl = new URL(base);
    oddsUrl.searchParams.set("action", "get_odds");
    oddsUrl.searchParams.set("from", date);
    oddsUrl.searchParams.set("to", date);
    oddsUrl.searchParams.set("APIkey", API_KEY);

    const [eventsResponse, oddsResponse] = await Promise.all([
      fetch(eventsUrl),
      fetch(oddsUrl)
    ]);

    if (!eventsResponse.ok || !oddsResponse.ok) {
      return res.status(502).json({ error: "A API de futebol não respondeu corretamente." });
    }

    const [eventsData, oddsData] = await Promise.all([
      eventsResponse.json(),
      oddsResponse.json()
    ]);

    const events = Array.isArray(eventsData) ? eventsData : [];
    const oddsRows = Array.isArray(oddsData) ? oddsData : [];

    const matches = events.map((event) => {
      const rows = oddsRows.filter((odd) => String(odd.match_id) === String(event.match_id));
      const first = rows[0] || {};
      const outcomes = [];
      const add = (label, value) => {
        const n = Number(value);
        if (value !== undefined && value !== null && value !== "" && Number.isFinite(n) && n > 1) {
          outcomes.push({ label, odds: n });
        }
      };

      // Odds principais 1X2
      add(event.match_hometeam_name || "Casa", first.odd_1);
      add("Empate", first.odd_x);
      add(event.match_awayteam_name || "Fora", first.odd_2);

      const markets = [];
      if (outcomes.length) {
        markets.push({ name: "Resultado da partida", outcomes });
      }

      // Alguns planos retornam linhas de gols. Inclui as que estiverem disponíveis.
      const goalOutcomes = [];
      for (const odd of rows) {
        for (const [key, value] of Object.entries(odd)) {
          const match = key.match(/^odd_(over|under)_(\d+(?:\.\d+)?)$/i);
          if (match) addGoal(goalOutcomes, `${match[1].toLowerCase() === "over" ? "Mais de" : "Menos de"} ${match[2]}`, value);
        }
      }
      function unused() {}
      if (goalOutcomes.length) markets.push({ name: "Gols", outcomes: goalOutcomes });

      return {
        league: event.league_name || event.country_name || "Futebol",
        home: event.match_hometeam_name || "Time da casa",
        away: event.match_awayteam_name || "Time visitante",
        time: [event.match_date, event.match_time].filter(Boolean).join(" "),
        markets
      };
    }).filter(m => m.home && m.away);

    res.setHeader("Cache-Control", "no-store");
    return res.json({ matches });
  } catch (err) {
    return res.status(502).json({ error: "Falha ao consultar a API de futebol.", detail: String(err) });
  }
});

function addGoal(list, label, value) {
  const n = Number(value);
  if (value !== undefined && value !== null && value !== "" && Number.isFinite(n) && n > 1) {
    list.push({ label, odds: n });
  }
}

app.listen(PORT, () => console.log(`API proxy listening on ${PORT}`));
