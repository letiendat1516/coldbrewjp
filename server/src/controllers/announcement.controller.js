const prisma = require("../prisma");


/**
 * POST /api/announcements
 * Teacher creates an announcement
 */
exports.createAnnouncement = async (req, res, next) => {
  try {
    const { classId, title, content } = req.body;

    const classRoom = await prisma.class.findUnique({
      where: { id: BigInt(classId) },
    });
    if (!classRoom)
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });
    if (classRoom.teacherId !== req.user.id && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const announcement = await prisma.announcement.create({
      data: {
        classId: BigInt(classId),
        teacherId: req.user.id,
        title,
        content,
      },
      include: {
        teacher: { select: { id: true, fullName: true } },
      },
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/announcements/class/:classId
 * Get all announcements for a class
 */
exports.getClassAnnouncements = async (req, res, next) => {
  try {
    const classId = BigInt(req.params.classId);
    const { page = 1, limit = 20 } = req.query;

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where: { classId },
        include: {
          teacher: { select: { id: true, fullName: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.announcement.count({ where: { classId } }),
    ]);

    res.json({
      success: true,
      data: {
        announcements,
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
 * PUT /api/announcements/:id
 * Update an announcement
 */
exports.updateAnnouncement = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);
    const { title, content } = req.body;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement)
      return res.status(404).json({ success: false, message: "Not found" });
    if (announcement.teacherId !== req.user.id && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/announcements/:id
 * Delete an announcement
 */
exports.deleteAnnouncement = async (req, res, next) => {
  try {
    const id = BigInt(req.params.id);

    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement)
      return res.status(404).json({ success: false, message: "Not found" });
    if (announcement.teacherId !== req.user.id && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await prisma.announcement.delete({ where: { id } });
    res.json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    next(error);
  }
};
