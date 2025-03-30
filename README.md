# MongoDB MCP Server

MongoDB 데이터베이스를 위한 Model Context Protocol (MCP) 서버입니다. 이 서버는 MongoDB 데이터베이스의 구조를 분석하고, AI를 활용하여 쿼리를 생성하는 기능을 제공합니다.

## 기능

### 1. ERD 생성 (generateErd)

데이터베이스의 컬렉션 구조를 분석하여 ERD(Entity Relationship Diagram)를 생성합니다.

- **입력 파라미터**:

  ```json
  {
    "database": "string",
    "collections": ["string"],  // 선택적
    "format": "mermaid" | "json"  // 기본값: "mermaid"
  }
  ```

- **사용 예시**:
  ```json
  {
    "database": "test",
    "format": "mermaid"
  }
  ```

### 2. 쿼리 생성 (generateQuery)

자연어 설명을 기반으로 MongoDB 쿼리를 생성합니다. 데이터베이스의 실제 구조를 분석하여 정확한 쿼리를 생성합니다.

- **입력 파라미터**:

  ```json
  {
    "database": "string",
    "collection": "string",
    "description": "string",
    "type": "mongodb" | "mongoose",  // 기본값: "mongodb"
    "includeExplanation": boolean  // 기본값: true
  }
  ```

- **사용 예시**:
  ```json
  {
    "database": "test",
    "collection": "users",
    "description": "오늘 가입한 사용자 찾기",
    "type": "mongodb"
  }
  ```

## 설치 및 실행

1. 의존성 설치:

   ```bash
   npm install
   ```

2. 빌드:

   ```bash
   npm run build
   ```

3. 서버 실행:
   ```bash
   node dist/index.js "mongodb://localhost:27017"
   ```

## Claude Desktop 설정

macOS에서 Claude Desktop과 함께 사용하려면 다음과 같이 설정하세요:

1. 설정 파일 위치: `~/Library/Application Support/Claude/claude_desktop_config.json`

2. MCP 서버 설정 추가:

   ```json
   {
     "mcp": {
       "servers": [
         {
           "name": "mongodb",
           "command": "node /path/to/mongo-mcp-server/dist/index.js mongodb://localhost:27017/test"
         }
       ]
     }
   }
   ```

3. Claude Desktop 재시작

## 개발

### 프로젝트 구조

```
src/
├── index.ts          # 메인 서버 코드
├── tools/
│   ├── generateErd.ts    # ERD 생성 도구
│   └── generateQuery.ts  # 쿼리 생성 도구
```

### 새로운 도구 추가

1. `src/tools` 디렉토리에 새 도구 파일 생성
2. 도구 인터페이스 구현:
   ```typescript
   export const newTool = {
     parameters: {
       // 파라미터 정의
     },
     async execute(params: any, context: { client: MongoClient }) {
       // 도구 로직 구현
     },
   };
   ```
3. `src/index.ts`에 도구 등록

## 라이선스

MIT
