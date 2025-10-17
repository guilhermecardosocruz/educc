import { prisma } from "@/lib/prisma";

export type ClassSummary = {
  classId: string;
  className: string;
  lessonsCount: number;          // nº de aulas no período
  avgPresentAbsolute: number;    // média de presentes (absoluto)
  avgPresentPercent: number;     // média de presença (%)
  topAbsentees: Array<{ studentId: string; name: string; absences: number }>;
};

/**
 * Busca as turmas do grupo via tabela de junção ClassGroupMembership (campo relacional 'cls'),
 * exatamente como já é feito nas rotas existentes.
 */
export async function getGroupAttendanceSummary(groupId: string, from: string, to: string): Promise<ClassSummary[]> {
  // memberships com relação para a turma
  const memberships = await prisma.classGroupMembership.findMany({
    where: { groupId },
    select: { cls: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  const classes = memberships
    .map((m) => m.cls)
    .filter((c): c is { id: string; name: string } => !!c);

  const summaries: ClassSummary[] = [];

  for (const cls of classes) {
    // aulas no período
    const attendances = await prisma.attendance.findMany({
      where: {
        classId: cls.id,
        lessonDate: { gte: new Date(from), lte: new Date(to) },
      },
      select: { seq: true },
      orderBy: { seq: "asc" },
    });

    if (attendances.length === 0) {
      summaries.push({
        classId: cls.id,
        className: cls.name,
        lessonsCount: 0,
        avgPresentAbsolute: 0,
        avgPresentPercent: 0,
        topAbsentees: [],
      });
      continue;
    }

    // lista atual de alunos (divisor padrão para %)
    const students = await prisma.student.findMany({
      where: { classId: cls.id },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });
    const studentMap = new Map(students.map((s) => [s.id, s.name]));

    let sumPresent = 0;
    let sumPercent = 0;
    const absencesCounter = new Map<string, number>();

    for (const att of attendances) {
      const presences = await prisma.attendancePresence.findMany({
        where: { classId: cls.id, seq: att.seq },
        select: { studentId: true, present: true },
      });

      const totalThisClassList = students.length > 0 ? students.length : presences.length;
      const presentCount = presences.reduce((acc, r) => acc + (r.present ? 1 : 0), 0);

      sumPresent += presentCount;
      sumPercent += totalThisClassList > 0 ? presentCount / totalThisClassList : 0;

      for (const r of presences) {
        if (!r.present) {
          absencesCounter.set(r.studentId, (absencesCounter.get(r.studentId) || 0) + 1);
        }
      }
    }

    const lessonsCount = attendances.length;
    const avgPresentAbsolute = lessonsCount > 0 ? sumPresent / lessonsCount : 0;
    const avgPresentPercent = lessonsCount > 0 ? (sumPercent / lessonsCount) * 100 : 0;

    const topAbsentees = Array.from(absencesCounter.entries())
      .map(([studentId, absences]) => ({
        studentId,
        name: studentMap.get(studentId) || "Aluno",
        absences,
      }))
      .sort((a, b) => b.absences - a.absences)
      .slice(0, 5);

    summaries.push({
      classId: cls.id,
      className: cls.name,
      lessonsCount,
      avgPresentAbsolute: Number(avgPresentAbsolute.toFixed(2)),
      avgPresentPercent: Number(avgPresentPercent.toFixed(2)),
      topAbsentees,
    });
  }

  return summaries;
}
