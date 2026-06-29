const prisma = require("../prisma");


/**
 * POST /api/rewards
 * Teacher gives a reward/penalty to a student
 */
exports.giveReward = async (req, res, next) => {
  try {
    const { classId, studentId, stickerId, note } = req.body;

    // Verify class ownership
    const classRoom = await prisma.class.findUnique({
      where: { id: BigInt(classId) },
    });
    if (!classRoom)
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });
    if (classRoom.teacherId !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to give rewards in this class",
      });
    }

    // Verify sticker exists and type
    const sticker = await prisma.sticker.findUnique({
      where: { id: BigInt(stickerId) },
    });
    if (!sticker)
      return res
        .status(404)
        .json({ success: false, message: "Sticker not found" });

    // Verify student is in the class
    const member = await prisma.classMember.findUnique({
      where: {
        classId_studentId: {
          classId: BigInt(classId),
          studentId: BigInt(studentId),
        },
      },
    });
    if (!member) {
      return res
        .status(400)
        .json({ success: false, message: "Student is not in this class" });
    }

    const log = await prisma.rewardLog.create({
      data: {
        classId: BigInt(classId),
        studentId: BigInt(studentId),
        teacherId: req.user.id,
        stickerId: BigInt(stickerId),
        note,
      },
      include: {
        sticker: {
          select: {
            id: true,
            name: true,
            emoji: true,
            point: true,
            type: true,
            color: true,
          },
        },
        student: { select: { id: true, fullName: true } },
        teacher: { select: { id: true, fullName: true } },
      },
    });

    res.status(201).json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rewards/class/:classId
 * Get reward logs for a class (with pagination & filters)
 */
exports.getClassRewards = async (req, res, next) => {
  try {
    const classId = BigInt(req.params.classId);
    const {
      studentId,
      type,
      page = 1,
      limit = 50,
      startDate,
      endDate,
    } = req.query;

    const where = { classId };

    if (studentId) where.studentId = BigInt(studentId);
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    if (type) {
      where.sticker = { type: type.toUpperCase() };
    }

    const [logs, total] = await Promise.all([
      prisma.rewardLog.findMany({
        where,
        include: {
          sticker: {
            select: {
              id: true,
              name: true,
              emoji: true,
              point: true,
              type: true,
              color: true,
            },
          },
          student: { select: { id: true, fullName: true, avatar: true } },
          teacher: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.rewardLog.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/rewards/student/:studentId/class/:classId
 * Get reward summary for a specific student in a class
 */
exports.getStudentRewards = async (req, res, next) => {
  try {
    const { studentId, classId } = req.params;

    const logs = await prisma.rewardLog.findMany({
      where: {
        studentId: BigInt(studentId),
        classId: BigInt(classId),
      },
      include: {
        sticker: {
          select: {
            id: true,
            name: true,
            emoji: true,
            point: true,
            type: true,
            color: true,
          },
        },
        teacher: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const totalReward = logs
      .filter((l) => l.sticker.type === "REWARD")
      .reduce((sum, l) => sum + l.sticker.point, 0);
    const totalPenalty = logs
      .filter((l) => l.sticker.type === "PENALTY")
      .reduce((sum, l) => sum + Math.abs(l.sticker.point), 0);
    const netPoints = totalReward - totalPenalty;

    res.json({
      success: true,
      data: {
        logs,
        summary: {
          totalReward,
          totalPenalty,
          netPoints,
          totalActions: logs.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/rewards/:id
 * Teacher deletes a reward log entry
 */
exports.deleteReward = async (req, res, next) => {
  try {
    const logId = BigInt(req.params.id);

    const log = await prisma.rewardLog.findUnique({
      where: { id: logId },
      include: { classRoom: true },
    });

    if (!log)
      return res.status(404).json({ success: false, message: "Not found" });
    if (log.teacherId !== req.user.id && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await prisma.rewardLog.delete({ where: { id: logId } });
    res.json({ success: true, message: "Reward log deleted" });
  } catch (error) {
    next(error);
  }
};
