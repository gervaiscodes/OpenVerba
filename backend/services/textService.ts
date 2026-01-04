import db from "../lib/db.js";
import translate from "../lib/translate.js";
import { generateAudioForText } from "../lib/audio.js";
import generate from "../lib/generate.js";

export class TextService {
  static async createText(
    text: string,
    sourceLanguage: string,
    targetLanguage: string,
    userId: number
  ) {
    const { choice: translation, usage } = await translate(
      text,
      sourceLanguage,
      targetLanguage
    );

    // Insert into texts table
    const textStmt = db.prepare(`
      INSERT INTO texts (text, source_language, target_language, prompt_tokens, completion_tokens, total_tokens, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const textResult = textStmt.run(
      text,
      sourceLanguage,
      targetLanguage,
      usage?.prompt_tokens || 0,
      usage?.completion_tokens || 0,
      usage?.total_tokens || 0,
      userId
    );
    const textId = textResult.lastInsertRowid as number;

    // Prepare statements for batch inserts
    const sentenceStmt = db.prepare(`
      INSERT INTO sentences (text_id, order_in_text, source_sentence, target_sentence)
      VALUES (?, ?, ?, ?)
    `);

    const wordInsertStmt = db.prepare(`
      INSERT OR IGNORE INTO words (source_word, target_word, source_language, target_language, user_id)
      VALUES (?, ?, ?, ?, ?)
    `);

    const wordSelectStmt = db.prepare(`
      SELECT id FROM words
      WHERE source_word = ? AND source_language = ? AND target_language = ? AND user_id = ?
    `);

    const sentenceWordStmt = db.prepare(`
      INSERT INTO sentence_words (sentence_id, word_id, order_in_sentence)
      VALUES (?, ?, ?)
    `);

    // Process each sentence
    for (const sentence of translation.sentences) {
      // Insert sentence
      const sentenceResult = sentenceStmt.run(
        textId,
        sentence.id,
        sentence.source_sentence,
        sentence.target_sentence
      );
      const sentenceId = sentenceResult.lastInsertRowid;

      // Process each word in the sentence
      for (const item of sentence.items) {
        // Insert word (or ignore if exists)
        wordInsertStmt.run(
          item.source.toLowerCase(),
          item.target.toLowerCase(),
          sourceLanguage,
          targetLanguage,
          userId
        );

        // Get word ID
        const wordRow = wordSelectStmt.get(
          item.source.toLowerCase(),
          sourceLanguage,
          targetLanguage,
          userId
        ) as { id: number } | undefined;

        if (wordRow) {
          // Link word to sentence
          sentenceWordStmt.run(sentenceId, wordRow.id, item.order);
        }
      }
    }

    // Update status to 'processing'
    db.prepare("UPDATE texts SET audio_status = ? WHERE id = ?").run(
      "processing",
      textId
    );

    // Trigger audio generation in background (truly async)
    setImmediate(async () => {
      try {
        await generateAudioForText(db, textId, sourceLanguage);
        // Update status to 'completed'
        db.prepare("UPDATE texts SET audio_status = ? WHERE id = ?").run(
          "completed",
          textId
        );
      } catch (err) {
        console.error("Background audio generation failed:", err);
        // Update status to 'failed'
        db.prepare("UPDATE texts SET audio_status = ? WHERE id = ?").run(
          "failed",
          textId
        );
      }
    });

    return {
      id: textId,
      translation,
      usage,
      audio_status: "processing",
    };
  }

  static async generateText(
    sourceLanguage: string,
    newWordsPercentage: number,
    numberOfSentences: number = 4,
    userId: number
  ) {
    const wordsStmt = db.prepare(`
      SELECT source_word FROM words
      WHERE source_language = ? AND user_id = ?
    `);
    const words = wordsStmt.all(sourceLanguage, userId) as Array<{
      source_word: string;
    }>;
    const knownWords = words.map((w) => w.source_word);

    return await generate(knownWords, newWordsPercentage, sourceLanguage, numberOfSentences);
  }

  static getAllTexts(userId: number) {
    const textsStmt = db.prepare(
      "SELECT * FROM texts WHERE user_id = ? ORDER BY created_at DESC"
    );
    const texts = textsStmt.all(userId) as Array<{
      id: number;
      text: string;
      source_language: string;
      target_language: string;
      created_at: string;
    }>;

    // Prepare statements for fetching related data
    const sentencesStmt = db.prepare(`
      SELECT id, order_in_text, source_sentence, target_sentence, audio_url
      FROM sentences
      WHERE text_id = ?
      ORDER BY order_in_text
    `);

    const wordsStmt = db.prepare(`
      SELECT w.source_word, w.target_word, sw.order_in_sentence
      FROM sentence_words sw
      JOIN words w ON sw.word_id = w.id
      WHERE sw.sentence_id = ?
      ORDER BY sw.order_in_sentence
    `);

    // Reconstruct translation data for each text
    return texts.map((text) => {
      const sentences = sentencesStmt.all(text.id) as Array<{
        id: number;
        order_in_text: number;
        source_sentence: string;
        target_sentence: string;
        audio_url: string | null;
      }>;

      const translationData = {
        source_language: text.source_language,
        target_language: text.target_language,
        original_text: text.text,
        sentences: sentences.map((sentence) => {
          const words = wordsStmt.all(sentence.id) as Array<{
            source_word: string;
            target_word: string;
            order_in_sentence: number;
          }>;

          return {
            id: sentence.order_in_text,
            source_sentence: sentence.source_sentence,
            target_sentence: sentence.target_sentence,
            audio_url: sentence.audio_url,
            items: words.map((word) => ({
              order: word.order_in_sentence,
              source: word.source_word,
              target: word.target_word,
            })),
          };
        }),
      };

      return {
        id: text.id,
        text: text.text,
        source_language: text.source_language,
        target_language: text.target_language,
        translation_data: JSON.stringify(translationData),
        created_at: text.created_at,
      };
    });
  }

  static getTextById(id: string, userId: number) {
    const textStmt = db.prepare("SELECT * FROM texts WHERE id = ? AND user_id = ?");
    const text = textStmt.get(id, userId) as
      | {
          id: number;
          text: string;
          source_language: string;
          target_language: string;
          prompt_tokens: number;
          completion_tokens: number;
          total_tokens: number;
          created_at: string;
        }
      | undefined;

    if (!text) {
      return null;
    }

    // Get sentences for this text
    const sentencesStmt = db.prepare(`
      SELECT id, order_in_text, source_sentence, target_sentence, audio_url
      FROM sentences
      WHERE text_id = ?
      ORDER BY order_in_text
    `);
    const sentences = sentencesStmt.all(id) as Array<{
      id: number;
      order_in_text: number;
      source_sentence: string;
      target_sentence: string;
      audio_url: string | null;
    }>;

    // Get words for each sentence
    const wordsStmt = db.prepare(`
      SELECT w.id, w.source_word, w.target_word, w.audio_url, sw.order_in_sentence,
      (SELECT COUNT(*) FROM sentence_words sw2 WHERE sw2.word_id = w.id) as occurrence_count
      FROM sentence_words sw
      JOIN words w ON sw.word_id = w.id
      WHERE sw.sentence_id = ?
      ORDER BY sw.order_in_sentence
    `);

    const translationData = {
      source_language: text.source_language,
      target_language: text.target_language,
      original_text: text.text,
      sentences: sentences.map((sentence) => {
        const words = wordsStmt.all(sentence.id) as Array<{
          id: number;
          source_word: string;
          target_word: string;
          audio_url: string | null;
          order_in_sentence: number;
          occurrence_count: number;
        }>;

        return {
          id: sentence.order_in_text,
          source_sentence: sentence.source_sentence,
          target_sentence: sentence.target_sentence,
          audio_url: sentence.audio_url,
          items: words.map((word) => ({
            id: word.id,
            order: word.order_in_sentence,
            source: word.source_word,
            target: word.target_word,
            audio_url: word.audio_url,
            occurrence_count: word.occurrence_count,
          })),
        };
      }),
    };

    return {
      id: text.id,
      text: text.text,
      source_language: text.source_language,
      target_language: text.target_language,
      translation_data: JSON.stringify(translationData),
      usage: {
        prompt_tokens: text.prompt_tokens,
        completion_tokens: text.completion_tokens,
        total_tokens: text.total_tokens,
      },
      created_at: text.created_at,
    };
  }

  static deleteText(id: string, userId: number) {
    const textExists = db.prepare("SELECT id FROM texts WHERE id = ? AND user_id = ?").get(id, userId);
    if (!textExists) {
      return false;
    }

    const deleteTransaction = db.transaction(() => {
      // Delete cascade: sentence_words -> sentences -> texts
      const sentences = db
        .prepare("SELECT id FROM sentences WHERE text_id = ?")
        .all(id) as Array<{ id: number }>;
      const sentenceIds = sentences.map((s) => s.id);

      if (sentenceIds.length > 0) {
        const placeholders = sentenceIds.map(() => "?").join(",");
        db.prepare(
          `DELETE FROM sentence_words WHERE sentence_id IN (${placeholders})`
        ).run(...sentenceIds);
      }

      db.prepare("DELETE FROM sentences WHERE text_id = ?").run(id);
      db.prepare("DELETE FROM texts WHERE id = ?").run(id);
    });

    deleteTransaction();
    return true;
  }

  static getAudioStatus(id: string, userId: number): string | null {
    const result = db
      .prepare("SELECT audio_status FROM texts WHERE id = ? AND user_id = ?")
      .get(id, userId) as { audio_status: string } | undefined;

    return result?.audio_status || null;
  }
}
