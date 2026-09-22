# 从 `titanic.html` 到 Executable Film Engine

## 2026-09-22 深夜—2026-09-23 凌晨讨论全记录与回顾

> 这不是一次普通的“项目总结”。它试图保存今晚这条讨论链真正发生过的思维推进：我们从一个令人惊艳的单文件 WebGL 电影项目开始，没有停在“好牛”或“代码很多”，而是连续追问它为什么像电影、配乐到底展示了什么技术、这种项目方式与灰模/预演的关系、它在 AI 视频和传统电影工业中的位置、历史上有哪些人类前置项目、它究竟体现了 Claude 哪些能力、模型是否存在从代码预判视觉结果的“脑内 renderer”、为什么高复杂度项目还保持单文件交付，以及最后如何把这套思想反向抽取成一个真正的程序化 3D 电影制作引擎。
>
> 最后，我们没有停在概念层，而是实际创建了 `Executable Film Engine` 的工程骨架，并将其覆盖提交到 `Frank-nju/longjing-tea-website` 的 `main` 分支。

---

## 0. 档案说明：哪些是原文，哪些是恢复版

这份文档分两层：

1. **第一部分：按时间顺序保存讨论。** 尽可能保留用户问题、关键原话、助手回答中的完整论证、代码/公式和项目事实。
2. **第二部分：站在整晚讨论结束后的高度重新回看。** 不替换原讨论，而是解释每次追问如何改变了问题本身。

需要特别说明原文完整性：

- 从《鲸落》v2 之后的大部分讨论，当前会话仍保留了足够完整的用户与助手原文，可以直接归档。
- 最早的 `titanic.html` 首次源码拆解，当前能访问到原项目文件、用户原始问题、后续用户原话，以及系统保留下来的详细内容摘要，但**最初助手回复的逐字全文已经无法完整恢复**。因此相关段落标注为 **“上下文恢复版”**，只整理能由源码和保留上下文支持的内容，不伪装成逐字转录。
- 工具调用的内部原始 JSON、隐藏推理链不属于用户可见对话，因此不收录；但用户实际看到的阶段性进度说明和最终结论，在其影响讨论方向时会保留。

---

# 第一部分：讨论原文与时间线

## 1. 起点：不是“看网页”，而是拆一部用代码写出来的电影

### 用户

> 阅读这个文件的源码，拆解项目细节和原理
>
> `titanic.html`

### 助手：上下文恢复版

第一次拆解后，真正重要的发现并不是“用了 Three.js”，而是整个项目已经形成一套接近小型实时电影运行时的结构。源码被明确分成：

```text
00_core
10_story
20_sky
30_ocean
40_ship
45_props
50_audio
55_score
60_fx
70_director
80_ui
90_main
```

其中最关键的架构思想，是**所有主要系统共享一个可寻址的故事时间**。

项目不是把电影理解成：

```text
上一帧 -> 改一点状态 -> 下一帧 -> 再改一点状态
```

而更接近：

```text
S = story.sample(t)
```

即给定故事时间 `t`，重新求出这一刻世界应该是什么状态。这样播放器才能做到任意 seek、freeze、debug still，并尽可能让冷启动到某个时间点时的画面与从头播放到该点一致。

这个思路贯穿项目：

- `TT.clock` 负责主故事时间；音频启动后可把 AudioContext 时钟作为更精确的时间权威。
- `TT.story` 管剧情事件、沉船阶段、无线电、救生艇、字幕等世界事实。
- `director` 不改变剧情，只决定这一刻怎么拍：机位、目标、焦段、焦点、光圈、roll、fade、cut。
- 粒子、泡沫、烟、火花等效果尽量被写成绝对时间可重建的解析状态；某些跟随船体历史的发射器则使用预计算的 history lookup texture。
- UI 也尽量由 story time 求值，因此 seek 后字幕、深度、时间条应与画面一致。
- 音频在 seek 时不是简单“继续播”，而是结束旧 voice、重新从新的 story time 调度，连长音和 ambient bed 都需要从中途重新建立。

源码中还存在大量开发工具化设计：

```text
?t=SECONDS
&freeze=1
&cam=...
&q=low|medium|high
&nofx=1
&hideui=1
&synth=1
&debug=1
&warm=SECONDS
```

这说明它不是一个“把画面堆出来就结束”的 demo，而是一个考虑调镜头、关键帧检查、性能降级、音频离线测试、seek 和故障隔离的工程。

第一次拆解时形成的核心判断是：

> 这个项目最厉害的不是某一个 shader 或某一艘程序化 Titanic，而是它把一部电影变成了一个**可以在任意故事时间重新求值的实时程序世界**。

---

## 2. 用户第一次把“视觉品质”和“电影性”分开

### 用户原话

> 确实厉害，我的理解，画面渲染和建模的精细程度以及帧率奠定了视觉品质，用纯代码实现很牛逼，运镜、bgm和剧情这些补齐了它更像一个电影而不是动态网页，而这些影视要素居然也是纯代码实现，更厉害了。只是复刻这个技术路线不难，做到这个精细程度不容易啊。另外有个问题，配乐就只是联网传输没有更多技术实力展示吗

随后又补充：

> 确实厉害，我的理解，画面渲染和建模的精细程度以及帧率奠定了视觉品质，用纯代码实现很牛逼，运镜、bgm和剧情这些补齐了它更像一个电影而不是动态网页，而这些影视要素居然也是纯代码实现，更厉害了。只是复刻这个技术路线不难，做到这个精细程度不容易啊。
> 上面这些我的观点我想和你讨论交流，你可以进一步阐释细节，也可以发表你的看法

### 助手：上下文恢复版

这一轮讨论里，观点被进一步拆成了几个层次。

第一，**视觉品质并不等于多边形数量**。真正决定“看起来精细”的，往往是有效细节（effective detail）：轮廓是否可信、材质是否在正确尺度上变化、光照是否能支持形体、镜头里真正被看见的地方是否值得投入、远景是否有足够层次但不过度计算。

第二，Titanic 之所以不再像一个 Three.js 技术页，而开始像电影，是因为它拥有了完整的“影视语法”：

```text
世界状态
+ 镜头设计
+ 剪辑节奏
+ 声音透视
+ 配乐结构
+ 字幕/信息控制
+ 事件节奏
```

如果只有一艘高精度船在水上动，它仍然只是 3D demo；一旦相机、声音、叙事和节奏开始围绕故事组织，观众看到的才会是电影。

第三，“纯代码”真正有意思的不是“不准用素材”，而是**最终视听表达是运行时由程序组织出来的**。项目可以联网下载乐器 sample，也可以导入 Three.js，但电影不是提前烤好的 mp4；给定 `t`，系统会实时重建此刻的世界、镜头、声音和后期。

第四，技术路线确实可以复刻，但精细程度来自大量“小正确”累积。架构只决定“能不能做”，而画面是否令人信服依赖无数参数选择、反复检查、镜头级修正和审美判断。真正难的并非 `new WebGLRenderer()`，而是做出一整条正确的 production chain。

