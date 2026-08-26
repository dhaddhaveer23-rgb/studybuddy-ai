import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { title, source_content, file_url, grade_level, subject, material_types } = body;
    const types = material_types && material_types.length
      ? material_types
      : ['simple_notes', 'detailed_notes', 'revision_sheet', 'flashcards', 'mcqs', 'true_false', 'practice_test'];

    const material = await base44.entities.StudyMaterial.create({
      title: title || 'Untitled Material',
      source_type: file_url ? 'file' : 'text',
      source_content: source_content || '',
      file_url: file_url || '',
      grade_level: grade_level || 'High School',
      subject: subject || 'General',
      status: 'processing',
      generated_types: types,
      simple_notes: '', detailed_notes: '', revision_sheet: '',
      flashcards: [], mcqs: [], true_false: [], practice_test: [], topics: [],
      times_studied: 0
    });

    const prompt = `You are an expert study coach. A student in grade "${grade_level || 'High School'}" uploaded study material. Turn it into premium study resources tailored to their level.

MATERIAL:
${source_content ? source_content.slice(0, 12000) : '(see attached file — read its contents)'}

Generate these resources: ${types.join(', ')}.
- simple_notes: concise, clear markdown summary of key points.
- detailed_notes: thorough markdown explanation with headings, examples, and sub-points.
- revision_sheet: a single-page dense revision sheet in markdown (bullet style, exam-ready).
- flashcards: 8-15 concise Q/A pairs (front = question, back = answer).
- mcqs: 8 multiple-choice questions, each with exactly 4 options, answer_index (0-3), and a short explanation.
- true_false: 8 statements with is_true boolean and explanation.
- practice_test: 10 mixed-difficulty questions (4 options each, answer_index, explanation) simulating an exam.
- topics: list the key topics covered, each with an estimated mastery 0-100 (start around 20 for new material).

Return JSON matching the schema exactly.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: file_url ? [file_url] : undefined,
      response_json_schema: {
        type: 'object',
        properties: {
          simple_notes: { type: 'string' },
          detailed_notes: { type: 'string' },
          revision_sheet: { type: 'string' },
          flashcards: { type: 'array', items: { type: 'object', properties: { front: { type: 'string' }, back: { type: 'string' } }, required: ['front', 'back'] } },
          mcqs: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, answer_index: { type: 'number' }, explanation: { type: 'string' } }, required: ['question', 'options', 'answer_index', 'explanation'] } },
          true_false: { type: 'array', items: { type: 'object', properties: { statement: { type: 'string' }, is_true: { type: 'boolean' }, explanation: { type: 'string' } }, required: ['statement', 'is_true', 'explanation'] } },
          practice_test: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, options: { type: 'array', items: { type: 'string' } }, answer_index: { type: 'number' }, explanation: { type: 'string' } }, required: ['question', 'options', 'answer_index', 'explanation'] } },
          topics: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, mastery: { type: 'number' } }, required: ['name', 'mastery'] } }
        }
      }
    });

    const update = { status: 'ready', topics: result.topics || [] };
    if (types.includes('simple_notes')) update.simple_notes = result.simple_notes || '';
    if (types.includes('detailed_notes')) update.detailed_notes = result.detailed_notes || '';
    if (types.includes('revision_sheet')) update.revision_sheet = result.revision_sheet || '';
    if (types.includes('flashcards')) update.flashcards = result.flashcards || [];
    if (types.includes('mcqs')) update.mcqs = result.mcqs || [];
    if (types.includes('true_false')) update.true_false = result.true_false || [];
    if (types.includes('practice_test')) update.practice_test = result.practice_test || [];

    const updated = await base44.entities.StudyMaterial.update(material.id, update);
    return Response.json({ material: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}