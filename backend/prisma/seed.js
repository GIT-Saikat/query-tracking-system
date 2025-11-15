const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      department: 'IT',
      isActive: true,
    },
  });

  // Create sample manager
  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      password: managerPassword,
      firstName: 'Manager',
      lastName: 'User',
      role: 'MANAGER',
      department: 'Customer Support',
      isActive: true,
    },
  });

  // Create sample agents
  const agent1Password = await bcrypt.hash('agent123', 10);
  const agent1 = await prisma.user.upsert({
    where: { email: 'agent1@example.com' },
    update: {},
    create: {
      email: 'agent1@example.com',
      password: agent1Password,
      firstName: 'Agent',
      lastName: 'One',
      role: 'AGENT',
      department: 'Customer Support',
      skills: ['Technical Support', 'Billing'],
      isActive: true,
    },
  });

  const agent2Password = await bcrypt.hash('agent123', 10);
  const agent2 = await prisma.user.upsert({
    where: { email: 'agent2@example.com' },
    update: {},
    create: {
      email: 'agent2@example.com',
      password: agent2Password,
      firstName: 'Agent',
      lastName: 'Two',
      role: 'AGENT',
      department: 'Customer Support',
      skills: ['Sales', 'General Inquiry'],
      isActive: true,
    },
  });

  // Create default categories
  const categories = [
    { name: 'Question', description: 'General questions', color: '#3B82F6' },
    { name: 'Complaint', description: 'Customer complaints', color: '#EF4444' },
    { name: 'Compliment', description: 'Positive feedback', color: '#10B981' },
    { name: 'Bug Report', description: 'Technical issues', color: '#F59E0B' },
    { name: 'Feature Request', description: 'Product suggestions', color: '#8B5CF6' },
    { name: 'Billing', description: 'Billing inquiries', color: '#6366F1' },
    { name: 'Support Request', description: 'Support assistance', color: '#EC4899' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
  }

  // Create default channels
  const channels = [
    { name: 'Email', type: 'EMAIL' },
    { name: 'Twitter', type: 'TWITTER' },
    { name: 'Facebook', type: 'FACEBOOK' },
    { name: 'Instagram', type: 'INSTAGRAM' },
    { name: 'LinkedIn', type: 'LINKEDIN' },
    { name: 'Discord', type: 'DISCORD' },
    { name: 'Slack', type: 'SLACK' },
    { name: 'Website Chat', type: 'WEBSITE_CHAT' },
  ];

  for (const channel of channels) {
    await prisma.channel.upsert({
      where: { name: channel.name },
      update: {},
      create: channel,
    });
  }

  console.log('Database seeded successfully!');
  console.log('Default users created:');
  console.log('- Admin: admin@example.com / admin123');
  console.log('- Manager: manager@example.com / manager123');
  console.log('- Agent1: agent1@example.com / agent123');
  console.log('- Agent2: agent2@example.com / agent123');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

