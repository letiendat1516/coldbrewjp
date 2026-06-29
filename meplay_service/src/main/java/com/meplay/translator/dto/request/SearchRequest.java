package com.meplay.translator.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class SearchRequest {
    @NotBlank(message = "WORD_REQUIRED")
    String keyword;

    @Builder.Default
    String type = "easy";

    @Builder.Default
    int limit = 10;

    int page;
}
