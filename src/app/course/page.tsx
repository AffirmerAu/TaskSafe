import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Icon, Ring } from "@/components/icons";

export const dynamic = "force-dynamic";

type ModuleRow = {
  id: string;
  position: number;
  slug: string;
  title: string;
  icon: string;
  lessons: number;
  mins: number;
  thumb_url: string | null;
};

export default async function CoursePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/course");

  // Enrolled course (RLS limits this to courses the user is enrolled in).
  const { data: course } = await supabase
    .from("courses")
    .select("id, employer_name, title, subtitle, total_mins")
    .limit(1)
    .maybeSingle();

  if (!course) {
    return (
      <div className="app">
        <div className="scroll" style={{ padding: 24 }}>
          <h2>No course yet</h2>
          <p className="lead">
            You aren&apos;t enrolled in a course. Run the seed script, or ask your administrator to
            add you.
          </p>
        </div>
      </div>
    );
  }

  const { data: modules } = await supabase
    .from("modules")
    .select("id, position, slug, title, icon, lessons, mins, thumb_url")
    .eq("course_id", course.id)
    .order("position", { ascending: true });

  const { data: unlocks } = await supabase
    .from("module_unlocks")
    .select("module_id, unlocked")
    .eq("user_id", user.id);
  const unlockedSet = new Set((unlocks ?? []).filter((u) => u.unlocked).map((u) => u.module_id));

  const { data: prog } = await supabase
    .from("progress")
    .select("lesson_id, completed, slide_index, lessons(module_id)")
    .eq("user_id", user.id);
  const completedModules = new Set(
    (prog ?? [])
      .filter((p: any) => p.completed)
      .map((p: any) => p.lessons?.module_id)
      .filter(Boolean)
  );

  const mods: ModuleRow[] = modules ?? [];
  const totalDone = completedModules.size;
  const overall = mods.length ? Math.round((totalDone / mods.length) * 100) : 0;

  function statusOf(m: ModuleRow): "done" | "current" | "locked" {
    if (completedModules.has(m.id)) return "done";
    if (unlockedSet.has(m.id)) return "current";
    return "locked";
  }
  const STATUS_LABEL: Record<string, string> = {
    current: "Start now",
    locked: "Locked",
    done: "Complete",
  };

  return (
    <div className="app">
      <div className="appbar">
        <Link className="appbar__back" href="/" aria-label="Back">
          <Icon name="chevron-left" size={20} />
        </Link>
        <div className="appbar__titles">
          <div className="appbar__eyebrow">Your course</div>
          <div className="appbar__title">Site Induction</div>
        </div>
        <div className="appbar__lang">
          <Icon name="globe" size={14} /> EN
        </div>
      </div>

      <div className="scroll">
        <div className="course">
          <div className="course__hero">
            <div className="eb">
              {course.employer_name} · Induction
            </div>
            <h2>{course.title}</h2>
            <div className="course__progressrow">
              <Ring value={overall} size={56} stroke={6}>
                {overall}%
              </Ring>
              <div className="meta">
                <b>{overall === 0 ? "Let's get started" : "Keep going"}</b>
                <span>
                  {totalDone} of {mods.length} modules complete · ~{course.total_mins} min left
                </span>
              </div>
            </div>
          </div>

          <div className="modlist">
            <div className="modlist__lbl">{mods.length} modules</div>
            <div>
              {mods.map((m) => {
                const status = statusOf(m);
                const locked = status === "locked";
                const card = (
                  <div className="mod" data-locked={locked ? 1 : 0}>
                    <div
                      className={"mod__thumb" + (m.thumb_url ? "" : " mod__thumb--gradient")}
                      style={m.thumb_url ? { backgroundImage: `url(${m.thumb_url})` } : undefined}
                    >
                      <div className="mod__num">{String(m.position).padStart(2, "0")}</div>
                      <div
                        className={
                          "mod__status " +
                          (status === "done"
                            ? "mod__status--done"
                            : status === "locked"
                            ? "mod__status--lock"
                            : "mod__status--prog")
                        }
                      >
                        {status === "locked" && <Icon name="lock" size={11} />}
                        {status === "done" && <Icon name="check" size={11} stroke={3} />}
                        {STATUS_LABEL[status]}
                      </div>
                      {!m.thumb_url && (
                        <div className="mod__icon">
                          <Icon name={m.icon} size={20} />
                        </div>
                      )}
                    </div>
                    <div className="mod__body">
                      <h3>{m.title}</h3>
                      <div className="mod__sub">
                        <i>
                          <Icon name="play" size={12} /> {m.lessons} lessons
                        </i>
                        <i>
                          <Icon name="clock" size={12} /> {m.mins} min
                        </i>
                      </div>
                      {status === "current" && (
                        <div className="mod__bar">
                          <i style={{ width: "0%" }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
                return locked ? (
                  <div key={m.id}>{card}</div>
                ) : (
                  <Link key={m.id} href={`/lesson/${m.slug}`} style={{ textDecoration: "none" }}>
                    {card}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
