# Playwright 自动化测试框架

## 架构分层

```
playwright-framework/
├── config/              # 环境配置层
│   └── env.config.ts    # 多环境配置(dev/staging/prod)
├── core/                # 核心基础层
│   ├── base-page.ts     # BasePage基类(通用操作封装)
│   ├── bug-collector.ts # Bug收集器(单例,去重,持久化)
│   └── reporters/       # 自定义Reporter
│       └── bug-reporter.ts
├── middlewares/         # 中间件层
│   └── lifecycle-monitor.ts  # 全生命周期监控
├── pages/               # PageObject层
│   ├── login.page.ts    # 登录页
│   └── home.page.ts     # 首页
├── tests/               # 测试用例层
│   ├── login/           # 按业务模块组织
│   ├── home/
│   └── quality/         # 通用质量检查
├── utils/               # 工具层
│   ├── logger.ts        # 日志工具
│   ├── accessibility-checker.ts  # 无障碍检查
│   └── page-health-checker.ts   # 页面健康检查
├── fixtures/            # Playwright Fixture扩展
│   └── test-fixtures.ts
├── bugs/                # Bug沉淀目录(自动生成JSON)
├── reports/             # 测试报告目录
└── playwright.config.ts # Playwright配置
```

## 快速接入新页面

1. 在 `pages/` 下创建 PageObject，继承 `BasePage`
2. 在 `tests/` 下创建测试文件，使用自定义 fixture
3. 在 `tests/quality/quality-gate.spec.ts` 中添加页面URL即可自动执行质量检查

## 缺陷发现能力

- Console Error 监控
- JS未捕获异常检测
- HTTP 4xx/5xx 错误捕获
- 慢请求（>3s）告警
- 请求失败检测
- 可访问性检查
- 死链检测
- 元素重叠检查
- 性能基线检查

## 运行方式

```bash
npm install
npx playwright install
npm test                    # 运行所有测试
TEST_ENV=staging npm test   # 指定环境
npx playwright test --headed # 有头模式
```
