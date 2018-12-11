const cookieParser = require('cookie-parser');
// const jwt = require('jsonwebtoken');
const { GraphQLServer } = require('graphql-yoga');
const cors = require('cors');
const { prisma } = require('./prisma-client');
const createServer = require('./create-server');
const { checkJwt } = require('./middleware/jwt');
const { getUser } = require('./middleware/getUser');
const Mutation = require('./resolvers/mutation');
const Query = require('./resolvers/query');

const server = createServer();

// const server = new GraphQLServer({
//   typeDefs: './schema.graphql',
//   resolvers: { Mutation, Query },
//   context: {
//     prisma
//   }
// });

server.express.use(cookieParser());

// decode the JWT so we can get the user Id on each request
// server.express.use((req, res, next) => {
//   // console.log('req.headers', req.headers);
//   // console.log('req.cookies', req.cookies);
//   // const { token } = req.cookies;
//   // console.log('req.cookies', req);
//   // if (token) {
//   //   const { userId } = jwt.verify(token, process.env.APP_SECRET);
//   //   // put the userId onto the req for future requests to access
//   //   req.userId = userId;
//   // }
//   next();
// });

// 2. Create a middleware that populates the user on each request

// Uncomment This Like
server.express.post(
  server.options.endpoint,
  checkJwt,
  (err, req, res, next) => {
    if (err) return res.status(401).send(err.message);
    next();
  }
);
server.express.post(server.options.endpoint, (req, res, next) => {
  console.log('HERE');
  // console.log('req', req)
  // console.log("At get User", req.user);
  // If there is a user on the request (get that)
  getUser(req, res, next, prisma);
  // Otherwise check if there is a cookie to get the user
});

server.start(
  {
    cors: {
      credentials: true,
      origin: 'http://localhost:3000'
    }
  },
  deets => {
    console.log(`Server is now running on port http://localhost:${deets.port}`);
  }
);

// server.express.use(
//   cors({
//     origin: 'http://localhost:3000'
//     // credentials: true,
//     // allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
//   })
// );

// const corsOptions = {
//   origin: 'http://localhost:3000',
//   credentials: true // <-- REQUIRED backend setting
// };
// server.use(cors(corsOptions));
// server.express.use(cors());

// server.start(() => console.log('Server is running on http://localhost:4000'));
