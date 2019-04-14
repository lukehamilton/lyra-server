const LyraClient = require('../lib/client');

const getLyraClient = async (req, res, next, prisma) => {
  req.lyraClient = new LyraClient();
  next();
};

module.exports = { getLyraClient };
