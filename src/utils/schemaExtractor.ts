import { Db, Collection } from "mongodb";
import { Field, Schema } from "./types";

/**
 * MongoDB 컬렉션에서 스키마를 추출합니다.
 */
export async function extractSchema(
  db: Db,
  collectionName: string
): Promise<Schema> {
  const collection = db.collection(collectionName);

  // 컬렉션에서 샘플 문서 가져오기 (최대 100개)
  const sampleDocs = await collection.find().limit(100).toArray();

  if (sampleDocs.length === 0) {
    return { fields: [] };
  }

  // 문서들을 분석하여 스키마 추출
  const fields = new Map<string, Field>();

  for (const doc of sampleDocs) {
    analyzeDocument(doc, "", fields);
  }

  return {
    fields: Array.from(fields.values()),
  };
}

/**
 * 모든 컬렉션의 스키마를 추출합니다.
 */
export async function extractSchemas(
  db: Db,
  collectionNames?: string[]
): Promise<Record<string, Schema>> {
  if (!collectionNames) {
    // 지정된 컬렉션이 없으면 모든 컬렉션 가져오기
    const collections = await db.listCollections().toArray();
    collectionNames = collections.map((c) => c.name);
  }

  const schemas: Record<string, Schema> = {};

  for (const name of collectionNames) {
    schemas[name] = await extractSchema(db, name);
  }

  return schemas;
}

/**
 * 문서를 재귀적으로 분석하여 필드 정보를 추출합니다.
 */
function analyzeDocument(
  doc: any,
  prefix: string,
  fields: Map<string, Field>
): void {
  for (const [key, value] of Object.entries(doc)) {
    const fieldName = prefix ? `${prefix}.${key}` : key;

    // _id 필드는 특별히 처리
    if (key === "_id") {
      fields.set(fieldName, {
        name: fieldName,
        type: "objectId",
        bsonType: "objectId",
        required: true,
      });
      continue;
    }

    if (value === null) {
      // null 값은 타입을 알 수 없으므로 'null'로 표시
      fields.set(fieldName, {
        name: fieldName,
        type: "null",
      });
    } else if (Array.isArray(value)) {
      // 배열인 경우
      const field: Field = {
        name: fieldName,
        type: "array",
      };

      // 배열의 첫 번째 요소를 분석하여 항목 타입 결정
      if (value.length > 0) {
        const firstItem = value[0];
        if (firstItem === null) {
          field.items = { type: "null" };
        } else if (typeof firstItem === "object") {
          field.items = { type: "object" };
          // 중첩 객체 분석
          analyzeDocument(firstItem, `${fieldName}[]`, fields);
        } else {
          field.items = { type: typeof firstItem };
        }
      }

      fields.set(fieldName, field);
    } else if (typeof value === "object") {
      // 객체인 경우 (중첩 문서)
      fields.set(fieldName, {
        name: fieldName,
        type: "object",
      });

      // 중첩 객체 분석
      analyzeDocument(value, fieldName, fields);
    } else {
      // 기본 타입 (문자열, 숫자, 불리언 등)
      fields.set(fieldName, {
        name: fieldName,
        type: typeof value,
      });
    }
  }
}
