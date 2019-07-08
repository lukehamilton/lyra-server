/* eslint no-await-in-loop: 0, no-bitwise: 0 */
const moment = require('moment');

const { topics } = require('./topics');
const { posts, slugs: postSlugs } = require('./posts');

const { prisma } = require('../prisma-client');

const config = {
  sections: {
    count: 45,
    minPosts: 8,
    maxPosts: 20
  }
};

const galleryThumbs = [
  'https://lyra-labs-development.s3.amazonaws.com/images/gallery-stock-1.jpeg',
  'https://lyra-labs-development.s3.amazonaws.com/images/gallery-stock-2.jpeg',
  'https://lyra-labs-development.s3.amazonaws.com/images/gallery-stock-3.jpeg',
  'https://lyra-labs-development.s3.amazonaws.com/images/gallery-stock-4.jpeg'
];

const setup = async () => {
  for (let i = 0; i < topics.length; i += 1) {
    await prisma.createTopic(topics[i]);
  }

  for (let i = 0; i < posts.length; i += 1) {
    await prisma.createPost({
      ...posts[i],
      link: 'https://loomx.io/',
      galleryThumbs: { set: galleryThumbs },
      description:
        'Put the outside world on hold – this is all about you and your music. No noise, no wires, no distractions. Just exceptional sound, industry-leading noise cancellation, and hour upon hour of pure listening freedom.'
    });
  }

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
};

setup().then(() => {
  process.exit(0);
});
