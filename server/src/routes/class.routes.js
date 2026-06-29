const router = require("express").Router();
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const classCtrl = require("../controllers/class.controller");

// All routes require authentication
router.use(authenticate);

// POST /api/classes - Teacher creates class
router.post(
  "/",
  authorize("TEACHER", "ADMIN"),
  [
    body("className").trim().notEmpty().withMessage("Class name is required"),
    validate,
  ],
  classCtrl.createClass,
);

// GET /api/classes - List classes
router.get("/", classCtrl.getClasses);

// POST /api/classes/join - Student joins class
router.post(
  "/join",
  authorize("STUDENT"),
  [
    body("joinCode").trim().notEmpty().withMessage("Join code is required"),
    validate,
  ],
  classCtrl.joinClass,
);

// POST /api/classes/:id/import-students - Bulk import
router.post("/:id/import-students", authorize("TEACHER", "ADMIN"), classCtrl.importStudents);

// GET /api/classes/:id - Class detail
router.get("/:id", classCtrl.getClassDetail);

// PUT /api/classes/:id - Update class
router.put("/:id", authorize("TEACHER", "ADMIN"), classCtrl.updateClass);

// DELETE /api/classes/:id - Delete class
router.delete("/:id", authorize("TEACHER", "ADMIN"), classCtrl.deleteClass);

// GET /api/classes/:id/members - Class members
router.get("/:id/members", classCtrl.getClassMembers);

// DELETE /api/classes/:id/members/:studentId - Remove member
router.delete(
  "/:id/members/:studentId",
  authorize("TEACHER", "ADMIN"),
  classCtrl.removeMember,
);

module.exports = router;