---

## 3. 一个细节追问：配乐是不是只是在联网播放素材？

### 用户问题（包含在上一轮）

> 另外有个问题，配乐就只是联网传输没有更多技术实力展示吗

### 助手：上下文恢复版

不是。

项目确实会从 CDN 获取部分乐器录音 sample，但那只是**音色原材料**。真正的音乐与声音逻辑大量存在代码内部：

```text
score data
  ↓
notes / velocity / duration / instrument / articulation
  ↓
sampler 或 synth
  ↓
instrument processing
  ↓
music / band / sfx / ambience buses
  ↓
procedural convolution reverb
  ↓
automation / ducking
  ↓
compression / limiter
  ↓
master
```

并且：

- 音符和配器是代码中定义的数据，而非简单播放一条完整 mp3。
- sample 下载失败、离线或 CSP 阻止时，项目会现场生成合成器音色并“bake”成 buffer，继续交给同一个 sampler 体系播放。
- choir、drone、harmonics、部分 percussion 本来就是合成的。
- 环境声、海、撞击、摩斯电码等有自己的程序化声音设计。
- 音频调度基于 AudioContext 时钟并映射 story time，支持 look-ahead 和 seek 后重调度。
- 配乐会围绕剧情事件自动做 automation、静默、ducking，而不是一条背景音乐从头放到尾。

所以更准确地说：

> 网络 sample 只是“乐器录音”；真正展示技术实力的是一个缩小版的**实时配乐 + 声音设计 + 混音引擎**。

这一点也强化了最初的判断：Titanic 不是“动态网页加 BGM”，而是从画面、导演到声音都在共享同一个电影时间。

---

## 4. 从“分析别人作品”转向“自己做”：鲸落初版

### 用户任务

用户随后提供了一份混合文档，其中包含可运行 HTML demo 和完整的《鲸落（Whale Fall）》影视脚本，并明确提出：

> 阅读这个文档，这是我尝试做的一点初步独显demo，影视脚本，实际代码你都可以改，工程框架也可以，继续细化这个demo

文档本身把目标定义为一个更小规模的同类作品：约 80 秒、单文件零构建、保留 `TT.register`、纯时间状态、seek、shader 视觉、URL 调试，但砍掉 Titanic 级别的冰山、复杂刚体、平面反射和大型 UI。

它的故事结构已经很清楚：

```text
海面 / 暖 / 告别
    ↓
下沉 / 冷 / 孤独
    ↓
深海 / 黑 / 神秘
    ↓
海床 / 重新变暖
    ↓
死亡 -> 转化 -> 新生命
```

原始脚本甚至已经给出了 14 个镜头：

```text
surface_sunset
surface_eye
surface_dive
sink_bubbles
sink_wide
sink_light
sink_dark
deep_lume
deep_creatures
deep_fall
floor_touch
floor_settle
floor_life
floor_end
```

### 助手工作结果：`whale_fall_v2.html`

这一轮不是只给建议，而是直接重构并生成了新版 HTML。

主要修改包括：

#### 4.1 Story / Timeline

重新组织关键事件：

```text
titleIn    1.5
eye        4
dive       7
submerge   10.5
sink       14
twilight   22
dark       42
creatures  48
floor      62
settle     66
yearsLater 70.5
life       72
endCard    74
end        80
```

并把“数年后”明确加入剧情，避免鲸落生态在几秒内突然形成的科学违和感。

#### 4.2 Whale

原先只是非常简化的球体变形，新版补了：

- 更接近座头鲸比例的程序化身体轮廓；
- 头部、腹部、尾柄变化；
- 尾鳍上下表面；
- 长胸鳍；
- 背鳍；
- 眼球、瞳孔、角膜高光；
- 约 42 个程序化藤壶 instance；
- 程序化脊椎与肋骨骨架；
- `center / head / eye / blowhole / tail / shoulder` 等锚点，用于导演与 FX；
- 深海吸收、rim light、皮肤 top/bottom coloration；
- 接近海床后逐渐停止“游泳感”的尾部运动；
- “数年后”后身体淡化、骨架出现。

#### 4.3 Environment / FX

新增或强化：

- 海面 procedural wave 与 world-space normal；
- 日落天空、太阳盘、薄云；
- 水下光柱；
- 1800 个 marine snow；
- 2200 个生物发光粒子；
- 程序化海床；
- 触底沉积物云；
- 喷气雾和入水气泡；
- 四只水母；
- 42 条程序化鱼；
- 海床鲨鱼剪影；
- 深度驱动的环境颜色与 fog；
- 冷暖色调转换、vignette、film grain、blackout；
- 动态 bloom。

还修掉了原始 demo 一个很典型的问题：旧 `FogExp2` 密度一度达到 `0.3~0.35`，在几十米距离上会几乎把主体彻底吃掉，新版把深海 fog 改到合理量级。

#### 4.4 Director

最关键的变化，是把原始“一个连续绕鲸鱼转的相机”改成了与脚本一一对应的 14-shot director：

```text
0–4       surface_sunset
4–7       surface_eye
7–10.5    surface_dive
10.5–14   sink_bubbles
14–22     sink_wide
22–30     sink_light
30–42     sink_dark
42–48     deep_lume
48–54     deep_creatures
54–62     deep_fall
62–66     floor_touch
66–70.5   floor_settle
70.5–74   floor_life
74–80     floor_end
```

每个镜头拥有独立构图、距离、FOV、target，并开始真正体现“导演系统”而不是自动摄像机。

#### 4.5 Audio

《鲸落》v2 没再借用外部 BGM，而是用 Web Audio 生成：

- 低频压力 drone；
- 海面噪声；
- 水下纹理；
- 远处鲸歌；
- D major 倾向的海床 pad；
- piano / glass / thud 等 cue；
- 10.48s 和 41.92s 附近的叙事静默；
- 78.1–80s 的结尾淡出。

#### 4.6 Engineering

- 音频挂接到主时钟；
- 模块级错误隔离；
- `t / freeze / autoplay / debug`；
- adaptive DPR；
- 代表性时间点预热：`1.5 / 5.2 / 9 / 12 / 25 / 43.5 / 50 / 60.5 / 63 / 71.5 / 77`；
- 通过 `node --check` 语法检查。

但有一条验证边界被明确记录：当前执行环境的 Headless Chromium 无法初始化 WebGL/EGL，因此**没有假装说已经完成真实 GPU 截图验收**。代码层检查通过，但真正视觉 art-direction 仍需实际浏览器。

产物：`whale_fall_v2.html`。

---

## 5. 第一次真正意识到“它已经是影片了”

### 用户原话

> 很好很好！我能感受到这是影片了，有剧情，有运镜和场景。唯一的缺点就是视觉上还不够精细，不过对标的文件肯定也不是一遍做出来的就是了

### 助手原回复

