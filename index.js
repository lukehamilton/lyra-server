const { prisma } = require("./prisma-client");
const { GraphQLServer } = require("graphql-yoga");
const { checkJwt } = require("./middleware/jwt")
const { getUser } = require("./middleware/getUser")
const validateAndParseIdToken = require("./helpers/validateAndParseIdToken")

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
        .products({ first: args.first, skip: args.skip })
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
    async authenticate(root, {idToken}, context, info) {
      // console.log('root', root)
      // console.log('args', args)
      // console.log('context', context)
      // console.log('info', info)
      
      // console.log('args', args)
      // const {idToken} = args;
      // console.log('idToken', idToken)
      let userToken = null
      try {
        userToken = await validateAndParseIdToken(idToken)
      } catch (err) {
        throw new Error(err.message)
      }
      console.log('userToken', userToken)
      // const auth0id = userToken.sub.split("|")[1]
      // let user = await ctx.db.query.user({ where: { auth0id } }, info)
      // if (!user) {
      //   user = createPrismaUser(ctx, userToken)
      // }
      // return user
    },

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
