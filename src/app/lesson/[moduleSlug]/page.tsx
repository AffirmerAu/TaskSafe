import { redirect, notFound } from "next/navigation";
import { getLessonByModuleSlug } from "@/lib/content";
import { createClient } from "@/lib/supabase-server";
import SlideLesson, { type Slide } from "@/components/slide-lesson";

export const dynamic = "force-dynamic";

export default async function LessonPage({ params }: { params: { moduleSlug: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/lesson/${params.moduleSlug}`);

  // The content layer enforces gating: returns null if the module is locked.
  const result = await getLessonByModuleSlug(params.moduleSlug);
  if (!result) notFound();

  const { module: mod, lesson, slides } = result;

  const { data: profile } = await supabase
    .from("profiles")
    .select("language")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <SlideLesson
      slides={slides as Slide[]}
      courseId={mod.course_id}
      lessonId={lesson.id}
      initialLang={profile?.language ?? "en"}
    />
  );
}
