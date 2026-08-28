import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [attempts, checks, materials] = await Promise.all([
      base44.entities.QuizAttempt.list('-created_date', 60).catch(() => []),
      base44.entities.AnswerCheck.list('-created_date', 60).catch(() => []),
      base44.entities.StudyMaterial.list('-updated_date', 50).catch(() => [])
    ]);

    // Aggregate topic strength from material baseline mastery, answer-check mastery, and quiz weak topics.
    const stats = {};
    const ensure = (name) => { if (!stats[name]) stats[name] = { sum: 0, count: 0, weakHits: 0 }; return stats[name]; };

    (materials || []).forEach((m) => {
      (m.topics || []).forEach((t) => {
        const s = ensure(t.name);
        s.sum += (t.mastery || 0); s.count += 1;
      });
    });
    (checks || []).forEach((c) => {
      (c.topics || []).forEach((t) => {
        const s = ensure(t.name);
        s.sum += (t.mastery || 0); s.count += 1;
      });
    });
    (attempts || []).forEach((a) => {
      (a.weak_topics || []).forEach((t) => { ensure(t).weakHits += 1; });
    });

    const topics = Object.entries(stats).map(([name, s]) => {
      let score = s.count ? Math.round(s.sum / s.count) : 50;
      score = Math.max(0, Math.min(100, score - s.weakHits * 8));
      const category = score >= 75 ? 'strong' : score >= 40 ? 'average' : 'weak';
      return { name, score, category, weakHits: s.weakHits };
    }).sort((a, b) => a.score - b.score);

    const prompt = `You are a study coach. A student's topic strength breakdown (0-100) is:
${JSON.stringify(topics.map((t) => ({ topic: t.name, score: t.score })))}

Give 4 specific, prioritized recommendations on what the student should revise next and how. Return JSON { recommendations: [string] }.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: { type: 'object', properties: { recommendations: { type: 'array', items: { type: 'string' } } } }
    });

    return Response.json({ topics, recommendations: result.recommendations || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}