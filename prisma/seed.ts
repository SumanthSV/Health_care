import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // console.log('Starting database seed...')

  // Create sample users
  const manager = await prisma.user.upsert({
    where: { email: 'manager@healthshift.com' },
    update: {},
    create: {
      email: 'manager@healthshift.com',
      name: 'Sarah Johnson',
      role: Role.MANAGER,
      auth0Id: 'auth0|manager123',
    },
  })

  const worker1 = await prisma.user.upsert({
    where: { email: 'worker1@healthshift.com' },
    update: {},
    create: {
      email: 'worker1@healthshift.com',
      name: 'Mike Chen',
      role: Role.CARE_WORKER,
      auth0Id: 'auth0|worker123',
    },
  })

  const worker2 = await prisma.user.upsert({
    where: { email: 'worker2@healthshift.com' },
    update: {},
    create: {
      email: 'worker2@healthshift.com',
      name: 'Emily Rodriguez',
      role: Role.CARE_WORKER,
      auth0Id: 'auth0|worker456',
    },
  })

  // Create sample location setting
  await prisma.locationSetting.upsert({
    where: { id: 'location1' },
    update: {},
    create: {
      id: 'location1',
      managerId: manager.id,
      name: 'Main Hospital',
      latitude: 37.7749,
      longitude: -122.4194,
      radius: 0.5,
      isActive: true,
    },
  })

  // Create sample shifts
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

  // Completed shift from yesterday
  await prisma.shift.create({
    data: {
      userId: worker1.id,
      clockInTime: new Date(yesterday.getTime() + 8 * 60 * 60 * 1000), // 8 AM
      clockOutTime: new Date(yesterday.getTime() + 16 * 60 * 60 * 1000), // 4 PM
      clockInLocation: {
        lat: 37.7749,
        lng: -122.4194,
        address: 'Main Hospital, San Francisco, CA'
      },
      clockOutLocation: {
        lat: 37.7749,
        lng: -122.4194,
        address: 'Main Hospital, San Francisco, CA'
      },
      clockInNotes: 'Starting morning shift',
      clockOutNotes: 'Completed patient rounds',
      status: 'CLOCKED_OUT',
    },
  })

  // Another completed shift
  await prisma.shift.create({
    data: {
      userId: worker2.id,
      clockInTime: new Date(twoDaysAgo.getTime() + 12 * 60 * 60 * 1000), // 12 PM
      clockOutTime: new Date(twoDaysAgo.getTime() + 20 * 60 * 60 * 1000), // 8 PM
      clockInLocation: {
        lat: 37.7749,
        lng: -122.4194,
        address: 'Main Hospital, San Francisco, CA'
      },
      clockOutLocation: {
        lat: 37.7749,
        lng: -122.4194,
        address: 'Main Hospital, San Francisco, CA'
      },
      clockInNotes: 'Afternoon shift coverage',
      clockOutNotes: 'Night shift handover completed',
      status: 'CLOCKED_OUT',
    },
  })

  // Current active shift
  await prisma.shift.create({
    data: {
      userId: worker1.id,
      clockInTime: new Date(now.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      clockInLocation: {
        lat: 37.7749,
        lng: -122.4194,
        address: 'Main Hospital, San Francisco, CA'
      },
      clockInNotes: 'Starting current shift',
      status: 'CLOCKED_IN',
    },
  })

  console.log('Database seeded successfully!')
  console.log('Created users:', { manager, worker1, worker2 })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })