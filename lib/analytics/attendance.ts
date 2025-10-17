import { prisma } from "@/lib/prisma";

export type ClassSummary = {
  classId: string;
  className: string;
  lessonsCount: number;          // número de aulas no período
  avgPresentAbsolute: number;    // média de presentes (absoluto)
  avgPresentPercent: number;     // média de presença (%) considerando tamanho da lista da turma na data da aula
  topAbsentees: Array<{ studentId: string; name: string; absences: number }>; // top 5
};

export async function getGroupAttendanceSummary(groupId: string, from: string, to: string): Promise<ClassSummary[]> {
  // Busca as turmas do grupo (assumindo relação Class.groupId)
  const classes = await prisma.class.findMany({
    where: { groupId },
    select: { id: true, name: true },
  });

  const summaries: ClassSummary[] = [];
  for (const cls of classes) {
    // Aulas (attendances) no período
    const attendances = await prisma.attendance.findMany({
      where: {
        classId: cls.id,
        lessonDate: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      select: { seq: true, classId: true },
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

    // Lista de alunos atuais da turma (para divisor de % se necessário)
    const students = await prisma.student.findMany({
      where: { classId: cls.id },
      select: { id: true, name: true },
    });
    const studentMap = new Map(students.map(s => [s.id, s.name]));

    // Presenças por aula
    let sumPresent = 0;
    let sumPercent = 0;

    // Acúmulo de faltas por aluno
    const absencesCounter = new Map<string, number>();

    for (const att of attendances) {
      const presences = await prisma.attendancePresence.findMany({
        where: { classId: cls.id, seq: att.seq },
        select: { studentId: true, present: true },
      });

      const totalThisClassList = students.length > 0 ? students.length : presences.length; // fallback
      const presentCount = presences.reduce((acc, r) => acc + (r.present ? 1 : 0), 0);

      sumPresent += presentCount;
      sumPercent += totalThisClassList > 0 ? (presentCount / totalThisClassList) : 0;

      // faltas
      for (const r of presences) {
        if (!r.present) {
          absencesCounter.set(r.studentId, (absencesCounter.get(r.studentId) || 0) + 1);
        }
      }
    }

    const lessonsCount = attendances.length;
    const avgPresentAbsolute = lessonsCount > 0 ? sumPresent / lessonsCount : 0;
    const avgPresentPercent = lessonsCount > 0 ? (sumPercent / lessonsCount) * 100 : 0;

    // Top 5 faltantes
    const topAbsentees = Array.from(absencesCounter.entries())
      .map(([studentId, absences]) => ({ studentId, name: studentMap.get(studentId) || "Aluno", absences }))
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
