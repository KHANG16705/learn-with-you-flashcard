# TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM (SRS) & PRD
## Dự án: Nền tảng Học Từ Vựng Đa Ngôn Ngữ (Tiếng Anh & Tiếng Trung) qua Flashcard SRS Cá Nhân Hóa (Web & Mobile App)

---

# PHẦN 1: TỔNG QUAN DỰ ÁN & ĐỊNH HƯỚNG SẢN PHẨM (PRODUCT VISION)

## 1.1. Mục tiêu sản phẩm
Xây dựng nền tảng học từ vựng song hành **Tiếng Anh (English)** và **Tiếng Trung (Mandarin Chinese)** hoạt động mượt mà trên **Web (Giai đoạn 1 - MVP)** và mở rộng sang **Mobile App iOS/Android (Giai đoạn 2)**.

Hệ thống tập trung 100% vào **Trải nghiệm Học Tập Cá Nhân Hóa (Distraction-Free & Self-Paced Learning)**:
- **Mở miễn phí 100% (Full Free Access)** toàn bộ kho từ vựng chuẩn hóa (Oxford 3000/5000 từ A1–C1, TOEIC, IELTS, HSK 1–6).
- **Bắt buộc Đăng nhập (Login-First)** để đồng bộ tức thì tiến độ học tập và lịch ôn tập SRS của từng cá nhân trên MySQL ngay từ phiên đầu tiên.
- **Tự chủ động chọn chế độ học (Modular Study Modes):** Người học tự chọn kỹ năng muốn rèn luyện trong từng thời điểm (Lật thẻ Flashcard, Trắc nghiệm phản xạ, Nghe & Gõ chính tả/Ghép chữ Hán, Học kết hợp, hoặc Ôn tập riêng các từ yếu).
- **Loại bỏ hệ thống Xếp hạng ảo (No Leaderboard/EXP/Diamonds):** Thay thế bằng **Bảng Thống Kê Tiến Độ Cá Nhân (Personal Learning Analytics)** trực quan, giúp người học theo dõi sự tiến bộ thực chất của bản thân.

## 1.2. Mô hình Phễu Chia Nhỏ Nhận Thức (Micro-learning Funnel)
- **Tầng 1 - Trang Khám phá Danh mục (Catalog Level):**
  - Phân tách rõ ràng theo **Trình độ chuẩn CEFR (Tiếng Anh)** và **Chuẩn HSK (Tiếng Trung)**:
    - *Tiếng Anh:* 1000 Common Words, Giao tiếp, Oxford 3000 (A1, A2, B1, B2), Oxford 5000 (B2, C1), TOEIC 600, ETS TOEIC, IELTS Band 4.0–9.0, Idioms.
    - *Tiếng Trung:* HSK 1 đến HSK 6, Từ vựng Boya, Từ vựng giao tiếp văn phòng/thương mại, Thành ngữ 4 chữ (Chengyu - 成语).
  - Hệ thống **Filter Tags** trực quan (`#a1`, `#b1`, `#toeic`, `#ielts`, `#oxford`, `#hsk1`..`#hsk6`) giúp lọc nhanh bộ thẻ.
- **Tầng 2 - Chi tiết Bộ thẻ & Chia nhỏ Chặng học (Deck Detail & Unit Partitioning):**
  - Mỗi bộ thẻ lớn được chia tự động thành các **Unit nhỏ (20 từ / Unit)**.
  - **Thanh tổng quan tiến độ Bộ thẻ (4 trạng thái màu sắc):** Chưa học (`Unseen`) – Đang học (`Learning`) – Cần ôn hôm nay (`Due SRS`) – Đã thuộc dài hạn (`Mastered`).
  - **Danh sách từ vựng trực quan (Word List Preview):** Hiển thị danh sách từ kèm Từ loại, IPA/Pinyin, Âm Hán Việt, nút Loa nghe thử và **Nút đánh dấu "Đã biết" (Mark as Known)**.
- **Tầng 3 - 5 Chế độ Học & Ôn tập Tự chọn (Self-Selected Interactive Modes):**
  - Người dùng chủ động chọn chế độ luyện tập phù hợp với quỹ thời gian và mục tiêu.

---

# PHẦN 2: QUY TRÌNH PHÁT TRIỂN & CÔNG THỨC THUẬT TOÁN SRS (SDLC & SM-2 LOGIC)

