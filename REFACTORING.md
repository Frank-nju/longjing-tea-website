# 代码重构文档

## 概述

本次重构对龙井茶官网的代码进行了全面优化，提升代码质量、可维护性和性能。

## 重构内容

### 1. CSS 重构 (`css/style.css`)

#### 改进点：
- **采用 BEM 命名规范**：统一使用 `block__element--modifier` 格式
  - `.nav.scrolled` → `.nav--scrolled`
  - `.nav__link.active` → `.nav__link--active`
  - `.nav__toggle.open` → `.nav__toggle--open`

- **提取公共组件样式**
  - 新增 `.section` 基础区块类
  - 新增 `.section__header` 区块头部类
  - 新增 `.section__label`、`.section__title`、`.section__subtitle` 排版类
  - 合并重复的渐现动画样式到文件顶部

- **添加 button 元素重置**：确保所有按钮元素样式一致

- **优化注释结构**：每个组件区块添加清晰的重构说明

### 2. JavaScript 重构 (`js/main.js`)

#### 改进点：
- **模块化函数设计**：将功能拆分为独立的可测试函数
  ```javascript
  handleNavScroll()      // 导航栏滚动效果
  initMobileNav()        // 移动端导航切换
  highlightActiveNav()   // 导航高亮
  initScrollAnimations() // 滚动动画
  initFAQAccordion()     // FAQ 手风琴
  initSubscribeForm()    // 订阅表单
  initSmoothScroll()     // 平滑滚动
  init()                 // 统一初始化入口
  ```

- **使用现代 ES6+ 语法**
  - 全部使用 `const`/`let` 替代隐式全局变量
  - 使用箭头函数保持 `this` 上下文
  - 使用模板字符串（如需要）

- **添加 JSDoc 注释**：为每个函数添加类型说明和参数描述

- **优化事件处理**
  - 早期返回模式减少嵌套
  - 提取重复逻辑到辅助函数 `toggleMenu()`
  - 使用 `classList.toggle(className, force)` 简化条件切换

- **改进代码可读性**
  - 更清晰的变量命名（如 `emailInput` 替代 `email`）
  - 统一的代码格式化
  - 逻辑分组和空行分隔

### 3. 响应式样式 (`css/responsive.css`)

保持不变，但需注意配合新的 BEM 类名使用。

## 迁移指南

### HTML 更新

如果使用旧的类名，需要更新 HTML：

```html
<!-- 导航栏 -->
<nav class="nav">
  <!-- 旧写法 -->
  <button class="nav__toggle">...</button>
  <!-- 新写法：状态类使用双横线 -->
  <!-- nav__toggle.open → nav__toggle--open -->
  
  <!-- 旧写法 -->
  <a href="#" class="nav__link active">
  <!-- 新写法 -->
  <a href="#" class="nav__link nav__link--active">
</nav>
```

### JavaScript 兼容性

新的 JavaScript 代码完全向后兼容，无需修改 HTML 即可工作。
但如果使用了旧的类名（如 `.scrolled`、`.active`），需要在 JS 中调整或更新 CSS。

## 性能提升

1. **CSS 选择器优化**：BEM 命名避免了深层嵌套选择器
2. **JavaScript 执行优化**：
   - 函数提取减少重复代码
   - 早期返回减少不必要的判断
   - IntersectionObserver 自动取消观察已显示元素

## 可维护性提升

1. **清晰的代码结构**：每个功能模块职责单一
2. **完整的文档注释**：JSDoc 注释便于 IDE 智能提示
3. **一致的命名规范**：BEM 使 CSS 类名含义明确
4. **易于测试**：独立函数便于单元测试

## 后续建议

1. 考虑使用 CSS 预处理器（Sass/Less）进一步组织样式
2. 添加 ESLint 配置保证代码风格一致
3. 考虑使用构建工具进行代码压缩和打包
4. 为关键功能添加单元测试

---
重构日期：2026
