package com.netflix.user.dto;

import java.util.List;

public class OfflineImportResponse {
    private String inboxFolder;
    private List<String> imported;
    private List<String> skipped;
    private List<String> errors;

    public OfflineImportResponse() {}

    public OfflineImportResponse(String inboxFolder, List<String> imported,
                                 List<String> skipped, List<String> errors) {
        this.inboxFolder = inboxFolder;
        this.imported = imported;
        this.skipped = skipped;
        this.errors = errors;
    }

    public String getInboxFolder() { return inboxFolder; }
    public List<String> getImported() { return imported; }
    public List<String> getSkipped() { return skipped; }
    public List<String> getErrors() { return errors; }
}
