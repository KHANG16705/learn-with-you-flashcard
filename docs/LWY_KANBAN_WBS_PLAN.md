# KẾ HOẠCH QUẢN TRỊ DỰ ÁN KỸ THUẬT (WBS & KANBAN MASTER PLAN)
## Dự án: **LWY (Learn With You)** — Nền tảng Học Từ Vựng Đa Ngôn Ngữ (Anh - Trung) qua Flashcard SRS Cá Nhân Hóa
- **Vai trò lập kế hoạch:** Technical Project Manager & Tech Lead
- **Mô hình phát triển:** Solo Developer — **Vertical Slice Architecture** (Database $\rightarrow$ Backend API $\rightarrow$ Frontend React $\rightarrow$ E2E Verification theo từng tính năng dọc)
- **Tech Stack cốt lõi:** React 18 (Vite) + Tailwind CSS + Zustand + Framer Motion + `hanzi-writer` | Node.js 20 (ESM) + Express.js + `mysql2/promise` (Raw SQL Pool) | MySQL 8.0 (`utf8mb4_unicode_ci`) | Edge-TTS | Docker Compose (MySQL + API + Nginx Web)

---

## PHẦN 1: RÀ SOÁT & PHÂN TÍCH RỦI RO KỸ THUẬT CHO SOLO DEVELOPER

Khi phát triển độc lập (Solo Developer) một hệ thống vừa có thuật toán toán học (SM-2), vừa xử lý đa ngôn ngữ phức tạp (Anh - Trung), rất dễ rơi vào trạng thái "sa lầy" ở một khâu kỹ thuật hoặc mở quá nhiều file cùng lúc. Dưới đây là 5 điểm nghẽn (Bottlenecks) lớn nhất và giải pháp chặn trước:

### 1.1. Bảng Phân Tích 5 Điểm Nghẽn Kỹ Thuật (Technical Bottlenecks)

| # | Điểm nghẽn kỹ thuật | Nguy cơ gây tắc nghẽn (Risk) | Giải pháp kiến trúc & Phòng ngừa (Mitigation) |
| :--- | :--- | :--- | :--- |
| **B1** | **Pipeline sinh Audio Edge-TTS hàng loạt & theo yêu cầu (`generate-audio.py` & `tts.js`)** | Chạy batch hàng nghìn từ/câu ví dụ dễ bị Microsoft chặn kết nối (rate-limit/timeout); hoặc khi user tự thêm từ mới vào Sổ tay, chờ tạo `.mp3` quá lâu làm treo request API. | 1. Đặt tên file theo quy tắc định danh cố định (`en_word_{vocabId}.mp3`) và kiểm tra tồn tại trước khi gọi TTS (idempotent).<br>2. Giới hạn concurrency tối đa `3–5` luồng khi chạy script batch.<br>3. Trên Frontend (`AudioButton.jsx`), thiết kế cơ chế **Fallback sang Web Speech API (`window.speechSynthesis`)** nếu file `.mp3` chưa tồn tại hoặc lỗi mạng, đồng thời **Preload `<audio>` của thẻ kế tiếp (`index + 1`)** để độ trễ bằng `0ms`. |
| **B2** | **Đồng bộ SRS MySQL & Lazy Initialization (`user_vocab_progress`)** | 1. Một từ nằm trong nhiều bộ thẻ (`vocabularies` dùng chung) dẫn đến tính sai thanh tiến độ 4 màu nếu query không chuẩn.<br>2. Lệch múi giờ giữa Node.js (`UTC`) và MySQL (`+07:00`) làm thẻ `Due SRS` hiển thị sai ngày.<br>3. Tạo sẵn hàng chục nghìn dòng `UNSEEN` gây phình bảng. | 1. **Tuyệt đối không insert sẵn dòng `UNSEEN`**: dùng `LEFT JOIN user_vocab_progress uvp ON dc.vocab_id = uvp.vocab_id AND uvp.user_id = ?`, coi `uvp.id IS NULL` là `UNSEEN`.<br>2. Dùng duy nhất câu lệnh nguyên tử `INSERT INTO user_vocab_progress ... ON DUPLICATE KEY UPDATE ...` bọc trong **Database Transaction** cùng với bảng `user_study_logs`.<br>3. Dùng chung duy nhất module `shared/srsEngine.js` cho cả Frontend (preview nút bấm) và Backend (lưu DB). |
| **B3** | **Tích hợp `hanzi-writer` (Hoạt ảnh & Tập tô nét chữ Hán)** | 1. `hanzi-writer` chỉ nhận **từng chữ Hán đơn lẻ** (1 character), trong khi từ vựng HSK/Thành ngữ có từ 2–4 chữ Hán (`坚持`, `半途而废`).<br>2. Thao tác kéo chuột tô nét chữ trên mặt sau thẻ bị xung đột với sự kiện click lật thẻ 3D (`Framer Motion`).<br>3. Rò rỉ bộ nhớ (Memory Leak) khi chuyển nhanh qua 20 thẻ. | 1. Trong `HanziStrokeWriter.jsx`, tách từ tiếng Trung thành mảng từng ký tự Hán (`Array.from(word)`), hiển thị thanh tab chọn từng chữ để xem nét viết hoặc tập tô.<br>2. Bọc vùng canvas `hanzi-writer` bằng `onClick={(e) => e.stopPropagation()}` và `onPointerDown={(e) => e.stopPropagation()}` để không kích hoạt lật thẻ.<br>3. Hủy (cleanup) DOM container trong `useEffect` mỗi khi đổi `vocabId`. |
| **B4** | **Tách từ câu ví dụ bằng `Intl.Segmenter` & Popup Tra Nhanh (`ContextualLookupPopup.jsx`)** | Tiếng Trung viết liền không có khoảng trắng (`我每天坚持学习中文`). Nếu tách theo từng chữ cái đơn lẻ sẽ làm mất nghĩa của từ ghép (`坚持`, `学习`), hoặc người dùng click liên tục gây spam API tra từ điển. | 1. Sử dụng chuẩn trình duyệt `new Intl.Segmenter('zh-CN', { granularity: 'word' })` cho câu tiếng Trung và tách theo word boundary cho câu tiếng Anh.<br>2. Khi click vào một token, kiểm tra **Cache trên RAM (Map trong Zustand)** trước khi gọi `GET /api/v1/dictionary/lookup`.<br>3. Ở Backend, nếu tra từ ghép không thấy trong `dictionary_entries`, tự động trả kèm kết quả chiết tự từng chữ Hán đơn lẻ. |
| **B5** | **Độ phức tạp trạng thái của Chế độ 4 (`GuidedCombo.jsx` - 4 bước xoay vòng)** | Chế độ Học Kết Hợp chia 10–15 từ thành từng chùm 3–5 từ và xoay vòng qua 4 bước (*Lật thẻ $\rightarrow$ Trắc nghiệm $\rightarrow$ Gõ từ $\rightarrow$ Chấm SRS*). Nếu quản lý bằng `useState` rời rạc sẽ dẫn đến lỗi lặp vô tận hoặc mất tiến độ giữa chừng. | Thiết kế **State Machine tập trung trong `useStudyStore.js` (Zustand)** với cấu trúc rõ ràng: `batchIndex`, `currentBatchCards`, `comboStep` (`1..4`), `subCardIndex`, chỉ gọi API lưu SRS ở bước cuối hoặc gửi theo từng lượt hoàn thành. |

