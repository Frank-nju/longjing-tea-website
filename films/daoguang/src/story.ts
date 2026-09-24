export type Chapter = { id: string; label: string; start: number; end: number };
export type StoryBeat = {
  time: number;
  kicker: string;
  title: string;
  body: string;
  kind: 'history' | 'analysis' | 'simulation';
};

export const chapters: Chapter[] = [
  { id: '禁烟与判断', label: '01 / 1839', start: 0, end: 55 },
  { id: '军情抵京', label: '02 / 1840', start: 55, end: 115 },
  { id: '剿、抚与战局', label: '03 / 1840—1842', start: 115, end: 211 },
  { id: '江上与回望', label: '04 / 1842—1860', start: 211, end: 270 },
];

export const beats: StoryBeat[] = [
  { time: 0, kicker: '序 / 1839 · 海疆', title: '危机从海上来', body: '一场远方的贸易冲突，正逼近清廷熟悉的秩序。', kind: 'history' },
  { time: 17, kicker: '1839 · 广东', title: '虎门销烟', body: '林则徐奉命查禁鸦片。虎门销烟激化中英冲突，随后武装冲突升级。', kind: 'history' },
  { time: 38, kicker: '问题 / 御案', title: '禁烟能否止战？', body: '此刻的朝廷能看到奏报，却还看不到战争将如何展开。', kind: 'analysis' },
  { time: 55, kicker: '1840 · 7 · 5 / 定海', title: '炮火先于消息抵京', body: '英军攻占定海。海上的战事，正在改变沿岸防务的现实。', kind: 'history' },
  { time: 76, kicker: '路线 / 示意', title: '军情沿驿路北上', body: '消息要经过递送才抵达京城；战场不会等奏报。', kind: 'analysis' },
  { time: 96, kicker: '1840 · 7 · 17 / 北京', title: '奏折抵达御案', body: '御前所见仍是六月广东奏折，并非定海战报；定海已失陷十二天。', kind: 'history' },
  { time: 111, kicker: '转场 / 决策之前', title: '信息到达时，局势已变', body: '最高权力并不自动带来完整的信息与可用的工具。', kind: 'analysis' },
  { time: 115, kicker: '课堂情境模拟', title: '剿，还是抚？', body: '此段是课堂决策模拟，不是史实中真实发生的交互选项。', kind: 'simulation' },
  { time: 135, kicker: '模拟路线 A / 议和', title: '先争取喘息', body: '拟命琦善赴粤交涉，试图以谈判换取缓冲时间。', kind: 'simulation' },
  { time: 156, kicker: '模拟路线 B / 主战', title: '调兵反攻', body: '拟命奕经统兵反攻浙东，决心仍受兵力与协同制约。', kind: 'simulation' },
  { time: 176, kicker: '回到史实 / 1841—1842', title: '战局继续向北', body: '两种模拟都不能改写后来发生的战事与条约。', kind: 'history' },
  { time: 190, kicker: '战场剖面', title: '差距不止在一件兵器', body: '火炮、舰船机动、训练与组织共同影响战场结果。', kind: 'analysis' },
  { time: 211, kicker: '1842 · 长江', title: '舰队驶入帝国腹地', body: '上海失守后，英军沿长江推进，镇江成为重要战场。', kind: 'history' },
  { time: 229, kicker: '1842 · 7 · 21 / 镇江', title: '漕运与京师受到威胁', body: '长江航道连接南北运输。战事逼近南京，和谈压力陡增。', kind: 'history' },
  { time: 235, kicker: '1842 · 8 · 29 / 南京', title: '条约在江面签署', body: '中英《南京条约》签订，战争以清廷失利告终。', kind: 'history' },
  { time: 252, kicker: '回望 / 战后十八年', title: '事实进入决策，为什么这么难？', body: '技术补救有所推进，持续认识世界并调整制度仍然艰难。', kind: 'analysis' },
  { time: 264, kicker: '终章', title: '奏报之外，还有整个世界', body: '这段历史留下的问题，是如何让新的事实改变旧的判断。', kind: 'analysis' },
];

export const sources = [
  { label: '英国国家陆军博物馆：第一次鸦片战争', url: 'https://www.nam.ac.uk/explore/first-china-war-1839-1842' },
  { label: '故宫博物院：签订《南京条约》', url: 'https://www.dpm.org.cn/court/event/157696.html' },
  { label: '茅海建：《天朝的崩溃——鸦片战争再研究》', url: 'https://books.google.com/books?id=6qOEAAAAIAAJ' },
  { label: '原课堂网页：道光皇帝模拟器与 Part 1—4 汇报材料', url: 'https://daoguang-1840-simulator.lizhifei681.chatgpt.site' },
];

export function beatAt(time: number): StoryBeat {
  return [...beats].reverse().find((beat) => beat.time <= time) ?? beats[0];
}

export function chapterAt(time: number): Chapter {
  return chapters.find((chapter) => time >= chapter.start && time < chapter.end) ?? chapters.at(-1)!;
}
