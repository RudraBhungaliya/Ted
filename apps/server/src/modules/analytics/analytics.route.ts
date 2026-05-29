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

      // 1. Fetch completed sessions count
      const sessionsCompleted = await db.session.count({
        where: {
          userId,
          status: "COMPLETED",
        },
      });

      // 2. Fetch global answer metrics
      const allAnalytics = await db.answerAnalytics.findMany({
        where: {
          session: {
            userId,
          },
        },
      });

      const totalConfidence = allAnalytics.reduce((acc, a) => acc + a.confidenceScore, 0);
      const totalFillers = allAnalytics.reduce((acc, a) => acc + a.fillerCount, 0);
      const averageConfidence = allAnalytics.length > 0 ? Math.round(totalConfidence / allAnalytics.length) : 0;
      const averageFillers = allAnalytics.length > 0 ? Number((totalFillers / allAnalytics.length).toFixed(1)) : 0;

      // 3. Fetch weekly trend of completed sessions
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
        const weekStr = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        weeklyMap.set(weekStr, (weeklyMap.get(weekStr) || 0) + 1);
      }
      const weeklyTrend = Array.from(weeklyMap.entries()).map(([week, count]) => ({
        week,
        count,
      }));

      // If trend is empty, fill with current week to show a nice baseline graph
      if (weeklyTrend.length === 0) {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(today.setDate(diff));
        const weekStr = monday.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        weeklyTrend.push({ week: weekStr, count: 0 });
      }

      // 4. Fetch per-session metrics
      const sessions = await db.session.findMany({
        where: {
          userId,
        },
        include: {
          analytics: true,
          summary: true,
        },
        orderBy: {
          startedAt: "desc",
        },
      });

      const sessionMetrics = sessions.map((session) => {
        const totalWords = session.analytics.reduce((acc, a) => acc + a.totalWords, 0);
        const fillerCount = session.analytics.reduce((acc, a) => acc + a.fillerCount, 0);
        const avgConfidence = session.analytics.length > 0
          ? Math.round(session.analytics.reduce((acc, a) => acc + a.confidenceScore, 0) / session.analytics.length)
          : 0;
        const usesStarCount = session.analytics.filter((a) => a.usesStarFormat).length;
        const starUsagePercent = session.analytics.length > 0
          ? Math.round((usesStarCount / session.analytics.length) * 100)
          : 0;

        return {
          id: session.id,
          title: session.title || `Session ${session.id.substring(0, 8)}`,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          status: session.status,
          metrics: {
            confidenceScore: avgConfidence,
            fillerCount,
            starUsage: starUsagePercent,
            wordCount: totalWords,
          },
          summary: session.summary ? {
            score: session.summary.score,
            strengths: session.summary.strengths,
            weaknesses: session.summary.weaknesses,
            recommendations: session.summary.recommendations,
          } : null,
        };
      });

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
