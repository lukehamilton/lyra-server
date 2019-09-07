const ctxUser = require('../helpers/ctxUser');
const LyraClient = require('../lib/client');
const gql = require('graphql-tag');

const postFields = gql`
  {
    id
    slug
    name
    tagline
    link
    description
    thumbnail
    galleryThumbs
    topics {
      id
      name
      slug
    }
    comments {
      id
      text
      author {
        avatar
        username
        name
      }
      replies {
        id
        text
        author {
          avatar
          username
          name
        }
        replies {
          id
        }
      }
    }
    submitter {
      username
      avatar
      headline
      name
    }
    creators {
      username
      avatar
      headline
      name
    }
    votes(first: 2) {
      id
      user {
        id
      }
    }
  }
`;

const fragment = `{ id slug name tagline link description thumbnail galleryThumbs topics { id name slug} comments { id text } submitter { username avatar headline name } creators { username avatar headline name } votes(first: 2) { id user { id } } }`;

const client = new LyraClient();

const Query = {
  sections(root, args, context, info) {
    return context.prisma
      .sections({ first: args.first, skip: args.skip, after: args.after })
      .$fragment(
        `{ id date posts { id name slug description tagline thumbnail votes { id } topics { id  name slug } }}`
      );
  },
  userSearch(root, { keyword }, context, info) {
    k = keyword.toLowerCase();
    return context.prisma
      .users({
        first: 3,
        where: {
          OR: [{ username_lower_contains: k }, { name_lower_contains: k }]
        }
      })
      .$fragment(`{ id name username avatar }`);
  },

  tokenInfo(root, args, context, info) {
    return { totalSupply: client.tokenSupply() };
  },
  posts(root, args, context, info) {
    return context.prisma
      .posts({ first: args.first, skip: args.skip })
      .$fragment(
        `{ id name slug description tagline  topics { id  name slug } }`
      );
  },
  post(root, { slug, voterCount = 3 }, context, info) {
    return context.prisma.post({ slug }).$fragment(postFields);
  },
  me(root, args, context, info) {
    if (context.request.user) {
      return context.prisma
        .user({ id: ctxUser(context).id })
        .$fragment(
          `{ id email name avatar username followedTopics { id name } }`
        );
    }
  },
  topics(root, args, context, info) {
    return context.prisma.topics();
  }
};

module.exports = Query;
