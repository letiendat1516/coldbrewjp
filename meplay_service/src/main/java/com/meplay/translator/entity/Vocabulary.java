package com.meplay.translator.entity;

import com.meplay.translator.enums.Level;
import com.meplay.translator.enums.VocabularyStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(
        name = "vocabulary",
        indexes = {
                @Index(name = "idx_vocab_level", columnList = "level"),
                @Index(name = "idx_vocab_word", columnList = "word"),
                @Index(name = "idx_vocab_is_kanji", columnList = "is_kanji")
        }
)
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Builder
public class Vocabulary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vocab_id", nullable = false)
    Long vocabId;

    @Size(max = 100)
    @NotNull
    @Column(name = "word", nullable = false, length = 100)
    String word;

    @Size(max = 100)
    @NotNull
    @Column(name = "reading", nullable = false, length = 100)
    String reading;

    @NotNull
    @Column(name = "meaning", nullable = false, columnDefinition = "TEXT")
    String meaning;

    @Size(max = 50)
    @Column(name = "part_of_speech", length = 50)
    String partOfSpeech;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "level", nullable = false)
    Level level;

    @Size(max = 500)
    @Column(name = "audio_url", length = 500)
    String audioUrl;

    @Column(name = "example_sentence", columnDefinition = "TEXT")
    String exampleSentence;

    @Column(name = "example_meaning", columnDefinition = "TEXT")
    String exampleMeaning;

    @Size(max = 100)
    @Column(name = "onyomi", length = 100)
    String onyomi;

    @Size(max = 100)
    @Column(name = "kunyomi", length = 100)
    String kunyomi;

    @Size(max = 500)
    @Column(name = "stroke_order_url", length = 500)
    String strokeOrderUrl;

    @Builder.Default
    @ColumnDefault("false")
    @Column(name = "is_kanji")
    Boolean isKanji = false;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    VocabularyStatus status = VocabularyStatus.ACTIVE;

    @ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "created_at")
    Instant createdAt;
}
