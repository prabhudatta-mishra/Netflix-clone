package com.netflix.user.service;

import com.netflix.user.dto.ProfileRequest;
import com.netflix.user.entity.Profile;
import com.netflix.user.entity.User;
import com.netflix.user.repository.ProfileRepository;
import com.netflix.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProfileService {

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    public List<Profile> getUserProfiles() {
        User user = getCurrentUser();
        return profileRepository.findByUser(user);
    }

    public Profile createProfile(ProfileRequest request) {
        User user = getCurrentUser();
        if (profileRepository.countByUser(user) >= 5) {
            throw new RuntimeException("Maximum 5 profiles allowed");
        }
        Profile profile = new Profile(request.getName(), request.getAvatarUrl(), request.isKids(), user);
        return profileRepository.save(profile);
    }

    public Profile updateProfile(Long profileId, ProfileRequest request) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        
        if (!profile.getUser().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Unauthorized");
        }

        profile.setName(request.getName());
        profile.setAvatarUrl(request.getAvatarUrl());
        profile.setKids(request.isKids());
        return profileRepository.save(profile);
    }

    public void deleteProfile(Long profileId) {
        Profile profile = profileRepository.findById(profileId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        
        if (!profile.getUser().getId().equals(getCurrentUser().getId())) {
            throw new RuntimeException("Unauthorized");
        }

        profileRepository.delete(profile);
    }

    private User getCurrentUser() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
