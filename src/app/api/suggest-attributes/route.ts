import { NextResponse } from "next/server";
import { z } from "zod";

const suggestSchema = z.object({
  title: z.string().default(""),
  description: z.string().default(""),
  category: z.string().default("")
});

type Suggestion = {
  keywords: string[];
  attributes: Record<string, string>;
};

function uniqueWords(values: string[]) {
  return Array.from(new Set(values.map((item) => item.trim().toLowerCase()).filter(Boolean))).slice(0, 12);
}

function localSuggestion(title: string, description: string, category: string): Suggestion {
  const text = `${title} ${description} ${category}`.toLowerCase();
  const keywords = uniqueWords([
    category,
    ...title.split(/\s+/).filter((word) => word.length > 3)
  ]);
  const attributes: Record<string, string> = {};

  if (/chasis|case|gabinete|tower/.test(text)) {
    attributes["Factor de forma"] = /micro/.test(text) ? "Micro ATX" : /mini/.test(text) ? "Mini ITX" : "ATX";
    attributes["Tipo"] = "Chasis de computadora";
  }

  if (/telefono|celular|iphone|samsung|xiaomi|android|smartphone/.test(text)) {
    attributes["Pantalla"] = text.match(/(\d(?:[.,]\d)?)\s?(?:\"|pulg|inch)/)?.[1]?.replace(",", ".") || "";
    attributes["RAM"] = text.match(/(\d+)\s?gb\s?(?:ram)?/)?.[1] ? `${text.match(/(\d+)\s?gb\s?(?:ram)?/)?.[1]} GB` : "";
    attributes["Tipo"] = "Telefono";
  }

  if (/laptop|computadora|pc|desktop|ordenador/.test(text)) {
    attributes["Tipo"] = /laptop/.test(text) ? "Laptop" : "Computadora";
    attributes["RAM"] = text.match(/(\d+)\s?gb\s?(?:ram)?/)?.[1] ? `${text.match(/(\d+)\s?gb\s?(?:ram)?/)?.[1]} GB` : "";
    attributes["Almacenamiento"] = text.match(/(\d+)\s?(?:tb|gb)\s?(?:ssd|hdd|nvme)?/)?.[0]?.toUpperCase() || "";
  }

  if (/ecoflow|bateria|energia|power|solar|estacion/.test(text)) {
    attributes["Tipo"] = "Energia portatil";
    attributes["Capacidad"] = text.match(/(\d+)\s?wh/)?.[0]?.toUpperCase() || "";
    attributes["Uso"] = /solar/.test(text) ? "Solar" : "Respaldo";
  }

  Object.keys(attributes).forEach((key) => {
    if (!attributes[key]) delete attributes[key];
  });

  return { keywords, attributes };
}

function readGeminiJson(text: string): Suggestion | null {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]) as Partial<Suggestion>;
    return {
      keywords: Array.isArray(parsed.keywords) ? uniqueWords(parsed.keywords.map(String)) : [],
      attributes: parsed.attributes && typeof parsed.attributes === "object" && !Array.isArray(parsed.attributes)
        ? Object.fromEntries(Object.entries(parsed.attributes).map(([key, value]) => [key, String(value)]))
        : {}
    };
  } catch {
    return null;
  }
}

async function geminiSuggestion(title: string, description: string, category: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Devuelve solo JSON valido con esta forma: {"keywords":["..."],"attributes":{"Campo":"Valor"}}. Sugiere palabras clave y atributos filtrables para este producto. Titulo: ${title}. Categoria: ${category}. Descripcion: ${description}`
        }]
      }],
      generationConfig: { responseMimeType: "application/json" }
    })
  });

  if (!response.ok) return null;
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === "string" ? readGeminiJson(text) : null;
}

export async function POST(request: Request) {
  try {
    const body = suggestSchema.parse(await request.json());
    const aiSuggestion = await geminiSuggestion(body.title, body.description, body.category);
    return NextResponse.json(aiSuggestion || localSuggestion(body.title, body.description, body.category));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No se pudieron sugerir atributos" },
      { status: 400 }
    );
  }
}
