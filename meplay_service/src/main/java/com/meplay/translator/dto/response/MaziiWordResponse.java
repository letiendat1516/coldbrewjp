package com.meplay.translator.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

/**
 * Mirrors Mazii's /api/search/word response format exactly.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MaziiWordResponse {
    int status;
    MaziiWordData data;
    String message;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MaziiWordData {
        List<MaziiWordItem> words;
        List<MaziiSuggestItem> suggestWords;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MaziiWordItem {
        String word;
        String phonetic;
        String short_mean;
        List<String> level;
        List<MaziiWordMean> means;
        List<MaziiSynset> synsets;
        String audio;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MaziiWordMean {
        String mean;
        String kind;
        String field;
        List<MaziiWordExample> examples;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MaziiWordExample {
        String content;
        String transcription;
        String mean;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MaziiSynset {
        List<MaziiSynsetEntry> entry;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @FieldDefaults(level = AccessLevel.PRIVATE)
        @Builder
        @JsonInclude(JsonInclude.Include.NON_NULL)
        public static class MaziiSynsetEntry {
            List<String> synonym;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class MaziiSuggestItem {
        String word;
        String phonetic;
        String short_mean;
    }
}
