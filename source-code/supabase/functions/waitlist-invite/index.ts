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
    const { email } = await req.json()
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Generate token
    const inviteToken = crypto.randomUUID()

    // 2. Update waitlist entry
    const { data, error: updateError } = await supabase
      .from('waitlist')
      .update({
        status: 'invited',
        invite_token: inviteToken,
        invited_at: new Date().toISOString()
      })
      .eq('email', email)
      .select()
      .single()

    if (updateError) throw updateError
    if (!data) throw new Error('Waitlist entry not found')

    // 3. Send email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: 'FastTrack <onboarding@fasttrack-ai.com>',
        to: email,
        subject: 'You\'re Invited to FastTrack AI!',
        html: `
          <h1>Welcome to FastTrack AI!</h1>
          <p>Hi ${data.name},</p>
          <p>We're excited to invite you to join our platform. Use the link below to create your account:</p>
          <a href="${Deno.env.get('APP_URL')}/?invite_token=${inviteToken}">Join FastTrack AI</a>
          <p>If the link doesn't work, copy and paste this URL into your browser:</p>
          <p>${Deno.env.get('APP_URL')}/?invite_token=${inviteToken}</p>
        `,
      }),
    })

    if (!res.ok) {
      const error = await res.text()
      throw new Error(`Resend API error: ${error}`)
    }

    return new Response(JSON.stringify({ success: true }), {
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
