package com.netflix.watchlist.dto;

import java.util.List;

public class CatalogRowDto {
    private String rowId;
    private String title;
    private String algorithm;
    private List<CatalogMovieDto> movies;

    public CatalogRowDto() {}

    public CatalogRowDto(String rowId, String title, String algorithm, List<CatalogMovieDto> movies) {
        this.rowId = rowId;
        this.title = title;
        this.algorithm = algorithm;
        this.movies = movies;
    }

    public String getRowId() { return rowId; }
    public String getTitle() { return title; }
    public String getAlgorithm() { return algorithm; }
    public List<CatalogMovieDto> getMovies() { return movies; }
}