对，我觉得你现在这个判断已经很接近“做作品”的视角了。

v2 最重要的变化，其实不是某个 shader 更复杂了，而是它已经跨过了一条线：**你不再是在看一个鲸鱼 3D demo，而是在看一段被导演过的时间。** 有镜头建立、有下潜、有无光带、有触底、有时间跳切、有结尾回收，这些一成立，“影片感”就出来了。

但你说视觉精细度不够也非常准确。现在它大概处在一种很典型的阶段：**叙事骨架已经成立，资产和材质还是预演级。**

我看 v2，当前最明显的短板不是“特效不够多”，而是几个核心对象的视觉可信度还没有进入同一个层级。鲸鱼仍然是最大瓶颈——轮廓比第一版合理了，但只要镜头一靠近，程序化椭球体的味道还是很明显；海面虽然运动和光照更对了，但微表面、远中近波浪层次、反射的信息量还远不如 Titanic；深海则有气氛，但“空间里到底有什么”的几何信息仍偏少，所以有些镜头容易变成漂亮的蓝黑色背景加粒子。

这也恰好说明 Titanic 为什么厉害：它不是靠某一个超级 shader 突然从 70 分变 95 分，而是很多 **+2、+3 分的小改动不断叠加**。船窗更真实一点，海水高光再克制一点，远景雾更合理一点，镜头焦段再改 5mm，烟雾速度慢一点，撞击时相机震动少 20%，音乐晚半秒进入……单看每项都不起眼，全部叠起来之后，观众才突然觉得“这不是网页了”。

如果继续做 v3，我反而不会急着加新剧情，80 秒的结构已经够用了。最值得投入的是把现有镜头当成真正的电影镜头逐个打磨，尤其是这四类：

- **鲸鱼资产**：目前这是视觉上最大的“AI/程序生成感”来源。头型、嘴线、眼周、喉腹褶皱、尾柄、尾鳍边缘、皮肤斑驳、伤痕与藤壶，都能显著提高可信度。
- **水体层次**：不是简单“把海做得更亮”，而是增加尺度层级。大尺度 swell 决定轮廓，中尺度波控制反射，微波纹负责闪烁；水下还应有真正的光衰减、前向散射和距离色偏。
- **灯光与材质**：目前不少东西还是“本身有颜色”。更成熟的状态应该是“物体主要靠环境光、轮廓光、散射和反射被看见”。尤其深海鲸体，少一点自发光感会高级很多。
- **镜头级精修**：不是全局参数统一到底。比如眼睛特写可以单独加强皮肤 roughness 和眼球反射；无光带可以故意把主体压到几乎看不见；海床触底镜头则可以让泥沙吃掉大量细节，只留剪影和体积感。

所以我甚至觉得现在不应该追求“再写 1000 行”。下一阶段更像游戏/电影制作里的 **shot polish**：围绕几个 hero shot 集中砸质量。

例如只拿 43～50 秒这个深海段，我们完全可以把它单独做到接近壁纸级：

鲸鱼皮肤微结构 → 更真实的 rim light → 海雪前中后景分层 → 一两只真正有体积的水母 → 极远处几乎不可见的生物光 → 相机轻微漂移 → 焦点慢慢从鲸鱼眼部拉到远处 → 声场同时变空。

这一个镜头磨好了，整部片子的“视觉上限”就会立刻被抬起来。

而且你说得对，对标那个 Titanic 几乎不可能是一遍出来的。看它源码里那些很具体的补丁——预热 shader、特殊镜头音频透视、seek 后粒子重建、分辨率自适应、某些事件专门卡帧——反而很像一个**反复看、反复发现不爽、再一点点补出来的工程**。

现在《鲸落》其实已经进入同一个阶段了：**大框架已经不再是主要问题，真正的工作开始变成“我为什么觉得这一帧还不够像电影？”**

这反而是好事，因为说明我们已经从“能不能做出来”走到了“能做到多好”。

---

## 6. 从样片跳到 AI 视频工业：代码预演是否比灰模更强？

### 用户原话

> 之前看到gpt6astra出来的时候，建模能力大提升，有人提出用llm调用工具构建灰模来引导视频生成模型渲染场景生成视频，比纯语言描述精准很多，那我觉得这种代码可靠的样片比灰模更合适作为草稿啊，有进入ai视频制作乃至传统电影工业的潜力吗

### 助手原回复（保留核心完整论证）

有，而且我认为你这个思路比“LLM 先搭灰模，再让视频模型重绘”还要再往前一步。更准确地说，我们刚才做的这种东西可以视为一种 **Executable Previs（可执行预演）**，甚至可以叫 **executable screenplay / 可执行电影脚本**。

灰模主要解决：

```text
人物 A 在这里
人物 B 在那里
桌子在这里
建筑轮廓这样
相机从 A 移到 B
```

而《鲸落》式代码样片即使几何没那么精确，却已经携带更多电影语义：

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

因此它不是“3D 场景草稿”，而实际上已经是：

> **低保真电影本身。**

最重要的工业价值是**确定性**。

文本 prompt：

> “鲸鱼缓缓下沉，镜头从侧后方跟随，然后推进到眼睛……”

重新生成十次，十次都可能不同。

但是：

```js
camera.position = f(t)
whale.position = g(t)
light = h(t)
```

只要代码不改：

**第 43.217 秒永远是第 43.217 秒。**

于是导演可以说：

> “43.2 秒这里相机再往左 1.5 米。”

然后改完以后其他东西不变，而不是“重新生成一次，希望 AI 这次别把鲸尾巴变了”。

因此更可靠的 AI 视频流程不是：

```text
文字
 ↓
视频模型
 ↓
成片
```

而可能是：

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

此时视频生成模型不再同时担任编剧、导演、摄影、美术、演员和渲染器，而更像一个：

> **神经渲染器 / neural renderer。**

代码样片真正的优势甚至还没在一条 RGB MP4 里完全发挥出来，因为程序可以额外导出：

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

未来一个镜头可以是：

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

然后告诉视频模型：

> **这些是不可违反的约束，剩下的视觉细节你自由生成。**

因此工业版最终也不该停在 `whale.html`，而应该出现：

```text
                 ┌→ 浏览器实时预演
LLM → Scene DSL ─┼→ Blender
                 ├→ Unreal
                 ├→ OpenUSD
                 ├→ OTIO
                 └→ AI Video Conditioner
```

HTML/Three.js 只是极快的 preview backend。

最终最好的形态是：

> **代码是源代码，3D scene 是中间表示，previs 是人看的结果，生成视频是最终渲染。**

这一整套想法后来被概括成：

> **AI Film Compilation**

即剧本不是 prompt；剧本首先被编译成一个确定的时空世界，导演在这个世界里锁定表演、镜头和剪辑，生成模型最后才负责把世界“摄影”出来。

这时《鲸落》的意义也发生变化：它不只是一个漂亮 demo，而可以成为第一个“可导出 AI 视频 conditioning package”的实验。

