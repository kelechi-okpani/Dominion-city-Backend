import 'dotenv/config';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import cors from 'cors';
import bodyParser from 'body-parser';
import { graphqlUploadExpress, GraphQLUpload } from 'graphql-upload-ts';

// Local imports
import { connectDB } from './config/db.js';
import { typeDefs, resolvers } from './modules/index.js';
import { createContext } from './context.js';
import { IResolverContext } from './context.js'; 
import './jobs/instagram-sync.js';


const startServer = async () => {
  const app = express();
  const PORT = Number(process.env.PORT) || 4000;

  try {
    await connectDB();
    console.log('✅ Database connection established.');

    const server = new ApolloServer<IResolverContext>({
      typeDefs,
    resolvers: {
        Upload: GraphQLUpload, // 1. CRITICAL: Ensure the Upload scalar is explicitly registered here
        ...resolvers,
      },
      introspection: true, 
      csrfPrevention: false,
    });

    await server.start();

    // 1. Global Middlewares (Move these above the routes)
    // app.use(cors<cors.CorsRequest>());
    // 1. UPDATED CORS CONFIGURATION
    app.use(cors({
      origin: [
        'http://localhost:3000', 
        'https://dominion-city-sayv.vercel.app/', 
        'https://studio.apollographql.com'      // Allows Apollo Sandbox to work
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

    // app.use(express.json()); // Use native express.json() instead of body-parser


    // 2. Base Routes
    app.get('/', (_req, res) => {
      res.status(200).json({
        message: "Welcome to the DC-Workforce-Backend API",
        client: "/graphql",
        health: "/health"
      });
    });

    app.get('/health', (_req, res) => {
      res.status(200).json({ 
        status: 'UP', 
        service: 'DC-Workforce-Backend',
        timestamp: new Date().toISOString() 
      });
    });

    app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 1 }));
    // 3. Apollo Middleware
  
    app.use(
      '/graphql',
      express.json(),
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

// Global Error Handling for Unhandled Rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

