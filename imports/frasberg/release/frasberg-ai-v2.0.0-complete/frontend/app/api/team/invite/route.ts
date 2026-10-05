import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const { email } = await req.json();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: team } = await supabase
    .from("ops.teams")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!team) {
    return NextResponse.json({ error: "No team" }, { status: 400 });
  }

  const { error } = await supabase.from("ops.team_invites").insert({
    team_id: team.id,
    email,
    invited_by: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
