package com.agrivision.entity;

public enum CropType {
    OTHER(0, "Other Agriculture / Non-Crop"),
    PADDY(1, "Lowland Irrigated Paddy"),
    BANANA(2, "Perennial Broadleaf Banana");

    private final int code;
    private final String description;

    CropType(int code, String description) {
        this.code = code;
        this.description = description;
    }

    public int getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static CropType fromCode(int code) {
        for (CropType type : values()) {
            if (type.code == code) {
                return type;
            }
        }
        return OTHER;
    }
}
