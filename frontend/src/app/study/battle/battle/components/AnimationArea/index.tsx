'use client';

import React, { useLayoutEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import $ from 'jquery';
import styles from './index.module.css';

export interface AnimationAreaHandle {
  updateContent: (word?: any, unlock?: { word: boolean; inflection: boolean; phrase: boolean }) => void;
  flipPage: () => void;
}

interface AnimationAreaProps {
  word: any;
  unlock: { word: boolean; inflection: boolean; phrase: boolean };
  className?: string;
  onTurned?: () => void;
  onPageFlip?: () => void;
}

const inflectionLabels: Record<string, string> = {
  past_tense: '过去式',
  past_participle: '过去分词',
  present_participle: '现在分词',
  comparative: '比较级',
  superlative: '最高级',
  plural: '名词复数',
  third_person: '第三人称单数',
};

const renderPageContent = (word: any, unlock: { word: boolean; inflection: boolean; phrase: boolean }) => {
  const inflection = word.inflection || {};
  const phrases = word.phrases || [];
  const flags = Array.isArray(word.flags) ? word.flags : [];
  // 释义、例句、拓展、记忆方法、辨析、用法、注意事项
  const fields = [
    { label: '释义', value: word.explanation },
    { label: '例句', value: word.example_sentences },
    { label: '拓展', value: word.expansions },
    { label: '记忆方法', value: word.memory_techniques },
    { label: '辨析', value: word.discrimination },
    { label: '用法', value: word.usage },
    { label: '注意事项', value: word.notes },
  ];
  const infoHtml = fields
    .filter(f => f.value)
    .map(f => `
      <div class='turnContent-section'>
        <div class='turnContent-title'>${f.label}</div>
        <div class='turnContent-content'>${String(f.value).replace(/\n/g, '<br/>')}</div>
      </div>
    `)
    .join('');
  // 变形形式一行展示
  let inflectionHtml = '';
  const inflectionEntries = Object.entries(inflection).filter(([_, v]) => v);
  if (inflectionEntries.length > 0 && unlock.inflection) {
    const inflectionStr = inflectionEntries
      .map(([key, value]) => `${inflectionLabels[key] || key}：${value}`)
      .join('&nbsp;&nbsp;|&nbsp;&nbsp;');
    inflectionHtml = `
      <div class='turnContent-section'>
        <div class='turnContent-title'>变形形式</div>
        <div class='turnContent-content'>${inflectionStr}</div>
      </div>
    `;
  }
  // 短语搭配 table
  let phraseHtml = '';
  if (phrases.length > 0 && unlock.phrase) {
    phraseHtml = `
      <div class='turnContent-section'>
        <div class='turnContent-title'>短语搭配</div>
        <table class='turnContent-table'>
          <tbody>
            ${phrases.map((item: any) => `
              <tr>
                <td class='turnContent-th'>${item.exp}：</td>
                <td class='turnContent-td'>${item.phrase}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  // 标签
  let tagHtml = '';
  if (flags.length > 0) {
    tagHtml = `
      <div class='turnContent-section' style="display:flex;align-items:baseline;margin-bottom:20px;">
        <div class='turnContent-title' style="display:inline-block;margin-bottom:0;margin-right:8px;white-space:nowrap;">标签</div>
        <div class='turnContent-tagRow' style="margin-left:0;display:flex;gap:8px;flex-wrap:wrap;margin-top:0;vertical-align:middle;">
          ${flags.map((flag: string) => `<span class='turnContent-tag'>${flag}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // 注入全局发音函数
  if (typeof window !== 'undefined') {
    (window as any).__playWordAudio = (w: string) => {
      if ('speechSynthesis' in window) {
        const utter = new window.SpeechSynthesisUtterance(w);
        utter.lang = 'en-US';
        window.speechSynthesis.speak(utter);
      }
    };
  }
  return `
    <div class='known-area' style='margin-bottom:32px;'>
      ${infoHtml}
      ${tagHtml}
    </div>
    <div style='display:${unlock.word ? 'block' : 'none'};'><hr style='border:1px solid #eee;margin:16px 0;'/></div>
    <div class='unlock-area'>
      <div class='word' style='margin-bottom:16px;display:${unlock.word ? 'block' : 'none'};'>
        <span style='font-size:32px;font-weight:bold;'>${word.word || ''}</span>
        <span style='font-size:22px;color:#888;margin-left:16px;'>${word.phonetic_symbol || ''}</span>
        <span style="font-size:20px;color:#bfa76a;margin-left:8px;cursor:pointer;vertical-align:middle;display:inline-flex;align-items:center;" onclick="window.__playWordAudio && window.__playWordAudio('${word.word}')">
          <svg viewBox="64 64 896 896" focusable="false" data-icon="sound" width="20" height="20" fill="#bfa76a" aria-hidden="true" style="display:inline-block;vertical-align:middle;">
            <path d="M512 128a384 384 0 1 0 0 768 384 384 0 0 0 0-768zm0 704a320 320 0 1 1 0-640 320 320 0 0 1 0 640zm-64-448v256h-96V384h96zm128 0v256h-96V384h96z"></path>
          </svg>
        </span>
      </div>
      <div style='display:${unlock.inflection ? 'block' : 'none'};'><hr style='border:1px solid #eee;margin:16px 0;'/></div>
      ${inflectionHtml}
      <div style='display:${unlock.phrase ? 'block' : 'none'};'><hr style='border:1px solid #eee;margin:16px 0;'/></div>
      ${phraseHtml}
    </div>
  `;
};

const AnimationArea = forwardRef<AnimationAreaHandle, AnimationAreaProps>((props, ref) => {
  // console.log('[AnimationArea] render', props.word, props.unlock);
  const bookRef = useRef<HTMLDivElement>(null);
  const currentPage = useRef(1);

  // 内容写入方法，供父组件手动调用
  const updateContent = (word = props.word, unlock = props.unlock) => {
    if (!bookRef.current) return;
    const $book = $(bookRef.current);
    if ($book.length === 0 || typeof $book.turn !== 'function') return;
    const html1 = renderPageContent(word || {}, unlock || { word: false, inflection: false, phrase: false });
    const html2 = renderPageContent(word || {}, unlock || { word: false, inflection: false, phrase: false });
    $book.find('.page1 .page-content').html(html1);
    $book.find('.page2 .page-content').html(html2);
    setPageBackground();
  };

  const setPageBackground = () => {
    if (typeof window !== 'undefined' && (window as any).jQuery) {
      (window as any).jQuery('.page').css({
        background: "url('/images/paper-texture.jpg') center center/cover no-repeat"
      });
    }
  };

  // 监听 props 变化，自动更新内容
  useLayoutEffect(() => {
    if (bookRef.current) {
      updateContent();
    }
  }, [props.word, props.unlock]);

  // 只在组件挂载时初始化 turn.js
  useLayoutEffect(() => {
    let timer: any;
    function tryInit() {
      if (!bookRef.current) {
        timer = setTimeout(tryInit, 50);
        return;
      }
      if (!(window as any).jQuery) {
        (window as any).jQuery = $;
        (window as any).$ = $;
      }
      if (!(window as any).jQuery.fn.turn) {
        const script = document.createElement('script');
        script.src = '/libs/turn.min.js';
        script.onload = () => {
          if (!(window as any).jQuery.fn.turn && (window as any).turn) {
            (window as any).jQuery.fn.turn = (window as any).turn;
          }
          if (!(window as any).jQuery.fn.turn) {
            return;
          }
          setTimeout(initTurn, 0);
        };
        document.body.appendChild(script);
      } else {
        setTimeout(initTurn, 0);
      }
    }
    function initTurn() {
      const $book = $(bookRef.current!);
      if ($book.length === 0) {
        return;
      }
      if ($book.data('turn')) {
        $book.turn('destroy');
      }
      $book.empty();
      $book.append(`
        <div class="hard">
          <div class="page-wrapper">
            <div class="page page1">
              <div class="page-content"></div>
            </div>
          </div>
        </div>
        <div class="hard">
          <div class="page-wrapper">
            <div class="page page2">
              <div class="page-content"></div>
            </div>
          </div>
        </div>
      `);
      // 动态获取父容器宽高
      const parent = $book.parent()[0];
      const width = parent ? parent.getBoundingClientRect().width : 700;
      const height = parent ? parent.getBoundingClientRect().height : 800;
      $book.turn({
        width,
        height,
        display: 'single',
        autoCenter: true,
        duration: 1500,
        gradients: true,
        elevation: 100,
        pages: 2,
        page: 1,
        when: {
          turning: function(e: any, page: number, view: any) {
            const $book = $(bookRef.current!);
            $book.find('.page-wrapper').addClass('animated');
            if (props.onPageFlip && page === 2) {
              props.onPageFlip();
            }
          },
          turned: function (event: any, pageNum: number) {
            const $book = $(bookRef.current!);
            $book.find('.page-wrapper').removeClass('animated');
            // 翻页完成后，重置回第1页，但不触发动画
            if (pageNum === 2) {
              setTimeout(() => {
                if (
                  $book &&
                  typeof $book.turn === 'function' &&
                  $book.data &&
                  typeof $book.data === 'function' &&
                  $book.data('turn') &&
                  typeof $book.data('turn').totalPages !== 'undefined'
                ) {
                $book.turn('page', 1);
                currentPage.current = 1;
                }
              }, 100);
            }
            if (props.onTurned) {
              setTimeout(() => {
                try {
                  props.onTurned!();
                } catch (error) {
                  console.warn('[AnimationArea] 调用 props.onTurned 时发生错误:', error);
                }
              }, 100);
            }
          }
        }
      });
      setPageBackground();
      // turn.js 初始化后立即写入内容
      setTimeout(() => {
        updateContent();
        // 动态移除父层 overflow 限制，保证滚动条可见
        document.querySelectorAll('.turn-page-wrapper, .hard, .page, .page-wrapper').forEach(el => {
          (el as HTMLElement).style.overflow = 'visible';
        });
      }, 100);
    }
    setTimeout(tryInit, 0);
    return () => {
      if (timer) clearTimeout(timer);
      if (bookRef.current) {
        const $book = $(bookRef.current);
        if ($book.data('turn')) {
          $book.turn('destroy');
        }
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    updateContent,
    flipPage: () => {
      function doFlip() {
        if (!bookRef.current) {
          setTimeout(doFlip, 50);
          return;
        }
        const $book = $(bookRef.current);
        if ($book.length === 0 || typeof $book.turn !== 'function') {
          setTimeout(doFlip, 50);
          return;
        }
        // 只执行一次翻页动画
        $book.turn('page', 2);
        currentPage.current = 2;
      }
      doFlip();
    }
  }));

  return (
    <div ref={bookRef} className={styles.animationArea}></div>
  );
});

export default AnimationArea; 