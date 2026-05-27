package com.netflix.user.dto;

import jakarta.validation.constraints.NotBlank;

public class ProfileRequest {
    @NotBlank(message = "Name is required")
    private String name;
    private String avatarUrl;
    private boolean isKids;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }

    public boolean isKids() { return isKids; }
    public void setKids(boolean kids) { isKids = kids; }
}
