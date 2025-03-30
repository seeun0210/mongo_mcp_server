import { MongoClient } from "mongodb";

export const generateQueryTool = {
  parameters: {
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

  async execute(params: any, context: { client: MongoClient }) {
    const {
      database,
      collection,
      description,
      type = "mongodb",
      includeExplanation = true,
    } = params;

    try {
      // 데이터베이스 분석
      const dbAnalysis = await analyzeDatabaseStructure(
        database,
        collection,
        context.client
      );

      // AI에게 쿼리 생성 요청
      const aiRequest = {
        task: "generate_mongodb_query",
        user_description: description,
        database_info: {
          name: database,
          collection: collection,
          structure: dbAnalysis,
        },
        query_type: type,
      };

      // TODO: AI 서비스 호출 구현
      // const aiResponse = await callAIService(aiRequest);
      // return aiResponse;

      // 임시 에러 응답 (AI 서비스 연동 전까지)
      return {
        success: false,
        error: "AI query generation service not implemented yet",
      };
    } catch (error) {
      console.error("Error analyzing database:", error);
      return {
        success: false,
        error: "Failed to analyze database structure",
      };
    }
  },
};

interface FieldInfo {
  type: string;
  isArray?: boolean;
  references?: {
    collection: string;
    field: string;
  };
  sample?: any;
}

interface CollectionAnalysis {
  name: string;
  fields: { [key: string]: FieldInfo };
  relationships: {
    [key: string]: {
      type: "one-to-many" | "many-to-one" | "many-to-many";
      collection: string;
      through?: string;
    };
  };
  sampleData: any[];
}

async function analyzeDatabaseStructure(
  database: string,
  collection: string,
  client: MongoClient
): Promise<CollectionAnalysis> {
  const db = client.db(database);
  const coll = db.collection(collection);

  // 샘플 데이터 수집
  const sampleData = await coll.find().limit(10).toArray();
  if (sampleData.length === 0) {
    throw new Error(`No documents found in collection ${collection}`);
  }

  // 필드 분석
  const fields: { [key: string]: FieldInfo } = {};
  const relationships: CollectionAnalysis["relationships"] = {};

  // 모든 컬렉션 이름 가져오기
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);

  // 필드 및 관계 분석
  for (const doc of sampleData) {
    analyzeDocument(doc, "", fields, relationships, collectionNames);
  }

  // 관계 검증 및 보완
  for (const [field, info] of Object.entries(fields)) {
    if (field.endsWith("Id") && info.type === "ObjectId") {
      const refCollection = field.slice(0, -2) + "s";
      if (collectionNames.includes(refCollection)) {
        relationships[field] = {
          type: "many-to-one",
          collection: refCollection,
        };
      }
    }
  }

  return {
    name: collection,
    fields,
    relationships,
    sampleData,
  };
}

function analyzeDocument(
  doc: any,
  prefix: string,
  fields: { [key: string]: FieldInfo },
  relationships: CollectionAnalysis["relationships"],
  collectionNames: string[],
  parentField: string = ""
) {
  for (const [key, value] of Object.entries(doc)) {
    const fieldName = prefix ? `${prefix}.${key}` : key;

    if (value === null) {
      fields[fieldName] = { type: "null" };
      continue;
    }

    if (Array.isArray(value)) {
      fields[fieldName] = {
        type: value.length > 0 ? typeof value[0] : "any",
        isArray: true,
        sample: value[0],
      };
      if (value.length > 0 && typeof value[0] === "object") {
        analyzeDocument(
          value[0],
          `${fieldName}[]`,
          fields,
          relationships,
          collectionNames,
          fieldName
        );
      }
      continue;
    }

    if (value instanceof require("mongodb").ObjectId) {
      fields[fieldName] = { type: "ObjectId" };
      const possibleRefCollection = key.endsWith("Id")
        ? key.slice(0, -2) + "s"
        : null;
      if (
        possibleRefCollection &&
        collectionNames.includes(possibleRefCollection)
      ) {
        fields[fieldName].references = {
          collection: possibleRefCollection,
          field: "_id",
        };
      }
      continue;
    }

    if (value instanceof Date) {
      fields[fieldName] = { type: "Date", sample: value };
      continue;
    }

    if (typeof value === "object") {
      fields[fieldName] = { type: "object" };
      analyzeDocument(
        value,
        fieldName,
        fields,
        relationships,
        collectionNames,
        key
      );
      continue;
    }

    fields[fieldName] = { type: typeof value, sample: value };
  }
}

// TODO: AI 서비스 호출 함수 구현
// async function callAIService(request: any) {
//   // AI 서비스 호출 로직
//   // 예: OpenAI API 호출
// }

// 임시로 기존 함수들 유지 (AI 서비스 연동 전까지)
async function generateQueryConditions(
  description: string,
  dbAnalysis: CollectionAnalysis
) {
  const conditions: any = {};

  // 날짜 관련 필드 찾기
  const dateFields = Object.entries(dbAnalysis.fields)
    .filter(([_, info]) => info.type === "Date")
    .map(([field]) => field);

  // 날짜 조건 분석
  if (description.includes("오늘") && dateFields.length > 0) {
    conditions.date = {
      type: "today",
      field: dateFields.find((f) => f.includes("createdAt")) || dateFields[0],
    };
  } else if (description.includes("이후") && dateFields.length > 0) {
    conditions.date = {
      type: "after",
      value: new Date(),
      field: dateFields.find((f) => f.includes("createdAt")) || dateFields[0],
    };
  }

  // 관계 분석
  for (const [field, rel] of Object.entries(dbAnalysis.relationships)) {
    if (description.includes("쓴") || description.includes("작성")) {
      conditions.join = {
        from: rel.collection,
        localField: "_id",
        foreignField: field,
        type: rel.type,
      };
    }
  }

  // 필드 조건 분석
  for (const [field, info] of Object.entries(dbAnalysis.fields)) {
    if (description.toLowerCase().includes(field.toLowerCase())) {
      if (!conditions.fields) conditions.fields = [];
      conditions.fields.push({
        name: field,
        type: info.type,
      });
    }
  }

  return conditions;
}

function generateMongoQuery(conditions: any, dbAnalysis: CollectionAnalysis) {
  const query: any = {};
  const pipeline: any[] = [];

  // 날짜 조건 처리
  if (conditions.date) {
    if (conditions.date.type === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query[conditions.date.field] = { $gte: today };
    } else if (conditions.date.type === "after") {
      query[conditions.date.field] = { $gte: conditions.date.value };
    }
  }

  // 조인 처리
  if (conditions.join) {
    pipeline.push({
      $lookup: {
        from: conditions.join.from,
        localField: conditions.join.localField,
        foreignField: conditions.join.foreignField,
        as: conditions.join.from,
      },
    });

    // 조인된 데이터 필터링
    if (conditions.date) {
      pipeline.push({
        $match: {
          [`${conditions.join.from}.${conditions.date.field}`]:
            query[conditions.date.field],
        },
      });
    }

    // 필드 선택
    if (conditions.fields) {
      const projection: any = {};
      conditions.fields.forEach((field: any) => {
        projection[field.name] = 1;
      });
      pipeline.push({ $project: projection });
    }
  }

  if (pipeline.length > 0) {
    return `db.${dbAnalysis.name}.aggregate(${JSON.stringify(
      pipeline,
      null,
      2
    )})`;
  }

  return `db.${dbAnalysis.name}.find(${JSON.stringify(query, null, 2)})`;
}
