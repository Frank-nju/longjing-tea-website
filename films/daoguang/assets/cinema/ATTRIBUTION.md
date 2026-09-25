# 本轮素材记录

2026-09-25

## 绘景

`court.webp`、`courier.webp`、`river.webp` 使用内置 image_gen 生成，再用 FFmpeg 编码为 WebP；完整提示词保存在 `image-prompts.json`。这些是原创历史场景意象，不是档案照片或经考证的现场复原。实际电影画面单独标识可视化性质。

## 人声

`voice/*.mp3`：通过 edge-tts 调用 Microsoft Edge 在线语音服务生成，音色 `zh-CN-YunjianNeural`。正片使用默认语速，A/B插段使用 −8%；没有调用 Azure `documentary-narration` 风格。角色是现代叙述者，不冒充道光或其他历史人物。制作脚本仅发送本项目原创旁白，输出音频内嵌离线成品。

`voice/*.jsonl` 是语音服务返回的 SentenceBoundary 时间戳。生成器版本和时间戳与音频一同保留；不要替换音频而沿用旧时间戳。

三个同文试听在 `release/voice-auditions/`：云健、云希、晓晓，默认音色且统一 −8% 语速。尚未完成主观盲听评审；工作拷贝暂用云健，不能称为已选定的最终声音。

服务客户端说明：https://github.com/rany2/edge-tts

## 乐器与拟音

复用上级 `audio/` 中 Nicholas Brosowsky / tonejs-instruments 的 `harp-D4.mp3` 和 `cello-D3.mp3`，CC BY 3.0。作了音高、包络和声像调整，编排为三音动机。

https://github.com/nbrosowsky/tonejs-instruments
https://creativecommons.org/licenses/by/3.0/

纸声、脚步、雨滴与炮声是程序合成拟音，不是现场采录。尚未经过最终混音验收。
