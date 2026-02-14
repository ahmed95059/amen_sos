import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import fs from "fs";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";
import { buildContext } from "./context";

async function main() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "20mb" }));

  const uploadDir = process.env.UPLOAD_DIR || "./uploads";
  fs.mkdirSync(uploadDir, { recursive: true });

  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => buildContext(req),
    })
  );

  const port = Number(process.env.PORT || "4000");
  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));
  console.log(`GraphQL ready at http://localhost:${port}/graphql`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
