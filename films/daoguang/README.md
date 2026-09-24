# 道光历史影片

独立播放器：`apps/daoguang`。离线成品：`release/daoguang-history-film.html`，双击即可打开，声音需点击播放后启用。

## 开发和打包

```sh
pnpm --filter @efe/daoguang-viewer dev
pnpm --filter @efe/daoguang-viewer build
node tools/package-daoguang-single.mjs
pnpm typecheck
pnpm test:core
pnpm exec playwright test --config playwright.daoguang.config.ts
```

## 视觉实现

- `src/visuals.ts`：参数化弧形船壳、甲板、炮门、帆面及索具；独立的木材、帆布、砌石和自然地表纹理；海面与天空着色器；炮台、瓦顶和御案陈设。
- `src/index.ts`：场景布局、光照、绝对时间动画、竖屏构图和资源释放。
- `film.project.json`：分镜时段、镜头位置、目标及焦距。
- `src/story.ts`：四章字幕与史实、解释性归纳、课堂模拟分类。

新增纹理在浏览器中用固定种子生成，不需要网络。船体摆动、帆面和水波仅由故事时间决定。程序生成的舰船、炮台、地形和御案属于解释性可视化，不是特定文物或历史地点的测绘复原；御案文书文字标注为示意。人物保持中远景。

桌面保持 16:9；手机扩大相机视野，并使用较小阴影贴图。抗锯齿仅由道光播放器显式开启，共用渲染器默认行为不变。为保证重复跳转的画面一致，影片关闭运行时自动分辨率变化。低性能设备仍可能需要降低像素比或关闭阴影。

浏览器测试覆盖正片、互动路线切换、断网单文件、手机字幕边界及四章/两条模拟路线的像素复现。截图一致性测试比较目标时间与经过其他镜头后重新跳转的画面，不等同于整片实时连续播放的性能测试。
