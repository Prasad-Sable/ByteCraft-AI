import OpenAI from 'openai';

const apiKey = process.env.GEMINI_API_KEY || '';

const client = new OpenAI({
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  apiKey,
});

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

/**
 * Generates a structured micro-lesson with interactive quiz questions.
 *
 * @param {string} topic - Subject matter
 * @param {string} difficulty - Target complexity tier
 * @param {number} duration - Target completion time in minutes
 * @returns {Promise<Object|null>} Structured lesson object
 */
export async function generateLessonViaLLM(topic, difficulty, duration) {
  const prompt = `
Create a structured ${duration}-minute lesson on "${topic}" targeted at a ${difficulty} level.

Format instructions:
- Use clean Markdown with headers (## and ###) and bulleted takeaways.
- Include exactly 3 multiple-choice questions testing key concepts from the content.
- Return strictly valid JSON matching this schema:
{
  "title": "string",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "duration": ${duration},
  "content": "string (markdown content)",
  "quiz": [
    {
      "question": "string",
      "options": [{"text": "string"}, {"text": "string"}, {"text": "string"}, {"text": "string"}],
      "answer_index": 0,
      "explanation": "string"
    }
  ]
}
`;

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are an educational curriculum designer. Output raw JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return null;

    const cleaned = raw
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '');

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Error generating lesson content:', error);
    return null;
  }
}

/**
 * Evaluates submitted quiz answers against lesson context and returns score metrics.
 *
 * @param {Object} lesson - Lesson document
 * @param {Array<{question_index: number, selected_option: number}>} userAnswers - User submissions
 * @returns {Promise<Object|null>} Performance evaluation
 */
export async function evaluateQuizViaLLM(lesson, userAnswers) {
  const quiz = lesson.quiz || [];
  let questionsContext = '';

  quiz.forEach((q, i) => {
    const submission = userAnswers.find(a => a.question_index === i);
    const selectedIdx = submission ? submission.selected_option : -1;
    const selectedText = (selectedIdx >= 0 && selectedIdx < q.options.length)
      ? q.options[selectedIdx].text
      : 'Unanswered';
    const correctText = q.options[q.answer_index]?.text || 'N/A';

    questionsContext += `Q${i + 1}: ${q.question}\nSelected: ${selectedText}\nCorrect: ${correctText}\n\n`;
  });

  const prompt = `
Evaluate the following quiz attempt for the lesson "${lesson.title}" (${lesson.topic}):

${questionsContext}

Return strictly a valid JSON object:
{
  "score_percentage": 0-100,
  "total_correct": number,
  "total_questions": number,
  "feedback": "1-2 sentences of encouraging, actionable feedback based on incorrect answers."
}
`;

  try {
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        { role: 'system', content: 'You are an assessment evaluator. Output raw JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content?.trim();
    if (!raw) return null;

    const cleaned = raw
      .replace(/^```json\s*/, '')
      .replace(/^```\s*/, '')
      .replace(/\s*```$/, '');

    return JSON.parse(cleaned);
  } catch (error) {
    console.error('Error evaluating quiz submission:', error);
    return null;
  }
}
