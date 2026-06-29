package com.meplay.translator.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class HandwritingRequest {
    String apiLevel;
    String appVersion;
    String device;
    int inputType;
    String options;

    List<StrokeRequest> requests;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    @Builder
    public static class StrokeRequest {
        int maxCompletions;
        int maxNumResults;
        String preContext;

        WritingGuide writingGuide;

        /** Array of strokes. Each stroke = [xCoords[], yCoords[], timestamps[]] */
        List<List<List<Double>>> ink;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @FieldDefaults(level = AccessLevel.PRIVATE)
        @Builder
        public static class WritingGuide {
            int writingAreaHeight;
            int writingAreaWidth;
        }
    }
}
