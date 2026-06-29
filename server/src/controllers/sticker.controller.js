const prisma = require("../prisma");


/**
 * POST /api/stickers/sets
 * Teacher creates a sticker set
 */
exports.createStickerSet = async (req, res, next) => {
  try {
    const { name, isDefault } = req.body;

    const stickerSet = await prisma.stickerSet.create({
      data: {
        teacherId: req.user.id,
        name,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json({ success: true, data: stickerSet });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/stickers/sets
 * Get teacher's sticker sets
 */
exports.getStickerSets = async (req, res, next) => {
  try {
    const sets = await prisma.stickerSet.findMany({
      where: { teacherId: req.user.id },
      include: {
        stickers: { orderBy: { sortOrder: "asc" } },
        _count: { select: { classMapping: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, data: sets });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/stickers/sets/:id
 * Get sticker set detail with stickers
 */
exports.getStickerSetDetail = async (req, res, next) => {
  try {
    const setId = BigInt(req.params.id);

    const stickerSet = await prisma.stickerSet.findUnique({
      where: { id: setId },
      include: {
        stickers: { orderBy: { sortOrder: "asc" } },
        classMapping: {
          include: { classRoom: { select: { id: true, className: true } } },
        },
      },
    });

    if (!stickerSet) {
      return res
        .status(404)
        .json({ success: false, message: "Sticker set not found" });
    }

    res.json({ success: true, data: stickerSet });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/stickers/sets/:id
 * Update sticker set
 */
exports.updateStickerSet = async (req, res, next) => {
  try {
    const setId = BigInt(req.params.id);
    const { name, isDefault } = req.body;

    const stickerSet = await prisma.stickerSet.findUnique({
      where: { id: setId },
    });
    if (!stickerSet)
      return res.status(404).json({ success: false, message: "Not found" });
    if (stickerSet.teacherId !== req.user.id && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const updated = await prisma.stickerSet.update({
      where: { id: setId },
      data: {
        ...(name && { name }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/stickers/sets/:id
 * Delete sticker set
 */
exports.deleteStickerSet = async (req, res, next) => {
  try {
    const setId = BigInt(req.params.id);

    const stickerSet = await prisma.stickerSet.findUnique({
      where: { id: setId },
    });
    if (!stickerSet)
      return res.status(404).json({ success: false, message: "Not found" });
    if (stickerSet.teacherId !== req.user.id && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await prisma.stickerSet.delete({ where: { id: setId } });
    res.json({ success: true, message: "Sticker set deleted" });
  } catch (error) {
    next(error);
  }
};

// ==================== STICKERS ====================

/**
 * POST /api/stickers
 * Add a sticker to a set
 */
exports.createSticker = async (req, res, next) => {
  try {
    const { stickerSetId, name, emoji, color, point, type, sortOrder } =
      req.body;

    // Check ownership
    const stickerSet = await prisma.stickerSet.findUnique({
      where: { id: BigInt(stickerSetId) },
    });
    if (!stickerSet)
      return res
        .status(404)
        .json({ success: false, message: "Sticker set not found" });
    if (stickerSet.teacherId !== req.user.id && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const sticker = await prisma.sticker.create({
      data: {
        stickerSetId: BigInt(stickerSetId),
        name,
        emoji,
        color,
        point: parseInt(point),
        type,
        sortOrder: sortOrder || 0,
      },
    });

    res.status(201).json({ success: true, data: sticker });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/stickers/:id
 * Update a sticker
 */
exports.updateSticker = async (req, res, next) => {
  try {
    const stickerId = BigInt(req.params.id);
    const { name, emoji, color, point, type, sortOrder } = req.body;

    const sticker = await prisma.sticker.findUnique({
      where: { id: stickerId },
      include: { stickerSet: true },
    });
    if (!sticker)
      return res
        .status(404)
        .json({ success: false, message: "Sticker not found" });
    if (
      sticker.stickerSet.teacherId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const updated = await prisma.sticker.update({
      where: { id: stickerId },
      data: {
        ...(name && { name }),
        ...(emoji !== undefined && { emoji }),
        ...(color !== undefined && { color }),
        ...(point !== undefined && { point: parseInt(point) }),
        ...(type && { type }),
        ...(sortOrder !== undefined && { sortOrder: parseInt(sortOrder) }),
      },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/stickers/:id
 * Delete a sticker
 */
exports.deleteSticker = async (req, res, next) => {
  try {
    const stickerId = BigInt(req.params.id);

    const sticker = await prisma.sticker.findUnique({
      where: { id: stickerId },
      include: { stickerSet: true },
    });
    if (!sticker)
      return res.status(404).json({ success: false, message: "Not found" });
    if (
      sticker.stickerSet.teacherId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await prisma.sticker.delete({ where: { id: stickerId } });
    res.json({ success: true, message: "Sticker deleted" });
  } catch (error) {
    next(error);
  }
};

// ==================== CLASS STICKER SETS ====================

/**
 * POST /api/stickers/assign
 * Assign a sticker set to a class
 */
exports.assignStickerSetToClass = async (req, res, next) => {
  try {
    const { classId, stickerSetId } = req.body;

    // Check class ownership
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

    const mapping = await prisma.classStickerSet.create({
      data: {
        classId: BigInt(classId),
        stickerSetId: BigInt(stickerSetId),
      },
    });

    res.status(201).json({ success: true, data: mapping });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({
        success: false,
        message: "Sticker set already assigned to this class",
      });
    }
    next(error);
  }
};

/**
 * DELETE /api/stickers/assign/:id
 * Remove sticker set from class
 */
exports.removeStickerSetFromClass = async (req, res, next) => {
  try {
    const mappingId = BigInt(req.params.id);

    const mapping = await prisma.classStickerSet.findUnique({
      where: { id: mappingId },
      include: { classRoom: true },
    });
    if (!mapping)
      return res.status(404).json({ success: false, message: "Not found" });
    if (
      mapping.classRoom.teacherId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await prisma.classStickerSet.delete({ where: { id: mappingId } });
    res.json({ success: true, message: "Sticker set removed from class" });
  } catch (error) {
    next(error);
  }
};
