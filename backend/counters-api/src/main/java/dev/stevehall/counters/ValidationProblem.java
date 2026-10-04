package dev.stevehall.counters;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.Map;

record ValidationProblem(String type,
                         @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String title,
                         @Schema(requiredMode = Schema.RequiredMode.REQUIRED) int status,
                         @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String detail,
                         @Schema(requiredMode = Schema.RequiredMode.REQUIRED, format = "uri-reference") String instance,
                         @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Map<String, String> errors) {}
