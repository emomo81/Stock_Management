
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to connect to Prisma...');
        await prisma.$connect();
        console.log('Successfully connected to Prisma!');
        const users = await prisma.user.findMany();
        console.log(`Found ${users.length} users.`);
    } catch (e) {
        console.error('Failed to connect or query:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
