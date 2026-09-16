# 后端基础 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可运行、可测试、使用本机 SQLite 的美股模拟交易后端基础。

**Architecture:** 使用 Fastify 提供 REST API，SQLite 保存应用数据。阶段 1 只实现服务启动、配置、健康检查、统一错误响应和数据库连接，不实现行情、订单或前端。

**Tech Stack:** Node.js 20+, TypeScript, Fastify, better-sqlite3, Vitest, tsx。

**Spec:** `docs/superpowers/specs/2026-09-16-us-stock-mvp-design.md`

## Global Constraints

- 后端先行，前端在 API 稳定后开始。
- 数据保存在本机 SQLite，暂不做登录和多用户隔离。
- API 写入前必须校验输入；错误不能改变数据状态。
- 行情和市场信息在后续阶段使用 provider adapter，阶段 1 不接外部 API。

---

### Task 1: 初始化 TypeScript 服务

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `src/server.ts`
- Create: `src/app.ts`
- Create: `src/config.ts`

**Interfaces:**
- Produces: `buildApp()` 返回 Fastify 实例；`GET /health` 返回 `{ "status": "ok" }`。

- [ ] **Step 1: 写失败测试**

```ts
// test/health.test.ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from '../src/app';
import type { FastifyInstance } from 'fastify';

describe('GET /health', () => {
  let app: FastifyInstance;
  beforeAll(async () => { app = await buildApp({ databasePath: ':memory:' }); });
  afterAll(async () => { await app.close(); });

  it('returns a healthy service response', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- --run test/health.test.ts`
Expected: FAIL because `src/app.ts` and the route do not exist.

- [ ] **Step 3: 写最小实现**

```ts
// src/app.ts
import Fastify from 'fastify';
import { initDatabase } from './db';

export async function buildApp(options: { databasePath: string }) {
  const app = Fastify({ logger: false });
  initDatabase(options.databasePath);
  app.get('/health', async () => ({ status: 'ok' }));
  return app;
}
```

`src/server.ts` 读取 `PORT` 和 `DATABASE_PATH`，调用 `buildApp()` 后监听 `127.0.0.1`。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- --run test/health.test.ts`
Expected: PASS.

- [ ] **Step 5: 提交**

```bash
git add package.json tsconfig.json src test
git commit -m "feat: initialize stock backend service"
```

### Task 2: 建立 SQLite 初始化和配置

**Files:**
- Create: `src/db.ts`
- Modify: `src/app.ts`
- Create: `test/db.test.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: `buildApp({ databasePath: string })`。
- Produces: `initDatabase(databasePath)` 创建 SQLite 数据库并执行基础 schema；`getDatabase()` 返回当前连接。

- [ ] **Step 1: 写失败测试**

```ts
// test/db.test.ts
import { afterEach, describe, expect, it } from 'vitest';
import { getDatabase, initDatabase } from '../src/db';

afterEach(() => getDatabase()?.close());

describe('database initialization', () => {
  it('creates the schema metadata table', () => {
    initDatabase(':memory:');
    const row = getDatabase().prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_meta'").get();
    expect(row).toEqual({ name: 'schema_meta' });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- --run test/db.test.ts`
Expected: FAIL because `src/db.ts` does not exist.

- [ ] **Step 3: 写最小实现**

使用 `better-sqlite3` 打开路径，执行：

```sql
CREATE TABLE IF NOT EXISTS schema_meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

启用外键约束，保留单个进程内连接；阶段 1 不添加 ORM。

- [ ] **Step 4: 运行测试确认通过**

Run: `npm test -- --run test/db.test.ts test/health.test.ts`
Expected: PASS.

- [ ] **Step 5: 更新运行说明并提交**

README 只写安装、测试和启动命令：`npm install`、`npm test`、`npm run dev`。

```bash
git add src/db.ts src/app.ts test/db.test.ts README.md
git commit -m "feat: add sqlite database bootstrap"
```

### Task 3: 统一错误处理和服务启动检查

**Files:**
- Create: `src/errors.ts`
- Modify: `src/app.ts`
- Modify: `test/health.test.ts`
- Create: `test/errors.test.ts`

**Interfaces:**
- Produces: 未处理错误统一返回 `{ error: { code: string, message: string } }`；未知路由返回 `404`。

- [ ] **Step 1: 写失败测试**

```ts
it('returns a stable error shape for unknown routes', async () => {
  const response = await app.inject({ method: 'GET', url: '/missing' });
  expect(response.statusCode).toBe(404);
  expect(response.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- --run test/errors.test.ts test/health.test.ts`
Expected: FAIL because the default Fastify error response does not match the contract.

- [ ] **Step 3: 写最小实现**

注册 `setNotFoundHandler` 和 `setErrorHandler`，仅转换响应格式，不吞掉服务端日志。

- [ ] **Step 4: 运行完整阶段测试**

Run: `npm test -- --run`
Expected: PASS with health, database, and error tests green.

- [ ] **Step 5: 提交并推送**

```bash
git add src test
git commit -m "feat: add stable api error responses"
git push origin main
```

## 阶段 1 验收

- `npm test -- --run` 全部通过。
- `npm run dev` 启动后，`curl http://127.0.0.1:3000/health` 返回 `{"status":"ok"}`。
- SQLite 文件能创建，服务重启不报错。
- 未知路由返回稳定的 404 JSON。
- 远程 `main` 包含阶段 1 的提交。