---

## 7. 用户继续追问：Titanic 的思想是不是其实比画面本身更重要？历史上有人做过吗？

### 用户原话

> 额泰坦尼克这个小电影demo据说是刚发布的opus5.5的宣传物料，用来证明它的能力，那我觉得这个实现方式和项目思路远大于实现的精细程度（当然这确实很精细很强），那我请你去github广泛搜索一下，有没有类似的前置人类项目，还是说这个tt的思路和工程框架也是一个模型原创的，那也太强了吧 @GitHub

### 助手检索思路

当时明确按两条线搜索：

1. 确认 Titanic 与所谓 Opus 5.5 宣传物料之间的公开关系；
2. 在 GitHub 里找真正接近其工程思想的祖先，而不是泛泛找“Three.js 动画”。搜索重点是：

```text
可寻址时间轴
导演/镜头系统
程序化场景
音频调度
seek 后一致性
浏览器电影
程序化音乐视频
single-file cinematic runtime
```

### GitHub 搜索后形成的结论

核心结论是：

> **“浏览器里做电影”不是它首创；“程序化时间线 + 相机 + 音乐同步”也有很长历史。但没有找到一个早期人类项目同时把 Titanic 里的纯时间世界、导演、程序化 3D、音频引擎、seek 一致性和单文件电影交付组合得这么完整。**

最重要的历史前置项目包括：

| 项目 | 大致年代 | 与 Titanic 相似处 | 差异 |
|---|---:|---|---|
| 3 Dreams of Black | 2011 | 浏览器即剧场，WebGL 实时电影，音乐+3D+互动 | 更传统资产/pipeline，不是统一纯时间世界 |
| GNU Rocket | 2010s 初 | 音乐主时轴，大量视觉参数是时间函数，可 scrub | 是同步器，不是完整世界/导演/渲染器 |
| frame.js | 2012 | Player + Timeline + Animation + Three.js + audio，支持 seek | 更像通用 sequence editor/runtime |
| Under Neon Lights | 2010s | Three.js + Frame.js 的 WebVR 音乐视频 | 传统模型资产更多 |
| Theatre.js | 2013 起 | 程序化 + 可视化高保真动画，支持 Three.js | 偏 animation tool |
| Remotion | 2020 | code is source of truth，frame/time -> video | 更偏 React/视频合成 |
| Motion Canvas | 2022 | TypeScript 写动画、实时预览 | 更偏 2D motion graphics |

其中两个“祖先”尤其重要。

### 7.1 3 Dreams of Black

2011 年 Google Data Arts / Chris Milk / Mr.doob 等已经做过真正意义上的 WebGL browser film。源码甚至把主要体验目录称为 “the film”。因此：

> “用 JavaScript/WebGL 写电影”当然不是模型第一次想到。

### 7.2 frame.js / demoscene / GNU Rocket

`mrdoob/frame.js` 已经有：

```text
Player
Timeline
Animation
Resources
Code
```

并通过 `Timeline.update(time)` 激活对应片段，向后 seek 时 reset active timeline。这与 Titanic 的“任意故事时间求值”在思想上非常接近。

GNU Rocket 则代表更早的 demoscene 思路：

```text
music time
   ↓
parameter timeline
   ↓
camera.x
camera.y
camera.fov
fog
FX intensity
...
```

Titanic 可以理解成把原先“一堆 parameter = f(time)”进一步升格为：

> **整个 World State = F(storyTime)**

### 7.3 真正显得“模型化”的部分

搜索没有找到明显的旧仓库能一一对应 Titanic 的完整组合。

因此当时把原创性拆成：

- **零件原创度：不高。** Three.js、WebAudio、procedural mesh、timeline、demoscene sync、director camera 都有前人。
- **架构思想原创度：中等。** deterministic / functional time-based rendering 也有历史。
- **组合方式原创度：很高。** 把电影定义成一个可实时求值的确定性世界程序，并让 director、FX、audio、UI 都围绕同一 story time 运行，这个组合没有找到明显前置模板。

还发现一个很有意思的 `AEON DRIFT` / `opus5-tech-demo` 项目，其模块编号、单文件交付、procedural everything、adaptive resolution、audio、director、verification 等风格与 Titanic 非常相似：

```text
00-math.js
10-gl.js
20-shaders-world.js
...
70-main.js
```

对比 Titanic：

```text
00_core.js
10_story.js
20_sky.js
30_ocean.js
...
90_main.js
```

这引出了一个谨慎的推测：

> Titanic 的具体 framework 可能不是照着某个旧电影项目复制，而更像模型/评测 harness 已经逐渐形成了一套“复杂 WebGL 项目 house style”。

但不能仅凭两个项目证明它是模型内部固定模板。

这一轮最重要的总结是：

> Titanic 不是这棵技术树的根，但它非常像模型第一次把 demoscene、WebGL 互动电影、sequence editor、code-as-video、实时音频和现代软件工程重新组合成一个完整作品。

---

## 8. 用户把问题推进到“这到底说明 Claude 会什么？”

### 用户原话

> 那这个项目具体体现了claude哪些方面的能力呢

### 助手原回复（结构保持）

如果把它当成 Claude 主导生成的作品，它体现的不是“会写 Three.js”这么单一，而是几种能力同时叠加：**架构设计、长程一致性、跨领域整合、工程判断、影视理解、性能意识和自检能力。**

同时先加一个限定：单看成品源码，可以判断项目**体现了哪些能力**，但不能仅凭源码证明这些内容全部由 Claude 一次性、无人工修改完成。

#### 8.1 把模糊目标转成完整系统

如果需求只是：

> 做一个五分钟、实时渲染的 Titanic 沉没电影。

普通实现很容易停在：

```text
Three.js 场景
+ 一艘船
+ 海
+ 相机动画
+ BGM
```

而 Titanic 自己形成：

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

说明它完成了一次**需求分解和系统建模**，而且模块边界不是按“写代码方便”拆，而是按电影 production logic 拆。

#### 8.2 长程架构一致性

核心决定：

```text
TT.S = story.sample(t)
```

真正难的不是想到一次，而是写到上万行后仍然让 UI、particle、audio、camera 等系统遵守这一高层 invariant。

这体现的是：

> **模型能维持一个高层架构约束，并让后续实现继续服从它。**

#### 8.3 跨领域整合

项目横跨：

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

更重要的不是“都知道一点”，而是它们真的发生了语义耦合：
- director 的 aperture 被 FX 用于 DOF；
- 音乐知道 impact / funnel fall / break 等事件并做 ducking；
- 海洋读取船体/航行状态；
- 粒子读取断裂后的不同 section history；
- score / audio / UI / world 共享 story time。

#### 8.4 抽象能力

船体不是各模块自己猜一个“差不多的 Titanic”，而是抽象出 canonical hull：

```text
halfBeam(x, y)
sheer(x)
ends(y)
```

