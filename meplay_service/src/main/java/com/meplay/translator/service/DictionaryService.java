package com.meplay.translator.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.meplay.translator.dto.request.SearchRequest;
import com.meplay.translator.dto.response.MaziiWordResponse;
import com.meplay.translator.dto.response.SearchResponse;
import com.meplay.translator.dto.response.SearchResponse.ArticleResult;
import com.meplay.translator.entity.Vocabulary;
import com.meplay.translator.repository.VocabularyRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DictionaryService {

    VocabularyRepository vocabularyRepository;
    ObjectMapper objectMapper;

    private static final String MAZII_TOKEN = "a1dff8abeb4b03cc4ff96378ef8e01eb";
    private static final String JISHO_SEARCH_URL = "https://jisho.org/api/v1/search/words";
    private static final String MAZII_WORD_URL = "https://mazii.net/api/search/word";
    private static final String MAZII_NEWS_SEARCH_URL = "https://mazii.net/api/news/search";

    private final RestClient restClient = RestClient.builder()
            .defaultHeader(HttpHeaders.USER_AGENT,
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36")
            .defaultHeader(HttpHeaders.ACCEPT, "application/json, text/plain, */*")
            .defaultHeader(HttpHeaders.ACCEPT_LANGUAGE, "vi,en-US;q=0.9,en;q=0.8")
            .defaultHeader(HttpHeaders.ACCEPT_CHARSET, "utf-8")
            .defaultHeader(HttpHeaders.REFERER, "https://mazii.net/vi-VN/search/word/javi/")
            .defaultHeader(HttpHeaders.ORIGIN, "https://mazii.net")
            .messageConverters(converters -> {
                converters.add(0, new org.springframework.http.converter.StringHttpMessageConverter(
                        java.nio.charset.StandardCharsets.UTF_8));
            })
            .build();

    /**
     * Search Japanese words with Vietnamese meanings.
     * Priority: Mazii word search → Jisho → Mazii news → local DB.
     */
    public SearchResponse search(SearchRequest request) {
        // 1. Try Mazii word dictionary API (Japanese → Vietnamese)
        try {
            SearchResponse maziiResult = searchViaMaziiWordApi(request);
            if (hasResults(maziiResult)) return maziiResult;
        } catch (Exception e) {
            log.warn("Mazii word API failed: {}", e.getMessage());
        }

        // 2. Try Jisho.org API (Japanese → English)
        try {
            SearchResponse jishoResult = searchViaJisho(request);
            if (hasResults(jishoResult)) return jishoResult;
        } catch (Exception e) {
            log.warn("Jisho API failed: {}", e.getMessage());
        }

        // 3. Try Mazii news/article search
        try {
            SearchResponse newsResult = searchViaMaziiNewsApi(request);
            if (hasResults(newsResult)) return newsResult;
        } catch (Exception e) {
            log.warn("Mazii news API failed: {}", e.getMessage());
        }

        // 4. Fallback to local vocabulary DB
        return searchLocal(request);
    }

    private boolean hasResults(SearchResponse response) {
        return response != null && response.getData() != null && !response.getData().isEmpty();
    }

    /**
     * Proxy to Mazii word API, returns raw Mazii-formatted response.
     */
    public MaziiWordResponse searchMazii(SearchRequest request) {
        String requestBody;
        try {
            Map<String, Object> maziiBody = new HashMap<>();
            maziiBody.put("dict", "javi");
            maziiBody.put("type", "word");
            maziiBody.put("query", request.getKeyword());
            maziiBody.put("limit", request.getLimit());
            maziiBody.put("page", Math.max(request.getPage(), 1));
            requestBody = objectMapper.writeValueAsString(maziiBody);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize Mazii request", e);
            return MaziiWordResponse.builder().status(500).message("Serialization error: " + e.getMessage()).build();
        }

        try {
            String response = restClient.post()
                    .uri(MAZII_WORD_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            return objectMapper.readValue(response, MaziiWordResponse.class);
        } catch (Exception e) {
            log.warn("Mazii word API failed: {}", e.getMessage());
            return MaziiWordResponse.builder()
                    .status(500)
                    .message("API error: " + e.getMessage())
                    .data(MaziiWordResponse.MaziiWordData.builder()
                            .words(Collections.emptyList())
                            .suggestWords(Collections.emptyList())
                            .build())
                    .build();
        }
    }

    // ==================== Jisho ====================

    private SearchResponse searchViaJisho(SearchRequest request) {
        String uri = UriComponentsBuilder.fromHttpUrl(JISHO_SEARCH_URL)
                .queryParam("keyword", request.getKeyword())
                .build().toUriString();

        String response = restClient.get().uri(uri).retrieve().body(String.class);

        log.info("Jisho raw response (first 800): {}",
                response != null ? response.substring(0, Math.min(800, response.length())) : "null");

        return parseJishoResponse(response);
    }

    private SearchResponse parseJishoResponse(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode dataNode = root.path("data");
            List<ArticleResult> articles = new ArrayList<>();

            if (dataNode.isArray()) {
                int limit = Math.min(dataNode.size(), 10);
                for (int i = 0; i < limit; i++) {
                    JsonNode item = dataNode.get(i);

                    JsonNode jpNode = item.path("japanese");
                    String word = "";
                    String reading = "";
                    if (jpNode.isArray() && jpNode.size() > 0) {
                        word = jpNode.get(0).path("word").asText("");
                        reading = jpNode.get(0).path("reading").asText("");
                    }

                    JsonNode senses = item.path("senses");
                    List<String> meanings = new ArrayList<>();
                    List<String> posList = new ArrayList<>();
                    if (senses.isArray()) {
                        for (JsonNode sense : senses) {
                            JsonNode defs = sense.path("english_definitions");
                            if (defs.isArray()) {
                                for (JsonNode d : defs) meanings.add(d.asText());
                            }
                            JsonNode pos = sense.path("parts_of_speech");
                            if (pos.isArray()) {
                                for (JsonNode p : pos) posList.add(p.asText());
                            }
                        }
                    }

                    String jlpt = "";
                    JsonNode jlptNode = item.path("jlpt");
                    if (jlptNode.isArray() && jlptNode.size() > 0) {
                        jlpt = jlptNode.get(0).asText().replace("jlpt-", "").toUpperCase();
                    }

                    String title = word;
                    if (!reading.isEmpty() && !reading.equals(word)) title += "（" + reading + "）";
                    if (!meanings.isEmpty()) title += " — " + String.join(", ", meanings.subList(0, Math.min(3, meanings.size())));

                    Map<String, List<String>> levelWords = null;
                    if (!jlpt.isEmpty()) {
                        levelWords = new HashMap<>();
                        levelWords.put(jlpt, List.of(word));
                    }

                    String bodySnippet = "";
                    if (!meanings.isEmpty()) bodySnippet = String.join("; ", meanings);
                    if (!posList.isEmpty()) bodySnippet += " [" + String.join(", ", posList) + "]";

                    articles.add(ArticleResult.builder()
                            .id(item.path("slug").asText(""))
                            .title(title)
                            .bodySnippet(bodySnippet)
                            .source("jisho.org")
                            .type(!posList.isEmpty() ? posList.get(0) : null)
                            .levelWords(levelWords)
                            .build());
                }
            }

            return SearchResponse.builder().total(articles.size()).data(articles).build();
        } catch (Exception e) {
            log.error("Failed to parse Jisho response", e);
            return SearchResponse.builder().data(Collections.emptyList()).total(0).build();
        }
    }

    // ==================== Mazii Word Dictionary ====================

    private SearchResponse searchViaMaziiWordApi(SearchRequest request) {
        String requestBody;
        try {
            Map<String, Object> maziiBody = new HashMap<>();
            maziiBody.put("dict", "javi");
            maziiBody.put("type", "word");
            maziiBody.put("query", request.getKeyword());
            maziiBody.put("limit", request.getLimit());
            maziiBody.put("page", Math.max(request.getPage(), 1));
            requestBody = objectMapper.writeValueAsString(maziiBody);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize search request", e);
        }

        try {
            log.info("Calling Mazii word API: {}", MAZII_WORD_URL);
            String response = restClient.post()
                    .uri(MAZII_WORD_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.COOKIE, "token-id=" + MAZII_TOKEN)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            log.info("Mazii word response (first 500): {}",
                    response != null ? response.substring(0, Math.min(500, response.length())) : "null");

            return parseMaziiWordResponse(response, request.getLimit());
        } catch (Exception e) {
            log.warn("Mazii word API failed: {}", e.getMessage());
            return SearchResponse.builder().data(Collections.emptyList()).total(0).build();
        }
    }

    private SearchResponse parseMaziiWordResponse(String json, int limit) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode data = root.path("data");
            List<ArticleResult> articles = new ArrayList<>();

            JsonNode wordsNode = data.path("words");
            if (wordsNode.isArray()) {
                int count = 0;
                for (JsonNode w : wordsNode) {
                    if (count >= limit) break;
                    ArticleResult article = parseMaziiWordItem(w);
                    if (article != null) { articles.add(article); count++; }
                }
            }

            JsonNode suggestsNode = data.path("suggestWords");
            if (suggestsNode.isArray() && articles.size() < limit) {
                int remaining = limit - articles.size();
                int count = 0;
                for (JsonNode s : suggestsNode) {
                    if (count >= remaining) break;
                    ArticleResult article = parseMaziiSuggestItem(s);
                    if (article != null) { articles.add(article); count++; }
                }
            }

            return SearchResponse.builder().total(articles.size()).data(articles).build();
        } catch (Exception e) {
            log.error("Failed to parse Mazii word response", e);
            return SearchResponse.builder().data(Collections.emptyList()).total(0).build();
        }
    }

    private ArticleResult parseMaziiWordItem(JsonNode w) {
        if (w == null || w.isMissingNode()) return null;

        String word = w.path("word").asText("");
        if (word.isEmpty()) return null;

        String phonetic = w.path("phonetic").asText("");
        String shortMean = w.path("short_mean").asText("");

        StringBuilder jlptBuilder = new StringBuilder();
        JsonNode levelNode = w.path("level");
        if (levelNode.isArray()) {
            for (JsonNode l : levelNode) {
                if (jlptBuilder.length() > 0) jlptBuilder.append(", ");
                jlptBuilder.append(l.asText());
            }
        }
        String jlpt = jlptBuilder.toString();

        JsonNode meansNode = w.path("means");
        StringBuilder allMeanings = new StringBuilder();
        StringBuilder bodyBuilder = new StringBuilder();
        String partOfSpeech = null;

        if (meansNode.isArray()) {
            for (JsonNode m : meansNode) {
                String mean = m.path("mean").asText("");
                String kind = m.path("kind").asText(null);

                if (allMeanings.length() > 0) allMeanings.append("; ");
                allMeanings.append(mean);

                if (partOfSpeech == null && kind != null && !kind.isEmpty()) {
                    partOfSpeech = kind;
                }

                JsonNode examples = m.path("examples");
                if (examples.isArray()) {
                    for (JsonNode ex : examples) {
                        if (bodyBuilder.length() > 0) bodyBuilder.append("\n");
                        bodyBuilder.append(ex.path("content").asText(""));
                        String exMean = ex.path("mean").asText("");
                        if (!exMean.isEmpty()) bodyBuilder.append(" → ").append(exMean);
                    }
                }
            }
        }

        JsonNode synsetsNode = w.path("synsets");
        if (synsetsNode.isArray()) {
            for (JsonNode syn : synsetsNode) {
                JsonNode entry = syn.path("entry");
                if (entry.isArray()) {
                    for (JsonNode e : entry) {
                        JsonNode synonym = e.path("synonym");
                        if (synonym.isArray()) {
                            for (JsonNode s : synonym) {
                                if (bodyBuilder.length() > 0) bodyBuilder.append(" | ");
                                bodyBuilder.append(s.asText());
                            }
                        }
                    }
                }
            }
        }

        String title = word;
        if (!phonetic.isEmpty() && !phonetic.equals(word)) title += "（" + phonetic + "）";
        String displayMean = !shortMean.isEmpty() ? shortMean : allMeanings.toString();
        if (!displayMean.isEmpty()) title += " — " + displayMean;

        StringBuilder bodySnippet = new StringBuilder();
        if (!shortMean.isEmpty()) bodySnippet.append(shortMean);
        if (!allMeanings.isEmpty() && !allMeanings.toString().equals(shortMean)) {
            if (bodySnippet.length() > 0) bodySnippet.append("\n");
            bodySnippet.append(allMeanings);
        }
        if (bodyBuilder.length() > 0) {
            if (bodySnippet.length() > 0) bodySnippet.append("\n");
            bodySnippet.append(bodyBuilder);
        }

        Map<String, List<String>> levelWords = null;
        if (!jlpt.isEmpty()) {
            levelWords = new HashMap<>();
            levelWords.put(jlpt, List.of(word));
        }

        return ArticleResult.builder()
                .id(word)
                .title(title)
                .bodySnippet(bodySnippet.toString())
                .audio(w.path("audio").asText(null))
                .source("mazii")
                .type(partOfSpeech)
                .levelWords(levelWords)
                .build();
    }

    private ArticleResult parseMaziiSuggestItem(JsonNode s) {
        if (s == null || s.isMissingNode()) return null;

        String word = s.path("word").asText("");
        if (word.isEmpty()) return null;

        String phonetic = s.path("phonetic").asText("");
        String shortMean = s.path("short_mean").asText("");

        String title = word;
        if (!phonetic.isEmpty() && !phonetic.equals(word)) title += "（" + phonetic + "）";
        if (!shortMean.isEmpty()) title += " — " + shortMean;

        return ArticleResult.builder()
                .id(word)
                .title(title)
                .bodySnippet(shortMean)
                .source("mazii")
                .build();
    }

    // ==================== Mazii News ====================

    private SearchResponse searchViaMaziiNewsApi(SearchRequest request) {
        String requestBody;
        try {
            Map<String, Object> maziiBody = new HashMap<>();
            maziiBody.put("keyword", request.getKeyword());
            maziiBody.put("type", request.getType());
            maziiBody.put("limit", request.getLimit());
            requestBody = objectMapper.writeValueAsString(maziiBody);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize search request", e);
        }

        try {
            log.info("Trying Mazii news endpoint: {}", MAZII_NEWS_SEARCH_URL);
            String response = restClient.post()
                    .uri(MAZII_NEWS_SEARCH_URL)
                    .contentType(MediaType.APPLICATION_JSON)
                    .header(HttpHeaders.COOKIE, "token-id=" + MAZII_TOKEN)
                    .body(requestBody)
                    .retrieve()
                    .body(String.class);

            log.info("Mazii news response (first 500): {}",
                    response != null ? response.substring(0, Math.min(500, response.length())) : "null");

            return parseMaziiNewsResponse(response);
        } catch (Exception e) {
            log.warn("Mazii news endpoint failed: {}", e.getMessage());
            return SearchResponse.builder().data(Collections.emptyList()).total(0).build();
        }
    }

    private SearchResponse parseMaziiNewsResponse(String json) {
        try {
            JsonNode root = objectMapper.readTree(json);
            JsonNode resultsNode = root.path("results");

            List<ArticleResult> articles = new ArrayList<>();
            if (resultsNode.isArray()) {
                for (JsonNode item : resultsNode) {
                    JsonNode value = item.path("value");
                    if (value.isMissingNode()) continue;

                    String rawTitle = value.path("title").asText("");
                    String cleanTitle = stripHtml(rawTitle);

                    String rawBody = value.path("body").asText("");
                    String cleanBody = stripHtml(rawBody);
                    String snippet = cleanBody.length() > 300
                            ? cleanBody.substring(0, 300) + "..."
                            : cleanBody;

                    Map<String, List<String>> levelWords = new HashMap<>();
                    JsonNode lwNode = value.path("levelwords");
                    if (lwNode.isObject()) {
                        var fields = lwNode.fields();
                        while (fields.hasNext()) {
                            var entry = fields.next();
                            List<String> words = new ArrayList<>();
                            if (entry.getValue().isArray()) {
                                for (JsonNode w : entry.getValue()) words.add(w.asText());
                            }
                            levelWords.put(entry.getKey(), words);
                        }
                    }

                    ArticleResult article = ArticleResult.builder()
                            .id(item.path("id").asText(null))
                            .title(cleanTitle)
                            .bodySnippet(snippet)
                            .image(value.path("image").asText(null))
                            .audio(value.path("audio").asText(null))
                            .source(value.path("source").asText(null))
                            .type(value.path("type").asText(null))
                            .levelWords(levelWords.isEmpty() ? null : levelWords)
                            .build();
                    articles.add(article);
                }
            }

            return SearchResponse.builder().total(articles.size()).data(articles).build();
        } catch (Exception e) {
            log.error("Failed to parse Mazii news response", e);
            return SearchResponse.builder().data(Collections.emptyList()).total(0).build();
        }
    }

    private String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]+>", "")
                .replaceAll("&nbsp;", " ")
                .replaceAll("&lt;", "<")
                .replaceAll("&gt;", ">")
                .replaceAll("&amp;", "&")
                .trim();
    }

    /**
     * Fallback: search local vocabulary DB.
     */
    @Transactional(readOnly = true)
    public SearchResponse searchLocal(SearchRequest request) {
        String keyword = request.getKeyword().trim();
        List<Vocabulary> vocabList = vocabularyRepository.searchByKeyword(keyword)
                .stream()
                .limit(request.getLimit())
                .toList();

        List<ArticleResult> results = vocabList.stream().map(v -> {
            Map<String, List<String>> levelWords = new HashMap<>();
            String level = v.getLevel() != null ? v.getLevel().name() : "N5";
            levelWords.put(level, List.of(v.getWord()));

            String body = "";
            if (v.getExampleSentence() != null) {
                body = v.getExampleSentence();
                if (v.getExampleMeaning() != null) body += " → " + v.getExampleMeaning();
            }

            return ArticleResult.builder()
                    .id(String.valueOf(v.getVocabId()))
                    .title(v.getWord() + "（" + v.getReading() + "）— " + v.getMeaning())
                    .bodySnippet(body)
                    .source("local")
                    .type(v.getPartOfSpeech())
                    .levelWords(levelWords)
                    .build();
        }).toList();

        return SearchResponse.builder().total(results.size()).data(results).build();
    }
}
