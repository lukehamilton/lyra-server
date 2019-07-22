const ctxUser = ctx => ctx.request.user;

const Post = {
  async upvoted(root, args, context, info) {
    const currentUser = ctxUser(context);
    if (currentUser) {
      const voteExists = await context.prisma.$exists.vote({
        user: { id: currentUser.id },
        post: { id: root.id }
      });
      if (voteExists) {
        return true;
      }
    }
    return false;
  },
  // votesCount: {
  //   fragment: `fragment Votes on Post { id }`,
  //   resolve: async ({ id }, args, context, info) => {
  //     // console.log('context.prisma', context.prisma.votes);
  //     const votes = await context.prisma.votesConnection(
  //       { where: { post: { id } } },
  //       `{ aggregate { count } }`
  //     );
  //     // return votes.aggregate.count;
  //     // return 420;
  //   }
  // }

  async votesCount(root, args, context, info) {
    console.log('context.prisma', context.prisma.votesConnection);
    const votes = await context.prisma
      .votesConnection({
        where: { post: { id: root.id } }
      })
      .$fragment(`{ aggregate { count } }`);
    // const votes = await context.prisma.votesConnection(
    //   { post: { id: root.id } },
    //   `{ aggregate { count } }`
    // );
    console.log('votes', votes);
    return votes.aggregate.count;
  }
};

module.exports = Post;