船体、泡沫、喷溅、镜头等都共享这一数学事实源。

#### 8.5 导演能力

Director 处理：

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

关键不是“相机能动”，而是模型把柔性的电影概念转成了硬参数。

#### 8.6 音频系统能力

项目不是简单放 BGM，而是设计了一个小型实时音频引擎：sampler、synth、bus、EQ、reverb、compression、limiter、ducking、automation，并处理 seek 后中途重启持续音。

#### 8.7 性能意识

包括：

```text
instancing
quality tier
voice cap
DPR cap
GPU billboard particles
half-resolution reflection
adaptive resolution
shader prewarm
fallback
```

这代表的是：

> **知道实际用户看片时什么地方会坏。**

#### 8.8 为失败设计

```text
sample 下载失败 -> synth fallback
模块失败 -> proxy / error isolation
性能不足 -> low quality
FPS 下降 -> dynamic DPR
seek -> audio epoch reset
粒子冷启动 -> history texture
```

这是很典型的 Staff Engineer 思维：不只实现 happy path，还设计如何退化。

#### 8.9 世界状态与表现系统分离

`story` 负责世界发生什么；`director` 负责观众怎么看见它。

因此理论上：

```text
同一个 simulation
↓
Director A：灾难大片
Director B：纪录片
Director C：幸存者视角
```

世界不用重写。

#### 8.10 测试和可观测性

大量 debug/query hooks 代表模型在写系统时同时考虑：

> “以后怎么验证它？”

而不是只考虑最终画面。

#### 8.11 最核心：形成“制作方法”

这一轮最后把前面所有能力收束成一句话：

> **Claude 开始能够自己形成 production method。**

以前是：

```text
人 = architect
模型 = implementer
```

而 Titanic 如果确实主要由模型完成，则更像：

```text
人：
“做一部 Titanic 的实时电影。”

模型：
“要完成这个目标，我需要确定性时间轴、共享世界坐标、程序化船体、海洋、天空、导演、声音、配乐、后期、UI、seek、性能降级和测试接口，并且应该这样连接。”
```

这已经是：

> **project conception -> architecture -> implementation -> integration -> polish**

完整链条。

---

## 9. 一个非常细的能力问题：模型是不是“看代码就能想象画面”？

### 用户原话

> 扣一个细节问题，人/团队做这样的工作很难想象改动代码后，画面会怎样实时动，但是模型接触一些训练语料后是不是天然有从代码判断画面的能力，不然每次截图验证进度很慢消耗很大吧，类比gpt6涌现的原生空间智能

### 助手原回复（保留论证结构）

这个类比成立一半：模型很可能确实具备一种“从代码直接预测画面/运动趋势”的内部能力，但它更像**高层视觉仿真**，不是像浏览器那样逐像素执行。

可以把它拆成五层。

#### 第一层：符号空间推理

代码本身已经给出：

```text
鲸鱼 22m
camera 距离 30m
FOV 38°
海平面 y=0
鲸鱼 y=-200
灯从右上方来
```

很多视觉结果可以直接算，不需要真正“想象”。

#### 第二层：图形学知识 -> 视觉预测

例如看到：

```text
FogExp2 density = 0.3
camera distance ≈ 40m
```

就可以直接预警几乎什么都看不到，因为：

\[
T(d)=e^{-(density\cdot d)^2}
\]

\[
e^{-(0.3\times40)^2}=e^{-144}\approx0
\]

同样，看到高 exponent specular、低 bloom threshold、大量 emissive windows，也能预判高光、泛光等结果。

#### 第三层：代码—图像对应关系形成 latent intuition

如果训练中见过大量：

```text
Three.js demo <-> screenshot
Blender Python <-> render
CSS <-> webpage
SVG <-> visual output
GLSL <-> shader image
游戏代码 <-> gameplay frame
```

模型可能自然学出：

\[
program\ representation \rightarrow visual\ representation
\]

就像人看到 `display:flex` 已经能脑补大致布局，只不过强模型把这种映射扩展到了 3D geometry / camera / lighting / shader / animation。

#### 第四层：temporal imagination

更难的是：

```text
position = f(t)
rotation = g(t)
camera = h(t)
particles = p(t)
```

模型需要预判这些函数叠加以后“运动是什么感觉”。这已经不是静态空间，而是：

> **spatiotemporal program intuition / 时空程序直觉。**

#### 第五层：内部预测 + 少量外部校准

真正高效的工作流不会是：

```text
改 5 行
↓
截图
↓
改 5 行
↓
截图
```

更可能是：

```text
读代码
 ↓
内部建立 scene graph
 ↓
预测哪里应该出现什么、哪里可能出问题
 ↓
连续改一个完整系统
 ↓
只检查几个 hero frames
 ↓
根据真实结果校准
```

这与资深技术美术也很像：他们不会每改一个 roughness 数值都完整离线渲染；脑内已经有近似 renderer，真实 viewport 是校准器。

不过边界同样明确：

> **模型内部想象 ≠ 真正渲染。**

shader 叠加、tone mapping、HDR clipping、alpha sorting、temporal aliasing、粒子密度、真实帧率，以及最关键的“这个镜头到底舒不舒服”，仍然必须靠真实运行结果校验。

所以截图从“唯一感知渠道”变成：

> **ground truth 校准渠道。**

这一轮最终形成的判断是：

> Claude 不太可能完全看不见画面、只靠一次次截图瞎试。更合理的是它能从代码建立一部低分辨率的“脑内电影”，然后用浏览器实际执行来校准这部脑内电影。

---

## 10. 再扣一个工程细节：为什么这么复杂还坚持“单文件”？

### 用户原话

> 还有一个问题，这个项目的工程化完整度是很高的，但是它还是选择了单文件的展现形式，是一种炫技吗？每个部分拆开细化，其实最终可以形成一个程序化3D电影制作的引擎的，多文件系统可维护性，可拓展性之类的也会大大增加，我想的对吗

### 助手原回复（完整保留主要观点）

对，而且这里要把一个很容易混淆的东西分开：

> **“单文件交付”不等于“单文件架构”。**

从源码看，`titanic.html` 本身甚至很像 bundle/build artifact，因为里面直接留下：

```text
// ==== FILE: src/00_core.js ====
// ==== FILE: src/10_story.js ====
...
// ==== FILE: src/90_main.js ====
```

`00_core.js` 规定“每个 module file 调用 `TT.register(name, obj)`”，`90_main.js` 还提到为 “absent from a dev build” 的模块创建 stand-in proxy。

HTML 里甚至还有模板拼装痕迹。

因此更合理的判断是：

> **单文件更像发行格式，而不是源代码架构本身。**

它确实有炫技意味：一个 `titanic.html` 打开就是电影，传播冲击力远大于“这是一个 30 文件的 Three.js repo”。但它也有实际工程价值：易验收、易保存、易部署、易做 benchmark artifact。

更重要的是，Titanic 已经天然暴露出一个通用引擎的骨架。

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

