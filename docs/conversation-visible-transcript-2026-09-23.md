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

```js
TR.pitch(t)
TR.roll(t)
TR.smoke(t)
TR.dawn(t)
TR.exposure(t)
```

从思想史上看其实特别 **demoscene**。

```js
TR.pitch(t)
TR.roll(t)
TR.smoke(t)
TR.dawn(t)
TR.exposure(t)
```

从思想史上看其实特别 **demoscene**。

Titanic 更像是把原来：

> 一堆 timeline parameter

升级成：

> **一个完整的世界状态 S(t)**。

这一步非常关键。

再之后就是 Theatre.js。

[Theatre.js](https://github.com/theatre-js/theatre?utm_source=chatgpt.com)

GitHub 仓库从 2013 年就存在，目前 README 对自己的定义是：

> high-fidelity motion graphics

而且明确支持：

> Animate 3D objects made with THREE.js  
> Choreograph generative interactive art

它也是：

**programmatic + visual**

两种方式一起做。

所以我们前面说的：

> “以后 Film DSL + timeline editor”

本质上 Theatre.js 已经走了一部分。

而另一个非常像 Titanic 的思想来自：

## Remotion

[Remotion](https://github.com/remotion-dev/remotion?utm_source=chatgpt.com)

它从 2020 年开始，最核心的哲学就是：

> **React code is the source of truth.**

现在 README 更是直接写：

> Make videos agentically  
> Make videos programmatically

这就是我们前面讨论的：

```text
frame = f(time)
```

式视频生成。

Motion Canvas 也是同一族：

[Motion Canvas](https://github.com/motion-canvas/motion-canvas?utm_source=chatgpt.com)

它明确就是：

> TypeScript library that uses generators to program animations  
> + real-time preview editor

所以“代码就是视频源文件”这件事情，也不是 Claude 发明的。

但事情到这里反而开始有意思。

因为：

**我没有找到任何一个老项目，把这些东西像 Titanic 一样全部融合。**

3 Dreams of Black 有：

> browser + film + WebGL

但没有 Titanic 那种完整纯时间世界。

Rocket 有：

> deterministic timeline

但没有世界。

Frame.js 有：

> timeline + player + audio + Three.js

但更像工具。

Theatre.js 有：

> high fidelity animation

但不是一部电影 runtime。

Remotion 有：

> code → deterministic video

但不是实时 3D 世界。

而 Titanic 是：

```text
story
+
world state
+
procedural modelling
+
environment simulation
+
director
+
camera
+
FX
+
score
+
audio engine
+
UI
+
seek
+
performance system
```

并且全部围绕：

```text
S = story.sample(t)
```

这个核心。

你之前上传的源码甚至明确写着：

> `TT.S is a pure function of story time t`

所有模块都消费同一个时间状态。

我认为**这一层统一性**才是 Titanic 最值得看的地方。

而且我还找到一个非常值得注意的证据。

今年 8 月，也就是 Titanic 之前，有一个：

[TommyUSN/opus5-tech-demo — AEON DRIFT](https://github.com/TommyUSN/opus5-tech-demo?utm_source=chatgpt.com)

仓库 description 就叫：

> Opus 5 technical demo: a self-contained WebGL game with fully procedural assets

README 里结构是：

```text
00-math.js
10-gl.js
20-shaders-world.js
21-shaders-fx.js
30-meshes.js
40-audio.js
50-render.js
60-game.js
70-main.js
```

你再看 Titanic：

```text
00_core.js
10_story.js
20_sky.js
30_ocean.js
40_ship.js
45_props.js
50_audio.js
55_score.js
60_fx.js
70_director.js
80_ui.js
90_main.js
```

是不是非常眼熟？

而且 AEON DRIFT 同样强调：

```text
single-file
self-contained
procedural geometry
procedural audio
deterministic generation
adaptive resolution
HDR
bloom
WebAudio
director
verification
```

甚至 README 里有一个明确的：

> **course director**

负责把关卡组织成有“phrasing”的段落，而不是随机堆起来。

这就让我非常怀疑一个东西：

### Titanic 的具体 framework 很可能不是专门从某个人类电影工程抄来的，而是 Claude/这套评测 harness 已经形成了一种自己的“生成复杂 WebGL 项目 house style”。

尤其是：

```text
编号模块
每模块 owner 清楚
单文件最终 deliverable
procedural everything
deterministic RNG
降级 fallback
quality tiers
验证 hooks
debug URL params
自适应性能
```

这个味道高度一致。

但这里要非常谨慎：

**我不能仅凭两个仓库证明“这是 Claude 内部自创的架构模板”。**

因为也可能是：

- 相同的人类 prompt/测试规范；
- 相同的 harness；
- 模型从大量公开代码中归纳出的最佳实践；
- Claude 在此前任务中逐渐形成的设计偏好。

但它至少说明：

> Titanic 并不像“某个 2015 年开源项目换皮”。

我广搜 GitHub后**没找到一个明显可以一一对应的祖先仓库**。

所以如果让我给“原创度”做一个更准确的判断，我会这么拆：

**零件原创度：不高。**

Three.js、Gerstner wave、procedural mesh、timeline、WebAudio、director camera、Bloom、seek、demoscene synchronization，全都有前人。

**架构思想原创度：中等。**

`world = f(storyTime)` 这类 deterministic / functional rendering 也有很深的前置思想，Remotion、shader、demoscene 都有。

**组合方式原创度：很高。**

尤其：

> 把“电影”直接定义成一个可实时求值的确定性世界程序，而不是 animation clips 的集合。

再叠加：

> director 也是纯时间函数、粒子也可 seek、音频也能重新 hydrate、世界和摄影完全分离。

这个完整组合，我暂时没有找到明显的前置开源项目。

**最让我觉得像“模型真正做了设计工作”的，就是这一点。**

而且还有一个很微妙的区别。

早期人类项目往往是：

```text
我们要做一个 WebGL 电影
↓
先组一个团队
↓
导演
3D 美术
WebGL 工程师
工具开发
Blender exporter
音频
↓
做半年
```

2011 年的 3 Dreams of Black，Google 官方就明确说他们专门开发了工具、库、模型和 Blender pipeline。([developers.googleblog.com](https://developers.googleblog.com/en/dreams-in-3d-a-webgl-experience-for-the-modern-browser/?utm_source=chatgpt.com))

Titanic 展示出来的能力却是：

```text
模型理解：
“我要做一部五分钟 Titanic 电影”
↓
自己推导出需要：
world model
story timeline
ship model
ocean
sky
director
audio
score
FX
UI
performance
verification
↓
然后自己把这些系统接起来
```

所以最夸张的地方可能并不是：

> Claude 发明了新的计算机图形学技术。

而是：

> **Claude 已经能像一个技术导演/technical director 一样，把几十种成熟思想组织成一条极其合理的 production pipeline。**

这其实比“它会不会写一个特别牛的 shader”更重要。

所以你前面说：

> “这个实现方式和项目思路远大于实现的精细程度。”

我现在查完这些历史项目后，反而**更认同了**。

因为画质再高，本质上可以继续靠：

模型资产、纹理、更好的 shader、更长迭代时间

慢慢堆。

但 Titan​​ic 真正展示的是：

> **模型已经知道怎样把一个模糊的创意，结构化成一个可执行的电影系统。**

而这正好就是我们前面聊 AI Film Compilation 时最关键的那一步。

如果把 Titanic、Frame.js、GNU Rocket、Remotion、3 Dreams of Black 画成技术谱系，其实会得到一条很漂亮的线：

**demoscene 时间同步 → WebGL 互动电影 → 浏览器时间轴编辑器 → code-as-video → LLM 自动生成完整 cinematic runtime。**

Titanic 很可能不是这棵树的根。

**但它非常像第一次由模型自己把整棵树重新组装成一个作品。**

这个判断，我觉得比“Claude 会写 Three.js”要震撼得多。

---


## Round 03 · 这个项目具体证明了 Claude 的什么能力？

### 用户

那这个项目具体体现了claude哪些方面的能力呢

### 助手

我觉得这个 Titanic 项目最能证明的，不是“Claude 会写很长的前端代码”，而是它开始表现出一种很接近 **技术导演（Technical Director）+ Staff Engineer + 程序化美术/声音设计师** 的复合能力。

先加一个重要限定：**单看成品源码，我们能判断它体现了哪些能力，但不能仅凭源码证明这些东西全部由 Claude 一次性、无人工修改完成。** 所以下面说的是“如果这确实主要由 Claude 完成，那么这个作品具体说明了什么”。

### 1. 最强的其实是“把模糊目标转成完整系统”的能力

假设原始需求只是：

> 做一个五分钟、实时渲染的 Titanic 沉没电影。

普通代码模型最容易做成：

```text
Three.js 场景
+ 一艘船
+ 海
+ 相机动画
+ BGM
```

Titanic 没停在这里，而是自己推导出了：

```text
core
story
sky
ocean
ship
props
audio
score
fx
director
ui
main
```

这说明它首先完成了一次**需求分解和系统建模**。

而且这种模块划分不是按“代码方便写”随便拆，而是按电影生产逻辑拆：

> 世界是什么 → 世界发生什么 → 怎么拍 → 怎么听 → 怎么呈现。

这比“会实现某个 shader”重要得多。

### 2. 很强的长程架构一致性

这个项目最核心的决定：

```text
TT.S = story.sample(t)
```

也就是：

> 世界状态是故事时间 `t` 的函数。

源码甚至明确写了 `TT.S is a pure function of story time t`。

这个设计一旦确定，后面几十个系统都围绕它统一：

```text
船的位置 = f(t)
海况 = f(t)
天空 = f(t)
粒子 = f(t)
字幕 = f(t)
镜头 = f(t)
音乐 = f(t)
```

真正难的是，模型写到一万多行之后**没有把这个核心哲学丢掉**。

很多大型 AI 代码最常见的问题是：

> 前 2000 行一个架构，  
> 到 8000 行已经变成各种补丁和局部状态。

但这个项目连 UI 都坚持“所有可见状态由 story time 求值”，所以 seek 和 freeze 仍然成立。

这说明的不只是 context window 大，而是：

**模型能够维持一个高层 invariant，并让后续实现服从它。**

这类能力对大型软件工程非常关键。

### 3. 跨领域知识整合能力特别明显

这个项目至少横跨：

```text
计算机图形学
几何建模
GLSL
WebGL / Three.js
音频 DSP
Web Audio
音乐理论
电影配乐
摄影
剪辑
UI
性能工程
航海/船体知识
天文学
历史叙事
```

重点不是 Claude 分别知道这些知识。

而是**能把它们接起来**。

例如：

摄影系统给出：

```text
lens
focus
aperture
```

FX 系统真的读取 aperture 去控制 DOF。

音乐系统知道：

```text
impact
funnel fall
break
stern splash
```

所以会在这些大音效处自动 duck 配乐。

音频又和主时钟共用 story time。

海洋需要知道船走过哪里，所以读取船的 travel。

粒子需要跟随断裂后的船头/船尾，所以要知道不同 rigid section 的历史矩阵。

这是一种：

> **跨模块语义理解**

而不只是 API 拼接。

### 4. 它体现了明显的“抽象能力”

比如 Titanic 船体没有简单写成：

```js
new BoxGeometry(...)
```

而是先抽象出一个 canonical hull：

```text
halfBeam(x, y)
sheer(x)
ends(y)
```

然后：

船体建模使用它；

海浪泡沫使用它；

碰撞喷溅使用它；

镜头构图也可以使用同一个空间定义。

这其实是很成熟的软件设计思想：

> **不要让每个模块分别拥有一个“差不多的 Titanic”。**
>
> 建立一个共享的数学事实源。

世界单位也统一：

```text
1 unit = 1 metre
+Y = up
sea level = 0
ship-local +X = bow
```

这种东西单独看非常不起眼，但大型项目是否会烂掉，往往就取决于这里。

### 5. “导演能力”已经不只是把相机动起来

`director` 模块真正让我觉得模型能力发生变化。

它没有把 camera 当普通 3D 控件，而是抽象成：

```text
shot
position
target
lens
focus
aperture
roll
fade
```

并组织成完整 shot list。

也就是说，它理解了：

> 摄像机位置 ≠ 镜头设计。

源码里的 director 本质上在实现**摄影语法**，并且还处理镜头 cut、focus、letterbox 等问题。

这体现的是一种很有意思的能力：

### 把软性的审美概念转化成硬参数。

“压迫感”最终变成：

```text
更低机位
更长焦/更广角
主体占画面多少
focus distance
camera drift
```

这对未来 AI 创作特别重要。

### 6. 它不是“会播放 BGM”，而是真的理解音频系统

我们前面拆过，这部分很能证明跨领域实现能力。

配乐本身就是程序数据：

```text
pitch
velocity
duration
instrument
articulation
time
```

而且还有主题、和声、tempo map 和剧情精确落点。

音频 pipeline 又包括：

```text
sampler
synthesizer
buses
EQ
convolution reverb
compression
limiter
ducking
automation
```

更关键的是，seek 到任意时刻以后，持续音符和环境床还能重新建立，调度器会重新同步 AudioContext。

所以它体现的是：

> Claude 不只是知道 Web Audio API 怎么调用，
> 而是能够设计一个小型实时音频引擎。

### 7. 很强的“性能意识”

很多 AI 生成的视觉 demo 是：

> 先把东西堆出来，跑不动再说。

Titanic 明显不是。

它主动做了很多“产品化”判断：

```text
instancing
LOD / quality tier
voice cap
DPR cap
GPU billboard particles
half-resolution reflection
adaptive resolution
shader prewarm
fallback
```

尤其那个 adaptive resolution：

帧率低于一定水平，就降低内部 DPR；恢复后再慢慢升回去。

还有我们之前觉得特别漂亮的 rehearsal：

正式播放之前，偷偷访问代表性镜头和事件，把 shader/texture/GPU pipeline 预热，避免第一次出现某场景的时候卡顿。

这不是“算法竞赛能力”。

这是：

> **我知道实际用户看片时什么地方会坏。**

很接近经验丰富的实时图形工程师。

### 8. 它体现了“为失败设计”的能力

这点其实非常 Staff Engineer。

比如：

```text
采样器下载失败
→ synth fallback

模块初始化失败
→ proxy fallback

手机性能不够
→ low quality

帧率下降
→ 动态 DPR

sample 不可用
→ baked synthesis

seek
→ audio epoch reset

粒子冷启动
→ history texture
```

这种架构的共同特点是：

> 不假设 happy path 永远成立。

AI 以前特别容易写：

```js
await loadEverything();
run();
```

任何一步失败整个东西就挂。

这个项目明显开始考虑：

**系统如何退化，而不是系统是否完美运行。**

### 9. 还有一个非常强的能力：把“状态系统”和“表现系统”分开

这是我觉得对 AI 电影尤其重要的。

Titanic 中：

```text
story
```

负责：

> 世界到底发生什么。

而：

```text
director
```

负责：

> 观众怎么看见它。

这两个不是一回事。

例如 Titanic 断裂发生在那里，是 story/world fact；

摄影机此时到底：

- 远景；
- 近景；
- 船尾低机位；
- 海平面视角；

是 director decision。

这种分离意味着：

**同一个世界可以重新导演。**

以后完全可以：

```text
世界 simulation 不变
↓
Director A：灾难大片
Director B：纪录片
Director C：幸存者视角
```

这其实已经很接近我们刚才说的 AI Film Compilation 了。

### 10. 它还表现出了“测试和可观测性意识”

源码有大量：

```text
freeze
t=
cam=
q=
nofx
hideui
synth
debug
warm
wav
wavstat
```

这些不是观众功能。

是**开发者 instrumentation**。

意味着模型在写系统的时候会想到：

> 我之后怎么检查这个系统？

而不是只考虑最终 UI。

比如：

```text
?t=198&freeze=1
```

就可以专门看断船那一帧。

```text
?cam=...
```

可以调镜头。

```text
?synth=1
```

可以验证没有网络采样时的声音。

这对于复杂系统的可迭代性非常重要。

## 但我觉得最核心的是第 11 个能力

前十个其实都可以概括成一句：

> **Claude 开始能够自己形成“制作方法”。**

以前的大模型更像：

```text
你：给我写一个 ocean shader
AI：好的

你：再写船
AI：好的

你：再写 camera
AI：好的
```

人是 architect。

模型是 implementer。

Titanic 如果真是以很少的人类干预完成的，那么角色发生了变化：

```text
人：
“做一部 Titanic 的五分钟实时电影。”

模型：
“要完成这个目标，我需要：
一个确定性的故事时间轴；
一个共享世界坐标；
程序化船体；
海洋；
天空；
历史事件；
导演系统；
声音设计；
配乐；
后处理；
UI；
seek；
性能降级；
测试接口……
然后这些东西应该这样连接。”
```

这已经不是单纯：

> **coding ability**

而是：

> **project conception → system architecture → implementation → integration → polish**

整个链条。

如果我要按这个项目体现能力的“重要程度”排，我大概会是：

**第一档：**

> **复杂目标分解与系统架构**  
> **长程一致性与跨模块整合**  
> **把不同专业知识转化为统一可执行系统**

**第二档：**

> 图形学实现  
> 程序化建模  
> 音频/DSP  
> 摄影与时间线设计  
> 性能工程

**第三档：**

> 单个 shader 写得多漂亮  
> 某个模型多精细  
> 某个视觉效果多炫

这也是为什么我赞成你之前那句话：

> **“这个项目的实现方式和项目思路，价值甚至大于最终画面到底有多精细。”**

Titanic 真正值得拿来展示下一代模型能力的地方，并不是“Claude 画出了一艘很漂亮的 Titanic”。

而是它表现出了一种以前更多属于**高级人类工程师/技术导演的能力：面对一个没有明确技术规格的创意目标，自己发明一套足够合理的 production pipeline，然后真的把它做完。**

这才是这个 demo 最让我觉得有分量的地方。

---


## Round 04 · 模型是否有“从代码直接想象动态画面”的能力？

### 用户

扣一个细节问题，人/团队做这样的工作很难想象改动代码后，画面会怎样实时动，但是模型接触一些训练语料后是不是天然有从代码判断画面的能力，不然每次截图验证进度很慢消耗很大吧，类比gpt6涌现的原生空间智能

### 助手

对，我觉得你抓到了一个很关键、而且经常被低估的能力：**强模型可能已经具备相当程度的“代码 → 动态视觉结果”的内部预测能力。**

但我会把它和“模型脑内真的跑了一遍 WebGL”区分开。更像是：它能够把代码还原成一个隐式场景图，再利用大量视觉、空间和程序经验，预测**画面大概会长什么样、怎么动、哪里可能出问题**。

比如它看到：

```js
camera.position.set(...)
camera.lookAt(...)
mesh.rotation.y = f(t)
```

实际上很容易建立：

```text
空间中的物体
↓
相机位姿
↓
投影视锥
↓
主体在画面的方位和大小
↓
随 t 如何变化
```

如果再看到：

```glsl
fresnel
normal
specular
bloom
fog
```

它未必能“算出第 742×391 个像素是什么 RGB”，但可以有相当强的判断：

> 这个视角是逆光；
> 轮廓会亮；
> grazing angle 会有强反射；
> bloom 可能把窗灯糊开；
> 雾太大会吞掉远处主体；
> 长焦会压缩纵深；
> 相机这样走可能会穿模。

这已经非常有用了。

我会把这种能力拆成 5 层。

**第一层是符号空间推理。**

这是最容易理解的。

代码本身已经包含了大量几何事实：

```text
鲸鱼 22m
camera 距离 30m
FOV 38°
海平面 y=0
鲸鱼 y=-200
灯从右上方来
```

模型其实可以算。

比如一个 22 米长物体、相机距离 30 米、38° FOV，大致会占画面多少，它完全可以粗估。

这甚至不需要所谓“视觉想象”。

**第二层才是视觉先验。**

比如我们改《鲸落》时，我看到：

```js
FogExp2 density = 0.3
camera distance ≈ 40m
```

即使不渲染，也应该立刻警觉：

> 这东西大概率什么都看不见了。

因为指数雾大致：

\[
T(d)=e^{-(density\cdot d)^2}
\]

那么：

\[
e^{-(0.3\times40)^2}=e^{-144}
\]

基本就是 0。

这不是“看图”。

是：

> **代码理解 + 图形学知识 → 对画面的预测。**

类似地，看到：

```glsl
pow(max(dot(N,H),0.0),220.0)
```

就知道高光非常尖。

看到：

```text
UnrealBloomPass threshold 很低
+
大量 emissive windows
```

就应该预判窗灯容易糊成光团。

**第三层是“学过大量代码—画面对应关系”形成的视觉直觉。**

这应该就是你真正问的东西。

一个模型如果训练过程中见过大量：

```text
Three.js demo
↔ screenshot
Blender Python
↔ render
CSS
↔ webpage
SVG
↔ visual output
GLSL
↔ shader image
游戏代码
↔ gameplay frame
```

即使没有显式教它：

> “现在请学习一个代码渲染器。”

它也可能逐渐学出一种 latent mapping：

\[
\text{program representation}
\rightarrow
\text{visual representation}
\]

也就是：

> **程序长这样，通常画面会长这样。**

这有点类似我们读：

```html
<div style="display:flex; justify-content:center">
```

不用打开浏览器，脑子里已经知道大概是什么布局。

只不过强模型把这个能力扩展到了：

```text
3D geometry
camera
lighting
shader
post FX
animation
```

这种复杂程度。

而你的 GPT‑6 Astra 类比我认为确实非常合适。

OpenAI 对 Astra 的官方描述里特意强调了它对 **websites、games、applications 和 renderings 的 visual judgment** 有明显增强，而且可以自己构建网站、游戏，再做 frontend QA。([openai.com](https://openai.com/index/gpt-6-astra/?utm_source=chatgpt.com))

更有意思的是，官方引用的实际使用反馈里说：

> 更高 reasoning effort 会带来更多迭代、更多 browser testing，并更倾向实际执行代码，而不是只 patch。([openai.com](https://openai.com/index/gpt-6-astra/?utm_source=chatgpt.com))

这恰恰说明现在强模型的能力很可能是：

```text
内部预测
+
外部视觉验证
```

而不是二选一。

这和人非常像。

### 一个很好的类比就是资深 3D 技术美术

一个真正很熟 Unreal / Blender 的人看到：

```text
相机位置
焦段
灯的位置
roughness
雾密度
动画曲线
```

他也不会每调一个数字都按 F12 渲染。

他脑子里已经有一个近似 renderer。

比如：

> “这个灯放到这里肯定会把脸打平。”

> “这个焦段再靠近，人脸透视会夸张。”

> “这里 roughness 0.05 太塑料了。”

> “这条 spline 到这里相机会突然减速。”

他们当然也会看 viewport。

但是：

**viewport 是校准器，不是他们唯一知道结果的方式。**

模型现在似乎也开始出现这种现象。

Titanic 的源码其实有一个细节很支持你的判断。

它专门做了大量：

```text
?t=198&freeze=1
?cam=...
?q=low
?nofx=1
```

也就是说它的开发方式很可能不是：

> 改一行 → 从 0 秒看片五分钟 → 截图。

而是：

```text
先根据代码推断
↓
一次改一个完整系统
↓
直接跳到几个关键时间点
↓
截图/运行验证
↓
修正
```

甚至还可以：

```text
t=74    碰撞
t=179   烟囱倒塌
t=198   船体断裂
t=216   船尾下沉
t=255   海床撞击
```

这实际上就是**视觉单元测试**。

所以一个模型如果已经有比较好的内部视觉模拟能力，它的工作循环可以变成：

```text
读代码
 ↓
内部建立 scene graph
 ↓
预测：
“这里应该出现 X”
“这里大概会有 Y 问题”
 ↓
连续修改 500 行
 ↓
只检查 5 个 hero frames
 ↓
根据真实结果修正内部判断
 ↓
再修改
```

而不是：

```text
改 5 行
↓
截图
↓
改 5 行
↓
截图
↓
改 5 行
↓
截图
```

效率差距会非常大。

而且这里其实还涉及一个比“识图”更强的东西：

## temporal imagination

静态画面还不是最难的。

Titanic 真正难的是：

```js
position = f(t)
rotation = g(t)
camera = h(t)
particles = p(t)
```

模型需要预测：

> **这些函数一起变化以后，运动是什么感觉。**

例如：

```text
相机向前 dolly
+
FOV 同时变窄
+
主体缓慢后退
```

最后可能造成：

> 主体尺寸基本不变，但背景被压缩。

这是经典 dolly zoom 的某种条件。

模型如果能读代码意识到这一点，就已经不只是“空间理解”，而是在做：

\[
\text{space} + \text{time}
\]

的隐式模拟。

所以我甚至觉得比“空间智能”更准确的词可能是：

> **spatiotemporal program intuition**
>
> 时空程序直觉。

不过有一条边界特别重要。

### 模型内部想象 ≠ 真正渲染

有很多东西仍然非常难脑补准确：

- shader 多层叠加；
- tone mapping；
- HDR clipping；
- alpha sorting；
- texture filtering；
- temporal aliasing；
- 粒子密度；
- 波浪干涉；
- bloom kernel；
- GPU driver 差异；
- 真实帧率；
- 一个镜头“看起来是否舒服”。

尤其是最后一个。

例如代码上：

```text
主体在三分线
焦距合理
没有穿模
曝光合理
```

并不意味着：

> 镜头好看。

所以截图依然非常重要。

只是截图从：

> **唯一感知渠道**

变成：

> **ground truth 校准渠道。**

这里也让我觉得“多模态训练”真正厉害的地方，可能不是单独提高了视觉问答。

而是不同模态之间开始形成可互译的内部表征：

```text
语言
 ↕
代码
 ↕
空间
 ↕
图像
 ↕
动作
```

于是：

```text
代码 → 图像
图像 → 代码
文字 → 3D
3D → 文字
截图 → 找 bug
```

这些以前看起来完全不同的任务，底层可能开始共享某种 representation。

这其实也是为什么 Astra 在 BenchCAD、多视图建模、Blender、Unreal、网页 QA 这些看似完全不同的任务上可以同时进步。官方确实把其 CAD/3D、游戏和 rendering visual judgment 放在同一代能力提升里展示。([openai.com](https://openai.com/index/gpt-6-astra/?utm_source=chatgpt.com))

所以我现在比较倾向于这样理解 Titanic：

Claude 不太可能是：

> **完全看不见画面，只靠每次 screenshot 瞎试。**

那样五分钟这种规模、这么多相互作用的系统，开发成本会高得离谱。

更合理的是：

> **大部分时候模型能从代码建立一个低分辨率的“脑内电影”；真正运行浏览器，是拿现实结果给这部脑内电影做校准。**

而且随着模型空间智能、视频理解和 computer-use 继续融合，这个“脑内 renderer”很可能会越来越准。

那时候会出现一个很有意思的变化：

以前 AI 写图形代码是：

> 写代码 → 看结果 → 修代码。

未来更像：

> **先在 latent space 里导演和预演 → 写出实现 → 少量现实验证。**

这和一个经验非常丰富的人类技术导演的工作方式，确实越来越像了。

---


## Round 05 · 为什么这么复杂还保持单文件？这其实已经是引擎雏形吗？

### 用户

还有一个问题，这个项目的工程化完整度是很高的，但是它还是选择了单文件的展现形式，是一种炫技吗？每个部分拆开细化，其实最终可以形成一个程序化3D电影制作的引擎的，多文件系统可维护性，可拓展性之类的也会大大增加，我想的对吗

### 助手

对，而且我觉得这里要把一个很容易混淆的东西分开：

**它选择的是“单文件交付”，未必是“单文件开发”。**

实际上从你给我的源码看，我现在甚至更倾向于认为：这个 `titanic.html` 本身就是某种 **bundle / build artifact**，而不是真正的原始工程形态。

因为文件里直接留下了这种标记：

```js
// ==== FILE: src/00_core.js ====
// ==== FILE: src/10_story.js ====
// ...
// ==== FILE: src/50_audio.js ====
// ==== FILE: src/90_main.js ====
```

而 `00_core.js` 里还明确规定“每个 module file 调用 `TT.register(name, obj)`”；`90_main.js` 更直接写着自己会为“**absent from a dev build**”的模块创建 stand-in proxy。

甚至 HTML 里还能看到 `<!--HEAD-->`、`<!--BODY-->` 这种明显有模板/拼装味道的痕迹，然后才进入内联后的 `src/00_core.js`。

所以我现在的判断是：

> **单文件更像发行格式，而不是架构本身。**

这和一个正常前端项目最后 `npm run build` 生成一个压缩 bundle 是一个道理。

### 那它是不是有一点“炫技”？

**有，但不只是炫技。**

如果这是一个模型能力 showcase，那么交一个：

```text
titanic.html
```

实在太有传播力了。

用户不需要面对：

```text
src/
assets/
package.json
vite.config.js
public/
npm install
npm run dev
```

而是：

> “这是一个 HTML，打开，它就是一部五分钟电影。”

从能力展示角度特别漂亮。

它在心理上的冲击远大于：

> “Claude 写了一个 30 文件的 Three.js repo。”

因为单 HTML 给人的感觉是：

**整个世界、电影、摄影、声音、程序都封存在一个文件里。**

所以它确实有某种 demoscene 式的炫技意味。

但更重要的是工程交付理由。

对这种 benchmark/showcase 来说，单文件有几个巨大优势：

**容易验收。**

拿到一个文件就能跑。

**容易保存。**

不会出现：

```text
少传了 assets/
node_modules 版本错了
构建工具升级了
文件路径坏了
```

**容易比较模型输出。**

如果模型每次最终都必须产生一个 artifact：

```text
index.html
```

评测 harness 就非常简单。

**容易部署和分享。**

直接静态托管。

而它其实并没有真正追求“绝对单文件离线”，因为 Three.js 和 addons 仍然通过 jsDelivr import map 加载。音频优先也会下载采样，失败才进入 synth fallback。

所以：

> 单文件明显是一种**封装形式**，而不是“我拒绝任何外部依赖”的极限挑战。

→ low quality

帧率下降
→ 动态 DPR

sample 不可用
→ baked synthesis

seek
→ audio epoch reset

粒子冷启动
→ history texture
```

这种架构的共同特点是：

> 不假设 happy path 永远成立。

AI 以前特别容易写：

```js
await loadEverything();
run();
```

任何一步失败整个东西就挂。

这个项目明显开始考虑：

**系统如何退化，而不是系统是否完美运行。**

### 9. 还有一个非常强的能力：把“状态系统”和“表现系统”分开

这是我觉得对 AI 电影尤其重要的。

Titanic 中：

```text
story
```

负责：

> 世界到底发生什么。

而：

```text
director
```

负责：

> 观众怎么看见它。

这两个不是一回事。

例如 Titanic 断裂发生在那里，是 story/world fact；

摄影机此时到底：

- 远景；
- 近景；
- 船尾低机位；
- 海平面视角；

是 director decision。

这种分离意味着：

**同一个世界可以重新导演。**

以后完全可以：

```text
世界 simulation 不变
↓
Director A：灾难大片
Director B：纪录片
Director C：幸存者视角
```

这其实已经很接近我们刚才说的 AI Film Compilation 了。

### 10. 它还表现出了“测试和可观测性意识”

源码有大量：

```text
freeze
t=
cam=
q=
nofx
hideui
synth
debug
warm
wav
wavstat
```

这些不是观众功能。

是**开发者 instrumentation**。

意味着模型在写系统的时候会想到：

> 我之后怎么检查这个系统？

而不是只考虑最终 UI。

比如：

```text
?t=198&freeze=1
```

就可以专门看断船那一帧。

```text
?cam=...
```

可以调镜头。

```text
?synth=1
```

可以验证没有网络采样时的声音。

这对于复杂系统的可迭代性非常重要。

## 但我觉得最核心的是第 11 个能力

前十个其实都可以概括成一句：

> **Claude 开始能够自己形成“制作方法”。**

以前的大模型更像：

```text
你：给我写一个 ocean shader
AI：好的

你：再写船
AI：好的

你：再写 camera
AI：好的
```

人是 architect。

模型是 implementer。

Titanic 如果真是以很少的人类干预完成的，那么角色发生了变化：

```text
人：
“做一部 Titanic 的五分钟实时电影。”

模型：
“要完成这个目标，我需要：
一个确定性的故事时间轴；
一个共享世界坐标；
程序化船体；
海洋；
天空；
历史事件；
导演系统；
声音设计；
配乐；
后处理；
UI；
seek；
性能降级；
测试接口……
然后这些东西应该这样连接。”
```

这已经不是单纯：

> **coding ability**

而是：

> **project conception → system architecture → implementation → integration → polish**

整个链条。

如果我要按这个项目体现能力的“重要程度”排，我大概会是：

**第一档：**

> **复杂目标分解与系统架构**  
> **长程一致性与跨模块整合**  
> **把不同专业知识转化为统一可执行系统**

**第二档：**

> 图形学实现  
> 程序化建模  
> 音频/DSP  
> 摄影与时间线设计  
> 性能工程

**第三档：**

> 单个 shader 写得多漂亮  
> 某个模型多精细  
> 某个视觉效果多炫

这也是为什么我赞成你之前那句话：

> **“这个项目的实现方式和项目思路，价值甚至大于最终画面到底有多精细。”**

Titanic 真正值得拿来展示下一代模型能力的地方，并不是“Claude 画出了一艘很漂亮的 Titanic”。

而是它表现出了一种以前更多属于**高级人类工程师/技术导演的能力：面对一个没有明确技术规格的创意目标，自己发明一套足够合理的 production pipeline，然后真的把它做完。**

这才是这个 demo 最让我觉得有分量的地方。

---


## Round 04 · 模型是否有“从代码直接想象动态画面”的能力？

### 用户

扣一个细节问题，人/团队做这样的工作很难想象改动代码后，画面会怎样实时动，但是模型接触一些训练语料后是不是天然有从代码判断画面的能力，不然每次截图验证进度很慢消耗很大吧，类比gpt6涌现的原生空间智能

### 助手

对，我觉得你抓到了一个很关键、而且经常被低估的能力：**强模型可能已经具备相当程度的“代码 → 动态视觉结果”的内部预测能力。**

但我会把它和“模型脑内真的跑了一遍 WebGL”区分开。更像是：它能够把代码还原成一个隐式场景图，再利用大量视觉、空间和程序经验，预测**画面大概会长什么样、怎么动、哪里可能出问题**。

比如它看到：

```js
camera.position.set(...)
camera.lookAt(...)
mesh.rotation.y = f(t)
```

实际上很容易建立：

```text
空间中的物体
↓
相机位姿
↓
投影视锥
↓
主体在画面的方位和大小
↓
随 t 如何变化
```

如果再看到：

```glsl
fresnel
normal
specular
bloom
fog
```

它未必能“算出第 742×391 个像素是什么 RGB”，但可以有相当强的判断：

> 这个视角是逆光；
> 轮廓会亮；
> grazing angle 会有强反射；
> bloom 可能把窗灯糊开；
> 雾太大会吞掉远处主体；
> 长焦会压缩纵深；
> 相机这样走可能会穿模。

这已经非常有用了。

我会把这种能力拆成 5 层。

**第一层是符号空间推理。**

这是最容易理解的。

代码本身已经包含了大量几何事实：

```text
鲸鱼 22m
camera 距离 30m
FOV 38°
海平面 y=0
鲸鱼 y=-200
灯从右上方来
```

模型其实可以算。

比如一个 22 米长物体、相机距离 30 米、38° FOV，大致会占画面多少，它完全可以粗估。

这甚至不需要所谓“视觉想象”。

**第二层才是视觉先验。**

比如我们改《鲸落》时，我看到：

```js
FogExp2 density = 0.3
camera distance ≈ 40m
```

即使不渲染，也应该立刻警觉：

> 这东西大概率什么都看不见了。

因为指数雾大致：

\[
T(d)=e^{-(density\cdot d)^2}
\]

那么：

\[
e^{-(0.3\times40)^2}=e^{-144}
\]

基本就是 0。

这不是“看图”。

是：

> **代码理解 + 图形学知识 → 对画面的预测。**

类似地，看到：

```glsl
pow(max(dot(N,H),0.0),220.0)
```

就知道高光非常尖。

看到：

```text
UnrealBloomPass threshold 很低
+
大量 emissive windows
```

就应该预判窗灯容易糊成光团。

**第三层是“学过大量代码—画面对应关系”形成的视觉直觉。**

这应该就是你真正问的东西。

一个模型如果训练过程中见过大量：

```text
Three.js demo
↔ screenshot
Blender Python
↔ render
CSS
↔ webpage
SVG
↔ visual output
GLSL
↔ shader image
游戏代码
↔ gameplay frame
```

即使没有显式教它：

> “现在请学习一个代码渲染器。”

它也可能逐渐学出一种 latent mapping：

\[
\text{program representation}
\rightarrow
\text{visual representation}
\]

也就是：

> **程序长这样，通常画面会长这样。**

这有点类似我们读：

```html
<div style="display:flex; justify-content:center">
```

不用打开浏览器，脑子里已经知道大概是什么布局。

只不过强模型把这个能力扩展到了：

```text
3D geometry
camera
lighting
shader
post FX
animation
```

这种复杂程度。

而你的 GPT‑6 Astra 类比我认为确实非常合适。

OpenAI 对 Astra 的官方描述里特意强调了它对 **websites、games、applications 和 renderings 的 visual judgment** 有明显增强，而且可以自己构建网站、游戏，再做 frontend QA。([openai.com](https://openai.com/index/gpt-6-astra/?utm_source=chatgpt.com))

更有意思的是，官方引用的实际使用反馈里说：

> 更高 reasoning effort 会带来更多迭代、更多 browser testing，并更倾向实际执行代码，而不是只 patch。([openai.com](https://openai.com/index/gpt-6-astra/?utm_source=chatgpt.com))

这恰恰说明现在强模型的能力很可能是：

```text
内部预测
+
外部视觉验证
```

而不是二选一。

这和人非常像。

### 一个很好的类比就是资深 3D 技术美术

一个真正很熟 Unreal / Blender 的人看到：

```text
相机位置
焦段
灯的位置
roughness
雾密度
动画曲线
```

他也不会每调一个数字都按 F12 渲染。

他脑子里已经有一个近似 renderer。

比如：

> “这个灯放到这里肯定会把脸打平。”

> “这个焦段再靠近，人脸透视会夸张。”

> “这里 roughness 0.05 太塑料了。”

> “这条 spline 到这里相机会突然减速。”

他们当然也会看 viewport。

但是：

**viewport 是校准器，不是他们唯一知道结果的方式。**

模型现在似乎也开始出现这种现象。

Titanic 的源码其实有一个细节很支持你的判断。

它专门做了大量：

```text
?t=198&freeze=1
?cam=...
?q=low
?nofx=1
```

也就是说它的开发方式很可能不是：

> 改一行 → 从 0 秒看片五分钟 → 截图。

而是：

```text
先根据代码推断
↓
一次改一个完整系统
↓
直接跳到几个关键时间点
↓
截图/运行验证
↓
修正
```

甚至还可以：

```text
t=74    碰撞
t=179   烟囱倒塌
t=198   船体断裂
t=216   船尾下沉
t=255   海床撞击
```

这实际上就是**视觉单元测试**。

所以一个模型如果已经有比较好的内部视觉模拟能力，它的工作循环可以变成：

```text
读代码
 ↓
内部建立 scene graph
 ↓
预测：
“这里应该出现 X”
“这里大概会有 Y 问题”
 ↓
连续修改 500 行
 ↓
只检查 5 个 hero frames
 ↓
根据真实结果修正内部判断
 ↓
再修改
```

而不是：

```text
改 5 行
↓
截图
↓
改 5 行
↓
截图
↓
改 5 行
↓
截图
```

效率差距会非常大。

而且这里其实还涉及一个比“识图”更强的东西：

## temporal imagination

静态画面还不是最难的。

Titanic 真正难的是：

```js
position = f(t)
rotation = g(t)
camera = h(t)
particles = p(t)
```

模型需要预测：

> **这些函数一起变化以后，运动是什么感觉。**

例如：

```text
相机向前 dolly
+
FOV 同时变窄
+
主体缓慢后退
```

最后可能造成：

> 主体尺寸基本不变，但背景被压缩。

这是经典 dolly zoom 的某种条件。

模型如果能读代码意识到这一点，就已经不只是“空间理解”，而是在做：

\[
\text{space} + \text{time}
\]

的隐式模拟。

所以我甚至觉得比“空间智能”更准确的词可能是：

> **spatiotemporal program intuition**
>
> 时空程序直觉。

不过有一条边界特别重要。

### 模型内部想象 ≠ 真正渲染

有很多东西仍然非常难脑补准确：

- shader 多层叠加；
- tone mapping；
- HDR clipping；
- alpha sorting；
- texture filtering；
- temporal aliasing；
- 粒子密度；
- 波浪干涉；
- bloom kernel；
- GPU driver 差异；
- 真实帧率；
- 一个镜头“看起来是否舒服”。

尤其是最后一个。

例如代码上：

```text
主体在三分线
焦距合理
没有穿模
曝光合理
```

并不意味着：

> 镜头好看。

所以截图依然非常重要。

只是截图从：

> **唯一感知渠道**

变成：

> **ground truth 校准渠道。**

这里也让我觉得“多模态训练”真正厉害的地方，可能不是单独提高了视觉问答。

而是不同模态之间开始形成可互译的内部表征：

```text
语言
 ↕
代码
 ↕
空间
 ↕
图像
 ↕
动作
```

于是：

```text
代码 → 图像
图像 → 代码
文字 → 3D
3D → 文字
截图 → 找 bug
```

这些以前看起来完全不同的任务，底层可能开始共享某种 representation。

这其实也是为什么 Astra 在 BenchCAD、多视图建模、Blender、Unreal、网页 QA 这些看似完全不同的任务上可以同时进步。官方确实把其 CAD/3D、游戏和 rendering visual judgment 放在同一代能力提升里展示。([openai.com](https://openai.com/index/gpt-6-astra/?utm_source=chatgpt.com))

所以我现在比较倾向于这样理解 Titanic：

Claude 不太可能是：

> **完全看不见画面，只靠每次 screenshot 瞎试。**

那样五分钟这种规模、这么多相互作用的系统，开发成本会高得离谱。

更合理的是：

> **大部分时候模型能从代码建立一个低分辨率的“脑内电影”；真正运行浏览器，是拿现实结果给这部脑内电影做校准。**

而且随着模型空间智能、视频理解和 computer-use 继续融合，这个“脑内 renderer”很可能会越来越准。

那时候会出现一个很有意思的变化：

以前 AI 写图形代码是：

> 写代码 → 看结果 → 修代码。

未来更像：

> **先在 latent space 里导演和预演 → 写出实现 → 少量现实验证。**

这和一个经验非常丰富的人类技术导演的工作方式，确实越来越像了。

---


## Round 05 · 为什么这么复杂还保持单文件？这其实已经是引擎雏形吗？

### 用户

还有一个问题，这个项目的工程化完整度是很高的，但是它还是选择了单文件的展现形式，是一种炫技吗？每个部分拆开细化，其实最终可以形成一个程序化3D电影制作的引擎的，多文件系统可维护性，可拓展性之类的也会大大增加，我想的对吗

### 助手

对，而且我觉得这里要把一个很容易混淆的东西分开：

**它选择的是“单文件交付”，未必是“单文件开发”。**

实际上从你给我的源码看，我现在甚至更倾向于认为：这个 `titanic.html` 本身就是某种 **bundle / build artifact**，而不是真正的原始工程形态。

因为文件里直接留下了这种标记：

```js
// ==== FILE: src/00_core.js ====
// ==== FILE: src/10_story.js ====
// ...
// ==== FILE: src/50_audio.js ====
// ==== FILE: src/90_main.js ====
```

而 `00_core.js` 里还明确规定“每个 module file 调用 `TT.register(name, obj)`”；`90_main.js` 更直接写着自己会为“**absent from a dev build**”的模块创建 stand-in proxy。

甚至 HTML 里还能看到 `<!--HEAD-->`、`<!--BODY-->` 这种明显有模板/拼装味道的痕迹，然后才进入内联后的 `src/00_core.js`。

所以我现在的判断是：

> **单文件更像发行格式，而不是架构本身。**

这和一个正常前端项目最后 `npm run build` 生成一个压缩 bundle 是一个道理。

### 那它是不是有一点“炫技”？

**有，但不只是炫技。**

如果这是一个模型能力 showcase，那么交一个：

```text
titanic.html
```

实在太有传播力了。

用户不需要面对：

```text
src/
assets/
package.json
vite.config.js
public/
npm install
npm run dev
```

而是：

> “这是一个 HTML，打开，它就是一部五分钟电影。”

从能力展示角度特别漂亮。

它在心理上的冲击远大于：

> “Claude 写了一个 30 文件的 Three.js repo。”

因为单 HTML 给人的感觉是：

**整个世界、电影、摄影、声音、程序都封存在一个文件里。**

所以它确实有某种 demoscene 式的炫技意味。

但更重要的是工程交付理由。

对这种 benchmark/showcase 来说，单文件有几个巨大优势：

**容易验收。**

拿到一个文件就能跑。

**容易保存。**

不会出现：

```text
少传了 assets/
node_modules 版本错了
构建工具升级了
文件路径坏了
```

**容易比较模型输出。**

如果模型每次最终都必须产生一个 artifact：

```text
index.html
```

评测 harness 就非常简单。

**容易部署和分享。**

直接静态托管。

而它其实并没有真正追求“绝对单文件离线”，因为 Three.js 和 addons 仍然通过 jsDelivr import map 加载。音频优先也会下载采样，失败才进入 synth fallback。

所以：

> 单文件明显是一种**封装形式**，而不是“我拒绝任何外部依赖”的极限挑战。

## 但你后半句话，我觉得更加重要

> “每个部分拆开细化，其实最终可以形成一个程序化 3D 电影制作引擎。”

**完全正确。**

甚至我认为 Titanic 已经不是“能不能改造成引擎”的问题了。

它实际上已经是：

> **一个电影引擎原型，只不过 Titanic 这个项目和引擎层还粘在一起。**

你看它现在已经存在：

```text
Clock
Event Bus
Module Lifecycle
World State
Timeline
Renderer
Director
Camera Rig
Audio Scheduler
Mixer
Score Engine
Particle System
Post FX
Quality Manager
UI
Debug / Test Interface
```

这些哪一样是“Titanic 专属”的？

都不是。

真正 Titanic 专属的是：

```text
Titanic hull
lifeboats
iceberg
telegraph messages
Titanic sinking curves
1912 sky
Titanic score
Titanic shot list
```

所以其实已经天然可以切成两层：

```text
┌──────────────────────────┐
│       Film Engine        │
│                          │
│ clock                    │
│ timeline                 │
│ director                 │
│ renderer                 │
│ audio                    │
│ fx                       │
│ quality                  │
│ scene/module runtime     │
└────────────┬─────────────┘
             │
             │ film definition
             ▼
┌──────────────────────────┐
│      Titanic Film        │
│                          │
│ ship                     │
│ iceberg                  │
│ ocean setup              │
│ story events             │
│ shots                    │
│ score                    │
└──────────────────────────┘
```

然后下面再放一个：

```text
Whale Fall Film
```

我们的《鲸落》就不需要重新写：

```text
clock
seek
director
UI
quality
audio scheduling
render loop
```

只写作品本身。

## 真正值得抽出来的核心其实不是 Three.js

这是我特别想强调的。

如果真把它做成引擎，我不会把核心叫：

> `TitanicEngine`

甚至不会叫：

> `ThreeFilmEngine`

因为它最有价值的思想其实是：

\[
\boxed{WorldState = F(storyTime)}
\]

以及：

\[
\boxed{Shot = G(storyTime, WorldState)}
\]

这个才是灵魂。

Three.js 只是 renderer。

完全可以：

```text
Film Runtime
     │
     ├── Three.js renderer
     ├── Babylon renderer
     ├── Blender exporter
     ├── Unreal exporter
     └── AI-video conditioning exporter
```

也就是我们前面讨论的：

> **Film DSL / executable screenplay**

开始真正出现了。

### 我甚至会把现在的 `TT.S` 升格成正式概念

比如未来不叫：

```js
TT.S
```

而叫：

```ts
FilmState
```

所有系统有明确 contract：

```ts
interface FilmModule {
  init(ctx: FilmContext): Promise<void> | void;
  evaluate(
    time: number,
    state: FilmState,
    ctx: FilmContext
  ): void;
}
```

然后严格规定：

> 可 seek 系统原则上不能依赖上一帧。

如果必须 stateful，例如流体模拟，则需要：

```text
snapshot
history cache
reconstruction
```

机制。

Titanic 的 particle 系统其实已经在解决这件事了：粒子的位置是 `(t - birth)` 的解析函数；跟随船体的 emitter 甚至预生成整部电影的 section matrix history texture，因此冷启动到任意时间也能得到正确结果。

这已经非常像**引擎设计 invariant**，而不只是某部电影的小技巧。

## 然后 Director 完全可以独立成一套系统

现在 Titanic 已经有：

```text
position
target
lens
focus
aperture
roll
fade
cut
```

那下一步自然可以成为：

```ts
Shot {
  id
  t0
  t1

  camera
  lens
  focus
  aperture

  transition
  grade
  audioPerspective
}
```

甚至：

```text
shot_012:
    subject: stern
    framing: medium-wide
    lens: 55mm
    motion:
        type: dolly
        ...
```

于是导演不需要写 camera JS。

电影脚本开始变成**声明式数据**。

## Story 也应该从代码里抽出来

现在是：

```js
EV.impact = 74
EV.breakStart = 195
...
```

未来完全可以：

```yaml
events:
  - id: impact
    time: 74.0

  - id: funnel_fall
    time: 179.5

  - id: break
    time: 198.0
```

然后轨道：

```yaml
tracks:
  stern_pitch:
    - [190, 8deg]
    - [205, 35deg]
    - [214, 82deg]
```

引擎负责插值、seek、事件查询。

这样就开始真正具备“电影制作软件”的味道了。

## 多文件真正带来的提升不只是“代码好看”

你说的可维护性、可扩展性确实会大幅提高，但还可以更具体。

比如现在 `50_audio.js` 已经是两千多行。

拆开以后完全应该是：

```text
audio/
    AudioEngine.ts
    Scheduler.ts
    Mixer.ts
    Sampler.ts
    Synth.ts
    Reverb.ts
    Foley.ts
    OfflineRender.ts
```

然后测试：

```text
Scheduler.test.ts
Seek.test.ts
Mixer.test.ts
```

FX：

```text
fx/
    Composer.ts
    Bloom.ts
    DOF.ts
    Particles.ts
    Smoke.ts
    Splash.ts
    Underwater.ts
```

Director：

```text
director/
    Director.ts
    CameraRig.ts
    Shot.ts
    Framing.ts
    Shake.ts
```

这时候最大的区别是：

> **你可以升级引擎，而不碰电影。**

比如未来把 Bloom 换了：

Titanic 不改。

Whale Fall 不改。

再做“阿波罗 11 号”：

也不用重写 Bloom。

这才叫平台。

## 我如果真把它工程化，大概会长这样

```text
film-engine/
│
├─ packages/
│   ├─ core/
│   │   ├─ clock/
│   │   ├─ timeline/
│   │   ├─ state/
│   │   ├─ events/
│   │   └─ module-runtime/
│   │
│   ├─ director/
│   │   ├─ shots/
│   │   ├─ camera/
│   │   └─ framing/
│   │
│   ├─ renderer-three/
│   │   ├─ scene/
│   │   ├─ materials/
│   │   └─ geometry/
│   │
│   ├─ fx/
│   ├─ audio/
│   ├─ ui/
│   ├─ editor/
│   └─ exporter/
│
├─ films/
│   ├─ titanic/
│   │   ├─ film.ts
│   │   ├─ story.ts
│   │   ├─ shots.ts
│   │   ├─ score.ts
│   │   └─ world/
│   │
│   └─ whale-fall/
│
└─ tools/
    ├─ build-film
    ├─ render-frame
    ├─ render-video
    └─ package-html
```

然后：

```bash
film build titanic
```

最后仍然可以生成：

```text
dist/titanic.html
```

所以：

**工程多文件和最终单文件根本不矛盾。**

甚至我认为这才是最优解：

> **Source：高度模块化、多文件、多 package**
>
> **Artifact：一个可以到处分享的 HTML**

这个其实和游戏工业非常类似：

```text
Unity 项目
→ 成千上万个源文件

最终：
game.exe
```

没人因为最后只有一个 `.exe` 就认为游戏是“单文件工程”。

Titanic 应该也这么看。

## 再往前一步，它甚至应该有编辑器

这就是你这个想法最有价值的下一阶段。

现在模型直接写：

```js
shots.push(...)
TR.pitch = [...]
```

人类不舒服。

一个真正的引擎应该能够实时展示：

```text
┌────────────────────────────────────────────┐
│                 Viewport                   │
│                                            │
│                 Titanic                    │
│                                            │
├────────────────────────────────────────────┤
│ Story                                      │
│ ─────●impact────────●break─────────────    │
│                                            │
│ Camera   █ shot12 ███ shot13 █████         │
│ Music    ███████████████████████████       │
│ SFX          ▲      ▲        ▲             │
│ Lights   ─────────╲________                 │
└────────────────────────────────────────────┘
```

但是底层保存的不是一个黑盒 Premiere project。

而是：

```text
film.ts / film.json / film.yaml
```

所以：

人可以改；

模型可以改；

Git 可以 diff；

程序可以分析；

自动测试可以跑。

这个组合其实很强：

> **传统 NLE/DCC 的可视化编辑能力 + 代码工程的可版本控制能力 + LLM 的自然语言编辑能力。**

所以我反而觉得 Titanic 这个项目有一个很有意思的“不完整之处”：

它已经证明了：

> **程序化电影 runtime 可行。**

但还没有真正做到：

> **程序化电影 authoring platform。**

也就是：

```text
现在：
电影 = 大量精心组织的 JS

下一步：
电影 = 声明式 Film Project
          ↓
       Film Engine
          ↓
   realtime cinematic
```

这一步一旦完成，你前面提出的 AI 视频制作工作流就会自然接上：

```text
自然语言剧本
      ↓
LLM
      ↓
Film Project / DSL
      ↓
3D realtime previs
      ↓
导演调整
      ↓
RGB / Depth / Normal / Camera / Motion
      ↓
视频生成模型
      ↓
最终镜头
```

所以你的判断不只是“多文件会更好维护”。

更准确地说是：

> **Titanic 已经无意中暴露出了一套通用电影引擎的骨架；单 HTML 只是它现在为了展示而选择的发行容器。**

我甚至觉得，如果我们后面继续做《鲸落》，与其把 v3 又塞回一个越来越大的 HTML，**更有意思的路线就是开始把 Titanic 的通用部分抽出来，做一个真正的 `film-engine`，然后让 Titanic 和 Whale Fall 都变成这个引擎上的两个 project。**

那时候我们就不再是在“模仿这个 demo”，而是在把它隐含的工程思想向前推进一层。

---


## Round 06 · 用户澄清“单文件”的含义，并要求真正搭建引擎

### 用户

OK，我开始的单文件是指相对传统的稍微复杂一点的html网页就通常不是单页结构，而是在文件夹里有css之类的依赖，而这个项目居然在这么高的复杂度的情况下还能保持单文件，我觉得很厉害。你用exe解释我一下子就听懂了。现在尝试从这个项目开始逆向完整的视频制作引擎项目，在我的github里创一个仓库，把骨架搭好，填能填的内容
@GitHub

### 助手

已经把第一版“逆向引擎化”工程搭出来了，定位不是 Titanic 复刻，而是把它隐含的通用能力抽成真正可扩展的程序化 3D 电影引擎。

现在工程里已经有：

- `packages/core`：绝对故事时钟、play/pause/seek、模块生命周期、Service Registry、曲线、确定性 RNG
- `packages/director`：Shot、Camera Rig、焦段/FOV、镜头选择
- `packages/renderer-three`：Three.js 后端、相机适配、自适应 DPR
- `packages/audio`：Web Audio 总线、look-ahead cue 调度、seek epoch
- `packages/fx`：质量档位与后处理接口骨架
- `films/whale-fall`：第一个独立 Film Project，不再把作品和引擎绑死
- `apps/studio`：最小实时预览播放器
- `docs/`：架构、Titanic→Engine 映射、设计原则、完整路线图
- `film.project.json` + draft JSON Schema：开始把“电影=JS代码”往 Film DSL 推
- `tools/package-single-html.mjs`：开发期保持多文件，发布时重新压成单 HTML
- `tools/verify.mjs`：零依赖静态验证器

核心抽象已经明确成：

```text
FilmState = F(storyTime)
Shot      = G(storyTime, FilmState)
Frame     = Render(FilmState, Shot)
```

也就是说，Three.js 只是第一个 renderer，真正的引擎核心是**可寻址的电影世界**。

我还专门保留了你刚才理解到的那层：

```text
开发：
几十/几百个模块化文件
        ↓
构建
        ↓
