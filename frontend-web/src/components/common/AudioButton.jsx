import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';

/**
 * Nút Loa phát âm từ vựng hoặc câu ví dụ chuẩn thiết kế Parroto (Tactile Duo Button)
 * Hỗ trợ chọn giọng Anh-Mỹ (accent="US") hoặc Anh-Anh (accent="UK") và Tiếng Trung (lang="ZH")
 */
export default function AudioButton({
  text = '',
  lang = 'EN',
  accent = 'US',
  audioUrl = null,
  size = 'md',
  label = '',
  className = '',
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Hàm xử lý khi người dùng bấm vào nút Loa
  function handlePlayAudio(event) {
    event.stopPropagation();

    if (!text && !audioUrl) {
      return;
    }

    // Nếu có file .mp3 và đang ở giọng mặc định US thì ưu tiên phát file âm thanh
    if (audioUrl && accent !== 'UK') {
      try {
        setIsSpeaking(true);
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          setIsSpeaking(false);
          speakWithBrowserTTS();
        };
        audio.play().catch(() => {
          setIsSpeaking(false);
          speakWithBrowserTTS();
        });
        return;
      } catch {
        setIsSpeaking(false);
      }
    }

    speakWithBrowserTTS();
  }

  function speakWithBrowserTTS() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = String(text).replace(/™/g, '').trim();
    if (!cleanText) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    if (lang === 'ZH') {
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
    } else if (accent === 'UK') {
      utterance.lang = 'en-GB';
      utterance.rate = 0.94;
    } else {
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  // Tuỳ chỉnh kích thước nút theo size ('sm' | 'md' | 'lg')
  let sizeStyle = 'px-2.5 py-1.5 text-xs';
  let iconStyle = 'w-4 h-4';
  if (size === 'sm') {
    sizeStyle = label ? 'px-2 py-1 text-[11px]' : 'w-8 h-8 p-0';
    iconStyle = 'w-3.5 h-3.5';
  } else if (size === 'lg') {
    sizeStyle = 'px-3.5 py-2 text-sm';
    iconStyle = 'w-5 h-5';
  }

  return (
    <button
      type="button"
      onClick={handlePlayAudio}
      title={`Nghe phát âm (${lang === 'ZH' ? 'Tiếng Trung' : accent}): ${text}`}
      className={`btn-duo inline-flex items-center justify-center gap-1 rounded-xl font-bold border-2 cursor-pointer ${
        isSpeaking
          ? 'bg-[#3c94d4] text-white border-[#1e64a5] shadow-[0_2px_0_0_#1e64a5]'
          : 'bg-white dark:bg-slate-800 text-[#262c57] dark:text-slate-100 border-[#e2e8f0] dark:border-slate-700 shadow-duo-sm hover:border-[#3c94d4] hover:text-[#3c94d4]'
      } ${sizeStyle} ${className}`}
    >
      <Volume2 className={`${iconStyle} ${isSpeaking ? 'animate-pulse' : ''}`} />
      {label ? <span>{label}</span> : null}
    </button>
  );
}
