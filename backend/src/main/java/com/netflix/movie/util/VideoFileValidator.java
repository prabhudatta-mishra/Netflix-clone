package com.netflix.movie.util;

import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.Set;

public final class VideoFileValidator {

    private static final Set<String> BLOCKED_EXT = Set.of(
            "exe", "msi", "bat", "cmd", "com", "scr", "dll", "jar", "zip", "rar",
            "7z", "iso", "dmg", "html", "htm", "js", "php", "apk", "deb", "rpm",
            "txt", "pdf", "doc", "docx", "srt", "sub", "nfo"
    );

    private VideoFileValidator() {}

    public static boolean isAllowedVideoFilename(String filename) {
        String ext = extension(filename);
        if (ext.isEmpty()) {
            return false;
        }
        return !BLOCKED_EXT.contains(ext);
    }

    public static void validate(MultipartFile video) {
        if (video == null || video.isEmpty()) {
            throw new IllegalArgumentException("Video file is required.");
        }

        String ext = extension(video.getOriginalFilename());
        if (BLOCKED_EXT.contains(ext)) {
            throw new IllegalArgumentException(
                    "This file type is not allowed (.exe, .msi, installers, etc.). Upload a video file.");
        }

        String contentType = video.getContentType();
        if (contentType != null && contentType.toLowerCase(Locale.ROOT).startsWith("video/")) {
            return;
        }

        if (ext.isEmpty()) {
            throw new IllegalArgumentException("Video file must have a valid extension (mp4, mkv, avi, mov, etc.).");
        }
    }

    public static String extension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    public static String contentTypeForExtension(String ext) {
        if (ext == null || ext.isBlank()) {
            return "video/mp4";
        }
        return switch (ext.toLowerCase(Locale.ROOT)) {
            case "webm" -> "video/webm";
            case "ogg", "ogv" -> "video/ogg";
            case "mkv" -> "video/x-matroska";
            case "avi" -> "video/x-msvideo";
            case "mov" -> "video/quicktime";
            case "wmv" -> "video/x-ms-wmv";
            case "flv" -> "video/x-flv";
            case "m4v" -> "video/x-m4v";
            case "mpeg", "mpg" -> "video/mpeg";
            case "3gp" -> "video/3gpp";
            case "ts" -> "video/mp2t";
            default -> "video/mp4";
        };
    }
}
