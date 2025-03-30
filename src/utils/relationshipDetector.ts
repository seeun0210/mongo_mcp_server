import { Db } from "mongodb";
import { Schema, Relationship } from "./types";

/**
 * 스키마에서 컬렉션 간의 관계를 탐지합니다.
 */
export async function detectRelationships(
  schemas: Record<string, Schema>,
  db: Db
): Promise<Relationship[]> {
  const relationships: Relationship[] = [];

  // 모든 컬렉션의 스키마를 순회하며 관계 찾기
  for (const [sourceColl, sourceSchema] of Object.entries(schemas)) {
    // 스키마의 각 필드 검사
    for (const field of sourceSchema.fields) {
      // ObjectId 필드 확인 (잠재적인 참조)
      if (field.type === "objectId" || field.bsonType === "objectId") {
        // 필드 이름에서 관계 유추 (예: userId -> users)
        const possibleTargetColl = inferCollectionFromFieldName(field.name);

        if (possibleTargetColl && schemas[possibleTargetColl]) {
          relationships.push({
            sourceCollection: sourceColl,
            targetCollection: possibleTargetColl,
            sourceField: field.name,
            targetField: "_id",
            relationType: "1:N", // 기본적으로 1:N 관계로 가정
          });
        }
      }

      // 배열 내부의 ObjectId 확인 (N:M 관계 가능성)
      if (field.type === "array" && field.items) {
        if (
          field.items.type === "objectId" ||
          field.items.bsonType === "objectId"
        ) {
          const possibleTargetColl = inferCollectionFromFieldName(field.name);

          if (possibleTargetColl && schemas[possibleTargetColl]) {
            relationships.push({
              sourceCollection: sourceColl,
              targetCollection: possibleTargetColl,
              sourceField: field.name,
              targetField: "_id",
              relationType: "N:M",
            });
          }
        }
      }
    }
  }

  // 샘플 데이터 분석을 통한 추가 관계 탐지 (옵션)
  // 이 부분은 매우 고급 기능으로, 실제 데이터를 분석하여 암시적 관계를 찾을 수 있음

  return relationships;
}

/**
 * 필드 이름에서 관련 컬렉션 이름을 유추합니다.
 */
function inferCollectionFromFieldName(fieldName: string): string | null {
  // 특수 필드 제외
  if (fieldName === "_id") {
    return null;
  }

  // userId -> users
  if (fieldName.endsWith("Id") && fieldName.length > 2) {
    const base = fieldName.slice(0, -2);
    return pluralize(base);
  }

  // user_id -> users
  if (fieldName.endsWith("_id") && fieldName.length > 3) {
    const base = fieldName.slice(0, -3);
    return pluralize(base);
  }

  // userIds -> users
  if (fieldName.endsWith("Ids") && fieldName.length > 3) {
    const base = fieldName.slice(0, -3);
    return pluralize(base);
  }

  // user_ids -> users
  if (fieldName.endsWith("_ids") && fieldName.length > 4) {
    const base = fieldName.slice(0, -4);
    return pluralize(base);
  }

  return null;
}

/**
 * 단어의 복수형을 반환합니다.
 * 참고: 이 구현은 매우 기본적이며, 실제로는 더 복잡한 복수형 규칙을 고려해야 합니다.
 */
function pluralize(word: string): string {
  // 매우 간단한 영어 복수형 규칙 (실제 애플리케이션에서는 더 정교한 라이브러리 사용 권장)
  if (
    word.endsWith("s") ||
    word.endsWith("x") ||
    word.endsWith("z") ||
    word.endsWith("ch") ||
    word.endsWith("sh")
  ) {
    return word + "es";
  } else if (
    word.endsWith("y") &&
    !["a", "e", "i", "o", "u"].includes(word.charAt(word.length - 2))
  ) {
    return word.slice(0, -1) + "ies";
  } else {
    return word + "s";
  }
}
