const prisma = require("../prisma");


/**
 * Generate a random 6-character join code
 */
const generateJoinCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * POST /api/classes
 * Teacher creates a new class
 */
exports.createClass = async (req, res, next) => {
  try {
    const { className, description, schoolYear, semester } = req.body;

    // Generate unique join code
    let joinCode;
    let exists = true;
    while (exists) {
      joinCode = generateJoinCode();
      const found = await prisma.class.findUnique({ where: { joinCode } });
      if (!found) exists = false;
    }

    const classRoom = await prisma.class.create({
      data: {
        teacherId: req.user.id,
        className,
        description,
        joinCode,
        schoolYear,
        semester: semester ? parseInt(semester) : null,
      },
      include: {
        teacher: { select: { id: true, fullName: true, email: true } },
      },
    });

    res.status(201).json({ success: true, data: classRoom });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/classes
 * Get classes (teacher sees owned, student sees joined)
 */
exports.getClasses = async (req, res, next) => {
  try {
    let classes;

    if (req.user.role === "TEACHER" || req.user.role === "ADMIN") {
      classes = await prisma.class.findMany({
        where: { teacherId: req.user.id },
        include: {
          _count: { select: { members: true } },
        },
        orderBy: { updatedAt: "desc" },
      });
    } else {
      // Student: get joined classes
      const memberships = await prisma.classMember.findMany({
        where: { studentId: req.user.id },
        include: {
          classRoom: {
            include: {
              teacher: { select: { id: true, fullName: true } },
              _count: { select: { members: true } },
            },
          },
        },
        orderBy: { joinedAt: "desc" },
      });
      classes = memberships.map((m) => ({
        ...m.classRoom,
        joinedAt: m.joinedAt,
      }));
    }

    res.json({ success: true, data: classes });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/classes/:id
 * Get class detail
 */
exports.getClassDetail = async (req, res, next) => {
  try {
    const classId = BigInt(req.params.id);

    const classRoom = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: { id: true, fullName: true, email: true, avatar: true },
        },
        members: {
          include: {
            student: {
              select: { id: true, fullName: true, email: true, avatar: true },
            },
          },
          orderBy: { joinedAt: "asc" },
        },
        stickerSets: {
          include: {
            stickerSet: {
              include: { stickers: { orderBy: { sortOrder: "asc" } } },
            },
          },
        },
      },
    });

    if (!classRoom) {
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });
    }

    res.json({ success: true, data: classRoom });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/classes/join
 * Student joins a class via join code
 */
exports.joinClass = async (req, res, next) => {
  try {
    const { joinCode } = req.body;

    const classRoom = await prisma.class.findUnique({ where: { joinCode } });
    if (!classRoom) {
      return res.status(404).json({
        success: false,
        message: "Invalid join code. Class not found.",
      });
    }

    if (classRoom.status !== "ACTIVE") {
      return res
        .status(400)
        .json({ success: false, message: "This class is no longer active." });
    }

    // Check if already a member
    const existing = await prisma.classMember.findUnique({
      where: {
        classId_studentId: {
          classId: classRoom.id,
          studentId: req.user.id,
        },
      },
    });

    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Already a member of this class" });
    }

    const member = await prisma.classMember.create({
      data: {
        classId: classRoom.id,
        studentId: req.user.id,
      },
      include: {
        classRoom: {
          include: {
            teacher: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    res.status(201).json({ success: true, data: member });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/classes/:id
 * Teacher updates class info
 */
exports.updateClass = async (req, res, next) => {
  try {
    const classId = BigInt(req.params.id);

    const classRoom = await prisma.class.findUnique({ where: { id: classId } });
    if (!classRoom) {
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });
    }
    if (classRoom.teacherId !== req.user.id && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const { className, description, schoolYear, semester, status } = req.body;

    const updated = await prisma.class.update({
      where: { id: classId },
      data: {
        ...(className && { className }),
        ...(description !== undefined && { description }),
        ...(schoolYear && { schoolYear }),
        ...(semester !== undefined && { semester: parseInt(semester) }),
        ...(status && { status }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/classes/:id
 * Teacher deletes a class
 */
exports.deleteClass = async (req, res, next) => {
  try {
    const classId = BigInt(req.params.id);

    const classRoom = await prisma.class.findUnique({ where: { id: classId } });
    if (!classRoom) {
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });
    }
    if (classRoom.teacherId !== req.user.id && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await prisma.class.delete({ where: { id: classId } });

    res.json({ success: true, message: "Class deleted successfully" });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/classes/:id/members
 * Get class members list
 */
exports.getClassMembers = async (req, res, next) => {
  try {
    const classId = BigInt(req.params.id);

    const members = await prisma.classMember.findMany({
      where: { classId },
      include: {
        student: {
          select: { id: true, fullName: true, email: true, avatar: true },
        },
      },
      orderBy: { joinedAt: "asc" },
    });

    res.json({ success: true, data: members });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/classes/:id/members/:studentId
 * Teacher removes a student from class
 */
exports.removeMember = async (req, res, next) => {
  try {
    const classId = BigInt(req.params.id);
    const studentId = BigInt(req.params.studentId);

    const classRoom = await prisma.class.findUnique({ where: { id: classId } });
    if (!classRoom)
      return res
        .status(404)
        .json({ success: false, message: "Class not found" });
    if (classRoom.teacherId !== req.user.id && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await prisma.classMember.deleteMany({
      where: { classId, studentId },
    });

    res.json({ success: true, message: "Member removed" });
  } catch (error) {
    next(error);
  }
};
