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
public class TranslateRequest {
    @NotBlank(message = "WORD_REQUIRED")
    String text;

    @Builder.Default
    String sourceLang = "ja";

    @Builder.Default
    String targetLang = "vi";
}
