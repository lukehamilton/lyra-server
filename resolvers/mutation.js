const validateAndParseIdToken = require('../helpers/validateAndParseIdToken');
const ctxUser = require('../helpers/ctxUser');
const { LocalAddress, CryptoUtils } = require('loom-js');

async function createPrismaUser(context, idToken) {
  const bytes = CryptoUtils.generatePrivateKey();
  const privateKey = Buffer.from(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength
  );
  const privateKeyStr = privateKey.toString('base64');
  const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey);
  const address = LocalAddress.fromPublicKey(publicKey).toString();
  const user = await context.prisma.createUser({
    identity: idToken.sub.split(`|`)[0],
    auth0id: idToken.sub.split(`|`)[1],
    name: idToken.name,
    email: idToken.email,
    avatar: idToken.picture,
    privateKey: privateKeyStr,
    address
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
    // // 3. generate the JWT Token
    // const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    // // We set the jwt as a cookie on the response
    // context.response.cookie('overwatch', token, {
    //   httpOnly: true,
    //   maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    // });
    return user;
  },

  async mintTokens(root, { amount }, context, info) {
    const userAddress = ctxUser(context).address;
    const client = context.request.lyraClient;
    const tx = await client.mint(userAddress, amount);
    console.log('tx', tx);
    // console.log('user', user);
    // console.log('amount to mint', amount);
    return { id: 66667 };
  },

  async signUpload(root, { amount }, context, info) {
    console.log('sighing upload!! COOL BRO');
    // const userAddress = ctxUser(context).address;
    // const client = context.request.lyraClient;
    // const tx = await client.mint(userAddress, amount);
    // console.log('tx', tx);
    // // console.log('user', user);
    // // console.log('amount to mint', amount);
    // return { id: 66667 };
  },

  async vote(root, { postId }, context) {
    const userId = ctxUser(context).id;
    const votes = await context.prisma
      .user({ id: userId })
      .votes()
      .$fragment(`{ id post { id } }`);
    const vote = votes.find(v => v.post.id === postId);
    if (vote) {
      return context.prisma.deleteVote({
        id: vote.id
      });
    }
    return context.prisma.createVote({
      user: { connect: { id: userId } },
      post: { connect: { id: postId } }
    });

    // console.log('vote', vote);
    // const vote = votes
    // console.log('votes', votes);
    // const voteExists = await context.prisma.$exists.vote({
    //   user: { id: userId },
    //   post: { id: postId }
    // });
    // if (voteExists) {
    //   console.log('voteexists', voteExists);
    //   const votes = await context.prisma.user({ id: userId }).votes();
    //   console.log('votes', votes);
    //   // context.prisma.user({ id: ctxUser(context).id });
    // }
  },

  async updateFollowedTopic(root, { userId, topicId, following }, context) {
    const action = following ? 'connect' : 'disconnect';
    await context.prisma.updateUser({
      where: { id: userId },
      data: { followedTopics: { [action]: { id: topicId } } }
    });
    return context.prisma.topic({ id: topicId });
  }
};

module.exports = Mutations;
