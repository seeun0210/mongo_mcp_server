import { z } from "zod";
import { MongoClient } from "mongodb";

/**
 * MCP 도구의 컨텍스트 인터페이스
 */
export interface ToolContext {
  client: MongoClient;
  [key: string]: any;
}

/**
 * MCP 도구 실행 함수 인터페이스
 */
export type ToolExecuteFunction<T = any> = (
  params: T,
  context: ToolContext
) => Promise<any>;
