import { prisma } from "@/lib/prisma";
import { requireUser, getRole } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import ChamadaClient from "./ui";

export default async function ChamadaPage({ params }: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await params;
  const user = await requireUser();
  if (!user) redirect("/login");

  const role = await getRole(user.id, id);
  if (!role) notFound();               // sem acesso -> 404
  const canEdit = role === "PROFESSOR";

  const cls = await prisma.class.findFirst({
    where: { id },
    select: { id: true, name: true }
  });
  if (!cls) notFound();

  const attendance = await prisma.attendance.findUnique({
    where: { classId_seq: { classId: id, seq: Number(seq) } },
    select: { seq: true, title: true, lessonDate: true }
  });
  if (!attendance) notFound();

  const students = await prisma.student.findMany({
    where: { classId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, cpf: true, contact: true }
  });

  const presences = await prisma.attendancePresence.findMany({
    where: { classId: cls.id, seq: attendance.seq },
    select: { studentId: true, present: true }
  });
  const initialPresence = Object.fromEntries(presences.map(r => [r.studentId, !!r.present]));
  const initialLessonDate = attendance.lessonDate ? new Date(attendance.lessonDate).toISOString().slice(0,10) : "";

  return (
    <ChamadaClient
      classId={cls.id}
      className={cls.name}
      seq={attendance.seq}
      initialTitle={attendance.title}
      initialStudents={students}
      initialPresence={initialPresence}
      initialLessonDate={initialLessonDate}
      // UI pode ignorar; o back-end já bloqueia alteração
      // @ts-ignore
      readOnly={!canEdit}
    />
  );
}
