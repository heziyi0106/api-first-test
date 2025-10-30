# API 通用回應樣式指南（snake_case 版）

目的
- 在專案中統一 API 回應格式，使用 snake_case 命名，提升前後端串接一致性、降低解析錯誤與串接延遲，並作為 OpenAPI/Mock/CI 驗證的 single source of truth。

總原則（快速一覽）
- 使用正確的 HTTP 狀態碼（200/201/204/4xx/5xx）；不要把所有錯誤都回 200。
- Response body 使用 snake_case（例：request_id、timestamp、payload、errors）。
- 同時回傳 app-level code（字串，使用前綴如 `OK` / `ERR_...`）與 human-friendly message。
- 把共用 schema（response envelope、error item）放到 OpenAPI components，且 spec 與程式碼要同 PR 提交。

命名與風格決策（已決定，請放入 README）
- 命名風格：snake_case
- 主要資料欄位：payload（若無 payload，請回 null）
- 錯誤欄位：errors（array）
- 應用層 code：字串，採 `OK` / `ERR_` 前綴（例如：`OK`, `ERR_INVALID_INPUT`）
- 必須回傳：request_id（若前端未提供則由 server 產生）、timestamp（ISO 8601 格式）
- 204 處理策略：若要回 envelope 請用 200；204 表示 body 必須為空

通用 Response Envelope（snake_case 結構）
- 欄位說明：
  - request_id: string — log/tracing 的唯一請求識別碼
  - timestamp: string (date-time) — server 回應時間（ISO 8601）
  - code: string — application-level code（`OK` / `ERR_...`）
  - message: string — 人類可讀摘要（UI 用）
  - payload: object|array|null — 主要資料載體
  - meta: object|null — 分頁、總數、其他額外資訊
  - errors: array|null — field-level 或其他詳細錯誤（ErrorItem 陣列）

成功範例（200 OK）
```json
{
  "request_id": "req-15925-20251030",
  "timestamp": "2025-10-30T03:54:18Z",
  "code": "OK",
  "message": "查詢成功",
  "payload": {
    "id": 15925,
    "case_no": "890-113-00315",
    "statement_type": "PL"
  },
  "meta": null,
  "errors": null
}
```

建立成功（201 Created）
```json
{
  "request_id": "req-15925-20251030",
  "timestamp": "2025-10-30T03:54:18Z",
  "code": "OK_CREATED",
  "message": "資源建立成功",
  "payload": {
    "id": 456,
    "created_at": "2025-10-30T03:47:59Z"
  },
  "meta": null,
  "errors": null
}
```

欄位驗證失敗（422 Unprocessable Entity）
```json
{
  "request_id": "req-15925-422",
  "timestamp": "2025-10-30T03:54:18Z",
  "code": "ERR_INVALID_INPUT",
  "message": "輸入資料驗證失敗",
  "payload": null,
  "meta": null,
  "errors": [
    {
      "field": "id",
      "message": "必須為整數",
      "code": "ERR_INVALID_ID"
    },
    {
      "field": "file",
      "message": "不為有效的 URI",
      "code": "ERR_INVALID_FILE_URI"
    }
  ]
}
```

未授權（401 Unauthorized）
```json
{
  "request_id": "req-unauth-1",
  "timestamp": "2025-10-30T03:50:00Z",
  "code": "ERR_TOKEN_EXPIRED",
  "message": "憑證過期，請重新登入",
  "payload": null,
  "meta": null,
  "errors": null
}
```

伺服器錯誤（500 Internal Server Error）
```json
{
  "request_id": "req-internal-1",
  "timestamp": "2025-10-30T03:51:00Z",
  "code": "ERR_INTERNAL",
  "message": "系統錯誤，請稍後再試",
  "payload": null,
  "meta": null,
  "errors": null
}
```

關於 204 No Content
- 若回傳 204，body 必須為空（client 不應期待 envelope）。若要始終回 envelope（例如 client 需要 request_id），請使用 200。

