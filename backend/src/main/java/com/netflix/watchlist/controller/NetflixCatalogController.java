package com.netflix.watchlist.controller;

import com.netflix.watchlist.dto.CatalogMovieDto;
import com.netflix.watchlist.dto.HomeCatalogResponse;
import com.netflix.watchlist.service.NetflixCatalogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/catalog")
public class NetflixCatalogController {

    @Autowired
    private NetflixCatalogService catalogService;

    @GetMapping("/home")
    public ResponseEntity<HomeCatalogResponse> getHome(Authentication auth) {
        return ResponseEntity.ok(catalogService.getHomeCatalog(auth.getName()));
    }

    @GetMapping("/similar/{movieId}")
    public ResponseEntity<List<CatalogMovieDto>> getSimilar(@PathVariable Long movieId) {
        return ResponseEntity.ok(catalogService.getSimilarMovies(movieId));
    }
}
