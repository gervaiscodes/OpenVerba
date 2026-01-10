import { PollyClient, SynthesizeSpeechCommand } from "@aws-sdk/client-polly";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Database } from "better-sqlite3";

const polly = new PollyClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const AUDIO_DIR = path.join(process.cwd(), "public", "audio");

// Ensure directory exists
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

function mapLanguageCode(code: string): string {
  const map: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
    pt: "pt-BR",
    pl: "pl-PL",
    nl: "nl-NL",
  };
  return map[code] || "en-US";
}

export async function generateAudio(
  text: string,
  languageCode: string
): Promise<string | null> {
  try {
    let voiceId = "Joanna"; // Default US English
    if (languageCode.startsWith("en")) voiceId = "Joanna";
    else if (languageCode.startsWith("es")) voiceId = "Lucia";
    else if (languageCode.startsWith("fr")) voiceId = "Lea";
    else if (languageCode.startsWith("de")) voiceId = "Vicki";
    else if (languageCode.startsWith("it")) voiceId = "Bianca";
    else if (languageCode.startsWith("pt")) voiceId = "Camila";
    else if (languageCode.startsWith("pl")) voiceId = "Ola";
    else if (languageCode.startsWith("nl")) voiceId = "Lotte";

    // Check if file already exists (hash of text + voice)
    const hash = crypto
      .createHash("md5")
      .update(`${text}-${voiceId}`)
      .digest("hex");
    const filename = `${hash}.mp3`;
    const filePath = path.join(AUDIO_DIR, filename);

    if (fs.existsSync(filePath)) {
      return `/audio/${filename}`;
    }

    const command = new SynthesizeSpeechCommand({
      Text: text,
      OutputFormat: "mp3",
      VoiceId: voiceId as any,
      LanguageCode: mapLanguageCode(languageCode) as any,
      Engine: "neural",
    });

    const response = await polly.send(command);
    if (response.AudioStream) {
      const buffer = await response.AudioStream.transformToByteArray();
      fs.writeFileSync(filePath, Buffer.from(buffer));
      return `/audio/${filename}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating audio:", error);
    return null;
  }
}

export async function generateAudioForText(
  db: Database,
  textId: number,
  languageToLearn: string
) {
  console.log(`Starting audio generation for text ${textId}...`);

  // Get all sentences
  const sentences = db
    .prepare("SELECT id, source_sentence FROM sentences WHERE text_id = ?")
    .all(textId) as { id: number; source_sentence: string }[];

  for (const sentence of sentences) {
    const audioUrl = await generateAudio(sentence.source_sentence, languageToLearn);
    if (audioUrl) {
      db.prepare("UPDATE sentences SET audio_url = ? WHERE id = ?").run(
        audioUrl,
        sentence.id
      );
    }
  }

  // Get all words associated with this text that don't have audio yet
  const words = db
    .prepare(
      `
        SELECT DISTINCT w.id, w.source_word
        FROM words w
        JOIN sentence_words sw ON w.id = sw.word_id
        JOIN sentences s ON sw.sentence_id = s.id
        WHERE s.text_id = ? AND w.audio_url IS NULL
    `
    )
    .all(textId) as { id: number; source_word: string }[];

  for (const word of words) {
    // Skip punctuation-only words
    if (/^[\p{P}\p{S}]+$/u.test(word.source_word)) continue;

    const audioUrl = await generateAudio(word.source_word, languageToLearn);
    if (audioUrl) {
      db.prepare("UPDATE words SET audio_url = ? WHERE id = ?").run(
        audioUrl,
        word.id
      );
    }
  }

  console.log(`Finished audio generation for text ${textId}`);
}
