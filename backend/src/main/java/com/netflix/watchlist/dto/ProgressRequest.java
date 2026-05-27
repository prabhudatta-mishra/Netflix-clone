package com.netflix.watchlist.dto;

public class ProgressRequest {
    private int progressSeconds;
    private int durationSeconds;

    public ProgressRequest() {}

    public int getProgressSeconds() { return progressSeconds; }
    public void setProgressSeconds(int progressSeconds) { this.progressSeconds = progressSeconds; }

    public int getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(int durationSeconds) { this.durationSeconds = durationSeconds; }
}
