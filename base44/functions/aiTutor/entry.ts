import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, grade_level, mode, topic, voice, personality } = await req.json();

    const personalities = {
      chill: `Adopt a chill, laid-back "study buddy" persona. Speak casually and warmly, like a supportive friend. It's okay to use light slang and keep the vibe relaxed and fun, but stay accurate and age-appropriate.`,
      strict: `Adopt a strict but fair teacher persona. Be precise and rigorous. Hold the student to high standards, gently but firmly correct sloppy thinking, and insist on clear, complete answers. Demand effort but never belittle.`,
      motivator: `Adopt an energetic motivator persona. Be enthusiastic and uplifting. Celebrate effort, use encouragement and positive reinforcement, and pump the student up. Keep energy high while staying accurate.`,
      coach: `Adopt an exam-coach persona. Focus on exam strategy, time management, what examiners look for, and practicing under pressure. Be direct, strategic, and results-oriented. Prioritize marks and technique.`
    };
    const persona = personalities[personality] || personalities.chill;

    const systemPrompt = mode === 'homework'
      ? `${persona}\n\nYou are helping a grade ${grade_level || 'High School'} student with homework. Give clear step-by-step guidance. Lead the student toward the answer with hints and reasoning rather than just dumping the final answer. Use simple language. Break solutions into numbered steps.`
      : `${persona}\n\nYou are "StudyBuddy", an AI tutor for a grade ${grade_level || 'High School'} student. Explain topics at the student's level using analogies, examples, and simple language. Be helpful and motivating. Topic focus: ${topic || 'general study help'}. Keep responses focused and readable with short paragraphs and occasional bullet points.`;

    const convo = [{ role: 'system', content: systemPrompt }, ...(messages || [])];
    const prompt = convo.map(m => `${m.role.toUpperCase()}:\n${m.content}`).join('\n\n');

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });

    let audio_url = null;
    if (voice) {
      try {
        const speech = await base44.asServiceRole.integrations.Core.GenerateSpeech({
          text: typeof result === 'string' ? result.slice(0, 4000) : String(result),
          voice: 'honey',
          language_code: 'en'
        });
        audio_url = speech.url;
      } catch (e) {
        audio_url = null;
      }
    }

    return Response.json({ reply: result, audio_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}