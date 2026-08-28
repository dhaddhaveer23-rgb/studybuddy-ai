import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { material_id } = await req.json();
    if (!material_id) return Response.json({ error: 'Material required' }, { status: 400 });

    const material = await base44.entities.StudyMaterial.get(material_id);
    const content = (material.detailed_notes || material.simple_notes || material.source_content || '').slice(0, 8000);

    const prompt = `Create a fun "Boss Battle" challenge from this study material for a student. Build 3 levels of increasing difficulty. Each level has 3 multiple-choice questions (4 options each). Then create one final "Boss Question" — the hardest, that the student must defeat to win. Make it engaging like a game. Return JSON:
- title: a fun, short battle name
- levels: array (length 3) of {level (1-3), difficulty (Easy/Medium/Hard), questions: [{question, options[4], answer_index, explanation}]}
- boss_question: {question, options[4], answer_index, explanation}

MATERIAL:
${content}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          levels: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                level: { type: 'number' },
                difficulty: { type: 'string' },
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      question: { type: 'string' },
                      options: { type: 'array', items: { type: 'string' } },
                      answer_index: { type: 'number' },
                      explanation: { type: 'string' }
                    },
                    required: ['question', 'options', 'answer_index', 'explanation']
                  }
                }
              }
            }
          },
          boss_question: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              options: { type: 'array', items: { type: 'string' } },
              answer_index: { type: 'number' },
              explanation: { type: 'string' }
            }
          }
        }
      }
    });

    const record = await base44.entities.BossBattle.create({
      title: result.title || (material.title + ' Battle'),
      material_id,
      material_title: material.title,
      levels: result.levels || [],
      boss_question: result.boss_question || {},
      status: 'ready',
      current_level: 1,
      completed_levels: 0,
      xp_earned: 0
    });

    return Response.json({ battle: record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}