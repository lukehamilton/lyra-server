const Comment = {
  async votesCount(root, args, context, info) {
    const votes = await context.prisma
      .commentVotesConnection({
        where: { comment: { id: root.id } }
      })
      .$fragment(`{ aggregate { count } }`);
    return votes.aggregate.count;
  }
};

module.exports = Comment;