## 2.1. Công thức thuật toán SRS (SM-2 Cải tiến trong `shared/srsEngine.js`)
- Mỗi thẻ của user có các tham số: `repetitions` ($n$ - số lần nhớ liên tiếp), `ease_factor` ($EF$ - hệ số dễ, mặc định `2.50`, tối thiểu `1.30`), `interval_days` ($I$ - khoảng cách ngày ôn), và `lapses` (số lần quên).
- Khi người dùng chấm điểm $q \in \{0: \text{Quên}, 1: \text{Khó}, 2: \text{Nhớ}, 3: \text{Rất dễ}\}$:
  1. **Quên ($q = 0$):** Reset $n = 0$, $I = 0$ (ôn lại ngay trong phiên), giảm $EF = \max(1.30, EF - 0.20)$, tăng `lapses = lapses + 1` (nếu `lapses >= 3` thì gắn cờ **Từ yếu / Leech word**), `status = 'LEARNING'`.
  2. **Khó ($q = 1$):** Giữ $n$ hoặc tăng nhẹ $I = \max(1, \text{round}(I \times 1.2))$, giảm $EF = \max(1.30, EF - 0.15)$, `status = 'REVIEW'`.
  3. **Nhớ ($q = 2$):** Nếu $n=0 \Rightarrow I=1$; nếu $n=1 \Rightarrow I=3$; nếu $n \ge 2 \Rightarrow I = \text{round}(I \times EF)$. Tăng $n = n + 1$, giữ nguyên $EF$.
  4. **Rất dễ ($q = 3$):** Nếu $n=0 \Rightarrow I=4$; nếu $n \ge 1 \Rightarrow I = \text{round}(I \times EF \times 1.3)$. Tăng $n = n + 1$, tăng $EF = EF + 0.15$.
  5. **Quy tắc Mastered:** Khi $I > 21$ ngày, tự động chuyển `status = 'MASTERED'`.

