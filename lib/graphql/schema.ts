import { gql } from 'graphql-tag'

export const typeDefs = gql`
  scalar DateTime
  scalar JSON

  enum Role {
    MANAGER
    CARE_WORKER
  }

  enum ShiftStatus {
    CLOCKED_IN
    CLOCKED_OUT
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: Role!
    auth0Id: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    shifts: [Shift!]!
    locationSettings: [LocationSetting!]!
  }

  type Shift {
    id: ID!
    userId: String!
    clockInTime: DateTime
    clockOutTime: DateTime
    clockInLocation: JSON
    clockOutLocation: JSON
    clockInNotes: String
    clockOutNotes: String
    status: ShiftStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
    user: User!
  }

  type LocationSetting {
    id: ID!
    managerId: String!
    name: String!
    latitude: Float!
    longitude: Float!
    radius: Float!
    isActive: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    manager: User!
  }

  type ShiftAnalytics {
    totalHoursToday: Float!
    averageHoursPerDay: Float!
    totalStaffClockedIn: Int!
    dailyClockIns: [DailyClockIn!]!
    weeklyHours: [WeeklyHours!]!
  }

  type DailyClockIn {
    date: String!
    count: Int!
  }

  type WeeklyHours {
    staffName: String!
    hours: Float!
  }

  type Query {
    me: User
    shifts(userId: String): [Shift!]!
    activeShifts: [Shift!]!
    locationSettings: [LocationSetting!]!
    shiftAnalytics: ShiftAnalytics!
  }

  type Mutation {
    clockIn(location: JSON!, notes: String): Shift!
    clockOut(shiftId: ID!, location: JSON!, notes: String): Shift!
    setLocationSetting(
      name: String!
      latitude: Float!
      longitude: Float!
      radius: Float!
    ): LocationSetting!
    createUser(email: String!, name: String!, role: Role!, auth0Id: String!): User!
    updateUserRole(userId: ID!, role: Role!): User!
  }
`