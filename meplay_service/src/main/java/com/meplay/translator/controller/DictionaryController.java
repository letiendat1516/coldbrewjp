package com.meplay.translator.controller;

import com.meplay.translator.dto.request.HandwritingRequest;
import com.meplay.translator.dto.request.SearchRequest;
import com.meplay.translator.dto.request.TokenizeRequest;
import com.meplay.translator.dto.request.TranslateRequest;
import com.meplay.translator.dto.response.ApiResponse;
import com.meplay.translator.dto.response.HandwritingResponse;
import com.meplay.translator.dto.response.MaziiWordResponse;
import com.meplay.translator.dto.response.OcrResponse;
import com.meplay.translator.dto.response.SearchResponse;
import com.meplay.translator.dto.response.TokenizeResponse;
import com.meplay.translator.dto.response.TranslateResponse;
import com.meplay.translator.service.DictionaryService;
import com.meplay.translator.service.HandwritingService;
import com.meplay.translator.service.OcrService;
import com.meplay.translator.service.TokenizerService;
import com.meplay.translator.service.TranslateService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/dictionary")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DictionaryController {

    DictionaryService dictionaryService;
    HandwritingService handwritingService;
    OcrService ocrService;
    TokenizerService tokenizerService;
    TranslateService translateService;

    // ==================== SEARCH ====================

    /**
     * Search Japanese words — mirrors Mazii's /api/news/search endpoint.
     * Tries Mazii API first, falls back to local vocabulary database.
     *
     * POST /dictionary/search
     * Body: { "keyword": "日本", "type": "easy", "limit": 3 }
     */
    @PostMapping("/search")
    public ApiResponse<SearchResponse> search(@Valid @RequestBody SearchRequest request) {
        SearchResponse result = dictionaryService.search(request);
        return ApiResponse.<SearchResponse>builder()
                .code(200)
                .message("Search completed")
                .result(result)
                .build();
    }

    /**
     * Search with native Mazii word format (words + suggestWords).
     * Identical structure to https://mazii.net/api/search/word response.
     *
     * POST /dictionary/search-mazii
     * Body: { "keyword": "日本", "limit": 10 }
     */
    @PostMapping("/search-mazii")
    public MaziiWordResponse searchMazii(@Valid @RequestBody SearchRequest request) {
        return dictionaryService.searchMazii(request);
    }

    // ==================== HANDWRITING ====================

    /**
     * Recognize Japanese handwriting via Google Input Tools.
     * Mirrors Mazii's handwriting input feature.
     *
     * POST /dictionary/handwriting
     * Body: ink stroke data (x, y, timestamps per stroke)
     */
    @PostMapping("/handwriting")
    public ApiResponse<HandwritingResponse> recognizeHandwriting(
            @Valid @RequestBody HandwritingRequest request) {
        HandwritingResponse result = handwritingService.recognize(request);
        return ApiResponse.<HandwritingResponse>builder()
                .code(200)
                .message("Handwriting recognized")
                .result(result)
                .build();
    }

    // ==================== OCR ====================

    /**
     * OCR (extract Japanese text from image) via Mazii's OCR API.
     *
     * POST /dictionary/ocr
     * Form-data: image (MultipartFile)
     */
    @PostMapping(value = "/ocr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<OcrResponse> ocr(@RequestParam("image") MultipartFile image) {
        OcrResponse result = ocrService.recognize(image);
        return ApiResponse.<OcrResponse>builder()
                .code(200)
                .message("OCR completed")
                .result(result)
                .build();
    }

    /**
     * OCR + Translate: extract Japanese text from image, then translate.
     *
     * POST /dictionary/ocr-translate
     * Form-data: image (MultipartFile)
     */
    @PostMapping(value = "/ocr-translate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<OcrTranslateResponse> ocrAndTranslate(
            @RequestParam("image") MultipartFile image) {

        OcrResponse ocrResult = ocrService.recognize(image);
        String extractedText = ocrResult.getText();

        OcrTranslateResponse response = new OcrTranslateResponse();
        response.setOcr(ocrResult);

        if (extractedText != null && !extractedText.isBlank()) {
            TranslateResponse translation = translateService.translate(extractedText, "ja", "vi");
            response.setTranslation(translation);
        }

        return ApiResponse.<OcrTranslateResponse>builder()
                .code(200)
                .message("OCR + translate completed")
                .result(response)
                .build();
    }

    // ==================== TOKENIZE ====================

    /**
     * Tokenize Japanese text into words. Mirrors Mazii's /api/tokenizer endpoint.
     *
     * POST /dictionary/tokenize
     * Body: { "text": "日本に行きたい" }
     */
    @PostMapping("/tokenize")
    public ApiResponse<TokenizeResponse> tokenize(@Valid @RequestBody TokenizeRequest request) {
        TokenizeResponse result = tokenizerService.tokenize(request.getText());
        return ApiResponse.<TokenizeResponse>builder()
                .code(200)
                .message("Tokenization completed")
                .result(result)
                .build();
    }

    // ==================== TRANSLATE ====================

    /**
     * Translate text using Google Translate. Mirrors Mazii's translation feature.
     *
     * POST /dictionary/translate
     * Body: { "text": "日本に行きたい", "sourceLang": "ja", "targetLang": "vi" }
     */
    @PostMapping("/translate")
    public ApiResponse<TranslateResponse> translate(@Valid @RequestBody TranslateRequest request) {
        TranslateResponse result = translateService.translate(
                request.getText(), request.getSourceLang(), request.getTargetLang());
        return ApiResponse.<TranslateResponse>builder()
                .code(200)
                .message("Translation completed")
                .result(result)
                .build();
    }

    // ==================== TTS / SPEAK ====================

    /**
     * Google TTS: speak text aloud. Returns MP3 audio.
     *
     * POST /dictionary/speak
     * Body: { "text": "日本に行きたい", "lang": "ja" }
     */
    @PostMapping("/speak")
    public ResponseEntity<byte[]> speak(@RequestBody SpeakRequest body) {
        String text = body.getText();
        if (text == null || text.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        byte[] audio = translateService.speak(text, body.getLang());
        if (audio == null || audio.length == 0) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("audio/mpeg"))
                .body(audio);
    }

    // ==================== INNER CLASSES ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class SpeakRequest {
        String text;
        String lang = "ja";
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class OcrTranslateResponse {
        OcrResponse ocr;
        TokenizeResponse tokens;
        TranslateResponse translation;
        SearchResponse dictionary;
    }
}
