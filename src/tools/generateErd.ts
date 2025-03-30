import { z } from "zod";
import { Db, MongoClient } from "mongodb";
import { extractSchemas } from "../utils/schemaExtractor";
import { detectRelationships } from "../utils/relationshipDetector";
import { generateERDData, generateMermaidDiagram } from "../utils/erdGenerator";
import { ToolContext } from "../utils/mcp-types";

// 파라미터 스키마 정의
const parametersSchema = z.object({
  database: z.string().describe("The database name to analyze"),
  collections: z
    .array(z.string())
    .optional()
    .describe(
      "Optional list of specific collections to include in the ERD. If not provided, all collections will be analyzed."
    ),
  format: z
    .enum(["mermaid", "json"])
    .default("mermaid")
    .describe(
      'Output format of the ERD: "mermaid" for Mermaid diagram syntax, "json" for structured data'
    ),
});

// 파라미터 타입 추출
type GenerateErdParameters = z.infer<typeof parametersSchema>;

/**
 * ERD 생성 도구 정의
 */
export const generateErdTool = {
  name: "generateErd",
  description:
    "Generate an Entity-Relationship Diagram (ERD) from MongoDB collections",
  parameters: parametersSchema,
  execute: async (
    params: GenerateErdParameters,
    context: { client: MongoClient }
  ) => {
    try {
      const { database, collections, format } = params;

      // 데이터베이스 연결
      const client = context.client;
      const db = client.db(database);

      // Get all collections or specified ones
      let collectionNames = collections;
      if (!collectionNames) {
        collectionNames = (await db.listCollections().toArray()).map(
          (col) => col.name
        );
      }

      // Analyze schema for each collection
      const schemas: any = {};
      const relationships: any[] = [];

      for (const collectionName of collectionNames) {
        const collection = db.collection(collectionName);
        const sample = await collection.find().limit(10).toArray();

        if (sample.length === 0) continue;

        // Combine schema from all documents
        const schema: any = {};
        for (const doc of sample) {
          analyzeDocument(doc, schema);
        }

        schemas[collectionName] = schema;

        // Find relationships
        Object.entries(schema).forEach(([field, type]: [string, any]) => {
          if (type === "ObjectId" && field !== "_id") {
            const refCollection = field.replace("Id", "s");
            if (collectionNames.includes(refCollection)) {
              relationships.push({
                from: collectionName,
                to: refCollection,
                field,
              });
            }
          }
        });
      }

      // Generate Mermaid ERD
      if (format === "mermaid") {
        let diagram = "erDiagram\n";

        // Add entities
        Object.entries(schemas).forEach(
          ([collection, schema]: [string, any]) => {
            diagram += `  ${collection} {\n`;
            Object.entries(schema).forEach(([field, type]: [string, any]) => {
              if (typeof type === "object") {
                Object.entries(type).forEach(
                  ([subField, subType]: [string, any]) => {
                    diagram += `    ${subType} ${field}.${subField}\n`;
                  }
                );
              } else {
                diagram += `    ${type} ${field}${
                  field === "_id" ? "!" : ""
                }\n`;
              }
            });
            diagram += "  }\n";
          }
        );

        // Add relationships
        relationships.forEach((rel) => {
          diagram += `  ${rel.from} ||--o{ ${rel.to} : "${rel.field}"\n`;
        });

        return {
          success: true,
          format: "mermaid",
          diagram,
          stats: {
            collections: Object.keys(schemas).length,
            relationships: relationships.length,
          },
        };
      }

      return {
        success: true,
        format: "json",
        schemas,
        relationships,
        stats: {
          collections: Object.keys(schemas).length,
          relationships: relationships.length,
        },
      };
    } catch (error: any) {
      console.error("Error generating ERD:", error);
      return {
        success: false,
        error: `Failed to generate ERD: ${error.message}`,
      };
    }
  },
};

function analyzeDocument(doc: any, schema: any, prefix = "") {
  Object.entries(doc).forEach(([key, value]) => {
    const fieldName = prefix ? `${prefix}.${key}` : key;

    if (value === null) {
      schema[fieldName] = "null";
    } else if (Array.isArray(value)) {
      if (
        value.length > 0 &&
        typeof value[0] === "object" &&
        value[0] !== null
      ) {
        analyzeDocument(value[0], schema, `${fieldName}[]`);
      }
      schema[fieldName] = "array";
    } else if (value instanceof require("mongodb").ObjectId) {
      schema[fieldName] = "ObjectId";
    } else if (value instanceof Date) {
      schema[fieldName] = "Date";
    } else if (typeof value === "object") {
      const subSchema: any = {};
      analyzeDocument(value, subSchema);
      schema[fieldName] = subSchema;
    } else {
      schema[fieldName] = typeof value;
    }
  });
}
