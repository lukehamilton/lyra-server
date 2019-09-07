const { GraphQLServer } = require('graphql-yoga');
const { prisma } = require('./prisma-client');
const Mutation = require('./resolvers/mutation');
const Query = require('./resolvers/query');
const Post = require('./resolvers/post');
const Comment = require('./resolvers/comment');

function createServer() {
  return new GraphQLServer({
    typeDefs: './schema.graphql',
    resolvers: { Mutation, Query, Post, Comment },
    context: req => ({ ...req, prisma })
  });
}

module.exports = createServer;
