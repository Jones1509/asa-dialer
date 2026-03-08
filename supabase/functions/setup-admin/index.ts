import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" } });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { email, password, full_name } = await req.json();

  // Check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find(u => u.email === email);

  if (existing) {
    // Make sure they're admin + approved
    await supabase.from("profiles").update({ approved: true, active: true }).eq("user_id", existing.id);
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", existing.id);
    const hasAdmin = roles?.some(r => r.role === "admin");
    if (!hasAdmin) {
      await supabase.from("user_roles").insert({ user_id: existing.id, role: "admin" });
    }
    return new Response(JSON.stringify({ success: true, message: "Existing user promoted to admin" }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Create new user
  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: full_name || "Admin" },
  });

  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Profile is auto-created by trigger, update it
  await supabase.from("profiles").update({ approved: true, active: true }).eq("user_id", newUser.user!.id);
  
  // Add admin role (user role is auto-added by trigger)
  await supabase.from("user_roles").insert({ user_id: newUser.user!.id, role: "admin" });

  return new Response(JSON.stringify({ success: true, message: "Admin user created" }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
