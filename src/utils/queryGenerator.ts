import { Schema } from "./types";

/**
 * Mongoose 쿼리 결과 인터페이스
 */
export interface MongooseQueryResult {
  model: string;
  method: string;
  filter?: any;
  projection?: any;
  options?: any;
  update?: any;
  code: string;
  explanation?: string;
}

/**
 * MongoDB 드라이버 쿼리 결과 인터페이스
 */
export interface MongoDBQueryResult {
  collection: string;
  method: string;
  filter?: any;
  projection?: any;
  options?: any;
  update?: any;
  code: string;
  explanation?: string;
}

/**
 * 자연어 설명으로부터 Mongoose 쿼리를 생성합니다.
 * 실제 프로덕션에서는 LLM API를 사용하여 구현하는 것이 좋습니다.
 */
export function generateMongooseQuery(
  description: string,
  collectionName: string,
  schema: Schema,
  includeExplanation: boolean = true
): MongooseQueryResult {
  // 기본 예시 구현 - 실제로는 자연어 처리 또는 LLM을 사용하여 더 정교하게 구현 가능
  // 이 예시는 모델과 필터링 방법을 보여주는 것이 목적입니다

  // 모델 이름 생성 (복수형->단수형, 카멜케이스 변환)
  const modelName = singularize(collectionName);
  const model = capitalizeFirstLetter(modelName);

  // 설명에서 키워드를 찾아 적절한 쿼리 작성
  let method = "find";
  let filter = {};
  let explanation = "";

  const lowerDescription = description.toLowerCase();

  // 간단한 쿼리 분석 로직 (실제로는 더 복잡한 NLP나 LLM 필요)
  if (lowerDescription.includes("id") || lowerDescription.includes("_id")) {
    method = "findById";
    filter = "614c5ca4b86f1c1d401a0e0f"; // 예시 ID
    explanation = `This query finds a document by its ID. Replace with your actual ID.`;
  } else if (
    lowerDescription.includes("find all") ||
    lowerDescription.includes("get all")
  ) {
    method = "find";
    filter = {};
    explanation = `This query returns all documents in the ${collectionName} collection.`;
  } else if (lowerDescription.includes("count")) {
    method = "countDocuments";
    filter = {};
    explanation = `This query counts all documents in the ${collectionName} collection.`;
  } else if (lowerDescription.includes("update")) {
    method = "updateOne";
    filter = { field: "value" };
    explanation = `This query updates a single document in the ${collectionName} collection.`;
  } else if (
    lowerDescription.includes("delete") ||
    lowerDescription.includes("remove")
  ) {
    method = "deleteOne";
    filter = { field: "value" };
    explanation = `This query deletes a single document from the ${collectionName} collection.`;
  } else if (
    lowerDescription.includes("create") ||
    lowerDescription.includes("add") ||
    lowerDescription.includes("insert")
  ) {
    method = "create";
    explanation = `This query creates a new document in the ${collectionName} collection.`;
  }

  // 코드 생성
  let code: string;
  if (method === "findById") {
    code = `${model}.${method}('614c5ca4b86f1c1d401a0e0f');`;
  } else if (method === "create") {
    const sampleObj = generateSampleObject(schema);
    code = `${model}.${method}(${JSON.stringify(sampleObj, null, 2)});`;
  } else if (method === "updateOne") {
    code = `${model}.${method}({ field: 'value' }, { $set: { field: 'new value' } });`;
  } else {
    code = `${model}.${method}(${JSON.stringify(filter)});`;
  }

  return {
    model,
    method,
    filter,
    code,
    ...(includeExplanation ? { explanation } : {}),
  };
}

/**
 * 자연어 설명으로부터 MongoDB 드라이버 쿼리를 생성합니다.
 */
