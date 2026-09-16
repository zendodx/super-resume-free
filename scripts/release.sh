#!/bin/bash
# 发布脚本：修改版本号 + 打包
# 用法：
#   npm run release -- 1.2.0    # 指定版本号
#   npm run release -- patch    # 修订号 +1（默认）
#   npm run release -- minor    # 次版本 +1
#   npm run release -- major    # 主版本 +1
set -e

VERSION="${1:-patch}"

# 1. 更新版本号（同步 package.json 与 package-lock.json，不创建 git 提交/标签）
npm version "$VERSION" --no-git-tag-version

NEW_VERSION=$(node -p "require('./package.json').version")
echo "📌 版本已更新为 $NEW_VERSION"

# 2. 类型检查 + 打包（产物同步到 docs/）
npm run build

echo "✅ 发布完成：v$NEW_VERSION"
