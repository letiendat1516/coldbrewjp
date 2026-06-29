package com.meplay.translator.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meplay.translator.dto.response.TokenizeResponse;
import com.meplay.translator.dto.response.TokenizeResponse.Token;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TokenizerService {

    ObjectMapper objectMapper;

    private static final String MAZII_TOKENIZER_URL = "https://mazii.net/api/tokenizer";

    private final RestClient restClient = RestClient.builder()
            .defaultHeader(HttpHeaders.USER_AGENT,
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36")
            .defaultHeader(HttpHeaders.ACCEPT, "application/json, text/plain, */*")
            .defaultHeader(HttpHeaders.ACCEPT_LANGUAGE, "vi,en-US;q=0.9,en;q=0.8")
            .defaultHeader(HttpHeaders.ORIGIN, "https://mazii.net")
            .defaultHeader(HttpHeaders.REFERER, "https://mazii.net/")
            .build();

    /**
     * Tokenize Japanese text using Mazii's tokenizer API.
     *
     * @param text the Japanese text to segment
     * @return tokenized words with reading and part-of-speech
     */
    public TokenizeResponse tokenize(String text) {
        try {
            return callMaziiTokenizer(text);
        } catch (Exception e) {
            log.error("Mazii tokenizer call failed: {}", e.getMessage());
            return TokenizeResponse.builder()
                    .status("ERROR")
                    .tokens(Collections.emptyList())
                    .build();
        }
    }

    private TokenizeResponse callMaziiTokenizer(String text) throws JsonProcessingException {
        Map<String, String> body = new HashMap<>();
        body.put("text", text);

        String requestBody = objectMapper.writeValueAsString(body);

        String response = restClient.post()
                .uri(MAZII_TOKENIZER_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        return parseTokenizerResponse(response);
    }

    /**
     * Parse Mazii tokenizer response.
     * {
     *   "data": [
     *     { "text": "日本", "reading": "にほん", "pos": "名詞", "lemma": "日本", "meaning": "Nhật Bản" },
     *     ...
     *   ]
     * }
     */
    private TokenizeResponse parseTokenizerResponse(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            List<Token> tokens = new ArrayList<>();

            JsonNode dataNode = root.path("data");
            if (dataNode.isArray()) {
                for (JsonNode item : dataNode) {
                    tokens.add(Token.builder()
                            .text(item.path("text").asText(""))
                            .reading(item.path("reading").asText(null))
                            .pos(item.path("pos").asText(null))
                            .lemma(item.path("lemma").asText(null))
                            .meaning(item.path("meaning").asText(null))
                            .build());
                }
            }

            return TokenizeResponse.builder()
                    .status("ok")
                    .tokens(tokens)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse tokenizer response", e);
            return TokenizeResponse.builder()
                    .status("ERROR")
                    .tokens(Collections.emptyList())
                    .build();
        }
    }
}
