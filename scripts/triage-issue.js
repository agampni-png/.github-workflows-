const fs = require("fs");

const titre = process.env.ISSUE_TITRE || "";
const corps = (process.env.ISSUE_CORPS || "").slice(0, 4000);
const apiKey = process.env.OPENAI_API_KEY;

const labelsAutorises = ["bug", "feature", "documentation"];

async function main() {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Tu classes une issue GitHub. Réponds uniquement en JSON. " +
            "Le champ label doit être exactement bug, feature ou documentation."
        },
        {
          role: "user",
          content:
            `###DEBUT_DONNEES###\nTitre: ${titre}\nCorps: ${corps}\n###FIN_DONNEES###`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0
    })
  });

  if (!response.ok) {
    const erreur = await response.text();
    throw new Error(`Erreur API OpenAI : ${erreur}`);
  }

  const data = await response.json();
  const resultat = JSON.parse(data.choices[0].message.content);

  let label = resultat.label;

  if (!labelsAutorises.includes(label)) {
    console.log(`Label refuse : ${label}`);
    label = "";
  }

  console.log(`Label choisi : ${label || "aucun"}`);

  fs.appendFileSync(
    process.env.GITHUB_OUTPUT,
    `label=${label}\n`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
