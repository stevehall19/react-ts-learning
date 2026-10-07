package dev.stevehall.counters;

record StoredResponse(String requestHash, int statusCode, String location, String responseBody) {
}
