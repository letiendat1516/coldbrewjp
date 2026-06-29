package com.meplay.translator.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meplay.translator.dto.response.OcrResponse;
import com.meplay.translator.dto.response.OcrResponse.OcrBlock;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class OcrService {

    ObjectMapper objectMapper;

    private static final String MAZII_OCR_URL = "https://ocr.mazii.net/ocr/overlay";
    private static final String MAZII_OCR_TOKEN = "a1dff8abeb4b03cc4ff96378ef8e01eb";

    private final RestClient restClient = RestClient.builder()
            .defaultHeader(HttpHeaders.USER_AGENT,
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36")
            .defaultHeader(HttpHeaders.ORIGIN, "https://mazii.net")
            .defaultHeader(HttpHeaders.REFERER, "https://mazii.net/")
            .build();

    /**
     * OCR an image via Mazii OCR API (best for Japanese text).
     */
    public OcrResponse recognize(MultipartFile imageFile) {
        try {
            byte[] bytes = imageFile.getBytes();
            return callMaziiOcr(bytes, imageFile.getOriginalFilename());
        } catch (IOException e) {
            log.error("Failed to read uploaded image: {}", e.getMessage());
            return OcrResponse.builder()
                    .status("ERROR")
                    .text("Read error: " + e.getMessage())
                    .blocks(Collections.emptyList())
                    .build();
        }
    }

    private OcrResponse callMaziiOcr(byte[] imageBytes, String filename) {
        ByteArrayResource fileResource = new ByteArrayResource(imageBytes) {
            @Override
            public String getFilename() {
                return filename != null ? filename : "image.png";
            }
        };

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("image", fileResource);

        String response = restClient.post()
                .uri(MAZII_OCR_URL)
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .header(HttpHeaders.AUTHORIZATION, MAZII_OCR_TOKEN)
                .body(body)
                .retrieve()
                .body(String.class);

        log.info("Mazii OCR response (first 500): {}",
                response != null ? response.substring(0, Math.min(500, response.length())) : "null");
        return parseMaziiOcrResponse(response);
    }

    /**
     * Parse Mazii OCR response.
     * {
     *   "success": true,
     *   "text_blocks": [
     *     { "text": "日本語", "x": 10, "y": 20, "width": 100, "height": 30 },
     *     ...
     *   ]
     * }
     */
    private OcrResponse parseMaziiOcrResponse(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);

            boolean success = root.path("success").asBoolean(false);
            String status = success ? "ok" : "error";

            if (!success) {
                String errMsg = root.path("message").asText("OCR failed");
                return OcrResponse.builder().status("ERROR").text(errMsg).blocks(Collections.emptyList()).build();
            }

            JsonNode blocksNode = root.path("text_blocks");
            List<OcrBlock> blocks = new ArrayList<>();
            StringBuilder fullText = new StringBuilder();

            if (blocksNode.isArray()) {
                for (JsonNode block : blocksNode) {
                    String text = block.path("text").asText("");
                    if (!text.isEmpty()) {
                        fullText.append(text);

                        int x = 0, y = 0, w = 0, h = 0;
                        JsonNode bboxNode = block.path("bbox");
                        if (bboxNode.isArray() && bboxNode.size() >= 4) {
                            JsonNode p0 = bboxNode.get(0);
                            JsonNode p2 = bboxNode.get(2);
                            if (p0.isArray() && p0.size() >= 2 && p2.isArray() && p2.size() >= 2) {
                                x = (int) p0.get(0).asDouble();
                                y = (int) p0.get(1).asDouble();
                                w = (int) (p2.get(0).asDouble() - x);
                                h = (int) (p2.get(1).asDouble() - y);
                            }
                        } else {
                            x = block.path("x").asInt(0);
                            y = block.path("y").asInt(0);
                            w = block.path("width").asInt(0);
                            h = block.path("height").asInt(0);
                        }

                        blocks.add(OcrBlock.builder()
                                .text(text)
                                .x(x).y(y).width(w).height(h)
                                .build());
                    }
                }
            }

            return OcrResponse.builder()
                    .status(status)
                    .text(fullText.toString())
                    .blocks(blocks)
                    .build();
        } catch (Exception e) {
            log.error("Failed to parse Mazii OCR response", e);
            return OcrResponse.builder()
                    .status("ERROR")
                    .text("Parse error: " + e.getMessage())
                    .blocks(Collections.emptyList())
                    .build();
        }
    }
}
