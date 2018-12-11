const jwt = require('jsonwebtoken');
const validateAndParseIdToken = require('../helpers/validateAndParseIdToken');

async function createPrismaUser(context, idToken) {
  const user = await context.prisma.createUser({
    identity: idToken.sub.split(`|`)[0],
    auth0id: idToken.sub.split(`|`)[1],
    name: idToken.name,
    email: idToken.email,
    avatar: idToken.picture
  });
  return user;
}

const Mutations = {
  async authenticate(root, { idToken }, context, info) {
    console.log('authenticate', idToken);
    let userToken = null;
    try {
      userToken = await validateAndParseIdToken(idToken);
    } catch (err) {
      throw new Error(err.message);
    }
    console.log('userToken', userToken);
    const auth0id = userToken.sub.split('|')[1];
    console.log('auth0id', auth0id);
    let user = await context.prisma.user({ auth0id });
    if (!user) {
      user = createPrismaUser(context, userToken);
    }
    // // 3. generate the JWT Token
    // const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // // We set the jwt as a cookie on the response
    // context.response.cookie('overwatch', token, {
    //   httpOnly: true,
    //   maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    // });
    return user;
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
};

module.exports = Mutations;
