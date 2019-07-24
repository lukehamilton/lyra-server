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
  async votesCount(root, args, context, info) {
    const votes = await context.prisma
      .votesConnection({
        where: { post: { id: root.id } }
      })
      .$fragment(`{ aggregate { count } }`);
    return votes.aggregate.count;
  }
};

module.exports = Post;
