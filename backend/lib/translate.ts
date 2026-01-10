import OpenAI from "openai";

const PROMPT = `You are a helper for a language-learning app.

Your input will always be:

1. text - a continuous (possibly multi-line) text in {SOURCE_LANG}.
2. source_language - the language the text is written in.
3. target_language - the language to translate the text into.

Your job:

1. Split the input text into sentences in the source language, keeping punctuation and line breaks.
2. For each sentence, produce a natural translation into the target language.
3. Split each source sentence into teaching units (usually single words). Keep punctuation as separate items.
4. For every source unit, find its most direct equivalent in the target language in isolation from the rest of the sentence:
    - For example from polish to french: "mam" => "j'ai", "w" => "dans"
    - The order is not necessarly the same as the words in the translated sentence
    - Find a translation for all units even if the word is not used in itself in the source language
    - Translate the word by iteself, ignore the rest of the sentence and the context
    - If the word has multiple meanings, you are allowed to use the context to choose between the meanings
5. Output only valid JSON — no markdown, no explanations, no comments.

JSON structure to output:

{
  "source_language": "<SOURCE_LANG>",
  "target_language": "<TARGET_LANG>",
  "original_text": "<the full multi-line input text exactly as received>",
  "sentences": [
    {
      "id": 1,
      "source_sentence": "<sentence in SOURCE_LANG>",
      "target_sentence": "<sentence translated to TARGET_LANG>",
      "items": [
        { "order": 1, "source": "<word or chunk in SOURCE_LANG>", "target": "<closest translation in TARGET_LANG>" }
      ]
    }
  ]
}

Rules:
- Return valid UTF-8 JSON with double quotes and no trailing commas.
- Include punctuation as separate items:
  { "order": X, "source": ".", "target": "." }
- Number sentences in order, starting at 1.
- Do not output anything except the JSON.

Now process this input:

text:
"""
{TEXT}
"""
source_language: {SOURCE_LANG}
target_language: {TARGET_LANG}

Return only the JSON.`;

const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  throw new Error("OPENAI_API_KEY is not defined");
}

const client = new OpenAI({ apiKey: API_KEY });

export default async function translate(
  text: string,
  sourceLanguage: string,
  tagetLanguage: string
) {
  const filled = PROMPT.replaceAll("{TEXT}", text)
    .replaceAll("{SOURCE_LANG}", sourceLanguage)
    .replaceAll("{TARGET_LANG}", tagetLanguage);

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You return only valid JSON. No markdown or commentary.",
      },
      { role: "user", content: filled },
    ],
    temperature: 0.2,
  });

  const content = completion.choices[0]?.message?.content || "";
  // Some models may surround with backticks; try to parse safely
  const trimmed = content.trim().replace(/^```(?:json)?\n?|```$/g, "");
  const json = JSON.parse(trimmed);

  return {
    choice: json,
    usage: completion.usage,
  };
}
