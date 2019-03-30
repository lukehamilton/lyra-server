const ctxUser = ctx => ctx.request.user;

const Post = {
  async upvoted(root, args, context, info) {
    const currentUser = ctxUser(context);
    if (currentUser) {
      const voteExists = await context.prisma.$exists.vote({
        user: { id: currentUser.id },
        post: { id: root.id }
      });
      console.log('voteExists', voteExists);
      if (voteExists) {
        return true;
      }
    }
    return false;
  }
};

module.exports = Post;
