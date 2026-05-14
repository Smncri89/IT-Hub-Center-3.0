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

    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create admin client (service_role)
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create user client to verify caller identity
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the calling user
    const { data: { user: caller }, error: callerError } = await supabaseUser.auth.getUser();
    if (callerError || !caller) {
      throw new Error("Unauthorized: invalid token");
    }

    // Verify caller is admin
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
    const tempPassword = crypto.randomUUID().slice(0, 16) + "!A1";

    // Create the auth user with a temporary password
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name: name || email.split("@")[0],
        role: inviteRole,
        avatar_url: `https://picsum.photos/seed/${crypto.randomUUID()}/100/100`,
      },
    });

    if (createError) {
      if (createError.message?.includes("already been registered")) {
        throw new Error("User with this email already exists");
      }
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    // Create profile with correct organization_id
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUser.user!.id,
        email,
        name: name || email.split("@")[0],
        role: inviteRole,
        organization_id: orgId,
        avatar_url: `https://picsum.photos/seed/${newUser.user!.id}/100/100`,
      });

    if (profileError) {
      // Cleanup: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(newUser.user!.id);
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // Record the invitation
    const { error: inviteError } = await supabaseAdmin
      .from("invitations")
      .insert({
        organization_id: orgId,
        email,
        name: name || null,
        role: inviteRole,
        invited_by: caller.id,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      });

    if (inviteError) {
      console.error("Failed to record invitation:", inviteError);
    }

    // Send password reset email so the user can set their own password
    const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${supabaseUrl.replace(".supabase.co", ".vercel.app")}/#/update-password`,
      },
    });

    if (resetError) {
      console.error("Failed to send reset email:", resetError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUser.user!.id,
          email,
          name: name || email.split("@")[0],
          role: inviteRole,
          temp_password: tempPassword,
        },
        message: `User created. Temporary password: ${tempPassword}`,
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
