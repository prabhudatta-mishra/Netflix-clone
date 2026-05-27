package com.netflix.watchlist.dto;

import java.util.List;

public class HomeCatalogResponse {
    private CatalogMovieDto featured;
    private List<CatalogRowDto> rows;

    public HomeCatalogResponse() {}

    public HomeCatalogResponse(CatalogMovieDto featured, List<CatalogRowDto> rows) {
        this.featured = featured;
        this.rows = rows;
    }

    public CatalogMovieDto getFeatured() { return featured; }
    public List<CatalogRowDto> getRows() { return rows; }
}
