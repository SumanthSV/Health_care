import { prisma } from '../prisma'
import { getSession } from '@auth0/nextjs-auth0'
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'
import { getDistance, isPointWithinRadius } from 'geolib'

// Custom scalar types
const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  serialize: (value: any) => value instanceof Date ? value.toISOString() : value,
  parseValue: (value: any) => new Date(value),
  parseLiteral: (ast) => ast.kind === Kind.STRING ? new Date(ast.value) : null,
})

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  serialize: (value: any) => value,
  parseValue: (value: any) => value,
  parseLiteral: (ast) => {
    if (ast.kind === Kind.STRING || ast.kind === Kind.BOOLEAN || ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
      // @ts-ignore
      return JSON.parse(ast.value as string)
    }
    return null
  },
})

const isWithinPerimeter = async (location: any): Promise<boolean> => {
  const locationSettings = await prisma.locationSetting.findMany({
    where: { isActive: true }
  })
  
  for (const setting of locationSettings) {
    // Using geolib's isPointWithinRadius for accurate perimeter checking
    const isWithin = isPointWithinRadius(
      { latitude: location.lat, longitude: location.lng },
      { latitude: setting.latitude, longitude: setting.longitude },
      setting.radius * 1000 // Convert radius from kilometers to meters
    )
    
    if (isWithin) {
      return true
    }
  }
  return false
}

// Helper function to get distance in meters for display purposes
const getDistanceToNearestLocation = async (location: any): Promise<number> => {
  const locationSettings = await prisma.locationSetting.findMany({
    where: { isActive: true }
  })
  
  let minDistance = Infinity
  
  for (const setting of locationSettings) {
    const distance = getDistance(
      { latitude: location.lat, longitude: location.lng },
      { latitude: setting.latitude, longitude: setting.longitude }
    )
    
    if (distance < minDistance) {
      minDistance = distance
    }
  }
  
  return minDistance === Infinity ? 0 : minDistance
}

