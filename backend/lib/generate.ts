import OpenAI from "openai";

const PROMPT = `You are a language teacher creating reading material for a student.

Your task is to generate a short text (about {NUM_SENTENCES} sentences) in {SOURCE_LANG}.

The student knows the following words:
{KNOWN_WORDS}

Constraints:
1. The text must be in {SOURCE_LANG}.
2. Approximately {PERCENTAGE}% of the words in the text should be NEW words (words NOT in the list above).
3. The remaining {REMAINING_PERCENTAGE}% should be words from the known list.
4. The text should be coherent and grammatically correct.
5. Return ONLY the generated text. No translations, no explanations, no markdown.

Generate the text now.`;

const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  throw new Error("OPENAI_API_KEY is not defined");
}

const client = new OpenAI({ apiKey: API_KEY });

export default async function generate(
  knownWords: string[],
  newWordsPercentage: number,
  sourceLanguage: string,
  numberOfSentences: number = 4
) {
  // If known words list is too long, we might hit token limits.
  // For now, let's take a random sample if it's huge, or just the most frequent ones if we had that info.
  // Assuming the list passed in is manageable or we truncate it.
  const truncatedWords = knownWords.slice(0, 500); // Limit to 500 words to be safe

  const filled = PROMPT.replaceAll("{SOURCE_LANG}", sourceLanguage)
    .replaceAll("{KNOWN_WORDS}", truncatedWords.join(", "))
    .replaceAll("{PERCENTAGE}", newWordsPercentage.toString())
    .replaceAll(
      "{REMAINING_PERCENTAGE}",
      (100 - newWordsPercentage).toString()
    )
    .replaceAll("{NUM_SENTENCES}", numberOfSentences.toString());

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a helpful language teacher.",
      },
      { role: "user", content: filled },
    ],
    temperature: 0.7, // Slightly higher temperature for creativity
  });

  const content = completion.choices[0]?.message?.content || "";
  return content.trim();
}
