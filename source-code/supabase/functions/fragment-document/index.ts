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
    const { filePath, trackDraftId } = await req.json()

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Download document from Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(filePath)

    if (downloadError) throw downloadError
    
    const textContent = await fileData.text()

    // 2. Track AI job status: Processing
    const { data: job, error: jobError } = await supabase
      .from('ai_jobs')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        track_draft_id: trackDraftId,
        status: 'processing',
        job_type: 'fragmentation',
        payload: { filePath }
      })
      .select()
      .single()

    if (jobError) throw jobError

    // 3. Call OpenRouter (DeepSeek V3)
    const prompt = `Fragment the following educational content into a structured curriculum of "Cells" (modules) and "Atoms" (learning units).
    Types of atoms allowed: video, playbook, quiz, flashcard, task.
    Return ONLY a JSON object with this structure:
    { "sections": [{ "title": "Section Title", "atoms": [{ "title": "Atom Title", "type": "atom_type", "summary": "Brief summary" }] }] }
    
    Content:
    ${textContent.substring(0, 8000)}`

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
    const structuredContent = JSON.parse(aiResult.choices[0].message.content)

    // 4. Update the draft and the job
    await Promise.all([
      supabase
        .from('track_drafts')
        .update({ 
          steps_data: { fragmentation: structuredContent }, 
          current_step: 2 
        })
        .eq('id', trackDraftId),
      supabase
        .from('ai_jobs')
        .update({ 
          status: 'completed', 
          result: structuredContent 
        })
        .eq('id', job.id)
    ])

    return new Response(JSON.stringify(structuredContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Attempt to mark job as failed if it exists
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
