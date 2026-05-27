package com.netflix.movie.dto;

public class PlaybackInfoResponse {
    private Long movieId;
    private String title;
    private String streamUrl;
    private boolean ready;
    private String message;
    private String sourceType;
    private String deliveryMode;
    private String container;
    private String codecHint;
    private long fileSizeBytes;
    private boolean rangeRequestsSupported;
    private String nextUpgrade;

    public PlaybackInfoResponse() {}

    public PlaybackInfoResponse(Long movieId, String title, String streamUrl, boolean ready, String message) {
        this.movieId = movieId;
        this.title = title;
        this.streamUrl = streamUrl;
        this.ready = ready;
        this.message = message;
    }

    public PlaybackInfoResponse(Long movieId, String title, String streamUrl, boolean ready, String message,
                                String sourceType, String deliveryMode, String container, String codecHint,
                                long fileSizeBytes, boolean rangeRequestsSupported, String nextUpgrade) {
        this.movieId = movieId;
        this.title = title;
        this.streamUrl = streamUrl;
        this.ready = ready;
        this.message = message;
        this.sourceType = sourceType;
        this.deliveryMode = deliveryMode;
        this.container = container;
        this.codecHint = codecHint;
        this.fileSizeBytes = fileSizeBytes;
        this.rangeRequestsSupported = rangeRequestsSupported;
        this.nextUpgrade = nextUpgrade;
    }

    public Long getMovieId() { return movieId; }
    public String getTitle() { return title; }
    public String getStreamUrl() { return streamUrl; }
    public boolean isReady() { return ready; }
    public String getMessage() { return message; }
    public String getSourceType() { return sourceType; }
    public String getDeliveryMode() { return deliveryMode; }
    public String getContainer() { return container; }
    public String getCodecHint() { return codecHint; }
    public long getFileSizeBytes() { return fileSizeBytes; }
    public boolean isRangeRequestsSupported() { return rangeRequestsSupported; }
    public String getNextUpgrade() { return nextUpgrade; }
}
