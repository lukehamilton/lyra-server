/* eslint no-await-in-loop: 0, no-bitwise: 0 */
const moment = require('moment');
const { LocalAddress, CryptoUtils } = require('loom-js');

const { users, usernames } = require('./users');
const { topics } = require('./topics');
const { posts: seedPosts, slugs: seedPostSlugs } = require('./posts');

const posts = seedPosts.slice(0, 5);
const postSlugs = seedPostSlugs.slice(0, 5);

const { prisma } = require('../prisma-client');

const COMMENT_PARENT_TEXT =
  'Egg whites, turkey sausage, wheat toast, water. Of course they don’t want us to eat our breakfast, so we are going to enjoy our breakfast. In life there will be road blocks but we will over come it. I told you all this before, when you have a swimming pool, do not use chlorine, use salt water, the healing, salt water is the healing. Congratulations, you played yourself. It’s important to use cocoa butter. It’s the key to more success, why not live smooth? Why live rough?';

const COMMENT_REPLY_TEXT =
  'The weather is amazing, walk with me through the pathway of more success. Take this journey with me, Lion! Surround yourself with angels, positive energy, beautiful people, beautiful souls, clean heart, angel. Find peace, life is like a water fall, you’ve gotta flow. I’m giving you cloth talk, cloth. Special cloth alert, cut from a special cloth. You smart, you loyal, you a genius. I’m up to something. They key is to have every key, the key to open every door. We the best.';

const config = {
  sections: {
    count: 5,
    minPosts: 8,
    maxPosts: 3
  },
  comments: {
    minComments: 0,
    maxComments: 3,
    minReplies: 0,
    maxReplies: 2
  },
  votes: {
    minVotes: 0,
    maxVotes: 3
  },
  creators: {
    minCreators: 0,
    maxCreators: 2
  }
};

const galleryThumbs = [
  'https://lyra-labs-development.s3.amazonaws.com/images/gallery-stock-1.jpeg',
  'https://lyra-labs-development.s3.amazonaws.com/images/gallery-stock-2.jpeg',
  'https://lyra-labs-development.s3.amazonaws.com/images/gallery-stock-3.jpeg',
  'https://lyra-labs-development.s3.amazonaws.com/images/gallery-stock-4.jpeg'
];

const setup = async () => {
  // Create users
  for (let i = 0; i < users.length; i += 1) {
    const bytes = CryptoUtils.generatePrivateKey();
    const privateKey = Buffer.from(
      bytes.buffer,
      bytes.byteOffset,
      bytes.byteLength
    );
    const privateKeyStr = privateKey.toString('base64');
    const publicKey = CryptoUtils.publicKeyFromPrivateKey(privateKey);
    const address = LocalAddress.fromPublicKey(publicKey).toString();
    const { firstName, lastName, username } = users[i];
    const name = `${firstName} ${lastName}`;
    await prisma.createUser({
      ...users[i],
      privateKey: privateKeyStr,
      address,
      identity: 'google-oauth2',
      name,
      name_lower: name.toLowerCase(),
      username_lower: username.toLowerCase()
    });
  }

  // Create topics
  for (let i = 0; i < topics.length; i += 1) {
    await prisma.createTopic(topics[i]);
  }

  // Create posts
  for (let i = 0; i < posts.length; i += 1) {
    const submitter = usernames[Math.floor(Math.random() * usernames.length)];
    const { minCreators, maxCreators } = config.creators;
    const selectedCreators = usernames.slice(
      0,
      Math.floor(Math.random() * (maxCreators - minCreators + 1)) + minCreators
    );
    const connectedCreators = selectedCreators.map(username => ({ username }));
    await prisma.createPost({
      ...posts[i],
      link: 'https://loomx.io/',
      galleryThumbs: { set: galleryThumbs },
      submitter: { connect: { username: submitter } },
      creators: { connect: connectedCreators },
      description:
        'Put the outside world on hold – this is all about you and your music. No noise, no wires, no distractions. Just exceptional sound, industry-leading noise cancellation, and hour upon hour of pure listening freedom.'
    });
  }

  // Create sections
  for (let i = 0; i < config.sections.count; i += 1) {
    const date = moment()
      .subtract(i, 'd')
      .format('YYYY-MM-DD');

    postSlugs.sort(() => 0.5 - Math.random());
    const { minPosts, maxPosts } = config.sections;
    const selectedPostSlugs = postSlugs.slice(
      0,
      Math.floor(Math.random() * (maxPosts - minPosts + 1)) + minPosts
    );
    const connectedPostSlugs = selectedPostSlugs.map(slug => ({ slug }));
    await prisma.createSection({
      date,
      posts: { connect: connectedPostSlugs }
    });
  }

  // Create votes
  for (let i = 0; i < postSlugs.length; i += 1) {
    const { minVotes, maxVotes } = config.votes;
    const selectedUsernames = usernames.slice(
      0,
      Math.floor(Math.random() * (maxVotes - minVotes + 1)) + minVotes
    );
    for (let j = 0; j < selectedUsernames.length; j += 1) {
      await prisma.createVote({
        user: { connect: { username: selectedUsernames[j] } },
        post: { connect: { slug: postSlugs[i] } }
      });
    }
  }

  // Create comments
  for (let i = 0; i < postSlugs.length; i += 1) {
    const {
      minComments,
      maxComments,
      minReplies,
      maxReplies
    } = config.comments;

    for (let j = minComments; j < maxComments; j += 1) {
      const author = usernames[Math.floor(Math.random() * usernames.length)];
      const parent = await prisma.createComment({
        author: { connect: { username: author } },
        post: { connect: { slug: postSlugs[i] } },
        text: COMMENT_PARENT_TEXT
      });

      const selectedUsernames = usernames.slice(
        0,
        Math.floor(
          Math.random() * (config.votes.maxVotes - config.votes.minVotes + 1)
        ) + config.votes.minVotes
      );
      for (let h = 0; h < selectedUsernames.length; h += 1) {
        await prisma.createCommentVote({
          user: { connect: { username: selectedUsernames[0] } },
          comment: { connect: { id: parent.id } }
        });
      }

      let replyIds = [];
      for (let k = minReplies; k < maxReplies; k += 1) {
        const replyAuthor =
          usernames[Math.floor(Math.random() * usernames.length)];
        const reply = await prisma.createComment({
          author: { connect: { username: replyAuthor } },
          text: COMMENT_REPLY_TEXT,
          parent: { connect: { id: parent.id } }
        });

        const selectedUsernames = usernames.slice(
          0,
          Math.floor(
            Math.random() * (config.votes.maxVotes - config.votes.minVotes + 1)
          ) + config.votes.minVotes
        );
        for (let l = 0; l < selectedUsernames.length; l += 1) {
          await prisma.createCommentVote({
            user: { connect: { username: selectedUsernames[0] } },
            comment: { connect: { id: reply.id } }
          });
        }

        replyIds.push(reply.id);
      }
      const connectedreplyIds = replyIds.map(id => ({ id }));
      await prisma.updateComment({
        where: { id: parent.id },
        data: {
          replies: { connect: connectedreplyIds }
        }
      });
    }
  }
};

setup().then(() => {
  process.exit(0);
});
