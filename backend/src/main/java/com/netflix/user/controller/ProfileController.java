package com.netflix.user.controller;

import com.netflix.user.dto.ProfileRequest;
import com.netflix.user.entity.Profile;
import com.netflix.user.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    @Autowired
    private ProfileService profileService;

    @GetMapping
    public ResponseEntity<List<Profile>> getUserProfiles() {
        return ResponseEntity.ok(profileService.getUserProfiles());
    }

    @PostMapping
    public ResponseEntity<Profile> createProfile(@Valid @RequestBody ProfileRequest request) {
        return ResponseEntity.ok(profileService.createProfile(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Profile> updateProfile(@PathVariable Long id, @Valid @RequestBody ProfileRequest request) {
        return ResponseEntity.ok(profileService.updateProfile(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProfile(@PathVariable Long id) {
        profileService.deleteProfile(id);
        return ResponseEntity.noContent().build();
    }
}
