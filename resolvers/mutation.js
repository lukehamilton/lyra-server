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
    let userToken = null;
    try {
      userToken = await validateAndParseIdToken(idToken);
    } catch (err) {
      throw new Error(err.message);
    }
    const auth0id = userToken.sub.split('|')[1];
    let user = await context.prisma.user({ auth0id });
    if (!user) {
      user = createPrismaUser(context, userToken);
    }
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
