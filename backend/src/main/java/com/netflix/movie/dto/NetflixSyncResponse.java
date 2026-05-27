package com.netflix.movie.dto;

import java.util.List;

public class NetflixSyncResponse {
    private String inboxFolder;
    private List<String> steps;
    private int totalMovies;

    public NetflixSyncResponse() {}

    public NetflixSyncResponse(String inboxFolder, List<String> steps, int totalMovies) {
        this.inboxFolder = inboxFolder;
        this.steps = steps;
        this.totalMovies = totalMovies;
    }

    public String getInboxFolder() { return inboxFolder; }
    public List<String> getSteps() { return steps; }
    public int getTotalMovies() { return totalMovies; }
}
