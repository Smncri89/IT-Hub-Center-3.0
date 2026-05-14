import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: callerError } = await supabaseUser.auth.getUser();
    if (callerError || !caller) {
      throw new Error("Unauthorized: invalid token");
    }

    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role, organization_id")
      .eq("id", caller.id)
      .single();

    if (!callerProfile || callerProfile.role !== "Admin") {
      throw new Error("Forbidden: only admins can invite users");
    }

    const { email, name, role } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const orgId = callerProfile.organization_id;
    const inviteRole = role || "End User";

    // Use inviteUserByEmail - sends invite email via Supabase built-in mailer
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        name: name || email.split("@")[0],
        role: inviteRole,
        avatar_url: `https://picsum.photos/seed/${crypto.randomUUID()}/100/100`,
        organization_id: orgId,
      },
      redirectTo: `${supabaseUrl.replace(".supabase.co", ".vercel.app")}/#/`,
    });

    if (inviteError) {
      if (inviteError.message?.includes("already been registered")) {
        throw new Error("User with this email already exists");
      }
      throw new Error(`Failed to invite user: ${inviteError.message}`);
    }

    // Update profile with organization_id (trigger creates profile but may miss org)
    if (inviteData?.user) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ organization_id: orgId })
        .eq("id", inviteData.user.id);

      if (profileError) {
        console.error("Failed to update profile org:", profileError);
      }

      // Record the invitation
      await supabaseAdmin
        .from("invitations")
        .insert({
          organization_id: orgId,
          email,
          name: name || null,
          role: inviteRole,
          invited_by: caller.id,
          status: "pending",
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: inviteData?.user?.id,
          email,
          name: name || email.split("@")[0],
          role: inviteRole,
        },
        message: "Invite email sent successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const status = err.message?.includes("Unauthorized") ? 401
      : err.message?.includes("Forbidden") ? 403
      : 400;

    return new Response(
      JSON.stringify({ error: err.message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
