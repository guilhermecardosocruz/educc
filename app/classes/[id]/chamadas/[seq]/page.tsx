import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { notFound, redirect } from "next/navigation";
import ChamadaClient from "./ui";

export default async function ChamadaPage({ params }: { params: Promise<{ id: string; seq: string }> }) {
  const { id, seq } = await params;

  const user = await requireUser();
  if (!user) redirect("/login");

  const cls = await prisma.class.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true, name: true }
  });
  if (!cls) notFound();

  // dados iniciais para preencher o client
  const attendance = await prisma.attendance.findUnique({
    where: { classId_seq: { classId: id, seq: Number(seq) } },
    select: { seq: true, title: true }
  });
  if (!attendance) notFound();

  const students = await prisma.student.findMany({
    where: { classId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, cpf: true, contact: true }
  });


  // carrega presenças salvas para esta chamada
  const presences = await prisma.attendancePresence.findMany({
    where: { classId: cls.id, seq: attendance.seq },
    select: { studentId: true, present: true }
  });
  const initialPresence = Object.fromEntries(presences.map(r => [r.studentId, !!r.present]));
  return <ChamadaClient classId={cls.id} className={cls.name} seq={attendance.seq} initialTitle={attendance.title} initialStudents={students} initialPresence={initialPresence}  />;
}