export const resolvers = {
  DateTime: DateTimeScalar,
  JSON: JSONScalar,

  Query: {
    me: async (_: any, __: any, context: any) => {
      const session = await getSession(context.req, context.res)
      if (!session?.user) return null

      return await prisma.user.findUnique({
        where: { auth0Id: session.user.sub },
        include: {
          shifts: true,
          locationSettings: true,
        },
      })
    },

    shifts: async (_: any, { userId }: { userId?: string }, context: any) => {
      const session = await getSession(context.req, context.res)
      if (!session?.user) throw new Error('Not authenticated')

      const currentUser = await prisma.user.findUnique({
        where: { auth0Id: session.user.sub }
      })

      if (!currentUser) throw new Error('User not found')

      const targetUserId = userId || currentUser.id

      // Managers can view all shifts, workers can only view their own
      if (currentUser.role === 'CARE_WORKER' && targetUserId !== currentUser.id) {
        throw new Error('Unauthorized')
      }

      return await prisma.shift.findMany({
        where: { userId: targetUserId },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      })
    },

    activeShifts: async (_: any, __: any, context: any) => {
      const session = await getSession(context.req, context.res)
      if (!session?.user) throw new Error('Not authenticated')

      const currentUser = await prisma.user.findUnique({
        where: { auth0Id: session.user.sub }
      })

      if (currentUser?.role !== 'MANAGER') {
        throw new Error('Unauthorized - Manager access required')
      }

      return await prisma.shift.findMany({
        where: { status: 'CLOCKED_IN' },
        include: { user: true },
        orderBy: { clockInTime: 'desc' },
      })
    },

    locationSettings: async (_: any, __: any, context: any) => {
      const session = await getSession(context.req, context.res)
      if (!session?.user) throw new Error('Not authenticated')

      return await prisma.locationSetting.findMany({
        where: { isActive: true },
        include: { manager: true },
        orderBy: { createdAt: 'desc' },
      })
    },

    shiftAnalytics: async (_: any, __: any, context: any) => {
      const session = await getSession(context.req, context.res)
      if (!session?.user) throw new Error('Not authenticated')

      const currentUser = await prisma.user.findUnique({
        where: { auth0Id: session.user.sub }
      })

      if (currentUser?.role !== 'MANAGER') {
        throw new Error('Unauthorized - Manager access required')
      }

      const today = new Date()
      const startOfDay = new Date(today.setHours(0, 0, 0, 0))
      const endOfDay = new Date(today.setHours(23, 59, 59, 999))

      // Calculate analytics
      const totalStaffClockedIn = await prisma.shift.count({
        where: { status: 'CLOCKED_IN' }
      })

      // Get shifts from last 7 days for analytics
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const recentShifts = await prisma.shift.findMany({
        where: {
          clockInTime: {
            gte: sevenDaysAgo
          },
          clockOutTime: { not: null }
        },
        include: { user: true }
      })

      // Calculate total hours today
      const todayShifts = recentShifts.filter(shift => 
        shift.clockInTime && shift.clockInTime >= startOfDay && shift.clockInTime <= endOfDay
      )

      const totalHoursToday = todayShifts.reduce((total, shift) => {
        if (shift.clockInTime && shift.clockOutTime) {
          const hours = (shift.clockOutTime.getTime() - shift.clockInTime.getTime()) / (1000 * 60 * 60)
          return total + hours
        }
        return total
      }, 0)

      // Calculate average hours per day
      const averageHoursPerDay = recentShifts.length > 0 ? 
        recentShifts.reduce((total, shift) => {
          if (shift.clockInTime && shift.clockOutTime) {
            const hours = (shift.clockOutTime.getTime() - shift.clockInTime.getTime()) / (1000 * 60 * 60)
            return total + hours
          }
          return total
        }, 0) / 7 : 0

      // Daily clock-ins for last 7 days
      const dailyClockIns = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const startOfThisDay = new Date(date.setHours(0, 0, 0, 0))
        const endOfThisDay = new Date(date.setHours(23, 59, 59, 999))
        
        const count = recentShifts.filter(shift => 
          shift.clockInTime && 
          shift.clockInTime >= startOfThisDay && 
          shift.clockInTime <= endOfThisDay
        ).length

        dailyClockIns.push({
          date: startOfThisDay.toISOString().split('T')[0],
          count
        })
      }

      // Weekly hours per staff
      const staffHours = new Map()
      recentShifts.forEach(shift => {
        if (shift.clockInTime && shift.clockOutTime) {
          const hours = (shift.clockOutTime.getTime() - shift.clockInTime.getTime()) / (1000 * 60 * 60)
          const staffName = shift.user.name
          staffHours.set(staffName, (staffHours.get(staffName) || 0) + hours)
        }
      })

      const weeklyHours = Array.from(staffHours.entries()).map(([staffName, hours]) => ({
        staffName,
        hours
      }))

      return {
        totalHoursToday: Math.round(totalHoursToday * 100) / 100,
        averageHoursPerDay: Math.round(averageHoursPerDay * 100) / 100,
        totalStaffClockedIn,
        dailyClockIns,
        weeklyHours
      }
    },
  },

  Mutation: {
    clockIn: async (_: any, { location, notes }: { location: any, notes?: string }, context: any) => {
      const session = await getSession(context.req, context.res)
      if (!session?.user) throw new Error('Not authenticated')

      const currentUser = await prisma.user.findUnique({
        where: { auth0Id: session.user.sub }
      })

      if (!currentUser) throw new Error('User not found')

      // Check if already clocked in
      const existingShift = await prisma.shift.findFirst({
        where: {
          userId: currentUser.id,
          status: 'CLOCKED_IN'
        }
      })

      if (existingShift) {
        throw new Error('Already clocked in')
      }

      // Validate location
      const withinPerimeter = await isWithinPerimeter(location)
      if (!withinPerimeter) {
        throw new Error('Location is outside the allowed perimeter')
      }

      return await prisma.shift.create({
        data: {
          userId: currentUser.id,
          clockInTime: new Date(),
          clockInLocation: location,
          clockInNotes: notes,
          status: 'CLOCKED_IN',
        },
        include: { user: true },
      })
    },

    clockOut: async (_: any, { shiftId, location, notes }: { shiftId: string, location: any, notes?: string }, context: any) => {
      const session = await getSession(context.req, context.res)
      if (!session?.user) throw new Error('Not authenticated')

      const currentUser = await prisma.user.findUnique({
        where: { auth0Id: session.user.sub }
      })

      if (!currentUser) throw new Error('User not found')

      const shift = await prisma.shift.findUnique({
        where: { id: shiftId },
        include: { user: true }
      })

      if (!shift) throw new Error('Shift not found')
      if (shift.userId !== currentUser.id) throw new Error('Unauthorized')
      if (shift.status !== 'CLOCKED_IN') throw new Error('Not currently clocked in')

      return await prisma.shift.update({
        where: { id: shiftId },
        data: {
          clockOutTime: new Date(),
          clockOutLocation: location,
          clockOutNotes: notes,
          status: 'CLOCKED_OUT',
        },
        include: { user: true },
      })
    },

    setLocationSetting: async (_: any, { name, latitude, longitude, radius }: { name: string, latitude: number, longitude: number, radius: number }, context: any) => {
      const session = await getSession(context.req, context.res)
      if (!session?.user) throw new Error('Not authenticated')

      const currentUser = await prisma.user.findUnique({
        where: { auth0Id: session.user.sub }
      })

      if (!currentUser || currentUser.role !== 'MANAGER') {
        throw new Error('Unauthorized - Manager access required')
      }

      // Deactivate existing settings for this manager
      await prisma.locationSetting.updateMany({
        where: { managerId: currentUser.id },
        data: { isActive: false }
      })

      // Create new setting
      return await prisma.locationSetting.create({
        data: {
          managerId: currentUser.id,
          name,
          latitude,
          longitude,
          radius,
          isActive: true,
        },
        include: { manager: true },
      })
    },

    createUser: async (_: any, { email, name, role, auth0Id }: { email: string, name: string, role: string, auth0Id: string }) => {
      return await prisma.user.create({
        data: {
          email,
          name,
          role: role as any,
          auth0Id,
        },
        include: {
          shifts: true,
          locationSettings: true,
        },
      })
    },

    updateUserRole: async (_: any, { userId, role }: { userId: string, role: string }, context: any) => {
      const session = await getSession(context.req, context.res)
      if (!session?.user) throw new Error('Not authenticated')

      const currentUser = await prisma.user.findUnique({
        where: { auth0Id: session.user.sub }
      })

      if (currentUser?.role !== 'MANAGER') {
        throw new Error('Unauthorized - Manager access required')
      }

      return await prisma.user.update({
        where: { id: userId },
        data: { role: role as any },
        include: {
          shifts: true,
          locationSettings: true,
        },
      })
    },
  },
}
