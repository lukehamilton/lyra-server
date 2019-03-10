const validateAndParseIdToken = require('../helpers/validateAndParseIdToken');
const { CryptoUtils } = require('loom-js');

async function createPrismaUser(context, idToken) {
  const bytes = CryptoUtils.generatePrivateKey();
  const privateKey = Buffer.from(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  ).toString('base64');
  const user = await context.prisma.createUser({
    identity: idToken.sub.split(`|`)[0],
    auth0id: idToken.sub.split(`|`)[1],
    name: idToken.name,
    email: idToken.email,
    avatar: idToken.picture,
    privateKey
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
    console.log('user', user);
    // console.log('PR', user.privateKey);
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

  async updateFollowedTopic(root, { userId, topicId, following }, context) {
    const action = following ? 'connect' : 'disconnect';
    await context.prisma.updateUser({
      where: { id: userId },
      data: { followedTopics: { [action]: { id: topicId } } }
    });
    return context.prisma.topic({ id: topicId });
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