## 2.2. Danh sách RESTful API Cốt lõi (`Node.js + Express.js`)
- **Auth & Personal Analytics APIs:**
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/google`
  - `GET /api/v1/users/me/analytics` (Tổng số từ đã thuộc, số từ cần ôn hôm nay, tỷ lệ nhớ chính xác %, biểu đồ nhiệt lịch sử học tập 365 ngày).
- **Catalog & Deck APIs:**
  - `GET /api/v1/decks?lang=EN|ZH&tag=...`
  - `GET /api/v1/decks/:slug/overview` (Thông tin bộ thẻ + Thống kê 4 màu Unseen/Learning/Due/Mastered + Danh sách các Unit 1..N kèm tiến độ).
  - `GET /api/v1/decks/:slug/units/:unitId/cards` (Danh sách từ vựng trong Unit kèm bộ lọc trạng thái).
- **Modular Study & SRS APIs:**
  - `GET /api/v1/study/cards?deckId=...&unitId=...&mode=flashcard|quiz|typing|combo|weak_words|due_review&limit=15`
  - `POST /api/v1/study/submit-progress` (Cập nhật kết quả đánh giá SRS/bài tập, tính `next_review_at` và ghi nhận vào `user_study_logs`).
  - `PATCH /api/v1/study/cards/:vocabId/mark-known` (Đánh dấu "Đã biết" -> chuyển thẳng sang `IGNORED`/`MASTERED`).
- **Personal Notebook & Smart Lookup APIs:**
  - `GET /api/v1/dictionary/lookup?q=...&lang=EN|ZH` (Tra nhanh từ trong câu ví dụ hoặc Auto-fill khi tự thêm từ mới).
  - `GET /api/v1/notebooks` & `POST /api/v1/notebooks`
  - `POST /api/v1/notebooks/:notebookId/cards`
  - `POST /api/v1/notebooks/:notebookId/import-csv`

---

# PHẦN 3: ĐẶC TẢ CHI TIẾT CÁC PHÂN HỆ CHỨC NĂNG

## 3.1. So sánh Thành phần Thẻ Đa Ngôn Ngữ (Anh - Trung)
| Thành phần trên Thẻ | Chế độ Tiếng Anh (`EN`) | Chế độ Tiếng Trung (`ZH`) |
| :--- | :--- | :--- |
| **Mặt trước (Front)** | Từ vựng + Từ loại (`n, v, adj`) + Phiên âm IPA (US/UK) + Audio tự động phát | Chữ Hán (Giản thể, kèm Phồn thể nếu khác) + Từ loại + **Nút Ẩn/Hiện Pinyin** + Audio |
| **Mặt sau (Back)** | Nghĩa tiếng Việt + Câu ví dụ ngữ cảnh thật (in đậm từ khóa) + Audio câu ví dụ + Từ đồng nghĩa / Collocations | Pinyin có dấu + **Âm Hán Việt** + Nghĩa tiếng Việt + **Chiết tự từng chữ Hán** + **Hoạt ảnh Thứ tự nét viết (`hanzi-writer`)** + Câu ví dụ chữ Hán kèm Pinyin & Audio |
| **Tương tác Ngữ cảnh** | Click vào bất kỳ từ nào trong câu ví dụ để mở Popup tra nhanh và lưu vào Sổ tay | Click vào từng chữ Hán/từ ghép trong câu ví dụ (tách bằng `Intl.Segmenter`) để xem Âm Hán Việt, nghĩa riêng và lưu vào Sổ tay |

## 3.2. Năm Chế Độ Học & Ôn Tập Tự Chọn (Modular Study Modes)
1. **Chế độ 1 - Học & Duyệt nhanh bằng Flashcard SRS (`PureFlashcard.jsx`):**
   - Xem Mặt trước -> Bấm `Space` để lật Mặt sau -> Tự đánh giá qua 4 nút SRS (`Quên`, `Khó`, `Nhớ`, `Rất dễ`).
2. **Chế độ 2 - Luyện Phản Xạ Trắc Nghiệm 4 Đáp Án (`Quiz4Options.jsx`):**
   - Hỗ trợ 3 dạng: Nhìn từ đoán nghĩa, Nghe âm đoán chữ, Điền từ vào câu ví dụ khuyết `[___]`. Sử dụng mảng `distractors` lưu sẵn trong JSON.
3. **Chế độ 3 - Luyện Nhớ Chủ Động: Nghe, Ghép Chữ & Gõ Từ (`WordBankTyping.jsx`):**
   - **Tiếng Anh:** Phát Audio + Hiện nghĩa Việt + Gợi ý khung ký tự (`r _ s _ l _ e _ t`) -> Gõ chính tả.
   - **Tiếng Trung:**
     - *Tùy chọn A (Word Bank - Mặc định):* Bấm chọn 6–8 mảnh chữ Hán rời rạc (`word_bank_tokens`) theo đúng thứ tự mà không cần đổi bộ gõ.
     - *Tùy chọn B (Typing):* Chấp nhận gõ chữ Hán (`坚持`) hoặc Pinyin có số/không dấu (`jian1chi2` / `jianchi`).
4. **Chế độ 4 - Học Kết Hợp Tiêu Chuẩn (`GuidedCombo.jsx`):**
   - Chia 10–15 từ mới thành cụm 3–5 từ, xoay vòng: *Bước 1: Lật thẻ -> Bước 2: Trắc nghiệm -> Bước 3: Ghép chữ/Gõ từ -> Bước 4: Chấm điểm SRS*.
5. **Chế độ 5 - Tập Trung Xử Lý Từ Yếu (`WeakWordsMode.jsx`):**
   - Tự động lọc các từ có `lapses >= 3` để luyện riêng cho đến khi thuộc vững.

---

# PHẦN 4: CẤU TRÚC THƯ MỤC DỰ ÁN CHUẨN

```text
flashcard-srs-project/
├── .github/
│   └── copilot-instructions.md  # Quy tắc hệ thống dành riêng cho AI Coding Assistant
├── shared/                      # Logic dùng chung cho Web React, Backend & Mobile App
│   ├── srsEngine.js             # Công thức toán học SM-2 tính interval, ease_factor, lapses
│   ├── answerValidator.js       # Hàm chấm điểm gõ chính tả tiếng Anh & Pinyin/Chữ Hán
│   └── constants.js             # Hằng số trạng thái thẻ (UNSEEN, LEARNING, REVIEW, MASTERED)
│
├── backend/                     # Node.js + Express.js RESTful API
│   ├── src/
│   │   ├── config/db.js         # Cấu hình mysql2/promise Connection Pool (utf8mb4)
│   │   ├── middlewares/auth.js  # Kiểm tra JWT Token
│   │   ├── controllers/         # Xử lý logic: auth, deck, study, notebook, analytics
│   │   ├── routes/              # Định tuyến API (/api/v1/...)
│   │   ├── services/tts.js      # Gọi Edge-TTS tạo audio tự động khi thêm từ vào Sổ tay
│   │   └── server.js            # Điểm khởi chạy Express Server (Port 5000)
│   ├── scripts/                 # Data Pipeline chạy ở Giai đoạn 1
│   │   ├── schema.sql           # File khởi tạo 8 bảng MySQL 8.0+
│   │   ├── seed-decks.js        # Script đọc CSV/JSON -> Chia Unit 20 từ -> Nạp vào MySQL
│   │   └── generate-audio.py    # Script chạy batch Edge-TTS tạo hàng loạt file .mp3
│   ├── uploads/audio/           # Thư mục lưu file âm thanh .mp3 (Mount vào Docker Volume)
│   ├── package.json
│   └── Dockerfile
│
├── frontend-web/                # React.js (Vite) Single Page Application
│   ├── src/
│   │   ├── api/axiosClient.js   # Cấu hình Axios kết nối tới http://localhost:5000/api/v1
│   │   ├── components/
│   │   │   ├── flashcard/       # Flashcard3D, HanziStrokeWriter, AudioButton
│   │   │   ├── modes/           # PureFlashcard, Quiz4Options, WordBankTyping, GuidedCombo, WeakWordsMode
│   │   │   └── notebook/        # ContextualLookupPopup, AutoFillCardForm
│   │   ├── pages/               # LoginPage, DashboardPage, DeckDetailPage, StudySessionPage, NotebookPage, AnalyticsPage
│   │   ├── store/useStudyStore.js # Zustand quản lý phiên học & chế độ học
│   │   └── App.jsx
│   ├── package.json
│   └── Dockerfile
│
├── docker-compose.yml           # Đóng gói trọn bộ mysql + backend + frontend-web
└── README.md                    # Tài liệu đặc tả SRS & PRD toàn diện
```
