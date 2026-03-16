import 'dotenv/config';
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import cors from 'cors';
import bodyParser from 'body-parser';

// Local imports
import { connectDB } from './config/db.js';
import { typeDefs, resolvers } from './modules/index.js';
import { createContext } from './context.js';
import { IResolverContext } from './context.js'; // Ensure this matches your context file export
import './jobs/instagram-sync.js';

const startServer = async () => {
  const app = express();
  const PORT = Number(process.env.PORT) || 4000;

  try {
    // 1. Establish Database Connection
    await connectDB();
    console.log('✅ Database connection established.');

    // 2. Initialize Apollo Server
    // Passing IResolverContext as a generic ensures type safety in your resolvers
    const server = new ApolloServer<IResolverContext>({
      typeDefs,
      resolvers,
      introspection: process.env.NODE_ENV !== 'production',
    });

    // 3. Start Apollo
    await server.start();


       app.get('/', (_req, res) => {
      res.status(200).json({
        message: "Welcome to the DC-Workforce-Backend API",
        client: "/graphql", // if you have Swagger/OpenAPI
        health: "/health"
      });
    });

    // 4. Apply Middlewares
    // We apply CORS and JSON parsing specifically to the /graphql endpoint
    app.use(
      '/graphql',
      cors<cors.CorsRequest>(),
       bodyParser.json(),
      expressMiddleware(server, {
        context: async ({ req }) => createContext({ req }),
      })
    );

 

    // 5. REST Health Check (Good for monitoring Abuja HQ uptime)
    app.get('/health', (_req, res) => {
      res.status(200).json({ 
        status: 'UP', 
        service: 'DC-Workforce-Backend',
        timestamp: new Date().toISOString() 
      });
    });

    

    // 6. Start the Express Listener
    app.listen(PORT, () => {
      console.log(`
          🚀 DC-Workforce Server Ready
          📡 Endpoint: http://localhost:${PORT}/graphql
          🛠️  Environment: ${process.env.NODE_ENV || 'development'}
                `);
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

