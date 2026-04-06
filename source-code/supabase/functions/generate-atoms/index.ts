import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { atom, sourceText, trackDraftId } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const userId = (await supabase.auth.getUser()).data.user?.id

    // 1. Create or get job
    const { data: job, error: jobError } = await supabase
      .from('ai_jobs')
      .insert({
        user_id: userId,
        track_draft_id: trackDraftId,
        status: 'processing',
        job_type: 'generation',
        payload: { atomTitle: atom.title, atomType: atom.type }
      })
      .select()
      .single()

    if (jobError) throw jobError

    // 2. Call OpenRouter
    const prompt = `Generate educational content for an atom of type "${atom.type}" with title "${atom.title}".
    Use the following source text as context:
    ${sourceText.substring(0, 5000)}
    
    Requirements for type "${atom.type}":
    - quiz: JSON with "questions" array, each { "question": string, "options": string[], "correct_option": number, "hint": string }
    - flashcard: JSON with "cards" array, each { "term": string, "definition": string }
    - playbook: Markdown text content.
    - video: JSON with "script" and "suggested_visuals".
    - task: HTML instructions (sanitized).
    
    Return ONLY a JSON object with a "content" field containing the result.`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterApiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' }
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter Error: ${errorText}`)
    }

    const aiResult = await response.json()
    const content = JSON.parse(aiResult.choices[0].message.content).content

    // 3. Update job
    await supabase
      .from('ai_jobs')
      .update({ 
        status: 'completed', 
        result: { content } 
      })
      .eq('id', job.id)

    return new Response(JSON.stringify({ success: true, content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
