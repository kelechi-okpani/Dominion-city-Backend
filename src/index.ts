import 'dotenv/config';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import cors from 'cors';
import { graphqlUploadExpress, GraphQLUpload } from 'graphql-upload-ts';
import dns from 'node:dns';

// Local imports
import { connectDB } from './config/db.js';
import { typeDefs, resolvers } from './modules/index.js';
import { createContext } from './context.js';
import { IResolverContext } from './context.js'; 
// import './jobs/instagram-sync.js';
import { handleImageProxy } from './jobs/image-proxy.js';

dns.setDefaultResultOrder('ipv4first');

const startServer = async () => {
  const app = express();
  const PORT = Number(process.env.PORT) || 4000;

  try {
    await connectDB();
    console.log('✅ Database connection established.');

    const { syncInstagramFeed } = await import('./jobs/instagram-sync.js');
    // syncInstagramFeed();
    await syncInstagramFeed();

    const server = new ApolloServer<IResolverContext>({
      typeDefs,
      resolvers: {
        Upload: GraphQLUpload,
        ...resolvers,
      },
      introspection: true, 
      csrfPrevention: false, // Set to true in production for security
    });

    await server.start();

    // 1. CORS CONFIGURATION (CRITICAL: Must be the very first middleware)
    app.use(cors({
      origin: [
        'http://localhost:3000', 
        'https://dominion-city-sayv.vercel.app', // REMOVED trailing slash (Vercel strictly matches without /)
        'https://studio.apollographql.com'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'x-apollo-operation-name', 
        'apollo-require-preflight'
      ]
    }));

    // 2. PARSERS (Apply before routes)
    app.use(express.json()); 
    // Handle file uploads
    app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));

    // 3. BASE ROUTES
    app.get('/', (_req, res) => {
      res.status(200).json({ message: "DC-Workforce-Backend API Active" });
    });

    app.get('/health', (_req, res) => {
      res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
    });

    // 4. IMAGE PROXY ROUTE
    app.get('/api/proxy-image', handleImageProxy);
    
    // 5. APOLLO MIDDLEWARE
    app.use(
      '/graphql',
      expressMiddleware(server, {
        context: async ({ req }) => createContext({ req }),
      })
    );

    app.listen(PORT, () => {
      console.log(`🚀 DC-Workforce Server Ready at port ${PORT}`);
    });

  } catch (error) {
    console.error("💥 Failed to initialize server:", error);
    process.exit(1); 
  }
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

// import 'dotenv/config';
// import express from 'express';
// import { ApolloServer } from '@apollo/server';
// import { expressMiddleware } from '@as-integrations/express4';
// import cors from 'cors';
// import bodyParser from 'body-parser';
// import { graphqlUploadExpress, GraphQLUpload } from 'graphql-upload-ts';

// // Local imports
// import { connectDB } from './config/db.js';
// import { typeDefs, resolvers } from './modules/index.js';
// import { createContext } from './context.js';
// import { IResolverContext } from './context.js'; 
// import './jobs/instagram-sync.js';

// import dns from 'node:dns';
// import { handleImageProxy } from './jobs/image-proxy.js';
// dns.setDefaultResultOrder('ipv4first');

// const startServer = async () => {
//   const app = express();
//   const PORT = Number(process.env.PORT) || 4000;

//   try {
//     await connectDB();
//     console.log('✅ Database connection established.');

//     const server = new ApolloServer<IResolverContext>({
//       typeDefs,
//     resolvers: {
//         Upload: GraphQLUpload, // 1. CRITICAL: Ensure the Upload scalar is explicitly registered here
//         ...resolvers,
//       },
//       introspection: true, 
//       csrfPrevention: false,
//     });

//     await server.start();

//     // 1. Global Middlewares (Move these above the routes)
//     // app.use(cors<cors.CorsRequest>());
//     // 1. UPDATED CORS CONFIGURATION
//     app.use(cors({
//       origin: [
//         'http://localhost:3000', 
//         'https://dominion-city-sayv.vercel.app/', 
//         'https://studio.apollographql.com'  ,    
//         'https://apify/instagram-scraper'  ,    
//         'https://www.instagram.com/dominion_city_abuja?igsh=cGJrbDJpMmJ3bXVk',

//       ],
//       credentials: true,
//       methods: ['GET', 'POST', 'OPTIONS'],
//       allowedHeaders: [
//         'Content-Type', 
//         'Authorization', 
//         'x-apollo-operation-name', 
//         'apollo-require-preflight'
//       ]
//     }));

//     // app.use(express.json()); // Use native express.json() instead of body-parser


//     // 2. Base Routes
//     app.get('/', (_req, res) => {
//       res.status(200).json({
//         message: "Welcome to the DC-Workforce-Backend API",
//         client: "/graphql",
//         health: "/health"
//       });
//     });


//     app.get('/health', (_req, res) => {
//       res.status(200).json({ 
//         status: 'UP', 
//         service: 'DC-Workforce-Backend',
//         timestamp: new Date().toISOString() 
//       });
//     });

//     app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));
//     // 3. Apollo Middleware
  
//     app.get('/api/proxy-image', handleImageProxy);
    
//     app.use(
//       '/graphql',
//       express.json(),
//       expressMiddleware(server, {
//         context: async ({ req }) => createContext({ req }),
//       })
//     );

//     app.listen(PORT, () => {
//       console.log(`🚀 DC-Workforce Server Ready at port ${PORT}`);
//     });

//   } catch (error) {
//     console.error("💥 Failed to initialize server:", error);
//     process.exit(1); 
//   }
// };

// // Global Error Handling for Unhandled Rejections
// process.on('unhandledRejection', (reason, promise) => {
//   console.error('Unhandled Rejection at:', promise, 'reason:', reason);
// });

// startServer();

