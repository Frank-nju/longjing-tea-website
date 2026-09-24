# 道光历史影片

独立的实时 3D 历史影片项目，复用 Executable Film Engine 的绝对故事时间、Film Project 与 Director。

## 本地预览

从仓库根目录运行：

```sh
pnpm install
pnpm --filter @efe/daoguang-viewer dev
```

## 构建与离线单页

```sh
pnpm --filter @efe/daoguang-viewer build
node tools/package-daoguang-single.mjs
```

离线文件：release/daoguang-history-film.html（同时保存在构建目录 apps/daoguang/dist/ 中）。

影片支持线性正片和互动版。互动分支在第 135 秒暂停，选择后播放教学模拟片段；播放到 176 秒后，可跳回重看另一条路线。拖动时间轴不会依赖此前操作状态。

史料与视觉说明见 films/daoguang/SOURCES.md。
