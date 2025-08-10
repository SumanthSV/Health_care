import { ApolloServer } from '@apollo/server'
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { typeDefs } from '../../lib/graphql/schema'
import { resolvers } from '../../lib/graphql/resolvers'
import { NextApiRequest, NextApiResponse } from 'next'

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

export default startServerAndCreateNextHandler(server, {
  context: async (req: NextApiRequest, res: NextApiResponse) => ({ req, res }),
})