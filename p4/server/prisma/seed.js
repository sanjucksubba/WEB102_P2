const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  await prisma.follow.deleteMany();
  await prisma.commentLike.deleteMany();
  await prisma.videoLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.video.deleteMany();
  await prisma.user.deleteMany();

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const users = [];
  for (let i = 1; i <= 10; i++) {
    const user = await prisma.user.create({
      data: {
        username: `user${i}`,
        email: `user${i}@example.com`,
        password: hashedPassword,
        name: `Test User ${i}`,
        bio: `Hi I'm test user ${i}!`,
        avatar: `https://i.pravatar.cc/150?img=${i}`
      }
    });
    users.push(user);
  }
  console.log('✅ Created 10 users');

  const videos = [];
  const categories = ['Dance', 'Comedy', 'Food', 'Travel', 'Music'];
  for (const user of users) {
    for (let v = 0; v < 5; v++) {
      const video = await prisma.video.create({
        data: {
          title: `${categories[v]} video by ${user.username}`,
          description: `Awesome ${categories[v].toLowerCase()} content!`,
          videoUrl: `https://example.com/videos/${user.id}-${v}.mp4`,
          thumbnail: `https://picsum.photos/seed/${user.id * 10 + v}/320/180`,
          views: Math.floor(Math.random() * 10000),
          userId: user.id
        }
      });
      videos.push(video);
    }
  }
  console.log('✅ Created 50 videos');

  const commentTexts = ['Amazing!', 'Love this!', 'So cool!', 'Great video!', 'Wow!'];
  const comments = [];
  for (let i = 0; i < 200; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const video = videos[Math.floor(Math.random() * videos.length)];
    const comment = await prisma.comment.create({
      data: {
        text: commentTexts[Math.floor(Math.random() * commentTexts.length)],
        userId: user.id,
        videoId: video.id
      }
    });
    comments.push(comment);
  }
  console.log('✅ Created 200 comments');

  const videoLikePairs = new Set();
  let vLikes = 0;
  while (vLikes < 300) {
    const user = users[Math.floor(Math.random() * users.length)];
    const video = videos[Math.floor(Math.random() * videos.length)];
    const key = `${user.id}-${video.id}`;
    if (!videoLikePairs.has(key)) {
      videoLikePairs.add(key);
      await prisma.videoLike.create({ data: { userId: user.id, videoId: video.id } });
      vLikes++;
    }
  }
  console.log('✅ Created 300 video likes');

  const commentLikePairs = new Set();
  let cLikes = 0;
  while (cLikes < 150) {
    const user = users[Math.floor(Math.random() * users.length)];
    const comment = comments[Math.floor(Math.random() * comments.length)];
    const key = `${user.id}-${comment.id}`;
    if (!commentLikePairs.has(key)) {
      commentLikePairs.add(key);
      await prisma.commentLike.create({ data: { userId: user.id, commentId: comment.id } });
      cLikes++;
    }
  }
  console.log('✅ Created 150 comment likes');

  const followPairs = new Set();
  let follows = 0;
  while (follows < 40) {
    const follower = users[Math.floor(Math.random() * users.length)];
    const following = users[Math.floor(Math.random() * users.length)];
    const key = `${follower.id}-${following.id}`;
    if (follower.id !== following.id && !followPairs.has(key)) {
      followPairs.add(key);
      await prisma.follow.create({ data: { followerId: follower.id, followingId: following.id } });
      follows++;
    }
  }
  console.log('✅ Created 40 follows');

  console.log('\n🎉 Database seeded!');
  console.log('Login with: user1@example.com / password123');
}

main()
  .catch((e) => { console.error('❌ Error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });