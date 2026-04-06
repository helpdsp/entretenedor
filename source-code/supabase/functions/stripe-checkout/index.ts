import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orgId, trackId, assignedToType, assignedToId, seatCount } = await req.json()

    const authHeader = req.headers.get('Authorization')!
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2022-11-15',
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Verify user is org admin
    const { data: isAdmin, error: adminError } = await supabase.rpc('is_org_admin', { p_org_id: orgId })
    if (adminError || !isAdmin) throw new Error('Unauthorized: Not an org admin')

    // 2. Get track details
    const { data: track, error: trackError } = await supabase
      .from('tracks')
      .select('title, thumbnail_url')
      .eq('id', trackId)
      .single()

    if (trackError) throw trackError

    // 3. Create preliminary assignment
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    
    const { data: assignment, error: assignError } = await supabase
      .from('org_track_assignments')
      .insert({
        org_id: orgId,
        track_id: trackId,
        assigned_by: user?.id,
        assigned_to_type: assignedToType,
        assigned_to_id: assignedToId,
        seat_count: seatCount,
        status: 'pending'
      })
      .select()
      .single()

    if (assignError) throw assignError

    // 4. Create Stripe Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Track Assignment: ${track.title}`,
              images: track.thumbnail_url ? [track.thumbnail_url] : [],
            },
            unit_amount: 1000, // $10 per seat
          },
          quantity: seatCount,
        },
      ],
      mode: 'payment',
      success_url: `${Deno.env.get('APP_URL')}/org/${orgId}/assignments?success=true`,
      cancel_url: `${Deno.env.get('APP_URL')}/org/${orgId}/assignments?cancel=true`,
      client_reference_id: assignment.id,
      metadata: {
        assignmentId: assignment.id,
        orgId,
        trackId,
      },
    })

    // 5. Update assignment with session ID
    await supabase
      .from('org_track_assignments')
      .update({ stripe_session_id: session.id })
      .eq('id', assignment.id)

    return new Response(JSON.stringify({ url: session.url }), {
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
