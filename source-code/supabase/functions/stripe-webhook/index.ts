import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2022-11-15',
    })
    const signature = req.headers.get('stripe-signature')!
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? ''

    let event: Stripe.Event
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`)
      return new Response(JSON.stringify({ error: 'Webhook Error' }), { status: 400 })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const assignmentId = session.client_reference_id

      if (!assignmentId) throw new Error('No assignmentId found in session')

      // 1. Update assignment status to 'active'
      const { data: assignment, error: updateError } = await supabase
        .from('org_track_assignments')
        .update({ status: 'active' })
        .eq('id', assignmentId)
        .select('*, tracks(title)')
        .single()

      if (updateError) throw updateError

      // 2. Trigger notifications for assigned users
      const targetIds: string[] = []
      if (assignment.assigned_to_type === 'user') {
        targetIds.push(assignment.assigned_to_id)
      } else if (assignment.assigned_to_type === 'team') {
        const { data: members, error: membersError } = await supabase
          .from('org_team_members')
          .select('user_id')
          .eq('team_id', assignment.assigned_to_id)
        
        if (membersError) throw membersError
        members.forEach((m: { user_id: string }) => targetIds.push(m.user_id))
      }

      // Create notifications in batch
      if (targetIds.length > 0) {
        const notifications = targetIds.map((userId: string) => ({
          user_id: userId,
          type: 'track_assigned',
          title: 'New Track Assigned!',
          message: `You have been assigned to the track: ${assignment.tracks.title}`,
          link: `/tracks/${assignment.track_id}`,
          metadata: { assignmentId, trackId: assignment.track_id }
        }))

        await supabase.from('notifications').insert(notifications)
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error(`Webhook processing failed: ${error.message}`)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
