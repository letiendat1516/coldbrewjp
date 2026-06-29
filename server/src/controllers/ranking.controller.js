const prisma = require("../prisma");


/**
 * GET /api/ranking/class/:classId
 * Get ranking for a class (total +, total -, net)
 */
exports.getClassRanking = async (req, res, next) => {
  try {
    const classId = BigInt(req.params.classId);

    // Get all reward logs for this class grouped by student
    const logs = await prisma.rewardLog.findMany({
      where: { classId },
      include: {
        sticker: { select: { point: true, type: true } },
        student: { select: { id: true, fullName: true, avatar: true } },
      },
    });

    // Group and calculate per student
    const studentMap = new Map();

    for (const log of logs) {
      const sid = log.studentId.toString();
      if (!studentMap.has(sid)) {
        studentMap.set(sid, {
          student: log.student,
          totalReward: 0,
          totalPenalty: 0,
          rewardCount: 0,
          penaltyCount: 0,
        });
      }
      const entry = studentMap.get(sid);
      if (log.sticker.type === "REWARD") {
        entry.totalReward += log.sticker.point;
        entry.rewardCount++;
      } else {
        entry.totalPenalty += Math.abs(log.sticker.point);
        entry.penaltyCount++;
      }
    }

    // Also include students with no logs (0 points)
    const members = await prisma.classMember.findMany({
      where: { classId },
      include: {
        student: { select: { id: true, fullName: true, avatar: true } },
      },
    });

    for (const member of members) {
      const sid = member.studentId.toString();
      if (!studentMap.has(sid)) {
        studentMap.set(sid, {
          student: member.student,
          totalReward: 0,
          totalPenalty: 0,
          rewardCount: 0,
          penaltyCount: 0,
        });
      }
    }

    // Convert to array and calculate net
    const ranking = Array.from(studentMap.values()).map((entry) => ({
      ...entry,
      netPoints: entry.totalReward - entry.totalPenalty,
    }));

    // Sort by net points descending
    ranking.sort((a, b) => b.netPoints - a.netPoints);

    // Add rank
    const ranked = ranking.map((entry, index) => ({
      rank: index + 1,
      ...entry,
    }));

    // Class summary
    const classSummary = {
      totalStudents: ranked.length,
      totalRewardsGiven: ranked.reduce((sum, r) => sum + r.totalReward, 0),
      totalPenaltiesGiven: ranked.reduce((sum, r) => sum + r.totalPenalty, 0),
      totalActions: ranked.reduce(
        (sum, r) => sum + r.rewardCount + r.penaltyCount,
        0,
      ),
    };

    res.json({
      success: true,
      data: {
        ranking: ranked,
        summary: classSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/ranking/class/:classId/summary
 * Get quick stats summary for a class
 */
exports.getClassSummary = async (req, res, next) => {
  try {
    const classId = BigInt(req.params.classId);

    const [memberCount, logs, classRoom] = await Promise.all([
      prisma.classMember.count({ where: { classId } }),
      prisma.rewardLog.findMany({
        where: { classId },
        include: { sticker: { select: { point: true, type: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.class.findUnique({
        where: { id: classId },
        select: { className: true, schoolYear: true, semester: true },
      }),
    ]);

    const totalReward = logs
      .filter((l) => l.sticker.type === "REWARD")
      .reduce((sum, l) => sum + l.sticker.point, 0);
    const totalPenalty = logs
      .filter((l) => l.sticker.type === "PENALTY")
      .reduce((sum, l) => sum + Math.abs(l.sticker.point), 0);

    // Get all-time totals (separate query for accuracy)
    const allLogs = await prisma.rewardLog.findMany({
      where: { classId },
      include: { sticker: { select: { point: true, type: true } } },
    });

    const allTimeReward = allLogs
      .filter((l) => l.sticker.type === "REWARD")
      .reduce((sum, l) => sum + l.sticker.point, 0);
    const allTimePenalty = allLogs
      .filter((l) => l.sticker.type === "PENALTY")
      .reduce((sum, l) => sum + Math.abs(l.sticker.point), 0);

    res.json({
      success: true,
      data: {
        classInfo: classRoom,
        totalStudents: memberCount,
        allTime: {
          totalReward: allTimeReward,
          totalPenalty: allTimePenalty,
          netPoints: allTimeReward - allTimePenalty,
          totalActions: allLogs.length,
        },
        recentActivity: logs.map((l) => ({
          id: l.id.toString(),
          type: l.sticker.type,
          point: l.sticker.point,
          createdAt: l.createdAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};
