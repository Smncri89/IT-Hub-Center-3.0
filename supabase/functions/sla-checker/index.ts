import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

    // Find breached tickets (sla_due_at < now, not resolved/closed)
    const { data: breachedTickets } = await supabase
      .from("tickets")
      .select("id, subject, assignee_id, requester_id, organization_id, sla_notified_breach")
      .lt("sla_due_at", now)
      .not("status", "in", '("Resolved","Closed")')
      .eq("sla_notified_breach", false)
      .not("sla_due_at", "is", null);

    // Find warning tickets (sla_due_at < 2 hours from now, not yet warned)
    const { data: warningTickets } = await supabase
      .from("tickets")
      .select("id, subject, assignee_id, requester_id, organization_id, sla_notified_warning")
      .lt("sla_due_at", twoHoursFromNow)
      .gte("sla_due_at", now)
      .not("status", "in", '("Resolved","Closed")')
      .eq("sla_notified_warning", false)
      .not("sla_due_at", "is", null);

    let breachCount = 0;
    let warningCount = 0;

    // Process breached tickets
    for (const ticket of breachedTickets || []) {
      // Create notification for assignee or requester
      const recipientId = ticket.assignee_id || ticket.requester_id;
      if (recipientId) {
        await supabase.from("notifications").insert({
          user_id: recipientId,
          organization_id: ticket.organization_id,
          type: "error",
          category: "SLA",
          message: `SLA breached: "${ticket.subject.slice(0, 60)}"`,
          link: `/tickets/${ticket.id}`,
          read: false,
        });
      }
      // Mark as notified
      await supabase.from("tickets").update({ sla_notified_breach: true }).eq("id", ticket.id);
      breachCount++;
    }

    // Process warning tickets
    for (const ticket of warningTickets || []) {
      const recipientId = ticket.assignee_id || ticket.requester_id;
      if (recipientId) {
        await supabase.from("notifications").insert({
          user_id: recipientId,
          organization_id: ticket.organization_id,
          type: "warning",
          category: "SLA",
          message: `SLA expiring soon: "${ticket.subject.slice(0, 60)}"`,
          link: `/tickets/${ticket.id}`,
          read: false,
        });
      }
      await supabase.from("tickets").update({ sla_notified_warning: true }).eq("id", ticket.id);
      warningCount++;
    }

    return new Response(
      JSON.stringify({ success: true, breached: breachCount, warnings: warningCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("sla-checker error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
