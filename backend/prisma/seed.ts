import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cities = [
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Bengaluru', state: 'Karnataka' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Hyderabad', state: 'Telangana' },
];

const names = ['Aarav', 'Diya', 'Rohan', 'Ananya', 'Vivaan', 'Ishita', 'Kabir', 'Saanvi', 'Arjun', 'Meera'];

async function main() {
  console.log('Seeding demo data...');

  const admin = await prisma.user.upsert({
    where: { phone: '9999999999' },
    update: {},
    create: {
      phone: '9999999999', name: 'Admin', phoneVerified: true, isAdmin: true,
      gender: 'other', dob: new Date('1990-01-01'),
    },
  });
  console.log('Admin user phone: 9999999999 (use OTP dev flow to log in)');

  for (let i = 0; i < 10; i++) {
    const loc = cities[i % cities.length];
    const phone = `90000000${String(i).padStart(2, '0')}`;
    await prisma.user.upsert({
      where: { phone },
      update: {},
      create: {
        phone,
        name: names[i],
        gender: i % 2 === 0 ? 'male' : 'female',
        lookingFor: i % 2 === 0 ? 'female' : 'male',
        dob: new Date(1995 + (i % 8), i % 12, 10),
        city: loc.city,
        state: loc.state,
        bio: `Hi, I'm ${names[i]}! Love travel, food, and good conversations.`,
        religion: ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Other'][i % 5],
        relationshipGoal: ['long-term', 'marriage', 'casual', 'friends'][i % 4],
        interests: JSON.stringify(['travel', 'music', 'food', 'movies'].slice(0, (i % 4) + 1)),
        phoneVerified: true,
        aadhaarVerified: i % 3 === 0,
        selfieVerified: i % 2 === 0,
        trustScore: 30 + i * 5,
      },
    });
  }

  console.log('Seed complete. Demo users: 9000000000-9000000009, Admin: 9999999999');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