export function generateMongoDBQuery(
  description: string,
  collectionName: string,
  schema: Schema,
  includeExplanation: boolean = true
): MongoDBQueryResult {
  // 기본 예시 구현 - 실제로는 자연어 처리 또는 LLM을 사용하여 더 정교하게 구현 가능

  // 설명에서 키워드를 찾아 적절한 쿼리 작성
  let method = "find";
  let filter = {};
  let explanation = "";

  const lowerDescription = description.toLowerCase();

  // 간단한 쿼리 분석 로직
  if (lowerDescription.includes("id") || lowerDescription.includes("_id")) {
    method = "findOne";
    filter = { _id: "614c5ca4b86f1c1d401a0e0f" }; // 예시 ID
    explanation = `This query finds a document by its ID. Replace with your actual ID.`;
  } else if (
    lowerDescription.includes("find all") ||
    lowerDescription.includes("get all")
  ) {
    method = "find";
    filter = {};
    explanation = `This query returns all documents in the ${collectionName} collection.`;
  } else if (lowerDescription.includes("count")) {
    method = "countDocuments";
    filter = {};
    explanation = `This query counts all documents in the ${collectionName} collection.`;
  } else if (lowerDescription.includes("update")) {
    method = "updateOne";
    filter = { field: "value" };
    explanation = `This query updates a single document in the ${collectionName} collection.`;
  } else if (
    lowerDescription.includes("delete") ||
    lowerDescription.includes("remove")
  ) {
    method = "deleteOne";
    filter = { field: "value" };
    explanation = `This query deletes a single document from the ${collectionName} collection.`;
  } else if (
    lowerDescription.includes("create") ||
    lowerDescription.includes("add") ||
    lowerDescription.includes("insert")
  ) {
    method = "insertOne";
    explanation = `This query creates a new document in the ${collectionName} collection.`;
  }

  // 코드 생성
  let code: string;
  if (method === "find" || method === "findOne") {
    code = `db.collection('${collectionName}').${method}(${JSON.stringify(
      filter
    )});`;
  } else if (method === "insertOne") {
    const sampleObj = generateSampleObject(schema);
    code = `db.collection('${collectionName}').${method}(${JSON.stringify(
      sampleObj,
      null,
      2
    )});`;
  } else if (method === "updateOne") {
    code = `db.collection('${collectionName}').${method}({ field: 'value' }, { $set: { field: 'new value' } });`;
  } else {
    code = `db.collection('${collectionName}').${method}(${JSON.stringify(
      filter
    )});`;
  }

  return {
    collection: collectionName,
    method,
    filter,
    code,
    ...(includeExplanation ? { explanation } : {}),
  };
}

/**
 * 스키마를 기반으로 샘플 객체 생성
 */
function generateSampleObject(schema: Schema): Record<string, any> {
  const result: Record<string, any> = {};

  for (const field of schema.fields) {
    // _id 필드는 생략
    if (field.name === "_id") continue;

    // 중첩 필드는 처리하지 않음 (예: user.name)
    if (field.name.includes(".")) continue;

    // 필드 타입에 따라 적절한 값 할당
    switch (field.type) {
      case "string":
        result[field.name] = `Sample ${field.name}`;
        break;
      case "number":
        result[field.name] = 42;
        break;
      case "boolean":
        result[field.name] = true;
        break;
      case "date":
        result[field.name] = new Date().toISOString();
        break;
      case "objectId":
        result[field.name] = "614c5ca4b86f1c1d401a0e0f";
        break;
      case "array":
        result[field.name] = [];
        break;
      case "object":
        result[field.name] = {};
        break;
      default:
        result[field.name] = null;
    }
  }

  return result;
}

/**
 * 문자열의 첫 글자를 대문자로 변환
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 복수형 단어를 단수형으로 변환 (매우 기본적인 구현)
 */
function singularize(word: string): string {
  if (word.endsWith("ies")) {
    return word.slice(0, -3) + "y";
  } else if (word.endsWith("es")) {
    return word.slice(0, -2);
  } else if (word.endsWith("s") && !word.endsWith("ss")) {
    return word.slice(0, -1);
  }
  return word;
}
