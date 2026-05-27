package com.netflix.movie.controller;

import com.netflix.movie.dto.PlaybackInfoResponse;
import com.netflix.movie.service.NetflixPlaybackService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/movies")
public class MoviePlaybackController {

    @Autowired
    private NetflixPlaybackService netflixPlaybackService;

    @GetMapping("/{id}/playback")
    public ResponseEntity<PlaybackInfoResponse> playbackInfo(@PathVariable Long id) {
        return ResponseEntity.ok(netflixPlaybackService.getPlaybackInfo(id));
    }
}
