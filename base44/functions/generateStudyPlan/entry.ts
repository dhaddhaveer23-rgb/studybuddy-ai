import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { exam_title, exam_date, weak_topics, hours_per_day, grade_level } = await req.json();
    const days = exam_date ? Math.max(1, Math.ceil((new Date(exam_date) - new Date()) / 86400000)) : 7;

    const prompt = `Create a ${days}-day personalized study plan for a grade ${grade_level || 'High School'} student preparing for "${exam_title || 'final exams'}".
Weak topics to prioritize: ${(weak_topics && weak_topics.length) ? weak_topics.join(', ') : 'general review'}.
Available study time: ${hours_per_day || 2} hours per day.
Distribute topics across days, mix revision + practice, and ramp up closer to the exam.
Return JSON: an object with a "plan" array. Each item: { day (number), date (YYYY-MM-DD), focus (string), tasks: [{title, type, minutes}] }.
Today is ${new Date().toISOString().slice(0, 10)}.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          plan: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                day: { type: 'number' },
                date: { type: 'string' },
                focus: { type: 'string' },
                tasks: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      type: { type: 'string' },
                      minutes: { type: 'number' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    const plan = await base44.entities.StudyPlan.create({
      title: (exam_title || 'Study') + ' Plan',
      exam_date: exam_date || '',
      plan: result.plan || []
    });

    return Response.json({ plan });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}