package com.meplay.translator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meplay.translator.dto.response.TranslateResponse;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TranslateService {

    ObjectMapper objectMapper;

    private static final String GOOGLE_TRANSLATE_URL =
            "https://translate.googleapis.com/translate_a/single";
    private static final String GOOGLE_TTS_URL =
            "https://translate.google.com/translate_tts";

    private final RestClient restClient = RestClient.builder()
            .defaultHeader(HttpHeaders.USER_AGENT,
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36")
            .defaultHeader(HttpHeaders.ACCEPT, "application/json, text/plain, */*")
            .defaultHeader(HttpHeaders.ACCEPT_LANGUAGE, "vi,en-US;q=0.9,en;q=0.8")
            .defaultHeader(HttpHeaders.ORIGIN, "https://mazii.net")
            .defaultHeader(HttpHeaders.REFERER, "https://mazii.net/")
            .build();

    /**
     * Translate text using Google Translate API.
     *
     * @param text       the text to translate
     * @param sourceLang source language code (ja, en, vi, ...)
     * @param targetLang target language code (vi, en, ja, ...)
     * @return translated text
     */
    public TranslateResponse translate(String text, String sourceLang, String targetLang) {
        try {
            return callGoogleTranslate(text, sourceLang, targetLang);
        } catch (Exception e) {
            log.error("Google Translate call failed: {}", e.getMessage());
            return TranslateResponse.builder()
                    .sourceText(text)
                    .translatedText("")
                    .sourceLang(sourceLang)
                    .targetLang(targetLang)
                    .build();
        }
    }

    private TranslateResponse callGoogleTranslate(String text, String sourceLang, String targetLang) {
        String uri = UriComponentsBuilder.fromHttpUrl(GOOGLE_TRANSLATE_URL)
                .queryParam("client", "gtx")
                .queryParam("sl", sourceLang)
                .queryParam("tl", targetLang)
                .queryParam("dt", "t")
                .queryParam("q", text)
                .build()
                .toUriString();

        log.debug("Calling Google Translate: {}", uri);

        String response = restClient.get()
                .uri(uri)
                .retrieve()
                .body(String.class);

        log.debug("Google Translate raw response: {}", response);
        return parseTranslateResponse(response, text, sourceLang, targetLang);
    }

    /**
     * Parse Google Translate response.
     * Format: [[["translated text", "original", null, null, 3, ...]], null, "ja", ...]
     */
    private TranslateResponse parseTranslateResponse(String json, String sourceText,
                                                      String sourceLang, String targetLang) {
        try {
            JsonNode root = objectMapper.readTree(json);

            StringBuilder translatedBuilder = new StringBuilder();

            if (root.isArray() && root.size() > 0) {
                JsonNode firstArray = root.get(0);
                if (firstArray.isArray()) {
                    for (JsonNode segment : firstArray) {
                        if (segment.isArray() && segment.size() > 0) {
                            String piece = segment.get(0).asText("");
                            translatedBuilder.append(piece);
                        }
                    }
                }
            }

            String detectedLang = sourceLang;
            if (root.isArray() && root.size() > 2 && !root.get(2).isNull()) {
                detectedLang = root.get(2).asText(sourceLang);
            }

            return TranslateResponse.builder()
                    .translatedText(translatedBuilder.toString())
                    .sourceText(sourceText)
                    .sourceLang(detectedLang)
                    .targetLang(targetLang)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse Google Translate response", e);
            return TranslateResponse.builder()
                    .sourceText(sourceText)
                    .translatedText("")
                    .sourceLang(sourceLang)
                    .targetLang(targetLang)
                    .build();
        }
    }

    /**
     * Fetch Google TTS audio for text (MP3 bytes).
     */
    public byte[] speak(String text, String lang) {
        String uri = UriComponentsBuilder.fromHttpUrl(GOOGLE_TTS_URL)
                .queryParam("ie", "UTF-8")
                .queryParam("tl", lang)
                .queryParam("client", "gtx")
                .queryParam("q", text)
                .build()
                .toUriString();

        return restClient.get()
                .uri(uri)
                .retrieve()
                .body(byte[].class);
    }
}
