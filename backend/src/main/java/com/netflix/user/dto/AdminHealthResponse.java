package com.netflix.user.dto;

public class AdminHealthResponse {
    private boolean backendOnline;
    private boolean databaseOnline;
    private long catalogMovies;
    private long localVideos;
    private long feedbackEvents;
    private long watchHistoryEvents;
    private String importFolder;
    private String checkedAt;

    public AdminHealthResponse(boolean backendOnline, boolean databaseOnline, long catalogMovies,
                               long localVideos, long feedbackEvents, long watchHistoryEvents,
                               String importFolder, String checkedAt) {
        this.backendOnline = backendOnline;
        this.databaseOnline = databaseOnline;
        this.catalogMovies = catalogMovies;
        this.localVideos = localVideos;
        this.feedbackEvents = feedbackEvents;
        this.watchHistoryEvents = watchHistoryEvents;
        this.importFolder = importFolder;
        this.checkedAt = checkedAt;
    }

    public boolean isBackendOnline() { return backendOnline; }
    public boolean isDatabaseOnline() { return databaseOnline; }
    public long getCatalogMovies() { return catalogMovies; }
    public long getLocalVideos() { return localVideos; }
    public long getFeedbackEvents() { return feedbackEvents; }
    public long getWatchHistoryEvents() { return watchHistoryEvents; }
    public String getImportFolder() { return importFolder; }
    public String getCheckedAt() { return checkedAt; }
}
