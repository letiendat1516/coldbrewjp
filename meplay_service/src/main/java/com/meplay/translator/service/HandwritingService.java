package com.meplay.translator.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meplay.translator.dto.request.HandwritingRequest;
import com.meplay.translator.dto.response.HandwritingResponse;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class HandwritingService {

    ObjectMapper objectMapper;

    private static final String GOOGLE_INPUT_URL =
            "https://inputtools.google.com/request?itc=ja-t-i0-handwrit&app=translate";

    private final RestClient restClient = RestClient.builder()
            .defaultHeader(HttpHeaders.USER_AGENT,
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36")
            .defaultHeader(HttpHeaders.ACCEPT, "*/*")
            .defaultHeader(HttpHeaders.ACCEPT_LANGUAGE, "vi,en-US;q=0.9,en;q=0.8")
            .defaultHeader(HttpHeaders.ORIGIN, "https://mazii.net")
            .defaultHeader(HttpHeaders.REFERER, "https://mazii.net/")
            .build();

    /**
     * Recognize Japanese handwriting via Google Input Tools API.
     *
     * @param request the handwriting stroke data from the client
     * @return list of candidate characters
     */
    public HandwritingResponse recognize(HandwritingRequest request) {
        try {
            return callGoogleInputApi(request);
        } catch (Exception e) {
            log.error("Google Input Tools API call failed: {}", e.getMessage());
            return HandwritingResponse.builder()
                    .status("ERROR")
                    .candidates(Collections.emptyList())
                    .build();
        }
    }

    private HandwritingResponse callGoogleInputApi(HandwritingRequest request) throws JsonProcessingException {
        String requestBody = objectMapper.writeValueAsString(request);

        String response = restClient.post()
                .uri(GOOGLE_INPUT_URL)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String.class);

        return parseGoogleResponse(response);
    }

    /**
     * Parse Google Input Tools response.
     *
     * Response format:
     * ["SUCCESS", [
     *     ["session_id", ["candidate1", "candidate2", ...], [], {"is_html_escaped": false}]
     * ]]
     */
    private HandwritingResponse parseGoogleResponse(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);

            String status = root.isArray() && root.size() > 0
                    ? root.get(0).asText("ERROR")
                    : "ERROR";

            String sessionId = null;
            List<String> candidates = Collections.emptyList();
            boolean isHtmlEscaped = false;

            if (root.isArray() && root.size() > 1) {
                JsonNode results = root.get(1);
                if (results.isArray() && results.size() > 0) {
                    JsonNode firstResult = results.get(0);
                    if (firstResult.isArray()) {
                        if (firstResult.size() > 0 && !firstResult.get(0).isNull()) {
                            sessionId = firstResult.get(0).asText(null);
                        }

                        if (firstResult.size() > 1 && firstResult.get(1).isArray()) {
                            List<String> list = new ArrayList<>();
                            for (JsonNode c : firstResult.get(1)) {
                                list.add(c.asText());
                            }
                            candidates = list;
                        }

                        if (firstResult.size() > 3 && firstResult.get(3).isObject()) {
                            JsonNode meta = firstResult.get(3);
                            isHtmlEscaped = meta.path("is_html_escaped").asBoolean(false);
                        }
                    }
                }
            }

            return HandwritingResponse.builder()
                    .status(status)
                    .sessionId(sessionId)
                    .candidates(candidates)
                    .isHtmlEscaped(isHtmlEscaped)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse Google Input Tools response", e);
            return HandwritingResponse.builder()
                    .status("ERROR")
                    .candidates(Collections.emptyList())
                    .build();
        }
    }
}