而这些却不是：

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

因此可以自然切成：

```text
┌──────────────────────────┐
│       Film Engine        │
│ clock / timeline         │
│ director / renderer      │
│ audio / fx / quality     │
└────────────┬─────────────┘
             │ film definition
             ▼
┌──────────────────────────┐
│      Titanic Film        │
│ ship / iceberg / shots   │
│ story / score            │
└──────────────────────────┘
```

然后再挂：

```text
Whale Fall Film
```

于是《鲸落》不再重写 clock、seek、director、quality、render loop。

最重要的是：**真正值得抽出来的核心不是 Three.js。**

引擎灵魂应该是：

\[
WorldState = F(storyTime)
\]

以及：

\[
Shot = G(storyTime, WorldState)
\]

Three.js 只是 renderer backend。

未来可以：

```text
Film Runtime
     │
     ├── Three.js renderer
     ├── Babylon renderer
     ├── Blender exporter
     ├── Unreal exporter
     └── AI-video conditioning exporter
```

开发和发行因此完全可以是：

```text
Source：模块化、多文件、多 package
        ↓ build
Artifact：一个可以到处分享的 HTML
```

就像：

```text
Unity 工程 -> game.exe
```

最终 `.exe` 是一个文件，不代表源工程是一个文件。

这也把问题从“程序化电影 runtime”进一步推进到：

> **程序化电影 authoring platform。**

下一层应该出现 timeline editor、curve editor、shot inspector、viewport、Film DSL、自然语言修改和 AI-video conditioning export。

---

## 11. 用户确认“exe 类比一下就懂了”，并要求真正开始造引擎

### 用户原话

> OK，我开始的单文件是指相对传统的稍微复杂一点的html网页就通常不是单页结构，而是在文件夹里有css之类的依赖，而这个项目居然在这么高的复杂度的情况下还能保持单文件，我觉得很厉害。你用exe解释我一下子就听懂了。现在尝试从这个项目开始逆向完整的视频制作引擎项目，在我的github里创一个仓库，把骨架搭好，填能填的内容
> @GitHub

### 助手阶段性说明

当时明确把任务定义为真正的“逆向引擎化”，不是建空目录：

> 先把 Titanic 里通用 runtime 和作品专属内容分离，定义 `core / director / renderer-three / audio / fx / project schema / examples`，再放一个最小可运行示例和设计文档。

连接 GitHub 后确认账号为：

```text
Frank-nju
```

原本计划新建：

```text
executable-film-engine
```

但 GitHub 连接器缺少“创建 repository”动作，因此没有污染任何已有仓库，而是先在本地构建完整工程。

### 第一版 Engine 骨架

形成的模块包括：

```text
packages/core
packages/director
packages/renderer-three
packages/audio
packages/fx
films/whale-fall
apps/studio
docs
tools
```

核心抽象被正式写成：

```text
FilmState = F(storyTime)
Shot      = G(storyTime, FilmState)
Frame     = Render(FilmState, Shot)
```

并且设计目标明确为：

```text
开发：多文件 / 多 package / 类型安全 / 可测试
              ↓ build
发行：single executable HTML
```

### 已填入的真实内容

`core`：

- StoryClock；
- play / pause / seek；
- AudioContext 时间权威切换；
- Module lifecycle；
- Service Registry；
- EventBus；
- curve sampler；
- deterministic RNG。

`director`：

- Shot；
- CameraRig；
- lens / focus / aperture；
- shot selection；
- camera interpolation。

`renderer-three`：

- Three.js backend；
- camera adapter；
- ACES；
- adaptive DPR。

`audio`：

- Web Audio bus；
- look-ahead cue scheduler；
- seek epoch。

`films/whale-fall`：

- 第一个独立 film project；
- 与 engine 分离的 story sample；
- 程序化鲸鱼/深海/海床最小 world；
- shot list；
- film.project.json。

`docs`：

- architecture；
- design principles；
- Titanic -> Engine mapping；
- Film Project JSON Schema draft；
- roadmap。

`tools`：

- `package-single-html.mjs`；
- 零依赖 `verify.mjs`。

本地静态 verifier 通过，并生成了 zip / git bundle。

---

## 12. 用户决定直接占用废弃仓库

### 用户原话

> 不好创建仓库的话，那你传到longjing这个仓库里吧，废弃的仓库，没什么东西，直接覆盖都可以

### 助手回复/执行

确认目标：

```text
Frank-nju/longjing-tea-website
```

并确认 `main` 当时最新提交为旧龙井站点历史。

助手明确说明：

> 把它当成这个引擎的新仓库来用，按你允许的范围覆盖原内容。旧网站历史仍保留在 Git 历史里，只是当前工作树被完整替换。

随后开始构造新的 Git tree，并上传 Engine 文件。

---

## 13. 用户指出：为什么不直接 clone 改完再 push？

### 用户原话

> 你这个看起来好麻烦，你直接把原仓库拉下来改了再提交会不会快的多啊

### 助手原回复

> 对，这样更直接。前面我为了保证“整仓一次提交”才在走 Git object API，确实显得绕。现在我改成正常开发流程：**拉仓库 → 清空旧站点 → 把本地 `executable-film-engine` 整棵拷进去 → 跑检查 → commit → push**。如果当前容器拿不到你 GitHub 的写权限，我再只在最后一步用连接器推，不再一个文件一个文件处理。

随后实际尝试发现执行容器没有外网 DNS：

```text
Could not resolve host: github.com
```

因此无法本地 `git clone`，并非 GitHub 权限问题。

最终选择继续使用 GitHub Git tree/commit API，但效果仍然是一次**原子整仓提交**：36 个新源文件组成全新 root tree，旧站点文件不进入新 tree，最后 `main` 直接指向新 commit。

### 最终结果

仓库：

```text
Frank-nju/longjing-tea-website
```

新 `main` commit：

```text
fb74901bed4bf3df33ebb8b3714142d7f3a45146
feat: replace legacy site with executable film engine
```

最终远端核验：

- `main` 已指向该 commit；
- root tree 为全新的 Engine 工程；
- 36 个文件全部存在；
- README 首部为 `Executable Film Engine`；
- 旧龙井站点不再出现在当前工作树；
- 旧历史仍可从 Git ancestry 恢复。

### 助手最终回复原文

