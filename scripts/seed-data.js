// Seed script to populate the database with initial data
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Starting database seed...');
    
    // Check if we already have a test user
    let testUser = await prisma.user.findUnique({
      where: { 
        email: 'test@example.com',
      },
    });
    
    // Create test user if not exists
    if (!testUser) {
      console.log('Creating test user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password: hashedPassword,
        },
      });
      
      // Create default settings for the user
      await prisma.userSettings.create({
        data: {
          userId: testUser.id,
        },
      });
      
      console.log('Test user created successfully.');
    } else {
      console.log('Test user already exists, skipping creation.');
    }
    
    // Check if we already have default categories
    const existingCategories = await prisma.category.findMany({
      where: {
        userId: testUser.id,
      },
    });
    
    // Create default categories if none exist
    if (existingCategories.length === 0) {
      console.log('Creating default categories...');
      
      const defaultCategories = [
        { name: 'Work', color: '#4A90E2' },
        { name: 'Personal', color: '#50E3C2' },
        { name: 'Health', color: '#FF5A5F' },
        { name: 'Shopping', color: '#FFB400' },
        { name: 'Learning', color: '#8E44AD' },
      ];
      
      for (const category of defaultCategories) {
        await prisma.category.create({
          data: {
            ...category,
            userId: testUser.id,
          },
        });
      }
      
      console.log('Default categories created successfully.');
    } else {
      console.log(`${existingCategories.length} categories already exist, skipping creation.`);
    }
    
    // Check if we already have sample tasks
    const existingTasks = await prisma.task.findMany({
      where: {
        userId: testUser.id,
      },
    });
    
    // Create sample tasks if none exist
    if (existingTasks.length === 0) {
      console.log('Creating sample tasks...');
      
      // Get category IDs
      const categories = await prisma.category.findMany({
        where: {
          userId: testUser.id,
        },
      });
      
      const categoryMap = categories.reduce((map, category) => {
        map[category.name.toLowerCase()] = category.id;
        return map;
      }, {});
      
      // Sample tasks
      const sampleTasks = [
        {
          title: 'Complete project presentation',
          description: 'Prepare slides for the upcoming project review',
          priority: 'HIGH',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          categoryNames: ['work'],
        },
        {
          title: 'Schedule dentist appointment',
          description: 'Call the dental office to schedule a check-up',
          priority: 'MEDIUM',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
          categoryNames: ['health'],
        },
        {
          title: 'Buy groceries',
          description: 'Milk, eggs, bread, fruits, and vegetables',
          priority: 'LOW',
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
          categoryNames: ['shopping'],
        },
      ];
      
      for (const task of sampleTasks) {
        const { categoryNames, ...taskData } = task;
        
        // Create the task
        const createdTask = await prisma.task.create({
          data: {
            ...taskData,
            userId: testUser.id,
            categories: {
              connect: categoryNames.map(name => ({ id: categoryMap[name] })).filter(Boolean),
            },
          },
        });
        
        console.log(`Created task: ${createdTask.title}`);
      }
      
      console.log('Sample tasks created successfully.');
    } else {
      console.log(`${existingTasks.length} tasks already exist, skipping creation.`);
    }
    
    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 