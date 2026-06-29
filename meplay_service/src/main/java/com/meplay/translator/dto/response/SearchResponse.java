package com.meplay.translator.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SearchResponse {
    int total;
    List<ArticleResult> data;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Builder
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ArticleResult {
        String id;
        String title;
        String bodySnippet;
        String image;
        String audio;
        String source;
        String type;
        Map<String, List<String>> levelWords;
    }
}
