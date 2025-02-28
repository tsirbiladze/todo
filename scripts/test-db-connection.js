// Test MySQL database connection
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('Testing database connection...');
  
  const prisma = new PrismaClient();
  
  try {
    // Test connection by querying the database version
    const result = await prisma.$queryRaw`SELECT VERSION() as version`;
    console.log('✅ Successfully connected to MySQL database!');
    console.log(`MySQL Version: ${result[0].version}`);
    
    // Count tables to verify schema was created
    const tables = await prisma.$queryRaw`SHOW TABLES`;
    console.log(`Found ${tables.length} tables in the database:`);
    
    // List all tables
    tables.forEach((table) => {
      const tableName = Object.values(table)[0];
      console.log(`- ${tableName}`);
    });
    
    console.log('\nDatabase connection test completed successfully!');
  } catch (error) {
    console.error('❌ Failed to connect to the database:');
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