# 从 `titanic.html` 到 Executable Film Engine

## 可见对话原文档案版 · 2026-09-22 深夜—2026-09-23 凌晨

> **版本定位**
>
> 这一版与 `docs/conversation-archive-2026-09-23.md` 并列保存，不替代第一版。
>
> - **第一版**：讨论史 / 思想史版。允许在不歪曲原意的前提下做恢复、归纳和高层回顾。
> - **第二版（本文件）**：可见对话 transcript 版。优先保存用户在聊天界面看到的“用户原话 + 助手正式回复 + 关键产出物”，把总结性编辑压到最后。
>
> **不收录**：模型隐藏思考过程、chain-of-thought、工具原始 JSON、内部草稿。
>
> **原文边界说明**：当前运行上下文能够逐字取得本次长讨论中后半段的大量可见消息，因此这些内容按可见文本直接保存。更早的 `titanic.html` 首次源码拆解、《鲸落》文件初次改造等若只剩结构化会话摘要而没有逐字可见文本，本版**不把恢复稿伪装成逐字原文**；它们只在“前史索引”中标记，并指向第一版讨论史档案。

---

# 0. 前史索引

在下面可逐字保存的长对话之前，今晚已经发生了几层重要工作：

1. 用户上传并要求拆解 `titanic.html`。
2. 源码被识别为高度工程化的实时 WebGL 电影运行时。
3. 核心架构被提炼为：世界状态主要由故事时间 `t` 可寻址重建。
4. 用户进一步讨论视觉品质、电影性、BGM、配乐系统。
5. 用户提供《鲸落》初版 HTML + 影视脚本并允许直接改代码和工程架构。
6. 由此生成 `whale_fall_v2.html`，把 demo 推进成有 shot list、摄影语法、深海段落、海床落地、声音设计和时间跳跃的程序化短片 prototype。
7. 用户评价新版已经“能感受到这是影片了”，但视觉精细度仍低于 Titanic；讨论由“复刻技术”转向“这种可执行样片是否可能成为 AI 视频制作的新型 previs”。

这些前史在第一版 `docs/conversation-archive-2026-09-23.md` 中已有详细记录。

---

# 第一编：可见对话原文


## Round 01 · 从“灰模引导视频生成”推到 Executable Previs

### 用户

之前看到gpt6astra出来的时候，建模能力大提升，有人提出用llm调用工具构建灰模来引导视频生成模型渲染场景生成视频，比纯语言描述精准很多，那我觉得这种代码可靠的样片比灰模更合适作为草稿啊，有进入ai视频制作乃至传统电影工业的潜力吗

### 助手

有，而且我认为你这个思路比“LLM 先搭灰模，再让视频模型重绘”还要再往前一步。更准确地说，我们刚才做的这种东西可以视为一种 **Executable Previs（可执行预演）**，甚至可以叫 **executable screenplay / 可执行电影脚本**。

