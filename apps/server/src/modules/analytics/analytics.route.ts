import { FastifyInstance } from "fastify";
import { authMiddleware } from "../../middleware/auth.js";
import { db } from "../../db/client.js";

export async function analyticsRoutes(app: FastifyInstance) {
  app.get(
    "/dashboard",
    {
      preHandler: authMiddleware,
    },
    async (request) => {
      const userId = request.user!.userId;

      const sessionsCompleted = await db.session.count({
        where: {
          userId,
          status: "COMPLETED",
        },
      });

      const allAnalytics = await db.sessionAnalytics.findMany({
        where: {
          session: {
            userId,
          },
        },
      });

      const totalConfidence = allAnalytics.reduce(
        (acc, a) => acc + (a.confidenceScore ?? 0),
        0,
      );

      const totalFillers = allAnalytics.reduce(
        (acc, a) => acc + a.fillerCount,
        0,
      );

      const averageConfidence =
        allAnalytics.length > 0
          ? Math.round(totalConfidence / allAnalytics.length)
          : 0;

      const averageFillers =
        allAnalytics.length > 0
          ? Number((totalFillers / allAnalytics.length).toFixed(1))
          : 0;

      const completedSessions = await db.session.findMany({
        where: {
          userId,
          status: "COMPLETED",
        },

        select: {
          startedAt: true,
        },

        orderBy: {
          startedAt: "asc",
        },
      });

      const weeklyMap = new Map<string, number>();

      for (const s of completedSessions) {
        const d = new Date(s.startedAt);

        const day = d.getDay();

        const diff = d.getDate() - day + (day === 0 ? -6 : 1);

        const monday = new Date(d.setDate(diff));

        const weekStr = monday.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        weeklyMap.set(weekStr, (weeklyMap.get(weekStr) ?? 0) + 1);
      }

      const weeklyTrend = Array.from(weeklyMap.entries()).map(
        ([week, count]) => ({
          week,
          count,
        }),
      );

      if (weeklyTrend.length === 0) {
        const today = new Date();

        const day = today.getDay();

        const diff = today.getDate() - day + (day === 0 ? -6 : 1);

        const monday = new Date(today.setDate(diff));

        const weekStr = monday.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        weeklyTrend.push({
          week: weekStr,
          count: 0,
        });
      }

      const sessions = await db.session.findMany({
        where: {
          userId,
        },

        include: {
          analytics: true,

          summary: true,

          transcripts: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },

        orderBy: {
          startedAt: "desc",
        },
      });

      const sessionMetrics = sessions.map((session) => ({
        id: session.id,

        title: session.title ?? `Session ${session.id.substring(0, 8)}`,

        mode: session.mode,

        startedAt: session.startedAt,

        endedAt: session.endedAt,

        status: session.status,

        transcripts: session.transcripts.map((t) => ({
          id: t.id,

          speakerName: t.speakerName,

          speakerType: t.speakerType,

          text: t.text,

          createdAt: t.createdAt,
        })),

        metrics: {
          wordCount: session.analytics?.totalWords ?? 0,
          fillerCount: session.analytics?.fillerCount ?? 0,
          confidenceScore: session.analytics?.confidenceScore ?? 0,
          communicationScore: session.analytics?.communicationScore ?? 0,
          technicalScore: session.analytics?.technicalScore ?? 0,
          starUsage: session.analytics?.communicationScore ?? 0,
        },

        summary: session.summary
          ? {
              score: session.analytics?.technicalScore ?? 0,
              overview: session.summary.overview,
              strengths: session.summary.keyPoints ?? [],
              weaknesses: (session.summary.actionItems || []).filter((item: string) => item.toLowerCase().includes("avoid") || item.toLowerCase().includes("improve") || item.toLowerCase().includes("weakness")).slice(0, 3).length > 0
                ? (session.summary.actionItems || []).filter((item: string) => item.toLowerCase().includes("avoid") || item.toLowerCase().includes("improve") || item.toLowerCase().includes("weakness")).slice(0, 3)
                : (session.summary.actionItems || []).slice(0, 3),
              recommendations: session.summary.actionItems ?? [],
            }
          : null,
      }));

      return {
        success: true,

        global: {
          averageConfidence,

          averageFillers,

          sessionsCompleted,

          weeklyTrend,
        },

        sessions: sessionMetrics,
      };
    },
  );
}
