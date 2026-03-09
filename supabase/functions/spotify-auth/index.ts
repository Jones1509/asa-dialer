import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SPOTIFY_CLIENT_ID = Deno.env.get("SPOTIFY_CLIENT_ID")!;
const SPOTIFY_CLIENT_SECRET = Deno.env.get("SPOTIFY_CLIENT_SECRET")!;
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { action, code, redirect_uri } = await req.json();

    // Exchange authorization code for tokens
    if (action === "exchange") {
      const params = new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri,
      });

      const resp = await fetch(SPOTIFY_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
        },
        body: params.toString(),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error("Spotify token exchange error:", errText);
        return new Response(JSON.stringify({ error: "Token exchange failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await resp.json();
      const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

      // Use service role to upsert tokens
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      const { error: dbError } = await adminClient
        .from("spotify_tokens")
        .upsert(
          {
            user_id: userId,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );

      if (dbError) {
        console.error("DB upsert error:", dbError);
        return new Response(JSON.stringify({ error: "Failed to save tokens" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({ access_token: data.access_token, expires_in: data.expires_in }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Refresh access token
    if (action === "refresh") {
      // Get refresh token from DB
      const { data: tokenRow, error: fetchErr } = await supabase
        .from("spotify_tokens")
        .select("refresh_token")
        .eq("user_id", userId)
        .single();

      if (fetchErr || !tokenRow) {
        return new Response(JSON.stringify({ error: "No Spotify connection found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const params = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokenRow.refresh_token,
      });

      const resp = await fetch(SPOTIFY_TOKEN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)}`,
        },
        body: params.toString(),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error("Spotify refresh error:", errText);
        return new Response(JSON.stringify({ error: "Token refresh failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data = await resp.json();
      const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );

      await adminClient
        .from("spotify_tokens")
        .update({
          access_token: data.access_token,
          ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
          expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      return new Response(
        JSON.stringify({ access_token: data.access_token, expires_in: data.expires_in }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get connection status
    if (action === "status") {
      const { data: tokenRow } = await supabase
        .from("spotify_tokens")
        .select("expires_at")
        .eq("user_id", userId)
        .single();

      return new Response(
        JSON.stringify({ connected: !!tokenRow }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Disconnect
    if (action === "disconnect") {
      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
      );
      await adminClient.from("spotify_tokens").delete().eq("user_id", userId);
      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("spotify-auth error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
