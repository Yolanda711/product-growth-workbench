# OpenAI 辅助诊断后端 · v0.37

前端仍由 GitHub Pages 发布，本目录单独部署到 Cloudflare Worker。当前没有配置密钥，也没有执行真实付费调用。

## 部署步骤

1. 注册并登录 Cloudflare，在本目录用官方 Wrangler 部署（安装 Node.js 后运行 `npx wrangler login`、`npx wrangler deploy`）。账号开通与条款由你自行确认。
2. 在 Cloudflare Worker 的 Settings → Variables and Secrets 新增 **Secret** `OPENAI_API_KEY`，仅在 Cloudflare 官方页面输入。不要提交到 GitHub、HTML 或聊天。
3. 将普通变量 `OPENAI_MODEL` 填为你的 OpenAI 项目可用、支持 Responses API 与 Structured Outputs 的模型 ID；将 `ENABLE_AI` 改为 `true` 并重新部署。没有指定模型时服务保持未就绪，不擅自选用高价模型。
4. 保持 `BUDGET` Durable Object 绑定与 SQLite migration。它在事务里预留调用次数，计数重启后仍保留。不要删除限额存储来绕过限额。
5. Worker 地址生成后，在工作台“分析范围、数据发送与在线连接”中填写服务根地址，检查连接；选择在线 OpenAI，核对聚合数据并勾选同意发送。
6. 本机连接设置仅对当前浏览器有效。若要让简历访客默认能在线调用，再把已部署服务的**公开根地址**配置进前端（无需密钥），并重新发布 HTML。

## 成本与访问控制

- 默认每日最多30次模型请求（UTC），每IP每日5次、每小时3次。失败的上游请求也消耗预留次数，不自动重试。
- 可调整变量，但服务代码将日总次数限制在最多100次；每请求输出最多2400 token，请求聚合数据最多20KB。
- CORS只允许指定来源，**CORS不是身份认证**；公开作品集接口仍可能被脚本伪造 Origin 调用。全站持久化额度用来限制模型请求次数，不能替代账号身份和防滥用服务。OpenAI项目预算/用量通知需在OpenAI官方平台另行设置。
- 限额是请求次数，不是精确人民币/美元预算；费用取决于所选模型与token。Cloudflare也可能按你使用的套餐收费，开通前自行核对。
- 原始IP只用于当天匿名限额哈希，不保存原始IP。两天后删除计数；不记录聚合请求、模型响应或密钥。上游请求 `store:false`，不等于所有供应商日志零留存。
- 默认 `ENABLE_AI=false`，没有密钥、模型或限额绑定时停止调用；可随时关闭变量停止付费请求。

## 接口

- `GET /health` → `{service:"ops-ai-v37",ready,model}`；不回传密钥。
- `POST /diagnose` → `{intent:"diagnose"|"plan",context}`，只接受 contract.mjs 白名单字段；返回 `{mode:"online",model,result}`。
- 校验缺失字段、负数、分母异常、过大body、未知指标引用、模型拒绝与不完整响应。模型摘要仍需人工审核，不保证原因推断正确。

前端数据事实由工作台直接计算，模型只提供假设、待补证据和建议方案。确认带入草稿之后仍需用户核对负责人、日期和基线，按原流程保存。

官方参考：[OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)、[Cloudflare Durable Object持久化存储](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/)。
