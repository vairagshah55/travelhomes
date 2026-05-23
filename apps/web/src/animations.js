const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const MOBILE_QUERY = "(max-width: 767px)";

const animatedElements = new WeakSet();
const countedElements = new WeakSet();
const lazyImages = new WeakSet();
const parallaxElements = new Set();

let intersectionObserver;
let countObserver;
let mutationObserver;
let resizeObserver;
let themeObserver;
let progressBar;
let themeFadeLayer;
let previousTheme = "light";
let rafId = 0;

function prefersReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function isMobileViewport() {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getActiveTheme() {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function formatCount(value, decimals) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function parseCountTemplate(text) {
  if (!text) return null;
  const match = text.match(/[-+]?\d[\d,]*(?:\.\d+)?/);
  if (!match || match.index == null) return null;

  const numeric = Number(match[0].replace(/,/g, ""));
  if (Number.isNaN(numeric)) return null;

  return {
    value: numeric,
    prefix: text.slice(0, match.index),
    suffix: text.slice(match.index + match[0].length),
    decimals: match[0].includes(".") ? match[0].split(".")[1].length : 0,
  };
}

function createProgressBar() {
  const existing = document.querySelector("[data-dashboard-progress]");
  if (existing) return existing;

  const bar = document.createElement("div");
  bar.className = "motion-page-progress";
  bar.setAttribute("data-dashboard-progress", "true");

  const fill = document.createElement("span");
  bar.appendChild(fill);
  document.body.appendChild(bar);
  return bar;
}

function createThemeFadeLayer() {
  const existing = document.querySelector("[data-theme-fade-layer]");
  if (existing) return existing;

  const layer = document.createElement("div");
  layer.className = "th-theme-fade-layer";
  layer.setAttribute("data-theme-fade-layer", "true");
  document.body.appendChild(layer);
  return layer;
}

function animateThemeChange() {
  const nextTheme = getActiveTheme();
  if (!themeFadeLayer || nextTheme === previousTheme) {
    previousTheme = nextTheme;
    return;
  }

  themeFadeLayer.style.background = previousTheme === "dark" ? "var(--dark-bg)" : "var(--gray-50)";
  themeFadeLayer.classList.remove("is-fading");
  void themeFadeLayer.offsetWidth;
  themeFadeLayer.classList.add("is-fading");
  previousTheme = nextTheme;
}

function updateProgressBar() {
  if (!progressBar) return;
  const fill = progressBar.firstElementChild;
  if (!fill) return;

  const scrollRoot = document.documentElement;
  const maxScroll = scrollRoot.scrollHeight - window.innerHeight;
  const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
  fill.style.transform = `scaleX(${clamp(progress, 0, 1)})`;
}

function updateHeaderState() {
  document.querySelectorAll("[data-animate-header]").forEach((header) => {
    header.classList.toggle("is-scrolled", window.scrollY > 60);
  });
}

function updateParallax() {
  if (prefersReducedMotion() || isMobileViewport()) {
    parallaxElements.forEach((element) => {
      element.style.setProperty("--motion-parallax-y", "0px");
    });
    return;
  }

  parallaxElements.forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;

    const centerOffset = window.innerHeight * 0.5 - (rect.top + rect.height * 0.5);
    const multiplier = Number(element.getAttribute("data-parallax") || 0.05);
    const delta = clamp(centerOffset * multiplier, -12, 12);
    element.style.setProperty("--motion-parallax-y", `${delta}px`);
  });
}

function updateSidebarIndicators() {
  document.querySelectorAll("[data-sidebar-nav]").forEach((nav) => {
    const indicator = nav.querySelector(".motion-sidebar-indicator");
    const activeItem = nav.querySelector('[data-sidebar-item][data-active="true"]');
    if (!indicator || !activeItem) {
      nav.setAttribute("data-has-active", "false");
      return;
    }

    nav.setAttribute("data-has-active", "true");
    indicator.style.width = `${activeItem.offsetWidth}px`;
    indicator.style.height = `${activeItem.offsetHeight}px`;
    indicator.style.transform = `translate3d(${activeItem.offsetLeft}px, ${activeItem.offsetTop}px, 0)`;
  });
}

function revealElement(element) {
  if (animatedElements.has(element)) return;
  animatedElements.add(element);
  element.setAttribute("data-animate-in", "true");
}