GPT‑6 Astra 这次确实把这种路线的可行性往前推了一截。OpenAI 展示了它从多视图重建 CAD、直接在 Blender 建模并把场景送进 Unreal Engine 5 的能力；BenchCAD 上报告的几何重合度也明显高于上一代。([openai.com](https://openai.com/index/gpt-6-astra/?utm_source=chatgpt.com)) 而目前视频生成研究又正在往另一个方向汇合：GEN3C、3DScenePrompt、Geometry-as-context 都在证明，**把显式 3D 几何、相机轨迹或场景记忆作为视频模型的条件，比单纯文本描述更能维持空间一致性和精确机位。** ([openaccess.thecvf.com](https://openaccess.thecvf.com/content/CVPR2025/html/Ren_GEN3C_3D-Informed_World-Consistent_Video_Generation_with_Precise_Camera_Control_CVPR_2025_paper.html?utm_source=chatgpt.com))

所以你想到的其实是这两条发展路线的交汇点。

### 灰模解决的是“东西在哪里”，我们这个东西解决的是“这一镜到底怎么拍”

传统灰模大概提供：

```text
人物 A 在这里
人物 B 在那里
桌子在这里
建筑轮廓这样
相机从 A 移到 B
```

而我们现在这个《鲸落》，虽然模型本身没有专业 Blender 灰模精确，却已经携带了更多**电影语义**：

```text
t = 43.0s

鲸鱼：
position / rotation / deformation

camera：
position
target
FOV
运动轨迹

lighting：
深度光衰减
环境色

environment：
海雪
生物光
雾
水体

story：
进入无光带

editing：
这是 shot 8
持续 4.2 秒

sound：
低频环境声衰减
进入静默

grade：
降低暖色
压暗曝光
Bloom 增加
```

因此它不是“3D 场景草稿”。

它实际上已经是：

> **低保真电影本身。**

这就是我认为它比普通灰模有意思的原因。

而且这里有一个很重要的工业价值：**它是确定性的。**

文本 prompt：

> “鲸鱼缓缓下沉，镜头从侧后方跟随，然后推进到眼睛……”

你重新生成十次，十次都可能不同。

但是：

```js
camera.position = f(t)
whale.position = g(t)
light = h(t)
```

只要代码不改：

**第 43.217 秒永远是第 43.217 秒。**

这一点对于电影制作极其重要。

因为导演可以说：

> “43.2 秒这里相机再往左 1.5 米。”

然后改完之后其他东西不变。

而不是：

> “重新生成一下，希望 AI 这次别把鲸尾巴变了。”

这就是传统 CG pipeline 为什么仍然强大的根本原因之一：**可控制、可重现、可修改。**

## 最有意思的地方：让生成模型只负责“渲染”

我觉得未来非常有希望的一种 AI 视频工作流，不是：

```text
文字
 ↓
视频模型
 ↓
成片
```

而是：

```text
剧本
 ↓
LLM / Agent
 ↓
可执行 Previs
 ↓
导演修改
 ↓
锁定：
场景
表演
机位
运动
剪辑
时间
 ↓
视频生成模型
 ↓
材质 / 光照 / 人脸 / 毛发 /
自然运动 / 摄影质感
 ↓
成片
```

这时候视频生成模型的角色会发生一个非常重要的变化：

> 它不再同时担任**编剧、导演、摄影、美术、演员和渲染器**。

而主要负责：

> **神经渲染器 / neural renderer。**

我反而认为这可能比现在“prompt 一句话生成完整电影”靠谱得多。

因为现代视频模型真正特别强的，本来就是：

**视觉先验。**

它知道：

皮肤长什么样；
海水长什么样；
毛发怎么动；
夕阳怎么散射；
衣服怎么皱；
真实摄影机拍出来是什么质感。

但让它同时精确记住：

> 门在房间左边；
> 人物上一镜站在哪里；
> 摄影机应该走什么轨迹；
> 这张桌子的尺寸；
> 第三镜必须和第一镜空间连续；

就困难很多。

GEN3C 的论文其实非常直白地指出了这个问题：普通视频模型容易让物体消失、重新出现，而显式 3D cache 可以沿用户指定的摄影机轨迹投影回来，给生成模型更强的几何条件。([openaccess.thecvf.com](https://openaccess.thecvf.com/content/CVPR2025/html/Ren_GEN3C_3D-Informed_World-Consistent_Video_Generation_with_Precise_Camera_Control_CVPR_2025_paper.html?utm_source=chatgpt.com))

这跟你提出的想法几乎是同一个直觉。

## 而我们这种“代码样片”还可以比普通 RGB 样片更进一步

这里是我觉得真正值得做实验的地方。

假设最后只把：

```text
whale_fall_v2.mp4
```

扔给视频模型。

那视频模型其实不知道背后是代码。

它只看见像素。

因此代码真正的优势还没有完全发挥出来。

因为我们的程序实际上能够同时导出：

```text
RGB previs
Depth 深度
Normal 法线
Object ID / segmentation
Motion vectors
Optical flow
Camera matrix
Focal length
DOF / focus distance
Object transforms
Light position
Character skeleton
Scene event timeline
```

然后一起给生成系统。

这就比：

> “拿一个灰模 MP4 当 reference”

强很多了。

可以想象未来一个 shot package：

```text
shot_008/
    preview.mp4
    depth.exr
    normal.exr
    segmentation.exr
    motion.exr

    camera.json
    objects.json
    lighting.json

    shot.usd
    edit.otio
    audio.wav
```

然后对视频模型说：

> **这些是不可违反的约束，剩下的视觉细节你自由生成。**

这才是我认为最理想的 AI 电影生成接口。

这里甚至已经和传统电影工业现有基础设施很好地接上了。

OpenUSD 本来就是为大型电影/VFX 场景的几何、动画、灯光、材质等跨 DCC 数据交换而设计的；Pixar 自己把它作为其 3D pipeline 的核心。([openusd.org](https://openusd.org/release/index.html?utm_source=chatgpt.com))

剪辑侧则已经有 OpenTimelineIO，能表达 clip、时间、轨道、转场和 marker。([opentimelineio.readthedocs.io](https://opentimelineio.readthedocs.io/en/latest/?utm_source=chatgpt.com))

所以工业版其实不应该最终停在：

```text
whale.html
```

而应该变成：

```text
                 ┌→ 浏览器实时预演
LLM → Scene DSL ─┼→ Blender
                 ├→ Unreal
                 ├→ OpenUSD
                 ├→ OTIO
                 └→ AI Video Conditioner
```

**HTML/Three.js 只是其中一个极快的 preview backend。**

这也是为什么我会说：

### 我们现在这个《鲸落》比它表面看起来更有研究价值。

它现在看起来只是：

> “纯代码 Three.js 小电影”。

但换一种抽象，它其实已经具备：

```text
Scene description
Timeline
Director
Camera
Animation
Lighting
FX
Audio
Editing
Rendering
```

这些恰恰就是一个最小电影制作系统。

如果再把目前散落在 JS 里的信息抽出来：

```js
SHOTS = [...]
TRACKS = [...]
ACTORS = [...]
LIGHTS = [...]
CUES = [...]
```

变成一个统一的 scene/film DSL，那么 LLM 甚至不用每次重写大量 Three.js。

例如：

```text
SHOT 08
time 42.0 47.0

camera
  lens 85mm
  track whale.eye
  distance 3.2m
  dolly -0.4m/s

actor whale
  pose dead_drift
  roll 14deg

environment abyss
  fog 0.018
  marine_snow 0.8

light
  key none
  biolume 0.12

audio
  ambience -18db -> -35db
```

然后 compiler 自动生成 Three.js / Blender / Unreal / USD。

这时候 LLM 的工作就变成：

> **导演 + scene programmer。**

而不是每次从头写 WebGL。

### 这和传统电影工业其实一点都不冲突

事实上虚拟制片本身早就在沿着这个方向发展。

Epic 对 Virtual Production 的定义里就已经把 **previs、techvis、stuntvis、virtual scouting、virtual camera、in-camera VFX** 放在同一个连续工作流里；而且预演里的虚拟摄影机有时可以一路沿用到后期。([unrealengine.com](https://www.unrealengine.com/explainers/virtual-production/what-is-virtual-production?utm_source=chatgpt.com))

以前的问题在于：

> 做 previs 本身也需要专业人员。

建模师搭灰模，
动画师做 blocking，
摄影师调 VCam，
技术美术做场景，
剪辑师剪出来。

于是只有大型项目值得这样干。

现在 Astra 这种模型出现以后，如果变成：

> 导演说一句 → Agent 十分钟搭出一版完整可执行 previs → 导演看片并修改，

那**previs 成本会发生数量级变化**。

这可能反而是它进入传统电影行业最现实的入口。

不是马上：

> “AI 把摄影师替代了。”

而是：

> **原本只有大片才负担得起的高密度预演，现在一个小团队也可以每个镜头都做。**

而我认为它对 AI 电影甚至比对传统电影更重要。

因为传统电影还有真人摄影机维持物理世界的一致性。

AI 视频没有。

因此 AI 电影尤其需要一个：

> **persistent world model / persistent scene representation**

来告诉生成器：

这个房间到底长什么样；
人物站在哪里；
摄影机在哪里；
上一镜发生了什么。

现在研究界已经明显在向这种“显式 3D + 视频生成”靠。GEN3C 用 3D cache，3DScenePrompt 用 3D scene memory，2026 的 Geometry-as-context 进一步直接把几何当成生成上下文。([openaccess.thecvf.com](https://openaccess.thecvf.com/content/CVPR2025/html/Ren_GEN3C_3D-Informed_World-Consistent_Video_Generation_with_Precise_Camera_Control_CVPR_2025_paper.html?utm_source=chatgpt.com))

所以这并不是我们凭空想象的一条路线。

不过我会对“代码样片比灰模更合适”稍微加一个限定：

**不是代码取代灰模。**

最强的东西应该是：

> **代码/DSL 驱动灰模。**

因为 Blender/Unreal/USD 里的真正几何还有一个 HTML 视频没有的巨大优势：

**机器可以直接理解其三维结构。**

比如：

```text
这是墙
这是角色
这是 camera
这里离 camera 4.72m
这个 mesh 的法线是这样
这个物体上一帧 transform 是这样
```

如果只是把我们的 WebGL 画面录成 MP4，这些结构信息就又被压回像素里丢掉了。

所以最终最好的形态应该是：

> **代码是源代码，3D scene 是中间表示，previs 是人看的结果，生成视频是最终渲染。**

这很像编译器：

```text
电影意图
   ↓
Film DSL
   ↓
Scene Graph / USD
   ↓
┌───────────────┐
│ WebGL Previs  │
│ Blender       │
│ Unreal        │
│ AI Renderer   │
└───────────────┘
```

如果让我给这条路线起一个名字，我甚至不太愿意叫它：

**AI Video Generation。**

我会叫它：

> **AI Film Compilation**

剧本不是 prompt。

剧本首先被**编译成一个确定的时空世界**，导演在这个世界里锁定表演、镜头和剪辑；生成模型最后只是把这个世界“摄影”出来。

你刚才看《鲸落》v2 已经觉得“这是影片了”，其实就是一个很好的小型证明：**即使渲染质量远没到真实摄影，只要空间、时间、镜头和声音被确定下来，电影本身已经先存在了。**

后面的生成模型，理论上只需要把我们现在“不够精细”的那层画面，变成足够真实、足够漂亮的最终像素。

我认为这条路线非常值得继续做，而且下一步甚至不应该只是继续把《鲸落》的 Three.js 画质往上堆——**更有价值的是把它改造成第一个“可导出 AI 视频 conditioning package”的实验：同一镜头同时输出 RGB、depth、normal、segmentation、camera trajectory 和时间线，然后拿去测试视频生成器到底能不能严格服从。**那会从一个漂亮 demo，变成一个真正有方法论价值的原型。

---


## Round 02 · 追问历史：这是 Claude 的原创框架，还是前人已有？

### 用户

额泰坦尼克这个小电影demo据说是刚发布的opus5.5的宣传物料，用来证明它的能力，那我觉得这个实现方式和项目思路远大于实现的精细程度（当然这确实很精细很强），那我请你去github广泛搜索一下，有没有类似的前置人类项目，还是说这个tt的思路和工程框架也是一个模型原创的，那也太强了吧 @GitHub

### 助手

我广泛查了一圈 GitHub 后，结论反而更有意思了：

**Titanic 这套思想不是“从人类历史上完全没有过的东西里凭空发明出来的”，但我也没找到一个早期人类项目和它一模一样。** 更像是模型把过去十五年里分散在 **WebGL 互动电影、demoscene、时间轴动画工具、程序化视频、游戏引擎**里的几套思想，第一次非常自然地“收束”成了一个完整的 **代码电影运行时**。

而这件事本身，仍然相当强。

先纠正一个事实：我目前**没有找到 Anthropic 官方页面明确说《Titanic, April 1912》就是 Opus 5.5 官方宣传物料**。公开展示页显示它在 **2026 年 9 月 19 日**已经上线，而 Opus 5.5 是 **9 月 22 日**正式发布；因此它完全可能是早期访问/发布前 showcase，但目前我能确认的是时间关系，不能把“Anthropic 官方宣传片”当成已经证实的事实。([velven.ai](https://velven.ai/s/titanic-april-1912?utm_source=chatgpt.com))

但“这是 Claude 新一代前端/3D 能力展示”这个大背景是可信的：Anthropic 对 Opus 5 的官方介绍里甚至专门引用外部评价称其在“animations, games, and 3D work”上是他们见过的 Opus 中最好的一代。([anthropic.com](https://www.anthropic.com/claude/opus?utm_source=chatgpt.com))

### 我找到的“祖先”，最重要的是这几个

| 项目 | 年代 | 和 Titanic 相似的东西 | 和 Titanic 的关键差别 |
|---|---:|---|---|
| **3 Dreams of Black** | 2011 | 浏览器就是电影院；WebGL 实时渲染；剧情、音乐、3D 镜头融合 | 大量传统美术资产和制作 pipeline；不是整个世界都做成纯时间函数 |
| **GNU Rocket** | 至少 2012 前后 | 音乐作为主时间轴；大量视觉参数 = 时间的函数；可 scrub、同步 | 是同步工具，不负责完整世界/导演/渲染 |
| **frame.js** | 2012 | 浏览器 sequence editor；Player + Timeline；Three.js；音频同步；可 seek | 更像通用编辑器/runtime，项目内容仍由人手工制作 |
| **Under Neon Lights** | 2010s | Three.js + Frame.js 做真正的 WebVR 音乐视频 | 依赖模型资产，更接近传统数字制作搬进浏览器 |
| **Theatre.js** | 2013 起 | 高保真 motion design；直接动画 Three.js；程序化 + 可视化时间线 | 偏动画工具，不是电影世界 runtime |
| **Remotion** | 2020 | “代码是真源”；frame/time → 输出画面；可重复、可批量渲染 | 更偏 React/视频合成，3D 世界不是核心 |
| **Motion Canvas** | 2022 | TypeScript 写动画；实时预览；代码定义时间线 | 更偏 2D motion graphics |

这里第一个尤其值得看。

Google 在 **2011 年 5 月**发布的 **3 Dreams of Black**，官方当时直接把它描述成一个由 Chris Milk 导演的浏览器音乐体验：2D 动画与互动 3D 场景交织，而且整个体验实时跑在 WebGL 中。Google 甚至说浏览器被“转变成一个 theater”。([experiments.withgoogle.com](https://experiments.withgoogle.com/3-dreams-of-black?utm_source=chatgpt.com))

它的完整源码后来也开源了：

[dataarts/3-dreams-of-black](https://github.com/dataarts/3-dreams-of-black?utm_source=chatgpt.com)

README 里甚至明确把：

```text
deploy/js/
```

称为：

> JavaScript files for the primary experience, **the film**

也就是说，**“用 JavaScript/WebGL 写电影”这个概念，2011 年人类就已经干过了。** ([github.com](https://github.com/dataarts/3-dreams-of-black?utm_source=chatgpt.com))

而且参与者里面就有 **Mr.doob**，也就是 Three.js 作者 Ricardo Cabello。Google 当年的技术文章还专门提到他们为了这个项目开发了工具、库、模型以及 Blender→WebGL pipeline。([developers.googleblog.com](https://developers.googleblog.com/en/dreams-in-3d-a-webgl-experience-for-the-modern-browser/?utm_source=chatgpt.com))

所以如果问：

> Claude 是不是第一个想到“浏览器实时渲染电影”的？

显然不是。

但再往下挖，就出现了一个特别像 Titanic 的东西：

## frame.js

[mrdoob/frame.js](https://github.com/mrdoob/frame.js?utm_source=chatgpt.com)

这个仓库是 **2012 年 11 月创建的**，GitHub description 就叫：

> JavaScript Sequence Editor

它不是普通 tween 库。

我直接读了源码，它里面已经有：

```js
Player
Timeline
Animation
Resources
Code
```

Player 自己维护：

```js
currentTime
play()
pause()
playbackRate
audio
loop
```

然后每帧本质上就是：

```js
frame.player.tick(...)
frame.timeline.update(frame.player.currentTime)
```

GitHub 当前源码仍然是这么组织的。([github.com](https://github.com/mrdoob/frame.js/?utm_source=chatgpt.com))

而 `Timeline.update(time)` 会：

```text
根据 time 激活动画段
↓
调用 start()
↓
计算 progress
↓
调用 update(progress, dt)
↓
结束时调用 end()
```

如果发现：

```js
prevtime > time
```

也就是向后 seek，它会直接：

```js
reset()
```

重新构建 active timeline。

你看这跟我们看 Titanic 的感觉是不是已经非常接近了？

甚至 frame.js 后来真的被用于：

**Under Neon Lights**

一个 Three.js + Frame.js 制作的互动 WebVR 音乐视频。

[within-unlimited/under-neon-lights](https://github.com/within-unlimited/under-neon-lights?utm_source=chatgpt.com)

它 README 直接写：

> relied heavily on Three.js and Frame.js

然后把整个作品放进 Frame.js editor。

所以：

> **Three.js + timeline + audio + cinematic web experience**

这个技术族谱在人类项目里确实存在。

另一个非常重要的祖先反而不是 Web 开发圈，而是：

## demoscene

尤其是 **GNU Rocket**。

[GNU Rocket](https://github.com/emoon/rocket?utm_source=chatgpt.com)

它的核心思想几乎可以概括成：

```text
music time
   ↓
timeline row
   ↓
camera.x
camera.y
camera.fov
fogDensity
effectIntensity
sceneParameter
...
```

也就是把大量效果参数全部挂到音乐时间线上。

Rocket 的定义就是：

> 用于同步 demoscene production 中 music 和 visuals 的 sync tracker。([github.com](https://github.com/yupferris/gnurocket?utm_source=chatgpt.com))

甚至支持播放过程中：

```text
jump forward
jump backward
demo scratching
```

所以 Titanic 里那种：

