// Test migration script
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Testing migration functionality...');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Create a test user
    console.log('Creating test user...');
    const user = await prisma.user.create({
      data: {
        name: 'Migration Test User',
        email: `test-${Date.now()}@example.com`,
      },
    });
    console.log(`Created user with ID: ${user.id}`);
    
    // 2. Create a test project
    console.log('Creating test project...');
    const project = await prisma.project.create({
      data: {
        name: 'Test Project',
        description: 'A project to test migrations',
        userId: user.id,
      },
    });
    console.log(`Created project with ID: ${project.id}`);
    
    // 3. Create a test goal
    console.log('Creating test goal...');
    const goal = await prisma.goal.create({
      data: {
        name: 'Test Goal',
        description: 'A goal to test migrations',
        projectId: project.id,
      },
    });
    console.log(`Created goal with ID: ${goal.id}`);
    
    // 4. Create a test category
    console.log('Creating test category...');
    const category = await prisma.category.create({
      data: {
        name: 'Test Category',
        color: '#FF5733',
        userId: user.id,
      },
    });
    console.log(`Created category with ID: ${category.id}`);
    
    // 5. Create a test task
    console.log('Creating test task...');
    const task = await prisma.task.create({
      data: {
        title: 'Test Task',
        description: 'A task to test migrations',
        priority: 'MEDIUM',
        emotion: 'NEUTRAL',
        userId: user.id,
        goalId: goal.id,
        categories: {
          connect: [{ id: category.id }],
        },
      },
    });
    console.log(`Created task with ID: ${task.id}`);
    
    // 6. Create a subtask
    console.log('Creating test subtask...');
    const subtask = await prisma.task.create({
      data: {
        title: 'Test Subtask',
        description: 'A subtask to test parent-child relationships',
        priority: 'LOW',
        userId: user.id,
        parentId: task.id,
      },
    });
    console.log(`Created subtask with ID: ${subtask.id}`);
    
    // 7. Test cascade delete by deleting the user
    console.log('\nTesting cascade delete by deleting the user...');
    await prisma.user.delete({
      where: { id: user.id },
    });
    console.log('User deleted successfully');
    
    // 8. Verify cascade delete worked by checking if related records were deleted
    console.log('\nVerifying cascade delete...');
    
    const projectExists = await prisma.project.findUnique({
      where: { id: project.id },
    });
    console.log(`Project exists: ${projectExists !== null}`);
    
    const goalExists = await prisma.goal.findUnique({
      where: { id: goal.id },
    });
    console.log(`Goal exists: ${goalExists !== null}`);
    
    const categoryExists = await prisma.category.findUnique({
      where: { id: category.id },
    });
    console.log(`Category exists: ${categoryExists !== null}`);
    
    const taskExists = await prisma.task.findUnique({
      where: { id: task.id },
    });
    console.log(`Task exists: ${taskExists !== null}`);
    
    const subtaskExists = await prisma.task.findUnique({
      where: { id: subtask.id },
    });
    console.log(`Subtask exists: ${subtaskExists !== null}`);
    
    // All should be null if cascade delete worked correctly
    if (!projectExists && !goalExists && !categoryExists && !taskExists && !subtaskExists) {
      console.log('\n✅ Cascade delete test passed! All related records were deleted.');
    } else {
      console.log('\n❌ Cascade delete test failed! Some related records still exist.');
    }
    
    console.log('\nMigration test completed successfully!');
  } catch (error) {
    console.error('❌ Migration test failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 