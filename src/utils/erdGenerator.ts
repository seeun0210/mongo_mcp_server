import { Schema, Relationship, ERDData, ERDNode, ERDLink } from "./types";

/**
 * MongoDB 스키마와 관계로부터 ERD 다이어그램을 생성합니다.
 */
export function generateERDData(
  schemas: Record<string, Schema>,
  relationships: Relationship[]
): ERDData {
  // 컬렉션을 노드로 변환
  const nodes: ERDNode[] = Object.entries(schemas).map(
    ([collName, schema]) => ({
      id: collName,
      name: collName,
      fields: schema.fields.map((field) => ({
        name: field.name,
        type: field.type,
        required: field.required || false,
      })),
    })
  );

  // 관계를 링크로 변환
  const links: ERDLink[] = relationships.map((rel) => ({
    source: rel.sourceCollection,
    target: rel.targetCollection,
    sourceField: rel.sourceField,
    targetField: rel.targetField,
    type: rel.relationType,
  }));

  return { nodes, links };
}

/**
 * ERD 데이터를 Mermaid 문법으로 변환합니다.
 */
export function generateMermaidDiagram(
  schemas: Record<string, Schema>,
  relationships: Relationship[]
): string {
  // Mermaid ERD 문법으로 다이어그램 생성
  let mermaidCode = "erDiagram\n";

  // 각 엔티티(컬렉션) 추가
  for (const [collName, schema] of Object.entries(schemas)) {
    mermaidCode += `  ${collName} {\n`;

    // 필드 추가
    for (const field of schema.fields) {
      const fieldType = mapMongoTypeToERD(field.type);
      const requiredMark = field.required ? "!" : "";
      mermaidCode += `    ${fieldType}${requiredMark} ${field.name}\n`;
    }

    mermaidCode += "  }\n";
  }

  // 관계 추가
  for (const rel of relationships) {
    const relSymbol = mapRelationTypeToSymbol(rel.relationType);
    mermaidCode += `  ${rel.sourceCollection} ${relSymbol} ${rel.targetCollection} : "${rel.sourceField}"\n`;
  }

  return mermaidCode;
}

/**
 * MongoDB 타입을 ERD 표기법으로 변환
 */
function mapMongoTypeToERD(type: string): string {
  const typeMap: Record<string, string> = {
    string: "string",
    objectId: "string",
    number: "number",
    int: "int",
    double: "float",
    boolean: "boolean",
    date: "datetime",
    array: "array",
    object: "object",
    null: "any",
  };

  return typeMap[type] || "string";
}

/**
 * 관계 타입을 Mermaid 관계 심볼로 변환
 */
function mapRelationTypeToSymbol(relType: string): string {
  switch (relType) {
    case "1:1":
      return "||--||";
    case "1:N":
      return "||--o{";
    case "N:1":
      return "}o--||";
    case "N:M":
      return "}o--o{";
    default:
      return "||--o{";
  }
}
