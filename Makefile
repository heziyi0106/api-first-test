.PHONY: mock lint validate

# 啟動 Prism mock (需有 Docker，並下載 stoplight/prism 映像檔)
mock:
	docker run -d --name prism-mock -p 4010:4010 -v $(PWD)/openapi/statement-api.yaml:/tmp/api.yaml stoplight/prism:4 mock -h

mock-rm:
	docker run -d --name prism-mock --rm -p 4010:4010 -v $(PWD)/openapi/statement-api.yaml:/tmp/api.yaml stoplight/prism:4 mock -h 0.0.0.0 /tmp/api.yaml
# 使用 spectral lint (需安裝 @stoplight/spectral-cli)
lint:
	npx spectral lint openapi/statement-api.yaml

# 使用 swagger-cli 驗證 schema (需安裝 swagger-cli)
validate:
	npx swagger-cli validate openapi/statement-api.yaml

# 停止 Prism mock
stop-mock:
	docker stop prism-mock

# 刪除 Prism mock (若容器停止後未自動刪除)
remove-mock:
	docker rm prism-mock