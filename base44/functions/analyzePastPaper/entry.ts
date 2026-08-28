import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { file_url, title } = await req.json();
    if (!file_url) return Response.json({ error: 'Past paper file required' }, { status: 400 });

    const prompt = `You are an expert exam analyst. A student uploaded a past exam paper (attached image or PDF). Read it carefully and analyze it. Return JSON:
- subjects: array of subjects covered
- chapters: array of chapters / units referenced
- topics: array of key topics tested
- question_types: array of question formats found (e.g. MCQ, Short Answer, Essay, Problem Solving, Diagram)
- difficulty: overall difficulty — Easy, Medium, or Hard
- summary: a 1-2 sentence summary of the paper structure
- generated_questions: 10 practice questions similar in style and difficulty, each {question, options[4], answer_index, explanation, topic, difficulty}
- revision_list: a personalized revision list, array of {topic, priority (High/Medium/Low), reason}

Return JSON matching the schema exactly.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          subjects: { type: 'array', items: { type: 'string' } },
          chapters: { type: 'array', items: { type: 'string' } },
          topics: { type: 'array', items: { type: 'string' } },
          question_types: { type: 'array', items: { type: 'string' } },
          difficulty: { type: 'string' },
          summary: { type: 'string' },
          generated_questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                answer_index: { type: 'number' },
                explanation: { type: 'string' },
                topic: { type: 'string' },
                difficulty: { type: 'string' }
              },
              required: ['question', 'options', 'answer_index', 'explanation']
            }
          },
          revision_list: {
            type: 'array',
            items: {
              type: 'object',
              properties: { topic: { type: 'string' }, priority: { type: 'string' }, reason: { type: 'string' } }
            }
          }
        }
      }
    });

    const record = await base44.entities.PastPaper.create({
      title: title || 'Past Paper',
      file_url,
      subjects: result.subjects || [],
      chapters: result.chapters || [],
      topics: result.topics || [],
      question_types: result.question_types || [],
      difficulty: result.difficulty || 'Medium',
      summary: result.summary || '',
      generated_questions: result.generated_questions || [],
      revision_list: result.revision_list || []
    });

    return Response.json({ paper: record });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}