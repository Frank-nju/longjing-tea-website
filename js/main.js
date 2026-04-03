/* ══════════════════════════════════════════
   龙井茶官网 - JavaScript
   main.js
   
   重构说明：
   - 使用 const/let 替代 var
   - 提取可复用函数
   - 优化事件监听器管理
   - 添加 JSDoc 注释
══════════════════════════════════════════ */

/**
 * 导航栏滚动效果
 * @param {HTMLElement} nav - 导航栏元素
 */
const handleNavScroll = (nav) => {
  const onScroll = () => {
    nav.classList.toggle('nav--scrolled', window.scrollY > 20);
  };
  
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
};

/**
 * 移动端导航切换
 * @param {HTMLElement} toggle - 切换按钮
 * @param {HTMLElement} menu - 菜单容器
 */
const initMobileNav = (toggle, menu) => {
  if (!toggle || !menu) return;

  const toggleMenu = (isOpen) => {
    menu.classList.toggle('open', isOpen);
    toggle.classList.toggle('nav__toggle--open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
  };

  toggle.addEventListener('click', () => {
    const isOpen = !menu.classList.contains('open');
    toggleMenu(isOpen);
  });

  // 点击菜单项时关闭菜单
  menu.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });
};

/**
 * 当前页面导航高亮
 */
const highlightActiveNav = () => {
  const currentPath = location.pathname.split('/').pop() || 'index.html';
  
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href') || '';
    const isActive = href === currentPath || (currentPath === '' && href === 'index.html');
    link.classList.toggle('nav__link--active', isActive);
  });
};

/**
 * 滚动渐现动画
 */
const initScrollAnimations = () => {
  const fadeEls = document.querySelectorAll('.fade-in');
  if (!fadeEls.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  fadeEls.forEach(el => observer.observe(el));
};

/**
 * FAQ 手风琴效果
 */
const initFAQAccordion = () => {
  document.querySelectorAll('.faq-item__question').forEach(question => {
    question.addEventListener('click', () => {
      const item = question.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      // 关闭其他项
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        if (openItem !== item) openItem.classList.remove('open');
      });

      item.classList.toggle('open', !isOpen);
    });
  });
};

/**
 * 邮件订阅表单处理
 */
const initSubscribeForm = () => {
  const subscribeForm = document.getElementById('subscribe-form');
  if (!subscribeForm) return;

  subscribeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const emailInput = subscribeForm.querySelector('input[type="email"]');
    if (!emailInput || !emailInput.value) return;

    const msg = document.getElementById('form-message');
    if (msg) {
      msg.textContent = '感谢您的订阅，我们将于新茶上市时第一时间通知您。';
      msg.classList.add('visible');
    }

    subscribeForm.reset();
    setTimeout(() => msg && msg.classList.remove('visible'), 6000);
  });
};

/**
 * 平滑滚动到锚点
 */
const initSmoothScroll = () => {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      const target = id && id.length > 1 && document.querySelector(id);
      
      if (!target) return;
      
      e.preventDefault();
      const nav = document.querySelector('.nav');
      const navH = nav ? nav.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navH - 16;
      
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
};

/**
 * 初始化所有模块
 */
const init = () => {
  // 导航栏滚动效果
  const nav = document.querySelector('.nav');
  if (nav) handleNavScroll(nav);

  // 移动端导航
  const toggle = document.querySelector('.nav__toggle');
  const menu = document.querySelector('.nav__menu');
  initMobileNav(toggle, menu);

  // 导航高亮
  highlightActiveNav();

  // 滚动动画
  initScrollAnimations();

  // FAQ 手风琴
  initFAQAccordion();

  // 订阅表单
  initSubscribeForm();

  // 平滑滚动
  initSmoothScroll();
};

// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', init);