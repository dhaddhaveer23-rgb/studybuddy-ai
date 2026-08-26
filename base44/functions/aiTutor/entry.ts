import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { messages, grade_level, mode, topic, voice } = await req.json();
    const systemPrompt = mode === 'homework'
      ? `You are a patient, encouraging homework helper for a grade ${grade_level || 'High School'} student. Give clear step-by-step guidance. Lead the student toward the answer with hints and reasoning rather than just dumping the final answer. Use simple, friendly language. Break solutions into numbered steps.`
      : `You are "StudyBuddy", a friendly, encouraging AI tutor for a grade ${grade_level || 'High School'} student. Explain topics at the student's level using analogies, examples, and simple language. Be warm and motivating. Topic focus: ${topic || 'general study help'}. Keep responses focused and readable with short paragraphs and occasional bullet points.`;

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