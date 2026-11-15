import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';

/**
 * Nút Loa phát âm từ vựng hoặc câu ví dụ (AudioButton)
 * Ưu tiên phát file .mp3 nếu có (audioUrl), nếu chưa có thì dùng giọng đọc tự nhiên
 * có sẵn trên trình duyệt (window.speechSynthesis: 'en-US' cho Tiếng Anh, 'zh-CN' cho Tiếng Trung)
 */
export default function AudioButton({
  text = '',
  lang = 'EN',
  audioUrl = null,
  size = 'md',
  label = '',
  className = '',
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Hàm xử lý khi bấm vào nút Loa
  function handlePlayAudio(event) {
    // Ngăn sự kiện click lan ra ngoài (ví dụ tránh làm lật thẻ Flashcard khi bấm nghe loa)
    event.stopPropagation();

    if (!text && !audioUrl) {
      return;
    }

    // Cách 1: Nếu có đường dẫn file .mp3 thì phát file âm thanh trước
    if (audioUrl) {
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

    // Cách 2: Dùng trình đọc giọng nói Web Speech API của trình duyệt
    speakWithBrowserTTS();
  }

  function speakWithBrowserTTS() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Trình duyệt của bạn không hỗ trợ phát âm tự động.');
      return;
    }

    // Dừng giọng đọc cũ nếu đang đọc dở
    window.speechSynthesis.cancel();

    // Làm sạch ký tự đặc biệt (như ™) để giọng đọc chuẩn hơn
    const cleanText = String(text).replace(/™/g, '').trim();
    if (!cleanText) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Chọn mã ngôn ngữ đọc: Tiếng Trung ('zh-CN') hoặc Tiếng Anh ('en-US')
    if (lang === 'ZH') {
      utterance.lang = 'zh-CN';
      utterance.rate = 0.9;
    } else {
      utterance.lang = 'en-US';
      utterance.rate = 0.95;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  // Chỉnh kích thước nút theo tham số size ('sm' | 'md' | 'lg')
  let sizeStyle = 'p-2 text-xs';
  let iconStyle = 'w-4 h-4';
  if (size === 'sm') {
    sizeStyle = 'p-1.5 text-xs';
    iconStyle = 'w-3.5 h-3.5';
  } else if (size === 'lg') {
    sizeStyle = 'p-3 text-sm';
    iconStyle = 'w-5 h-5';
  }

  return (
    <button
      type="button"
      onClick={handlePlayAudio}
      title={`Nghe phát âm: ${text}`}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-medium transition border ${
        isSpeaking
          ? 'bg-blue-600 text-white border-blue-600 shadow-sm scale-105'
          : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/50'
      } ${sizeStyle} ${className}`}
    >
      <Volume2 className={`${iconStyle} ${isSpeaking ? 'animate-pulse' : ''}`} />
      {label && <span>{label}</span>}
    </button>
  );
}
