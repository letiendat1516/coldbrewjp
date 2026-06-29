# MePlay Translator Service

Gói API dịch tiếng Nhật độc lập — tách từ dự án FKOTOAI.

## 📦 Cấu trúc

```
meplay_service/
└── src/main/java/com/meplay/translator/
    ├── controller/
    │   └── DictionaryController.java    ← TẤT CẢ API endpoints
    ├── service/
    │   ├── DictionaryService.java        ← Tra từ (Mazii + Jisho + local DB)
    │   ├── TranslateService.java         ← Dịch văn bản + TTS (Google Translate)
    │   ├── HandwritingService.java       ← Nhận diện chữ viết tay (Google Input Tools)
    │   ├── OcrService.java               ← Nhận diện chữ từ ảnh (Mazii OCR)
    │   └── TokenizerService.java         ← Tách từ tiếng Nhật (Mazii Tokenizer)
    ├── dto/
    │   ├── request/                      ← Request DTOs
    │   └── response/                     ← Response DTOs
    ├── entity/
    │   └── Vocabulary.java               ← Entity cho local DB fallback
    ├── repository/
    │   └── VocabularyRepository.java     ← JPA Repository
    ├── enums/
    │   ├── Level.java
    │   └── VocabularyStatus.java
    └── exception/
        ├── AppException.java
        ├── ErrorCode.java
        └── GlobalExceptionHandler.java
```

## 🔌 API Endpoints

Base URL: `http://localhost:8081/dictionary`

### 1. Tra từ điển
```
POST /dictionary/search
Body: { "keyword": "日本", "type": "easy", "limit": 10 }
→ Ưu tiên: Mazii → Jisho → Mazii News → Local DB
```

### 2. Tra từ (format Mazii gốc)
```
POST /dictionary/search-mazii
Body: { "keyword": "日本", "limit": 10 }
→ Trả về format giống hệt https://mazii.net/api/search/word
```

### 3. Dịch văn bản
```
POST /dictionary/translate
Body: { "text": "日本に行きたい", "sourceLang": "ja", "targetLang": "vi" }
→ Gọi Google Translate API (miễn phí)
```

### 4. Nhận diện chữ viết tay
```
POST /dictionary/handwriting
Body: { ink stroke data (x, y, timestamps per stroke) }
→ Gọi Google Input Tools API
```

### 5. OCR - Nhận diện chữ từ ảnh
```
POST /dictionary/ocr
Form-Data: image (MultipartFile)
→ Gọi Mazii OCR API (tối ưu cho tiếng Nhật)
```

### 6. OCR + Dịch
```
POST /dictionary/ocr-translate
Form-Data: image (MultipartFile)
→ OCR trước, rồi dịch text sang tiếng Việt
```

### 7. Tách từ (tokenize)
```
POST /dictionary/tokenize
Body: { "text": "日本に行きたい" }
→ Tách câu tiếng Nhật thành các từ riêng lẻ
```

### 8. Đọc văn bản (TTS)
```
POST /dictionary/speak
Body: { "text": "日本に行きたい", "lang": "ja" }
→ Trả về file MP3 audio
```

## 🚀 Cách tích hợp vào project khác

1. **Copy toàn bộ folder** `meplay_service/src/main/java/com/meplay/translator/` vào project Spring Boot của bạn.

2. **Thêm dependencies** từ file `pom-dependencies.xml` vào `pom.xml` của bạn:
   - `spring-boot-starter-web`
   - `spring-boot-starter-data-jpa`
   - `spring-boot-starter-validation`
   - `lombok`

3. **Cấu hình DB** (nếu dùng local fallback search) trong `application.yaml`:
   ```yaml
   spring:
     datasource:
       url: jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=MYSQL
       username: sa
       password:
       driver-class-name: org.h2.Driver
     jpa:
       hibernate:
         ddl-auto: update
   ```

4. **Chạy project** và test API tại `http://localhost:8081/dictionary/search`

## ⚠️ Lưu ý

- Các service gọi API bên ngoài (Google Translate, Mazii, Jisho) nên hoạt động tốt.
- OCR yêu cầu Mazii token (đã hardcode).
- Local DB search yêu cầu có bảng `vocabulary` và dữ liệu.
- Port mặc định: `8081`, context-path: `/FKOTOAI` (có thể đổi).
