// const cookieParser = require('cookie-parser');
// const jwt = require('jsonwebtoken');
const { prisma } = require("./prisma-client");
const { GraphQLServer } = require("graphql-yoga");
const { checkJwt } = require("./middleware/jwt")
const { getUser } = require("./middleware/getUser")
const validateAndParseIdToken = require("./helpers/validateAndParseIdToken")

async function createPrismaUser(context, idToken) {
  const user = await context.prisma.createUser({
    identity: idToken.sub.split(`|`)[0],
    auth0id: idToken.sub.split(`|`)[1],
    name: idToken.name,
    email: idToken.email,
    avatar: idToken.picture 
  })
  return user
}

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
      // console.log('context.request.user', context.request.user)
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
      let userToken = null
      try {
        userToken = await validateAndParseIdToken(idToken)
      } catch (err) {
        throw new Error(err.message)
      }
      const auth0id = userToken.sub.split("|")[1]
      let user = await context.prisma.user( { auth0id } )
      if (!user) {
        user = createPrismaUser(context, userToken)
      }
      return user
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





server.express.post(
  server.options.endpoint,
  checkJwt,
  (err, req, res, next) => {
    console.log('here')
    console.log('err', err)
    if (err) return res.status(401).send(err.message)
    next()
  }
)
server.express.post(server.options.endpoint, (req, res, next) => {
  console.log("HERE");
  getUser(req, res, next, prisma)
});


server.start(() => console.log("Server is running on http://localhost:4000"));
