const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@classreward.com' },
    update: {},
    create: {
      fullName: 'System Admin',
      email: 'admin@classreward.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Admin: ${admin.email}`);

  // Create demo teacher
  const teacherPassword = await bcrypt.hash('teacher123', 12);
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@classreward.com' },
    update: {},
    create: {
      fullName: 'Demo Teacher',
      email: 'teacher@classreward.com',
      password: teacherPassword,
      role: 'TEACHER',
    },
  });
  console.log(`✅ Teacher: ${teacher.email}`);

  // Create demo student
  const studentPassword = await bcrypt.hash('student123', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@classreward.com' },
    update: {},
    create: {
      fullName: 'Demo Student',
      email: 'student@classreward.com',
      password: studentPassword,
      role: 'STUDENT',
    },
  });
  console.log(`✅ Student: ${student.email}`);

  // Create default sticker set for teacher
  const stickerSet = await prisma.stickerSet.create({
    data: {
      teacherId: teacher.id,
      name: 'Default Stickers',
      isDefault: true,
      stickers: {
        create: [
          { name: 'Excellent!', emoji: '🌟', color: '#FFD700', point: 3, type: 'REWARD', sortOrder: 1 },
          { name: 'Great Job', emoji: '👍', color: '#45E3C6', point: 2, type: 'REWARD', sortOrder: 2 },
          { name: 'Good Work', emoji: '👏', color: '#667EEA', point: 1, type: 'REWARD', sortOrder: 3 },
          { name: 'Well Done', emoji: '💪', color: '#4CAF50', point: 1, type: 'REWARD', sortOrder: 4 },
          { name: 'Star Student', emoji: '⭐', color: '#FF9800', point: 5, type: 'REWARD', sortOrder: 5 },
          { name: 'Late', emoji: '⏰', color: '#FF5722', point: -1, type: 'PENALTY', sortOrder: 6 },
          { name: 'No Homework', emoji: '📝', color: '#F44336', point: -2, type: 'PENALTY', sortOrder: 7 },
          { name: 'Disruptive', emoji: '⚠️', color: '#FFC107', point: -1, type: 'PENALTY', sortOrder: 8 },
          { name: 'Missing Class', emoji: '🚫', color: '#9E9E9E', point: -3, type: 'PENALTY', sortOrder: 9 },
        ],
      },
    },
  });
  console.log(`✅ Default sticker set created with ${9} stickers`);

  console.log('\n📋 Demo Accounts:');
  console.log('   Admin:   admin@classreward.com / admin123');
  console.log('   Teacher: teacher@classreward.com / teacher123');
  console.log('   Student: student@classreward.com / student123');
  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