---

### 1.2. Nguyên Tắc Giới Hạn Việc Đang Làm (WIP Limit Rules cho Solo Developer)

Để tránh tình trạng *"mở 15 tab code, sửa dở Backend lại nhảy sang chỉnh CSS Frontend rồi bỏ cuộc"*, bạn cần tuân thủ **4 quy tắc kỷ luật thép** sau:

1. **Quy tắc `WIP Limit = 1` ở cột `In Progress`:**
   - Tại bất kỳ thời điểm nào, cột **In Progress** chỉ được phép chứa **tối đa 01 Sub-task** (hoặc 1 task Backend, hoặc 1 task Frontend).
   - Muốn kéo task mới vào `In Progress`, bạn **bắt buộc** phải đẩy task hiện tại sang `Testing / Verification` hoặc `Done`.
2. **Quy tắc Khóa Lát Cắt Dọc (Vertical Slice Gate):**
   - Không được viết bất kỳ dòng code nào của `Epic N+1` khi toàn bộ Sub-tasks của `Epic N` chưa nằm ở cột `Done`.
   - Ví dụ: Phải hoàn thiện trọn vẹn từ DB $\rightarrow$ API $\rightarrow$ Giao diện $\rightarrow$ Test xong **Slice 3 (Chi tiết bộ thẻ & Chia Unit 20 từ)** rồi mới được bắt đầu làm **Slice 4 (5 Chế độ học)**.
3. **Quy tắc Timebox 6 Giờ (No Monster Tasks):**
   - Không có Sub-task nào được ước lượng vượt quá **6 giờ**. Nếu một tính năng phức tạp (như 5 chế độ học ở Epic 4), phải tách thành từng Sub-task độc lập từ `2h–5h` để mỗi ngày làm việc đều có cảm giác hoàn thành (Dopamine thực chất).
4. **Quy tắc Kiểm Thử Trước Khi Đóng (Verify Before Done):**
   - Backend API phải được kiểm tra bằng lệnh `curl` / `Invoke-RestMethod` trả về đúng JSON thật từ MySQL trước khi bắt tay vào ghép giao diện React.

---

## PHẦN 2: PHÂN RÃ CÔNG VIỆC CHI TIẾT (WBS: 7 EPICS & 36 SUB-TASKS)

> **Tổng thời lượng ước tính:** ~132 giờ (tương đương 4–5 tuần làm việc tập trung của 1 Solo Developer).

---

### EPIC 0: Foundation, Shared Algorithm & Data/Audio Pipeline (Nền tảng & Pipeline Dữ liệu)
*Mục tiêu: Xây dựng nền móng CSDL MySQL 8.0, bộ não thuật toán dùng chung `/shared`, và nạp sẵn bộ dữ liệu mẫu Anh/Trung kèm file âm thanh `.mp3`.*

