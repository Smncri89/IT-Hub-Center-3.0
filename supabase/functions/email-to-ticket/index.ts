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

    // Parse the inbound email from Resend webhook
    const body = await req.json();

    // Resend inbound email format
    const fromEmail = body.from?.address || body.from || "";
    const fromName = body.from?.name || fromEmail.split("@")[0] || "Unknown";
    const subject = body.subject || "No Subject";
    const textContent = body.text || body.html?.replace(/<[^>]*>/g, "") || "";

    // Find or create user by email
    let { data: profile } = await supabase
      .from("profiles")
      .select("id, organization_id")
      .eq("email", fromEmail)
      .single();

    if (!profile) {
      // Get default org (first available)
      const { data: orgs } = await supabase
        .from("profiles")
        .select("organization_id")
        .not("organization_id", "is", null)
        .limit(1)
        .single();

      if (!orgs?.organization_id) {
        return new Response(JSON.stringify({ error: "No organization found" }), { status: 400, headers: corsHeaders });
      }

      // Create a guest profile
      const { data: authUser } = await supabase.auth.admin.createUser({
        email: fromEmail,
        email_confirm: true,
        user_metadata: { name: fromName, role: "end_user" }
      });

      if (authUser?.user) {
        await supabase.from("profiles").upsert({
          id: authUser.user.id,
          email: fromEmail,
          name: fromName,
          role: "end_user",
          organization_id: orgs.organization_id,
        });
        profile = { id: authUser.user.id, organization_id: orgs.organization_id };
      }
    }

    if (!profile) {
      return new Response(JSON.stringify({ error: "Could not resolve user" }), { status: 400, headers: corsHeaders });
    }

    // Create the ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert({
        subject: subject.slice(0, 255),
        description: textContent.slice(0, 5000),
        status: "Open",
        priority: "Medium",
        category: "Email",
        requester_id: profile.id,
        organization_id: profile.organization_id,
        contact_info: fromEmail,
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Send confirmation email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && ticket) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "IT Hub Center <noreply@yourdomain.com>",
          to: [fromEmail],
          subject: `[Ticket #${ticket.id.slice(0, 8).toUpperCase()}] ${subject}`,
          html: `<p>Hi ${fromName},</p><p>Your support request has been received and a ticket has been created.</p><p><strong>Ticket ID:</strong> ${ticket.id.slice(0, 8).toUpperCase()}<br><strong>Subject:</strong> ${subject}</p><p>Our team will get back to you shortly.</p><p>IT Hub Center</p>`,
        }),
      });
    }

    return new Response(JSON.stringify({ success: true, ticketId: ticket.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("email-to-ticket error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
