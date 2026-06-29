package com.meplay.translator.repository;

import com.meplay.translator.entity.Vocabulary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VocabularyRepository extends JpaRepository<Vocabulary, Long> {

    long countByLevel(com.meplay.translator.enums.Level level);

    Optional<Vocabulary> findByWordAndMeaning(String word, String meaning);

    /** Find vocabularies whose word, reading, or meaning contains the keyword. */
    @Query("SELECT v FROM Vocabulary v WHERE "
            + "LOWER(v.word) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + "OR LOWER(v.reading) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + "OR LOWER(v.meaning) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + "OR LOWER(v.onyomi) LIKE LOWER(CONCAT('%', :keyword, '%')) "
            + "OR LOWER(v.kunyomi) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Vocabulary> searchByKeyword(@Param("keyword") String keyword);
}
