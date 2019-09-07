const validateAndParseIdToken = require('../helpers/validateAndParseIdToken');
const ctxUser = require('../helpers/ctxUser');
const slugify = require('../helpers/slugify');
const { LocalAddress, CryptoUtils } = require('loom-js');
const aws = require('aws-sdk');
require('dotenv').config();

aws.config.update({
  region: 'us-east-1', // Put your aws region here
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey
});

const S3_BUCKET = process.env.Bucket;

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
    name_lower: idToken.name.toLowerCase(),
    firstName: idToken.given_name,
    lastName: idToken.family_name,
    email: idToken.email,
    avatar: idToken.picture,
    privateKey: privateKeyStr,
    username: 'piesrtasty',
    username_lower: 'piesrtasty',
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

  async signUpload(root, { fileName, fileType }, context, info) {
    const s3 = new aws.S3();
    const s3Params = {
      Bucket: S3_BUCKET,
      Key: fileName,
      Expires: 500,
      ContentType: fileType,
      ACL: 'public-read'
    };
    const request = s3.getSignedUrl('putObject', s3Params);
    return {
      signedRequest: request,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
    };
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
  },

  async createComment(root, payload, context) {
    const { postId, parentId, body } = payload;
    const userId = ctxUser(context).id;
    const regex = /@\[(.+?)\]\((.+?)\)/g;
    const mentionedUsers = (body.match(regex) || []).map(e =>
      e.replace(regex, '$1')
    );
    // TODO: Email mentioned users
    const obj = {
      author: { connect: { id: userId } },
      text: body
    };
    if (parentId) {
      obj.parent = { connect: { id: parentId } };
    } else {
      obj.post = { connect: { id: postId } };
    }

    const comment = await context.prisma.createComment(obj);

    if (parentId) {
      await prisma.updateComment({
        where: { id: parentId },
        data: {
          replies: { connect: { id: comment.id } }
        }
      });
    }
    return comment;
  },

  async createPost(root, payload, context) {
    const {
      link,
      name,
      tagline,
      description,
      thumbnail,
      topics,
      galleryThumbs
    } = payload;
    console.log('-------- handling create Post mutation -----------------');
    console.log('payload', payload);
    console.log('-------- -----------------------------------------------');
    return context.prisma.createPost({
      slug: slugify(name),
      link,
      name,
      tagline,
      description,
      thumbnail,
      galleryThumbs: { set: galleryThumbs },
      topics: {
        connect: topics.map(topic => ({
          slug: topic
        }))
      }
    });
    // const action = following ? 'connect' : 'disconnect';
    // await context.prisma.updateUser({
    //   where: { id: userId },
    //   data: { followedTopics: { [action]: { id: topicId } } }
    // });
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
