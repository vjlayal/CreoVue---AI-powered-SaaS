import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const result = await prisma.video.updateMany({
        where: {
            userId: 'legacy_user'
        },
        data: {
            userId: 'user_35FM1PRdmgaNvU0tgNKlku18EjP'
        }
    })
    console.log('Updated videos count:', result.count)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