> 对，这次已经按“正常整仓替换”的结果收尾了。
>
> `Frank-nju/longjing-tea-website` 的 `main` 现在已经完全变成 **Executable Film Engine**，旧龙井网站不再出现在当前工作树里，但历史仍保留，可以随时从旧 commit 恢复。
>
> 新提交是：
>
> ```text
> fb74901bed4bf3df33ebb8b3714142d7f3a45146
> feat: replace legacy site with executable film engine
> ```
>
> 远端我也重新核验过，36 个源文件已经完整落进去，包括 `packages/core`、`director`、`renderer-three`、`audio`、`fx`、`films/whale-fall`、`apps/studio`、Film Project schema、Titanic→Engine 映射文档和单 HTML 打包工具。
>
> 你刚才说的方法本来确实更简单，只是我实际尝试 `git clone` 时，这个执行容器没有外网 DNS，连 `github.com` 都解析不了，所以最终还是用 GitHub 的 Git tree/commit 接口完成了**等价的一次整仓提交**，不是几十条零散提交。
>
> 现在这个仓库已经可以正式作为我们的引擎仓库用了。下一步我建议直接继续在这里做，不必再搬：**把现在的“骨架引擎”推进到真正可制作影片的 v0.2**，优先补 Titanic 最核心的 `cold seek / history cache / deterministic particles / rehearsal-prewarm / HDR post pipeline`，然后把我们之前那个视觉效果更完整的《鲸落 v2》真正迁移进去。

---

# 第二部分：站在讨论结束后的高度回看

## 14. 今晚真正发生的不是“项目分析”，而是问题层级连续上升

如果只看起点和终点，会非常跳跃：

```text
titanic.html
       ↓
Executable Film Engine
```

但中间其实经历了十次非常自然的抽象提升。

### 第 1 层：它为什么看起来厉害？

最初的对象是视觉结果：

```text
精细建模
实时渲染
高帧率
海面
船
天空
```

此时问题仍是“这个网页为什么这么牛”。

### 第 2 层：它为什么像电影，而不是高级网页？

用户主动把：

```text
视觉品质
```

和：

```text
电影性
```

分开。

这一步非常关键。因为随后才开始看到：

```text
运镜
剪辑
BGM
声音透视
事件节奏
剧情弧线
```

并意识到**镜头与时间的组织方式**比某一个视觉 feature 更接近电影本质。

### 第 3 层：声音是不是“外挂素材”？

对音频的追问把理解从“网页 + BGM”推进到：

> 一部电影里的声音同样可以是实时程序系统。

score data、sampler、synth、bus、reverb、ducking、seek scheduler 等事实证明，项目不只是在视觉上程序化，而是在视听层面拥有统一时间。

### 第 4 层：我们能不能自己做一个小规模版本？

《鲸落》成为第一个实践。

这一轮非常重要，因为它验证了一个认识：

> **电影感不需要先有 Titanic 级资产精度。**

只要有：

```text
明确情绪弧线
镜头设计
场景变化
声音节奏
时间结构
```

一个原本很像 3D demo 的东西就会跨过某条线，变成“影片”。

于是问题从：

> “怎么堆更多视觉 feature？”

变成：

> “为什么这一帧还不够像电影？”

这就是从 engineering demo 到 shot polish 的跃迁。

### 第 5 层：如果低保真电影已经成立，它是不是天然就是 AI 视频的更强草稿？

这一问把《鲸落》从一个作品变成一种生产方法。

灰模只编码空间；Executable Previs 同时编码：

```text
空间
时间
镜头
表演
灯光
音频
剪辑
剧情事件
```

因此它不是“给视频模型看的参考图”，而是一个**电影约束包**。

AI Video 的角色也因此被重新定位：

```text
不是：从一句话决定一切
而是：在已经锁定时空结构后做 neural rendering
```

“AI Film Compilation”概念就从这里自然出现。

### 第 6 层：这是模型原创思路，还是有技术祖先？

GitHub 追溯使讨论避免了“模型神话”。

我们找到：

```text
demoscene / GNU Rocket
      ↓
WebGL interactive film / 3 Dreams of Black
      ↓
frame.js timeline runtime
      ↓
Theatre.js
      ↓
Remotion / code-as-video
      ↓
Titanic-style unified executable film runtime
```

因此最后得到一个比“原创/不原创”更准确的判断：

> **技术零件大多有人类历史，但模型对它们的统一组织本身就是能力。**

### 第 7 层：它真正证明模型哪种能力？

此时评价对象不再是“代码质量”，而是：

```text
需求分解
架构形成
长程 invariant
跨领域语义整合
性能工程
失败模式设计
测试与可观测性
审美到参数的映射
```

也就是从 coder 到 technical director / staff engineer 的角色变化。

### 第 8 层：这种复杂视觉工作为什么可能做得这么快？

于是进一步追问模型是否有：

> **从程序到时空视觉的内部预测能力。**

这一步非常细，却解释了为什么模型不一定需要每几行就截图。模型可能拥有近似的 latent scene graph / renderer，用少量真实 viewport 校准。

这是对“原生空间智能”的一个自然延伸：

> **时空程序直觉。**

### 第 9 层：单文件是不是一种架构限制？

这一问把“单文件”从视觉奇观还原成软件工程问题。

真正的答案是：

```text
single-file artifact
≠
single-file source architecture
```
`.exe` 类比让这一点一下清楚了。

从这里开始，Titanic 不再被看作一个不可拆的神奇 HTML，而是：

> 一个多系统电影引擎被压缩后的发行物。

### 第 10 层：既然看见了引擎，就把它抽出来

于是最后一步不是继续讨论，而是实际执行：

```text
Titanic structural analysis
          ↓
extract invariants
          ↓
Executable Film Engine
          ↓
Whale Fall as first film project
          ↓
GitHub repository
```

整晚对话由此从“理解一个项目”闭环成“生成一个新项目”。

---

# 第三部分：今晚形成的核心技术认识

## 15. 电影作为可执行函数

最核心的表达最后固定成三行：

```text
FilmState = F(storyTime)
Shot      = G(storyTime, FilmState)
Frame     = Render(FilmState, Shot)
```

这三行比“Three.js 电影”更接近真正的方法论。

### `FilmState = F(storyTime)`

表示：世界发生什么，是故事时间的函数。

### `Shot = G(storyTime, FilmState)`

表示：观众怎么看这个世界，是导演层的函数。

### `Frame = Render(...)`

表示：Three.js、Blender、Unreal、视频模型，都只是不同的输出后端。

因此引擎最重要的 invariant 不是某个 WebGL API，而是：

> **给定绝对时间，可以尽可能重建相同电影事实。**

---

## 16. “世界事实”和“导演决定”必须分开

这是从 Titanic 里抽出的另一个关键原则。

例如：

```text
鲸鱼此刻深度 540m
```

属于 world truth。

而：

```text
相机此刻用 85mm 从鲸眼右侧拍
```

属于 director decision。

两者分开以后，同一电影世界可以重新导演；更进一步，同一 Film Project 可以输出不同 backend。

---

## 17. Seek 不是播放器功能，而是架构试金石

任何依赖“上一帧发生了什么”的隐藏状态，都可能导致：

```text
从 0 秒播放到 52 秒
!=
直接 seek 到 52 秒
```

因此状态系统必须被分类：

```text
A. time-pure / analytic
B. deterministic reconstruction
C. history cache / lookup texture
D. snapshot + bounded warmup
```

Titanic 的粒子 history texture、AudioContext 重调度、UI 纯时间求值，都说明 seek 是核心 architecture constraint，而不是进度条附属功能。

