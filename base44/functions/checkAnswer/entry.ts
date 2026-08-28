import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { question, material_id, answer_image_url, answer_text } = await req.json();
    if (!question && !answer_image_url) return Response.json({ error: 'Question or answer image required' }, { status: 400 });

    let reference = '';
    let materialTitle = '';
    if (material_id) {
      try {
        const m = await base44.entities.StudyMaterial.get(material_id);
        reference = (m.simple_notes || m.detailed_notes || m.source_content || '').slice(0, 6000);
        materialTitle = m.title || '';
      } catch (e) {}
    }

    const prompt = `You are an expert, encouraging exam marker. A student answered this question.
QUESTION:
${question || '(see answer image)'}

${reference ? `REFERENCE / MARKING CONTEXT:\n${reference}\n\n` : ''}The student's answer is provided ${answer_image_url ? 'as an attached image — read it carefully whether handwritten or typed' : 'as text below'}.
${answer_text ? `STUDENT ANSWER (text):\n${answer_text}` : ''}

Grade the answer out of 10 based on accuracy, completeness, and clarity. Return JSON:
- score: number 0-10
- missing_points: key points the student missed (strings)
- incorrect_points: anything factually wrong (strings)
- suggestions: specific, actionable ways to improve (strings)
- feedback: a short encouraging paragraph
- topics: topics covered with estimated mastery 0-100 ({name, mastery})`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: answer_image_url ? [answer_image_url] : undefined,
      response_json_schema: {
        type: 'object',
        properties: {
          score: { type: 'number' },
          missing_points: { type: 'array', items: { type: 'string' } },
          incorrect_points: { type: 'array', items: { type: 'string' } },
          suggestions: { type: 'array', items: { type: 'string' } },
          feedback: { type: 'string' },
          topics: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, mastery: { type: 'number' } } } }
        }
      }
    });

    const record = await base44.entities.AnswerCheck.create({
      question: question || '',
      material_id: material_id || '',
      material_title: materialTitle,
      answer_image_url: answer_image_url || '',
      answer_text: answer_text || '',
      score: result.score ?? 0,
      max_score: 10,
      missing_points: result.missing_points || [],
      incorrect_points: result.incorrect_points || [],
      suggestions: result.suggestions || [],
      feedback: result.feedback || '',
      topics: result.topics || []
    });

    return Response.json({ check: record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}