const { prisma } = require("./prisma-client");
const { GraphQLServer } = require("graphql-yoga");

const resolvers = {
  Query: {
    publishedPosts(root, args, context) {
      return context.prisma.posts({ where: { published: true } });
    },
    post(root, args, context) {
      return context.prisma.post({ id: args.postId });
    },
    // products(root, args, context, info) {
    //   return context.prisma.products({ first: args.first });
    // },
    products(root, args, context, info) {
      return context.prisma
        .products({ first: args.first })
        .$fragment(
          `{ id name slug description imageUrl topics { id  name slug } }`
        );
    },
    topics(root, args, context, info) {
      return context.prisma.topics();
    },
    postsByUser(root, args, context) {
      return context.prisma
        .user({
          id: args.userId
        })
        .posts();
    }
  },
  // Product: {
  //   topics(root, args, context, info) {
  //     return context.prisma.topics();
  //   }
  // },
  Mutation: {
    createDraft(root, args, context) {
      return context.prisma.createPost({
        title: args.title,
        author: {
          connect: { id: args.userId }
        }
      });
    },
    createTopic(root, args, context) {
      return context.prisma.createTopic({
        name: args.name,
        slug: args.slug
      });
    },
    createProduct(root, args, context) {
      return context.prisma.createProduct({
        name: args.name,
        slug: args.slug,
        imageUrl: args.imageUrl,
        description: args.description,
        votesCount: args.votesCount,
        commentsCount: args.commentsCount,
        topics: {
          connect: { id: args.topicId }
        }
      });
    },
    publish(root, args, context) {
      return context.prisma.updatePost({
        where: { id: args.postId },
        data: { published: true }
      });
    },
    createUser(root, args, context) {
      return context.prisma.createUser({ name: args.name });
    }
  },
  User: {
    posts(root, args, context) {
      return context.prisma
        .user({
          id: root.id
        })
        .posts();
    }
  },
  Post: {
    author(root, args, context) {
      return context.prisma
        .post({
          id: root.id
        })
        .author();
    }
  }
};

const server = new GraphQLServer({
  typeDefs: "./schema.graphql",
  resolvers,
  context: {
    prisma
  }
});
server.start(() => console.log("Server is running on http://localhost:4000"));
