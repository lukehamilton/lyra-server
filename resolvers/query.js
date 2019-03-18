const ctxUser = ctx => ctx.request.user;

const Query = {
  // publishedPosts(root, args, context) {
  //   return context.prisma.posts({ where: { published: true } });
  // },
  // post(root, args, context) {
  //   return context.prisma.post({ id: args.postId });
  // },
  // products(root, args, context, info) {
  //   return context.prisma.products({ first: args.first });
  // },
  posts(root, args, context, info) {
    console.log('posts query');
    // console.log('context.request.user', context.request.user)
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
    // return { data: { me: null } };
  },
  topics(root, args, context, info) {
    return context.prisma.topics();
  }
  // postsByUser(root, args, context) {
  //   return context.prisma
  //     .user({
  //       id: args.userId
  //     })
  //     .posts();
  // }
};

module.exports = Query;