| Mã Task | Tên Sub-task (Bắt đầu bằng động từ kỹ thuật) | Ước lượng | Trạng thái hiện tại | Định nghĩa hoàn thành (Definition of Done - DoD) |
| :---: | :--- | :---: | :---: | :--- |
| **0.1** | **Khởi tạo MySQL Schema (8 bảng `utf8mb4`), cấu hình Connection Pool `db.js` và Healthcheck Server** | `3h` | ✅ **DONE** | Database `flashcard_srs_db` có đủ 8 bảng `InnoDB` chuẩn `utf8mb4_unicode_ci`; chạy `GET /api/v1/health` trả về `{"status":"OK","db":"connected"}`. |
| **0.2** | **Viết hằng số `constants.js` và thuật toán SM-2 cải tiến `calculateSRS` trong `shared/srsEngine.js`** | `3h` | ✅ **DONE** | Hàm `calculateSRS` tính đúng 4 mức `0..3`, chặn `ease_factor >= 1.30`, bật cờ `is_leech` khi `lapses >= 3`, tự chuyển `MASTERED` khi `interval_days > 21`; `getButtonPreviewIntervals` trả về đúng nhãn `< 10p`, `1 ngày`, `3 ngày`, `4 ngày`. |
| **0.3** | **Viết bộ hàm chấm điểm đa ngôn ngữ trong `shared/answerValidator.js`** | `3h` | ✅ **DONE** | `generateWordMask('resilient')` trả về `'r _ s _ l _ e _ t'`; `validateChineseAnswer` nhận diện đúng cả 5 kiểu (Chữ Hán giản/phồn, Pinyin có dấu/số/không dấu); `validateWordBankSelection` ghép đúng mảng token. |
| **0.4** | **Viết script `backend/scripts/seed-decks.js` & `enrich-oxford-data.js` nạp 3.004 từ Oxford 3000 (4 cấp độ A1–B2, 153 Units)** | `5h` | ✅ **DONE** | Đã nạp thành công 4 Bộ thẻ (`A1`, `A2`, `B1`, `B2`), 153 Units (20 từ/Unit), 3.004 thẻ từ vựng vào MySQL (`decks`, `deck_units`, `vocabularies`, `deck_cards`, `dictionary_entries`). |
| **0.5** | **[HOÃN LẠI - DEFERRED] Xây dựng service `backend/src/services/tts.js` và script batch `backend/scripts/generate-audio.py` tạo file `.mp3` qua Edge-TTS** | `4h` | ⏸️ **DEFERRED** | *(Tạm hoãn theo quyết định PM: Giai đoạn đầu dùng trực tiếp **Web Speech API (`window.speechSynthesis`)** có sẵn trên trình duyệt cho cả Tiếng Anh `en-US` và Tiếng Trung `zh-CN` để không bị chặn tiến độ bởi môi trường Python/MP3).* |

---

### EPIC 1 (Slice 1): Authentication & Global Language Switcher (Xác thực & Chuyển đổi Ngôn ngữ)
*Mục tiêu: Đảm bảo quy tắc Login-First và cho phép người học chuyển đổi tức thì giữa không gian học Tiếng Anh (`EN`) và Tiếng Trung (`ZH`).*