function bindGroups() {
  document.querySelectorAll("[data-animate-group]").forEach((group) => {
    const stagger = Number(group.getAttribute("data-stagger") || 80);
    const items = Array.from(group.querySelectorAll(":scope > [data-animate-item]"));
    items.forEach((item, index) => {
      item.style.setProperty("--motion-delay", `${index * stagger}ms`);
    });
  });
}

function bindAnimatedElements() {
  document.querySelectorAll("[data-animate]").forEach((element) => {
    if (element.getAttribute("data-animate-bound") === "true") return;
    element.setAttribute("data-animate-bound", "true");
    intersectionObserver.observe(element);
  });
}

function bindCountups() {
  document.querySelectorAll("[data-countup]").forEach((element) => {
    if (element.getAttribute("data-countup-bound") === "true") return;
    element.setAttribute("data-countup-bound", "true");
    countObserver.observe(element);
  });
}

function startCountup(element) {
  if (countedElements.has(element)) return;

  const template = parseCountTemplate(element.getAttribute("data-countup-value") || element.textContent || "");
  if (!template) return;

  countedElements.add(element);
  const duration = Number(element.getAttribute("data-countup-duration") || 1200);
  const startTime = performance.now();

  function tick(now) {
    const elapsed = now - startTime;
    const progress = clamp(elapsed / duration, 0, 1);
    const nextValue = template.value * easeOutCubic(progress);
    element.textContent = `${template.prefix}${formatCount(nextValue, template.decimals)}${template.suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      element.textContent = `${template.prefix}${formatCount(template.value, template.decimals)}${template.suffix}`;
    }
  }

  requestAnimationFrame(tick);
}

function bindLazyImages() {
  document.querySelectorAll("img[data-animate-image]").forEach((image) => {
    if (lazyImages.has(image)) return;
    lazyImages.add(image);

    const markLoaded = () => image.setAttribute("data-loaded", "true");
    if (image.complete) {
      markLoaded();
      return;
    }

    image.addEventListener("load", markLoaded, { once: true });
    image.addEventListener("error", markLoaded, { once: true });
  });
}

function bindParallax() {
  parallaxElements.clear();
  if (prefersReducedMotion()) return;

  document.querySelectorAll("[data-parallax]").forEach((element) => {
    parallaxElements.add(element);
  });
}

function scheduleRefresh() {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    bindGroups();
    bindAnimatedElements();
    bindCountups();
    bindLazyImages();
    bindParallax();
    updateSidebarIndicators();
    updateHeaderState();
    updateProgressBar();
    updateParallax();
  });
}

function handleScroll() {
  updateProgressBar();
  updateHeaderState();
  updateParallax();
}

export function initDashboardAnimations() {
  if (typeof window === "undefined") return () => {};

  previousTheme = getActiveTheme();

  if (prefersReducedMotion()) {
    document.documentElement.classList.remove("th-motion-ready");
    return () => {};
  }

  document.documentElement.classList.add("th-motion-ready");
  progressBar = createProgressBar();
  themeFadeLayer = createThemeFadeLayer();

  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealElement(entry.target);
        intersectionObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -8% 0px",
    },
  );

  countObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        startCountup(entry.target);
        countObserver.unobserve(entry.target);
      });
    },
    {
      threshold: 0.55,
      rootMargin: "0px 0px -5% 0px",
    },
  );

  mutationObserver = new MutationObserver(scheduleRefresh);
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "data-active", "data-collapsed"],
  });

  resizeObserver = new ResizeObserver(() => {
    updateSidebarIndicators();
    updateParallax();
  });
  document.querySelectorAll("[data-sidebar-nav], [data-sidebar-item]").forEach((element) => {
    resizeObserver.observe(element);
  });

  themeObserver = new MutationObserver(animateThemeChange);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  window.addEventListener("scroll", handleScroll, { passive: true });
  window.addEventListener("resize", scheduleRefresh);

  scheduleRefresh();

  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("scroll", handleScroll);
    window.removeEventListener("resize", scheduleRefresh);
    intersectionObserver?.disconnect();
    countObserver?.disconnect();
    mutationObserver?.disconnect();
    resizeObserver?.disconnect();
    themeObserver?.disconnect();
    progressBar?.remove();
    themeFadeLayer?.remove();
    document.documentElement.classList.remove("th-motion-ready");
  };
}
