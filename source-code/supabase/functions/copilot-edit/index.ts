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
    const { currentContent, creatorMessage, atomType } = await req.json()

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY') ?? ''

    const prompt = `Refine the current educational content for an atom of type "${atomType}".
    Current content:
    ${JSON.stringify(currentContent)}
    
    Creator instructions:
    ${creatorMessage}
    
    Refine the content according to instructions. 
    Maintain the JSON format (if applicable) or Markdown structure.
    Return ONLY a JSON object with a "content" field containing the updated content.`

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
