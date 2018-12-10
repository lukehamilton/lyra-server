const { GraphQLServer } = require('graphql-yoga');
const { prisma } = require('./prisma-client');
const Mutation = require('./resolvers/mutation');
const Query = require('./resolvers/query');

function createServer() {
  return new GraphQLServer({
    typeDefs: './schema.graphql',
    resolvers: { Mutation, Query },
    context: req => ({ ...req, prisma })
  });
}

module.exports = createServer;