OpenAPI (components) 範例（snake_case）
```yaml
components:
  schemas:
    response_envelope:
      type: object
      required:
        - request_id
        - timestamp
        - code
        - message
      properties:
        request_id:
          type: string
          description: "用於 log/tracing 的唯一請求識別碼"
        timestamp:
          type: string
          format: date-time
        code:
          type: string
          description: "應用層級代碼 (OK / ERR_... )"
        message:
          type: string
        payload:
          type: object
          nullable: true
        meta:
          type: object
          nullable: true
        errors:
          type: array
          nullable: true
          items:
            $ref: '#/components/schemas/error_item'
    error_item:
      type: object
      properties:
        field:
          type: string
          nullable: true
        message:
          type: string
        code:
          type: string
```

在 OpenAPI 使用建議
- 把 `response_envelope` 放在 `components.schemas`，每個 endpoint 的 200/201/4xx response 使用 `allOf` 合併 envelope 與具體 payload schema。
- 每個 response 至少提供一個 example（成功與常見錯誤）。
- 把 openapi 檔案放在 repo 的 `openapi/` 或 `api-spec/` 目錄，並強制 PR 必須包含 spec 變更（如果修改了 API）。

錯誤 code （起手清單，放 docs/errors.md）
- OK — 200 — 成功
- OK_CREATED — 201 — 成功建立
- ERR_INVALID_INPUT — 422 — 輸入資料驗證失敗
- ERR_NOT_FOUND — 404 — 資源不存在
- ERR_UNAUTHORIZED — 401 — 未授權或憑證過期
- ERR_FORBIDDEN — 403 — 權限不足
- ERR_INTERNAL — 500 — 伺服器錯誤
- ERR_RATE_LIMIT — 429 — 速率限制

錯誤 code 管理：  
- code 必須唯一且不可任意重複；任何新增或變更需透過 PR 並更新 `docs/errors.md`；若要移除或改名，需走 deprecation 流程（列出相容期）。

PR / Review Checklist（在 PR template 中加入）
- 新增/修改的 API 是否遵守 snake_case 命名？
- 是否使用 `response_envelope`（或有明確例外）？
- 是否回傳正確 HTTP status？
- 是否在 body 提供唯一 `code`？
- 是否包含成功與錯誤 examples？
- 若新增/修改錯誤 code，是否更新 `docs/errors.md`？

快速採用步驟（30–90 分鐘可跑通）
1. 把此檔案放入 repo（建議路徑：`docs/API-Response-Style-Guide.md` 或 `README` 的一節）。
2. 將先前產生的 OpenAPI YAML 轉為 snake_case（把 envelope、schema keys 換成 snake_case）並放到 `openapi/`。
3. 為團隊新增一個短會議（15–30 分鐘）確認命名與 204 策略，並把決議寫入此檔案。
4. 建一個 mock script（例如 `npm run mock` 或 Makefile target）以 Prism 啟動 mock server，使用 openapi/spec 的 examples。
5. 在 CI 加入 spectral lint 與 openapi schema 驗證，阻止不合法 spec 上 PR。

常見反模式（避免）
- 同時混用 snake_case 與 camelCase（會造成大量解析 bug）
- 全部回 200 並在 body 放錯誤（會破壞 HTTP client 行為與中間件）
- 只有 message 沒有唯一 code（不可用於程式化處理）
- spec 與實作不在同一 PR（容易脫節）

其他建議工具與資源
- OpenAPI / Swagger UI / Redoc：產生文件與 example
- Stoplight Prism / Mockoon / WireMock：mock server
- @stoplight/spectral：OpenAPI lint
- Pact：consumer-driven contract testing
- openapi-generator：產生 client/server stub（如需要）

附註
- 把此檔案放在 repo 的 `docs/` 或 root README，並在 PR 模板中加入「是否遵守 API style guide」的核對欄位，確保新變更會被驗證。
