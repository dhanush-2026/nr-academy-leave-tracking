package com.zenbyte.leave.dto;

public record ChangePasswordRequest(String oldPassword, String newPassword) {}