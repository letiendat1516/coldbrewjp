package com.meplay.translator.exception;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public enum ErrorCode {

    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized exception"),
    INVALID_KEY(9998, "Invalid error key"),
    UNAUTHENTICATED(9997, "Unauthenticated"),
    UNAUTHORIZED(9996, "You do not have permission"),
    UNCASE_EXCEPTION(9995, "This exception is undefined"),
    WRONG_KEY_EXCEPTION(9994, "You handler wrong key in exception handler"),

    FULLNAME_REQUIRED(1000, "Fullname is required"),
    FULLNAME_INVALID(1001, "Fullname must be between 5 and 100 characters"),
    USERNAME_REQUIRED(1002, "Username is required"),
    USERNAME_TOO_SHORT(1003, "Username must be at least 3 characters long"),
    USERNAME_EXISTED(1004, "Username already exists"),
    PASSWORD_REQUIRED(1005, "Password is required"),
    PASSWORD_TOO_SHORT(1006, "Password must be at least 6 characters long"),
    EMAIL_REQUIRED(1007, "Email is required"),
    EMAIL_INVALID(1008, "Email is invalid"),
    EMAIL_EXISTED(1009, "Email already exists"),
    LEVEL_REQUIRED(1010, "Japanese level is required"),
    STUDENT_NOT_FOUND(1100, "Student not found"),
    CHAPTER_NOT_FOUND(1011, "Vocabulary chapter not found"),
    CHAPTER_ACCESS_DENIED(1012, "You do not have permission to access this chapter"),
    VOCABULARY_NOT_FOUND(1013, "Vocabulary not found"),
    VOCAB_NOT_IN_CHAPTER(1014, "Vocabulary does not belong to this chapter"),
    VOCAB_ID_REQUIRED(1015, "Vocabulary ID must not be null"),
    CHAPTER_ID_REQUIRED(1016, "Chapter ID must not be null"),
    IS_MASTERED_REQUIRED(1017, "Review result (isMastered) must not be null"),
    CHAPTER_NAME_REQUIRED(1018, "Chapter name must not be blank"),
    CHAPTER_NAME_TOO_LONG(1019, "Chapter name must not exceed 100 characters"),
    ORDER_INDEX_REQUIRED(1020, "Order index must not be null"),
    EMAIL_ARE_REQUIRE(1021, "Email can not be empty"),
    OTP_ARE_REQUIRE(1022, "OTP can not be empty"),
    OTP_INVALID(1023, "OTP must be 6 character"),
    RESET_TOKEN_CANNOT_EMPTY(1024, "Reset token can not be empty"),
    PASSWORD_CANNOT_EMPTY(1025, "New password can not be empty"),
    CONFIRM_PASSWORD_CANNOT_EMPTY(1026, "New password can not be empty"),
    INVALID_OTP(1027, "OTP is invalid"),
    OTP_EXPIRED(1028, "OTP is expired"),
    PASSWORD_MISMATCH(1029, "Confirm password and password are not match"),
    INVALID_RESET_TOKEN(1030, "INVALID_RESET_TOKEN"),
    VOCAB_ALREADY_IN_CHAPTER(1021, "This vocabulary already exists in the chapter"),
    WORD_REQUIRED(1022, "Word must not be blank"),
    MEANING_REQUIRED(1023, "Meaning must not be blank"),
    ;

    int code;
    String message;
}