| Mã Task | Tên Sub-task (Bắt đầu bằng động từ kỹ thuật) | Ước lượng | Định nghĩa hoàn thành (Definition of Done - DoD) |
| :---: | :--- | :---: | :--- |
| **1.1** | **Viết middleware xác thực JWT `backend/src/middlewares/auth.js` và bộ khung định tuyến `backend/src/routes/index.js`** | `2.5h` | Middleware giải mã `Bearer <token>`, gắn `req.user = { id, email, preferred_lang }`, trả về `401 Unauthorized` khi token thiếu hoặc hết hạn; mount thành công `/api/v1` vào `server.js`. |
| **1.2** | **Tạo các API xác thực (`POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `PATCH /users/me/preferences`) trong `authController.js`** | `4h` | Mã hóa mật khẩu bằng `bcryptjs` (salt 10), xác thực Google ID Token qua `google-auth-library`, trả về `{ token, user: { id, email, display_name, preferred_lang, daily_new_cards_limit } }`; cho phép cập nhật `preferred_lang` (`EN`\|`ZH`) vào bảng `users`. |
| **1.3** | **Cấu hình Vite, Tailwind CSS, `axiosClient.js` (Interceptors) và глобал store `useStudyStore.js` (Zustand)** | `3h` | `axiosClient` tự động đính kèm header `Authorization: Bearer <token>` từ `localStorage` và tự động điều hướng về `/login` khi gặp lỗi `401`; Zustand lưu bền vững `user`, `token`, `activeLang` (`EN`\|`ZH`). |
| **1.4** | **Dựng trang `LoginPage.jsx` (Đăng nhập / Đăng ký / Google Login) và Header Layout kèm `LanguageSwitcher` (`EN` $\leftrightarrow$ `ZH`)** | `4h` | `ProtectedRoute` chặn người dùng chưa đăng nhập; bấm nút chuyển đổi `🇬🇧 Tiếng Anh` / `🇨🇳 Tiếng Trung` trên Header cập nhật tức thì `activeLang` trong Zustand và đồng bộ ngầm lên DB. |

---

### EPIC 2 (Slice 2): Catalog Dashboard, Filter Tags & Daily Due SRS Queue (Trang Khám Phá & Nhắc Ôn Tập)
*Mục tiêu: Hiển thị kho bộ thẻ theo ngôn ngữ đang chọn, lọc nhanh qua `#tags` và hiển thị số lượng thẻ đến hạn cần ôn tập hôm nay.*

| Mã Task | Tên Sub-task (Bắt đầu bằng động từ kỹ thuật) | Ước lượng | Định nghĩa hoàn thành (Definition of Done - DoD) |
| :---: | :--- | :---: | :--- |
| **2.1** | **Tạo API `GET /api/v1/decks` và thống kê hàng đợi ôn tập `due_today` trong `deckController.js`** | `3.5h` | Hỗ trợ query `?lang=EN\|ZH&tag=...&q=...`; trả về danh sách bộ thẻ hệ thống (`is_system = 1`) kèm tiến độ phần trăm đã học của user hiện tại và tổng số thẻ đến hạn ôn tập hôm nay (`next_review_at <= NOW()`) theo ngôn ngữ đó. |
| **2.2** | **Dựng trang `DashboardPage.jsx` với Banner Nhắc Ôn Tập Hàng Ngày (Daily Due SRS Banner) và thanh lọc `#tags`** | `4.5h` | Tự động tải lại danh sách bộ thẻ khi đổi `activeLang` (`EN`/`ZH`); lọc tức thì khi bấm vào các chip `#a1`, `#b1`, `#toeic`, `#ielts`, `#hsk1`..`#hsk6`; hiển thị nút CTA nổi bật **"Ôn tập ngay X từ đến hạn"** dẫn thẳng vào chế độ `due_review` và nút **"Luyện X từ hay quên"** dẫn vào `weak_words`. |

---

### EPIC 3 (Slice 3): Deck Detail, 20-Word Units, 4-Color Progress & Mark as Known (Chi Tiết Bộ Thẻ & Chia Chặng)
*Mục tiêu: Chia nhỏ bộ thẻ lớn thành các chặng 20 từ (Micro-learning Units), trực quan hóa tiến độ bằng thanh 4 màu và cho phép lọc bỏ từ đã biết.*

| Mã Task | Tên Sub-task (Bắt đầu bằng động từ kỹ thuật) | Ước lượng | Định nghĩa hoàn thành (Definition of Done - DoD) |
| :---: | :--- | :---: | :--- |
| **3.1** | **Tạo API `GET /api/v1/decks/:slug/overview` và `GET /api/v1/decks/:slug/units/:unitId/cards` trong `deckController.js`** | `4h` | Sử dụng câu lệnh SQL `LEFT JOIN user_vocab_progress` chuẩn để trả về 4 chỉ số (`unseen_count`, `learning_count`, `due_today_count`, `mastered_count`) cho toàn bộ thẻ và từng Unit 1..N; trả về danh sách từ vựng trong Unit kèm `status` hiện tại của user. |
| **3.2** | **Tạo API `PATCH /api/v1/study/cards/:vocabId/mark-known` trong `studyController.js`** | `2.5h` | Thực thi `INSERT INTO user_vocab_progress ... ON DUPLICATE KEY UPDATE status = 'IGNORED'` (hoặc `'MASTERED'`); tự động tính là đã thuộc ở tất cả các bộ thẻ khác có chứa cùng `vocab_id` đó. |
| **3.3** | **Dựng trang `DeckDetailPage.jsx` hiển thị Thanh Tiến Độ 4 Màu, lưới chọn Unit (20 từ/Unit) và Bảng Xem Trước Từ Vựng** | `5h` | Render thanh stacked bar 4 màu (`Xám: Chưa học`, `Xanh dương: Đang học`, `Cam: Cần ôn hôm nay`, `Xanh lá: Đã thuộc`); chọn từng Unit để xem danh sách từ kèm IPA/Pinyin, Âm Hán Việt, nút loa nghe thử, nút **"Đã biết"** (cập nhật Optimistic UI) và Modal chọn 1 trong 5 chế độ học. |

---

### EPIC 4 (Slice 4): Focus Study Mode — 5 Chế Độ Học Độc Lập & Tương Tác Đa Ngôn Ngữ
*Mục tiêu: Trái tim của sản phẩm — hoàn thiện trọn vẹn vòng lặp học tập không xao nhãng với 5 chế độ tự chọn, phím tắt bàn phím và hiệu ứng chữ Hán.*

| Mã Task | Tên Sub-task (Bắt đầu bằng động từ kỹ thuật) | Ước lượng | Định nghĩa hoàn thành (Definition of Done - DoD) |
| :---: | :--- | :---: | :--- |
| **4.1** | **Tạo API `GET /api/v1/study/cards` hỗ trợ lấy thẻ theo 6 chế độ (`flashcard`, `quiz`, `typing`, `combo`, `weak_words`, `due_review`)** | `4h` | Trả về danh sách thẻ theo `deckId` + `unitId` (hoặc toàn cục cho `weak_words` với `lapses >= 3` và `due_review` với `next_review_at <= NOW()`), tự động parse các cột JSON (`language_metadata`, `distractors`) và đính kèm thông số SRS hiện tại của từng thẻ. |
| **4.2** | **Tạo API `POST /api/v1/study/submit-progress` tính toán SRS và ghi nhật ký `user_study_logs` trong Transaction** | `4h` | Gọi `calculateSRS()` từ `/shared`, cập nhật bảng `user_vocab_progress` và cộng dồn `new_cards_learned`, `cards_reviewed`, `correct_answers`, `total_attempts`, `study_seconds` vào bảng `user_study_logs` theo ngày `CURDATE()` trong cùng 1 MySQL Transaction. |
| **4.3** | **Dựng component `AudioButton.jsx` (Preload thẻ kế tiếp + Web Speech Fallback) và `HanziStrokeWriter.jsx` (Hoạt ảnh & Tập tô nét chữ Hán)** | `4.5h` | `AudioButton` tự động nạp trước file `.mp3` của thẻ tiếp theo và hỗ trợ phím tắt `R`; `HanziStrokeWriter` tách từng chữ Hán trong từ vựng, cho phép bấm xem hoạt ảnh thứ tự nét (`animateCharacter`) hoặc chuyển sang chế độ tự tô nét (`quiz`) mà không làm lật thẻ. |
| **4.4** | **Dựng component `Flashcard3D.jsx` hiển thị 2 mặt thẻ chuyên biệt cho Tiếng Anh (`EN`) và Tiếng Trung (`ZH`)** | `4.5h` | Lật 3D mượt mà bằng `Framer Motion` (`rotateY: 180deg`); chế độ `EN` hiện từ, loại từ, IPA US/UK, câu ví dụ in đậm từ khóa, synonyms/collocations; chế độ `ZH` có nút **Ẩn/Hiện Pinyin** ở mặt trước, mặt sau hiện Pinyin, **Âm Hán Việt**, chiết tự từng chữ và `HanziStrokeWriter`. |
| **4.5** | **Dựng khung `StudySessionPage.jsx` và Chế độ 1: `PureFlashcard.jsx` (Học & Duyệt nhanh bằng Flashcard SRS)** | `4h` | Hiển thị thanh tiến độ phiên học, bắt phím tắt `Space` (lật thẻ), `1 / 2 / 3 / 4` (chấm điểm `Quên / Khó / Nhớ / Rất dễ`), hiển thị số ngày ôn dự kiến trên 4 nút thông qua `getButtonPreviewIntervals()`, tự động đẩy thẻ bấm `Quên (0)` vào cuối hàng đợi để ôn lại ngay trong phiên. |
| **4.6** | **Dựng Chế độ 2: `Quiz4Options.jsx` (Trắc nghiệm phản xạ 4 đáp án đa dạng thức)** | `4h` | Hỗ trợ 3 dạng câu hỏi (Nhìn từ chọn nghĩa Việt, Nghe Audio chọn từ, Điền từ vào chỗ trống `[___]` trong câu ví dụ); trộn ngẫu nhiên đáp án đúng với 3 `distractors`; hỗ trợ phím số `1–4`, phản hồi màu Xanh/Đỏ tức thì và gửi kết quả lên API. |
| **4.7** | **Dựng Chế độ 3: `WordBankTyping.jsx` (Luyện nhớ chủ động: Khung gợi ý Tiếng Anh & Word Bank / Pinyin Tiếng Trung)** | `5h` | Tiếng Anh: hiển thị nghĩa + phát Audio + khung ký tự `generateWordMask` (`r _ s _ l _ e _ t`) và chấm bằng `validateEnglishSpelling`. Tiếng Trung: có nút chuyển đổi giữa **Word Bank** (bấm chọn 6–8 mảnh chữ Hán rời rạc từ `word_bank_tokens`) và **Typing** (chấm cả Chữ Hán lẫn Pinyin qua `validateChineseAnswer`). |
| **4.8** | **Dựng Chế độ 4: `GuidedCombo.jsx` (Học kết hợp xoay vòng 4 bước theo cụm 3–5 từ)** | `5h` | Chia danh sách từ trong phiên thành từng nhóm 3–5 từ; dẫn dắt người học đi qua tuần tự 4 bước cho mỗi nhóm: *Bước 1 (Lật thẻ làm quen) $\rightarrow$ Bước 2 (Trắc nghiệm 4 đáp án) $\rightarrow$ Bước 3 (Ghép chữ/Gõ từ) $\rightarrow$ Bước 4 (Đánh giá mức độ nhớ SRS)* rồi mới sang nhóm tiếp theo. |
| **4.9** | **Dựng Chế độ 5: `WeakWordsMode.jsx` (Đặc trị từ yếu `lapses >= 3`) và Màn hình Tổng Kết Phiên Học (Session Summary)** | `3.5h` | Tự động tải danh sách các từ có `lapses >= 3`, hiển thị số lần đã quên và hệ số dễ hiện tại trên thẻ, kết hợp gõ từ + chấm SRS; khi kết thúc phiên học, hiển thị bảng tổng kết (% chính xác, thời gian học, số từ lên cấp). |

---

### EPIC 5 (Slice 5): Personal Notebook, Contextual Lookup, Smart Auto-fill & CSV Import (Sổ Tay Cá Nhân)
*Mục tiêu: Cho phép người học tra nhanh bất kỳ từ nào trong câu ví dụ chỉ với 1 cú click và tự xây dựng bộ thẻ cá nhân có phát âm tự động.*

| Mã Task | Tên Sub-task (Bắt đầu bằng động từ kỹ thuật) | Ước lượng | Định nghĩa hoàn thành (Definition of Done - DoD) |
| :---: | :--- | :---: | :--- |
| **5.1** | **Tạo API `GET /api/v1/dictionary/lookup` hỗ trợ tra từ điển nền và tự động sinh Pinyin/Âm Hán Việt trong `notebookController.js`** | `3.5h` | Tra cứu trong bảng `dictionary_entries` và `vocabularies`; nếu từ tiếng Trung chưa có trong từ điển, dùng thư viện `pinyin-pro` tự động sinh Pinyin có dấu, Pinyin số và trả về kết quả trong `< 20ms`. |
| **5.2** | **Tạo chuỗi API quản lý Sổ tay (`GET/POST /notebooks`, `POST /notebooks/:id/cards`, `POST /notebooks/:id/import-csv`)** | `5h` | Tạo thư mục sổ tay cá nhân (`decks` với `is_system = 0, creator_id = req.user.id`); khi thêm từ mới hoặc upload file CSV (qua `multer` + `csv-parser`), tự động kiểm tra/thêm vào `vocabularies`, chia Unit 20 từ và gọi `tts.js` sinh file âm thanh `.mp3`. |
| **5.3** | **Dựng component `ContextualLookupPopup.jsx` tích hợp `Intl.Segmenter` để click tra từ trực tiếp trong câu ví dụ** | `4.5h` | Câu ví dụ tiếng Anh và tiếng Trung trên mặt sau thẻ được tách thành các từ có thể click (dùng `Intl.Segmenter('zh-CN', { granularity: 'word' })` cho tiếng Trung); click vào từ bất kỳ mở Popup hiển thị Phiên âm, Âm Hán Việt, Nghĩa và nút **"+ Lưu vào Sổ tay"** chỉ với 1 chạm. |
| **5.4** | **Dựng trang `NotebookPage.jsx` và form `AutoFillCardForm.jsx` (Smart Auto-fill + Nhập CSV + Học Sổ tay)** | `4.5h` | Khi người dùng gõ từ vựng vào ô input (debounce 300ms), tự động gọi API `/dictionary/lookup` để điền sẵn Phiên âm IPA/Pinyin, Âm Hán Việt, Từ loại và Nghĩa gợi ý; hỗ trợ tải file CSV lên và bấm vào học bất kỳ Sổ tay nào bằng đủ 5 chế độ học. |

---

### EPIC 6 (Slice 6): Personal Learning Analytics & Dockerization (Thống Kê Tiến Độ & Đóng Gói Docker)
*Mục tiêu: Thay thế hoàn toàn bảng xếp hạng ảo bằng biểu đồ tiến bộ thực chất của cá nhân và đóng gói trọn bộ hệ thống chạy chỉ với 1 lệnh `docker compose up`.*

| Mã Task | Tên Sub-task (Bắt đầu bằng động từ kỹ thuật) | Ước lượng | Định nghĩa hoàn thành (Definition of Done - DoD) |
| :---: | :--- | :---: | :--- |
| **6.1** | **Tạo API `GET /api/v1/users/me/analytics` tổng hợp KPI, chuỗi ngày học (Streak) và dữ liệu Heatmap 365 ngày** | `4h` | Truy vấn bảng `user_vocab_progress` và `user_study_logs` để trả về: 4 chỉ số KPI (Tổng từ đã học, Từ đã thuộc dài hạn `MASTERED`, Từ cần ôn hôm nay, Tỷ lệ trả lời đúng %), thống kê tăng trưởng 14 ngày gần nhất và mảng 365 ngày `{ date, count, level }` cho Heatmap. |
| **6.2** | **Dựng trang `AnalyticsPage.jsx` với 4 thẻ KPI, Biểu đồ tăng trưởng (`Recharts`) và Biểu đồ nhiệt 365 ngày (`react-activity-calendar`)** | `4.5h` | Hiển thị trực quan phân bố từ vựng theo trạng thái, biểu đồ cột số từ học/ôn tập mỗi ngày bằng `Recharts`, và lịch sử chuyên cần 365 ngày kiểu GitHub bằng `react-activity-calendar` (lọc được theo ngôn ngữ `EN` / `ZH`). |
| **6.3** | **Viết `backend/Dockerfile`, `frontend-web/Dockerfile` (Nginx Reverse Proxy) và `docker-compose.yml` hoàn chỉnh** | `4h` | Cấu hình 3 containers (`mysql-db`, `api-backend`, `web-client`); tự động nạp `schema.sql`, mount persistent volume cho MySQL data và thư mục âm thanh `backend/uploads/audio`; Nginx proxy `/api` và `/audio` sang `api-backend:5000`; chạy `docker compose up --build` lên toàn bộ hệ thống. |

---

## PHẦN 3: BẢNG KANBAN THỰC CHIẾN (4 CỘT — ÁP DỤNG WIP LIMIT = 1)

> **Quy tắc vận hành bảng Kanban hàng ngày:**
> - **Cột `In Progress` chỉ chứa duy nhất 1 thẻ.** Hiện tại thẻ đang active là **`[0.4] Viết script seed-decks.js`**.
> - Các thẻ ở cột **`To-do`** đã được sắp xếp theo đúng thứ tự phụ thuộc kỹ thuật từ trên xuống dưới: cứ làm xong thẻ trên cùng của `To-do` thì kéo thẻ kế tiếp sang `In Progress`.

| 📋 TO-DO (Xếp theo thứ tự ưu tiên từ trên xuống) | 🔄 IN PROGRESS (Max 1 Task) | 🧪 TESTING / VERIFICATION (Tiêu chuẩn kiểm tra) | ✅ DONE (Đã chạy thực tế) |
| :--- | :--- | :--- | :--- |
| **1. `[1.1]`** Viết JWT middleware `auth.js` & `routes/index.js` *(2.5h)*<br>**2. `[1.2]`** Tạo API Auth (`register`, `login`, `google`, `preferences`) *(4h)*<br>**3. `[1.3]`** Cấu hình Vite, Tailwind, `axiosClient` & `useStudyStore` *(3h)*<br>**4. `[1.4]`** Dựng `LoginPage.jsx` & Header `LanguageSwitcher` (`EN`/`ZH`) *(4h)*<br>--- *🎯 Chốt Milestone 1* ---<br>**5. `[2.1]`** Tạo API `GET /decks` & đếm hàng đợi `due_today` *(3.5h)*<br>**6. `[2.2]`** Dựng `DashboardPage.jsx`, `#tags` filter & Due SRS Banner *(4.5h)*<br>**7. `[3.1]`** Tạo API `/decks/:slug/overview` (4 màu) & `/units/:unitId/cards` *(4h)*<br>**8. `[3.2]`** Tạo API `PATCH /study/cards/:vocabId/mark-known` *(2.5h)*<br>**9. `[3.3]`** Dựng `DeckDetailPage.jsx` (Thanh 4 màu, Units 20 từ, Mark Known) *(5h)*<br>**10. `[4.1]`** Tạo API `GET /study/cards` cho 6 chế độ học *(4h)*<br>**11. `[4.2]`** Tạo API `POST /study/submit-progress` (Transaction SRS + Logs) *(4h)*<br>**12. `[4.3]`** Dựng `AudioButton.jsx` (Web Speech API) & `HanziStrokeWriter.jsx` *(4.5h)*<br>**13. `[4.4]`** Dựng `Flashcard3D.jsx` (2 mặt chuyên biệt `EN` / `ZH`) *(4.5h)*<br>**14. `[4.5]`** Dựng `StudySessionPage.jsx` & Mode 1 `PureFlashcard.jsx` *(4h)*<br>--- *🎯 Chốt Milestone 2* ---<br>**15. `[4.6]`** Dựng Mode 2 `Quiz4Options.jsx` (3 dạng trắc nghiệm) *(4h)*<br>**16. `[4.7]`** Dựng Mode 3 `WordBankTyping.jsx` (Word Mask EN + Word Bank ZH) *(5h)*<br>**17. `[4.8]`** Dựng Mode 4 `GuidedCombo.jsx` (Xoay vòng 4 bước) *(5h)*<br>**18. `[4.9]`** Dựng Mode 5 `WeakWordsMode.jsx` (`lapses >= 3`) & Tổng kết *(3.5h)*<br>--- *🎯 Chốt Milestone 3* ---<br>**19. `[5.1]`** Tạo API `GET /dictionary/lookup` (Offline Dict + `pinyin-pro`) *(3.5h)*<br>**20. `[5.2]`** Tạo API CRUD Sổ tay, Thêm thẻ & Import CSV *(5h)*<br>**21. `[5.3]`** Dựng `ContextualLookupPopup.jsx` (`Intl.Segmenter` 1-click) *(4.5h)*<br>**22. `[5.4]`** Dựng `NotebookPage.jsx` & `AutoFillCardForm.jsx` *(4.5h)*<br>**23. `[6.1]`** Tạo API `GET /users/me/analytics` (KPIs + Heatmap 365d) *(4h)*<br>**24. `[6.2]`** Dựng `AnalyticsPage.jsx` (`Recharts` + `ActivityCalendar`) *(4.5h)*<br>**25. `[6.3]`** Đóng gói `Dockerfile` & `docker-compose.yml` (3 containers) *(4h)*<br>--- *🎯 Chốt Milestone 4* ---<br>⏸️ **HOÃN LẠI (Backlog):** `[0.5]` `tts.js` & `generate-audio.py` (File `.mp3` Edge-TTS) | **🔥 `[0.4]` Viết script `backend/scripts/seed-decks.js` nạp từ vựng mẫu (Anh/Trung), từ điển nền và tự động chia Unit 20 từ** *(5h)*<br><br>*Mục tiêu hiện tại:* Nạp dữ liệu mẫu chuẩn `utf8mb4` vào `vocabularies`, `decks`, `deck_units`, `deck_cards`, `dictionary_entries` để có dữ liệu thật phục vụ toàn bộ các API phía sau. | *(Trống — Khi `[0.4]` code xong sẽ chuyển sang cột này để chạy lệnh `npm run seed` và kiểm tra dữ liệu trong MySQL trước khi sang Done)*<br><br>**Checklist cổng kiểm thử chung:**<br>- [ ] Test API bằng `Invoke-RestMethod` / `curl`<br>- [ ] Kiểm tra dữ liệu MySQL (`utf8mb4`, không lỗi dấu tiếng Việt / chữ Hán)<br>- [ ] Kiểm tra phím tắt (`Space`, `1-4`, `R`) & Responsive Mobile/Desktop | - ✅ **`[0.1]`** Khởi tạo MySQL Schema (8 bảng `utf8mb4`), cấu hình `db.js`, `.env`, cài đặt `npm install` và chạy `server.js` (`/api/v1/health` OK).<br>- ✅ **`[0.2]`** Viết `shared/constants.js` và thuật toán SM-2 `shared/srsEngine.js` (`calculateSRS`, `getButtonPreviewIntervals`).<br>- ✅ **`[0.3]`** Viết `shared/answerValidator.js` (`generateWordMask`, `validateEnglishSpelling`, `validateChineseAnswer`, `validateWordBankSelection`). |

---

## PHẦN 4: 4 CỘT MỐC ĐO LƯỜNG NGHIỆM THU (PROJECT MILESTONES)

### 🏁 Milestone 1: Core Foundation, Seeded Data & Auth Flow (Hoàn thành Epic 0 & Epic 1)
- **Thời lượng dự kiến:** ~24.5 giờ (Đã hoàn thành 9 giờ ở các task `0.1`, `0.2`, `0.3`).
- **Tiêu chí nghiệm thu thực tế (Acceptance Criteria):**
  1. Trong MySQL `flashcard_srs_db` có sẵn dữ liệu từ vựng Tiếng Anh & Tiếng Trung được chia tự động thành các Unit (20 từ/Unit), có sẵn dữ liệu từ điển nền và file âm thanh `.mp3` phát được qua trình duyệt.
  2. Người dùng đăng ký / đăng nhập thành công trên Web, nhận JWT token và chuyển đổi qua lại nút **Tiếng Anh (`EN`) $\leftrightarrow$ Tiếng Trung (`ZH`)** trên thanh điều hướng.

### 🏁 Milestone 2: Core Learning Loop Chạy Sống (Hoàn thành Epic 2, Epic 3 & Mode 1 của Epic 4)
- **Thời lượng dự kiến:** ~41 giờ.
- **Tiêu chí nghiệm thu thực tế (Acceptance Criteria):**
  1. Từ `DashboardPage`, người dùng lọc được bộ thẻ theo `#tags`, bấm vào một bộ thẻ xem được **Thanh tiến độ 4 màu** (`Unseen`, `Learning`, `Due SRS`, `Mastered`) và danh sách các Unit 20 từ.
  2. Bấm nút **"Đã biết"** ở một từ bất kỳ làm tăng ngay số lượng `Mastered` trên thanh tiến độ.
  3. Bấm vào học **Chế độ 1 (`PureFlashcard`)**: lật thẻ 3D bằng phím `Space`, nghe phát âm tự động, xem hoạt ảnh & tập tô nét chữ Hán bằng `hanzi-writer`, bấm phím `1–4` chấm điểm SRS, dữ liệu lưu thật vào bảng `user_vocab_progress` & `user_study_logs`, quay ra trang chi tiết bộ thẻ thấy thanh tiến độ 4 màu cập nhật tức thì.

### 🏁 Milestone 3: Full 5 Modular Study Modes (Hoàn thành toàn bộ Epic 4)
- **Thời lượng dự kiến:** ~17.5 giờ.
- **Tiêu chí nghiệm thu thực tế (Acceptance Criteria):**
  1. Người học chủ động chọn và hoàn thành trọn vẹn cả 5 chế độ học:
     - **Chế độ 1 (`PureFlashcard`):** Lật thẻ & tự đánh giá 4 nút SRS.
     - **Chế độ 2 (`Quiz4Options`):** Trắc nghiệm 4 đáp án phản xạ nhanh.
     - **Chế độ 3 (`WordBankTyping`):** Tiếng Anh gõ chính tả theo khung gợi ý (`r _ s _ l _ e _ t`); Tiếng Trung bấm ghép mảnh chữ Hán (`Word Bank`) hoặc gõ Pinyin/Chữ Hán.
     - **Chế độ 4 (`GuidedCombo`):** Học xoay vòng cụm 3–5 từ qua đủ 4 bước.
     - **Chế độ 5 (`WeakWordsMode`):** Lọc đúng các từ có `lapses >= 3` để luyện tập riêng cho đến khi thuộc vững.

### 🏁 Milestone 4: Personal Notebook, Analytics & Dockerized Production (Hoàn thành Epic 5 & Epic 6)
- **Thời lượng dự kiến:** ~30 giờ.
- **Tiêu chí nghiệm thu thực tế (Acceptance Criteria):**
  1. Trong lúc học thẻ, click vào bất kỳ từ tiếng Anh hoặc từ ghép tiếng Trung nào trong câu ví dụ đều bật lên `ContextualLookupPopup` hiển thị nghĩa + Âm Hán Việt và lưu được vào Sổ tay cá nhân chỉ với 1 chạm.
  2. Trong `NotebookPage`, gõ từ mới tự động điền (Auto-fill) phiên âm/nghĩa, tự động gọi Edge-TTS tạo file phát âm `.mp3`, và hỗ trợ import danh sách từ qua file CSV.
  3. Trang `AnalyticsPage` hiển thị chính xác 4 thẻ KPI, biểu đồ cột tăng trưởng từ vựng (`Recharts`) và biểu đồ nhiệt lịch sử học tập 365 ngày (`react-activity-calendar`).
  4. Chạy lệnh `docker compose up --build` khởi động thành công cả 3 containers (`mysql-db`, `api-backend`, `web-client`) hoạt động ổn định như môi trường Production.