---

## 18. 程序化电影与 AI 视频的真正接口不是 RGB

如果只把实时样片录成 mp4 再喂给生成模型，实际上把最珍贵的信息压扁了。

更值得输出的是：

```text
RGB
Depth
Normal
Segmentation / Object ID
Motion vector
Optical flow
Camera matrix
Focal length
Focus distance
Light metadata
World transforms
Scene events
Audio timeline
```

这使“AI 视频生成”有可能变成：

> **在严格 scene truth 上进行视觉补全。**

而不是让视频模型自己重新猜世界。

---

## 19. 单文件的真正含义

今晚最终统一了一个非常清晰的认识：

```text
开发形式和交付形式是两个问题。
```

最合理的形态反而是：

```text
engine/
films/
editor/
tools/
packages/
      ↓
build
      ↓
film.html
```

复杂工程仍然可以拥有极简交付。

这也是 Titanic 单文件真正值得佩服的地方：

> 它不是因为简单所以能塞进一个文件，而是在复杂到接近小型游戏/电影 runtime 后，仍能把最终体验压成一个极低摩擦的 artifact。

---

# 第四部分：已经落地的工程结果

## 20. Executable Film Engine v0.1 骨架

当前仓库位置：

```text
Frank-nju/longjing-tea-website
```

虽然仓库名仍是旧项目名，但当前 `main` 已经是新的 Engine 工程。

关键目录：

```text
apps/
  studio/

docs/
  architecture.md
  design-principles.md
  film-project.schema.draft.json
  roadmap.md
  titanic-mapping.md

films/
  whale-fall/

packages/
  core/
  director/
  renderer-three/
  audio/
  fx/

tools/
  package-single-html.mjs
  verify.mjs
```

当前 commit：

```text
fb74901bed4bf3df33ebb8b3714142d7f3a45146
feat: replace legacy site with executable film engine
```

当前阶段不是“完整电影软件”，而是证明这些概念已经能被从 Titanic 项目里抽离：

```text
1. deterministic story time
2. modular film/runtime separation
3. data-driven shot selection
4. renderer backend boundary
5. seek-aware audio scheduler
6. modular source -> single HTML artifact
```

---

# 第五部分：后续最有价值的推进方向

## 21. v0.2 不应该先做花哨编辑器，而应该补 runtime 硬能力

优先级已经在讨论末尾明确：

```text
cold seek / history API
history cache
checkpoint / snapshot
bounded warmup
deterministic particles
rehearsal / prewarm
HDR render graph
DOF / bloom / grade
screenshot regression
```

原因很简单：这些是 Titanic 真正区别于普通 Three.js demo 的地方。

---

## 22. 把《鲸落 v2》迁入引擎，而不是再写一个新 demo

目前 `films/whale-fall` 只是最小 proof-of-concept。

下一步应该把之前已经具有明显电影感的完整 `whale_fall_v2.html` 拆成：

```text
story
world
whale asset
surface environment
deep environment
floor ecology
shots
audio cues
score
FX
```

并验证：

> 同一部《鲸落》，迁移前后的视觉/时间结构是否能在新引擎上复现。

这是测试引擎抽象是否真的成立的最好方法。

---

## 23. Authoring layer

Runtime 稳定后，才值得进入：

```text
Timeline Editor
Curve Editor
Shot Inspector
Camera Viewport
Event/Cue Markers
Film DSL
Undo / Redo
Git-friendly serialization
Natural-language editing
```

此时 LLM 不再需要直接改几千行 Three.js，而是修改：

```yaml
shot: abyss-wide
range: [44, 58]
lens: 40mm
subject: whale
motion: orbit
```

最终真正形成：

> **可视化 DCC / NLE + 代码工程 + LLM 自然语言编辑**

三者的结合。

---

## 24. AI Film Compilation

最远的一层路线仍然是今晚提出的：

```text
自然语言剧本
      ↓
LLM / agent
      ↓
Film Project / DSL
      ↓
Executable world
      ↓
Realtime previs
      ↓
导演修改
      ↓
RGB / Depth / Normal / Object ID / Motion / Camera
      ↓
AI video model / Blender / Unreal
      ↓
最终镜头
```

这条路线的意义不是“让 AI 自动拍完一切”，而是：

> **把生成模型最擅长的视觉先验，放在一个可控制、可重现、可修改的电影时空结构之上。**

---

# 第六部分：整晚讨论里最值得保留的几句话

这些不是事后编出的 slogan，而是讨论中逐渐形成的核心认识。

> **你不再是在看一个鲸鱼 3D demo，而是在看一段被导演过的时间。**

> **叙事骨架已经成立，资产和材质还是预演级。**

> **大框架已经不再是主要问题，真正的工作开始变成“我为什么觉得这一帧还不够像电影？”**

> **第 43.217 秒永远是第 43.217 秒。**

> **代码是源代码，3D scene 是中间表示，previs 是人看的结果，生成视频是最终渲染。**

> **AI Film Compilation：剧本首先被编译成一个确定的时空世界。**

> **技术零件大多有人类历史，但模型对它们的统一组织本身就是能力。**

> **Claude 开始能够自己形成 production method。**

> **模型内部想象 ≠ 真正渲染；截图从唯一感知渠道变成 ground truth 校准渠道。**

> **“单文件交付”不等于“单文件架构”。**

> **开发：模块化多文件；发行：一个 executable HTML。**

> **真正值得抽出来的核心不是 Three.js，而是 `WorldState = F(storyTime)`。**

---

# 结语

如果只停在第一轮，今晚得到的结论可能只是：

> “这个 Titanic HTML 真牛，Claude 写 3D 很厉害。”

但连续追问以后，我们最终看到的是完全不同的东西。

这个项目最值得研究的地方，不是“一个模型居然能写 90 万字节 HTML”，也不仅是画面够不够精细，而是它把此前分散在实时图形、demoscene、WebGL 互动电影、游戏引擎、音频 DSP、sequence editor、code-as-video 和传统影视制作里的思想，组织成了一种非常清晰的形式：

> **电影可以首先是一个可执行、可寻址、可重现的时空系统。**

而当 LLM 已经能够帮助构造这样的系统以后，它与视频生成模型之间就出现了一个非常自然的分工：

```text
LLM / Film Engine
负责结构、空间、时间、镜头、事件、可控性

Video Model / Neural Renderer
负责真实世界视觉先验、材质、人物、毛发、摄影质感
```

这条讨论没有停在概念上。

我们从一个 `titanic.html` 开始，途中做出了《鲸落》v2，最后又把观察到的通用思想抽离成了 `Executable Film Engine` 的第一版工程骨架，并真正写进 GitHub。

因此今晚最准确的总结可能不是：

> “我们分析了一个很厉害的项目。”

而是：

> **我们从一个项目中逆向出了一种可能的 AI 电影制作范式，并已经开始把它工程化。**
