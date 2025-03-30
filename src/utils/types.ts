/**
 * 필드 정보를 나타내는 인터페이스
 */
export interface Field {
  name: string;
  type: string;
  bsonType?: string;
  required?: boolean;
  items?: {
    type: string;
    bsonType?: string;
  };
}

/**
 * 스키마 정보를 나타내는 인터페이스
 */
export interface Schema {
  fields: Field[];
}

/**
 * 관계 정보를 나타내는 인터페이스
 */
export interface Relationship {
  sourceCollection: string;
  targetCollection: string;
  sourceField: string;
  targetField: string;
  relationType: "1:1" | "1:N" | "N:1" | "N:M";
}

/**
 * ERD 생성 시 사용되는 노드 정보
 */
export interface ERDNode {
  id: string;
  name: string;
  fields: {
    name: string;
    type: string;
    required?: boolean;
  }[];
}

/**
 * ERD 생성 시 사용되는 링크(관계) 정보
 */
export interface ERDLink {
  source: string;
  target: string;
  sourceField: string;
  targetField: string;
  type: string;
}

/**
 * ERD 데이터 인터페이스
 */
export interface ERDData {
  nodes: ERDNode[];
  links: ERDLink[];
}
