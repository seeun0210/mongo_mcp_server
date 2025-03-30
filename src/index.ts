import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MongoClient } from "mongodb";
import { z } from "zod";

// Import tools
import { generateErdTool } from "./tools/generateErd";
import { generateQueryTool } from "./tools/generateQuery";

// Get MongoDB connection string
const mongoConnectionString = process.argv[2] || "mongodb://localhost:27017";

// Global variable for MongoDB client
let mongoClient: MongoClient | null = null;

const server = new Server(
  {
    name: "mongo-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
server.setRequestHandler(
  z.object({
    method: z.literal("tools/list"),
  }),
  async () => {
    return {
      tools: [
        {
          name: "generateErd",
          description: "Generate ERD diagram from MongoDB collections",
          inputSchema: {
            type: "object",
            properties: {
              database: { type: "string" },
              collections: {
                type: "array",
                items: { type: "string" },
                optional: true,
              },
              format: {
                type: "string",
                enum: ["mermaid", "json"],
                default: "mermaid",
              },
            },
            required: ["database"],
          },
        },
        {
          name: "generateQuery",
          description: "Generate MongoDB queries from natural language",
          inputSchema: {
            type: "object",
            properties: {
              database: { type: "string" },
              collection: { type: "string" },
              description: { type: "string" },
              type: {
                type: "string",
                enum: ["mongoose", "mongodb"],
                default: "mongodb",
              },
              includeExplanation: {
                type: "boolean",
                default: true,
              },
            },
            required: ["database", "collection", "description"],
          },
        },
      ],
    };
  }
);

// Handle tool execution
server.setRequestHandler(
  z.object({
    method: z.literal("tools/call"),
    params: z.object({
      name: z.string(),
      arguments: z.any(),
    }),
  }),
  async (request) => {
    console.error("Executing tool:", request.params.name);
    const { name, arguments: params } = request.params;

    if (!mongoClient) {
      throw new Error("MongoDB client not connected");
    }

    if (name === "generateErd") {
      const result = await generateErdTool.execute(params, {
        client: mongoClient,
      });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } else if (name === "generateQuery") {
      const result = await generateQueryTool.execute(params, {
        client: mongoClient,
      });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    }
    throw new Error(`Unknown tool: ${name}`);
  }
);

async function main() {
  try {
    // Connect to MongoDB
    console.error("Connecting to MongoDB...");
    mongoClient = new MongoClient(mongoConnectionString);
    await mongoClient.connect();
    console.error("Connected to MongoDB successfully");

    // Start server
    console.error("Starting MCP server...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("MCP server started");

    // Handle shutdown
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  } catch (error) {
    console.error("Error starting server:", error);
    await shutdown();
    process.exit(1);
  }
}

// Shutdown function
async function shutdown() {
  console.error("Shutting down...");
  if (mongoClient) {
    await mongoClient.close();
    mongoClient = null;
  }
  process.exit(0);
}

// Start the server
main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
