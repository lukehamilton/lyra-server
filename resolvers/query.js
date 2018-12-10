const Query = {
  publishedPosts(root, args, context) {
    return context.prisma.posts({ where: { published: true } });
  },
  post(root, args, context) {
    return context.prisma.post({ id: args.postId });
  },
  // products(root, args, context, info) {
  //   return context.prisma.products({ first: args.first });
  // },
  products(root, args, context, info) {
    // console.log('context.request.user', context.request.user)
    return context.prisma
      .products({ first: args.first, skip: args.skip })
      .$fragment(
        `{ id name slug description imageUrl topics { id  name slug } }`
      );
  },
  topics(root, args, context, info) {
    return context.prisma.topics();
  },
  postsByUser(root, args, context) {
    return context.prisma
      .user({
        id: args.userId
      })
      .posts();
  }
};

module.exports = Query;
