const ctxUser = ctx => ctx.request.user;

const Query = {
  sections(root, args, context, info) {
    return context.prisma
      .sections({ first: args.first, skip: args.skip, after: args.after })
      .$fragment(
        `{ id date posts { id name slug description thumbnail votesCount topics { id  name slug } }}`
      );
  },
  posts(root, args, context, info) {
    return context.prisma
      .posts({ first: args.first, skip: args.skip })
      .$fragment(
        `{ id name slug description imageUrl topics { id  name slug } }`
      );
  },
  me(root, args, context, info) {
    if (context.request.user) {
      return context.prisma
        .user({ id: ctxUser(context).id })
        .$fragment(`{ id email name avatar followedTopics { id name } }`);
    }
  },
  topics(root, args, context, info) {
    return context.prisma.topics();
  }
};

module.exports = Query;
