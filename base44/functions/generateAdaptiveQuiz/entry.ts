import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { grade_level, count } = await req.json();

    const attempts = await base44.entities.QuizAttempt.filter({}, '-created_date', 30);
    const topicScores = {};
    attempts.forEach(a => {
      (a.weak_topics || []).forEach(t => {
        topicScores[t] = (topicScores[t] || 0) + 1;
      });
    });
    const weakTopics = Object.keys(topicScores)
      .sort((a, b) => topicScores[b] - topicScores[a])
      .slice(0, 6);

    const prompt = `Generate ${count || 10} adaptive multiple-choice questions for a grade ${grade_level || 'High School'} student.
Focus especially on these weak topics the student has struggled with: ${weakTopics.length ? weakTopics.join(', ') : 'general foundational concepts'}.
Each question must have exactly 4 options, a correct answer_index (0-3), a short explanation, and a topic label.
Return JSON matching the schema.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                question: { type: 'string' },
                options: { type: 'array', items: { type: 'string' } },
                answer_index: { type: 'number' },
                explanation: { type: 'string' },
                topic: { type: 'string' }
              },
              required: ['question', 'options', 'answer_index', 'explanation']
            }
          }
        }
      }
    });

    return Response.json({ questions: result.questions || [], weak_topics: weakTopics });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}