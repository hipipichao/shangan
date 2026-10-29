<div align="center">

# 岸上见 | ShangAn

**AI 公考备考助手 · 助你高效上岸**

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-dark)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue)](https://neon.tech/)
[![License](https://img.shields.io/badge/license-MIT-green)](#license)

</div>

---

## 项目简介

岸上见是一款面向公考考生的备考工具平台，致力于用可视化技术与结构化工具帮助考生更高效地管理任务、积累知识、把握考试时间节点，让备考之路更加清晰从容。

> 「岸上见 · 助你上岸」

## 功能特性

| 模块 | 说明 |
|------|------|
| 🏠 **首页** | 国考实时倒计时、关键时间节点（报名/准考证/笔试/面试）、随机备考 slogan |
| 📋 **Todo任务** | 每日与长期任务管理，支持任务勾选、循环任务与学习日记记录，养成良好备考习惯 |
| 📖 **成语学习** | 公考十年真题成语词频统计，分级展示，支持搜索、练习与 PDF 背诵表下载 |
| 📅 **报考日程** | 手动录入报名、准考证、笔试、面试等关键时间节点，支持阶段完成状态勾选与每日提醒弹窗 |
| 📊 **学习统计** | 任务完成情况与进度统计，直观了解学习节奏与坚持情况 |
| 🧊 **立体截面** | 基于 Three.js 的 3D 可视化练习，支持多种几何体与任意切割面 |
| 👤 **个人中心** | 头像、昵称、密码管理 |
| 📱 **PWA 支持** | 可安装到桌面/手机，支持离线访问 |

## 技术栈

- **框架**: Next.js 15 (App Router) · React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS · shadcn/ui
- **数据库**: PostgreSQL (Neon) · Prisma ORM
- **认证**: 自建认证 (bcryptjs + Web Crypto JWT + Session Cookie)
- **邮件**: Resend
- **3D**: Three.js
- **PDF**: pdfkit（成语背诵表本地生成）
- **人机验证**: Cloudflare Turnstile
- **PWA**: @ducanh2912/next-pwa

## 快速开始

### 环境要求

- Node.js >= 18
- npm (或 pnpm / yarn)

### 1. 克隆项目

```bash
git clone https://github.com/your-username/shangan.git
cd shangan
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的配置：

```bash
cp .env.example .env
```

### 4. 初始化数据库

```bash
# 推送 schema 到数据库
npx prisma db push

# 生成 Prisma Client
npx prisma generate

# 可选：导入种子数据（成语词频等）
npm run db:seed

# 可选：生成成语 PDF 背诵表（需本地有中文字体，如 Windows 的 Deng.ttf / simhei.ttf）
npm run generate:idiom-pdf
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 即可使用。

## 环境变量

| 变量 | 说明 | 必需 |
|------|------|:----:|
| `DATABASE_URL` | Neon 数据库连接池 URL（应用使用） | ✅ |
| `DIRECT_URL` | Neon 数据库直连 URL（Prisma 迁移使用） | ✅ |
| `AUTH_SECRET` | JWT 会话签名密钥（至少 32 字符） | ✅ |
| `RESEND_API_KEY` | Resend 邮件服务 API Key | ✅ |
| `RESEND_FROM_EMAIL` | 发件人邮箱地址 | ✅ |
| `NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY` | Turnstile 站点 Key | ✅ |
| `CLOUDFLARE_TURNSTILE_SECRET_KEY` | Turnstile 密钥 Key | ✅ |

> 开发环境下，Turnstile 可使用官方测试 Key（始终通过验证）。

## 部署

推荐使用 [Vercel](https://vercel.com) 一键部署：

1. 将代码推送到 GitHub
2. 在 Vercel 导入项目
3. 配置上述环境变量
4. 点击 Deploy

> 项目已内置 `.npmrc`（`legacy-peer-deps=true`）以解决 Vercel 构建时的依赖冲突。

## 项目结构

```
src/
├── app/
│   ├── (dashboard)/          # 需登录的页面组
│   │   ├── tasks/            # Todo任务
│   │   ├── idioms/           # 成语学习
│   │   ├── recruitments/     # 报考日程
│   │   ├── statistics/       # 学习统计
│   │   ├── geometry/         # 立体截面
│   │   ├── profile/          # 个人中心
│   │   └── about/            # 关于
│   ├── api/                  # API 路由
│   ├── login/ · register/ · verify-email/
│   └── page.tsx              # 首页
├── components/               # UI 组件
├── lib/
│   ├── auth/                 # 认证系统
│   ├── recruitment/          # 报考日程工具
│   ├── tasks/ · journals/ · recurring-tasks/
│   └── db/                   # Prisma 客户端
├── data/                     # 静态数据（成语词频）
├── scripts/                  # 脚本（成语 PDF 生成等）
└── middleware.ts             # 路由保护中间件
```

## License

[MIT](LICENSE)

---

<div align="center">
  <sub>用 ❤️ 制作，祝早日上岸</sub>
</div>