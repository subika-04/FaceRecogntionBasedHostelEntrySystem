package com.hostel.frs.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Without this, `/actuator/health` could report the whole application as
 * UP purely based on the database connection (Spring Boot's built-in DB
 * health indicator) even while the entire face-recognition feature is dead
 * because the Flask AI service is down or unreachable -- exactly the
 * failure mode the original audit report called out (StartupCacheSync logs
 * an error but doesn't fail startup or surface the problem anywhere an
 * operator would actually look).
 *
 * Shows up as a named component under `/actuator/health`'s `components` map
 * (`aiService`), so a monitoring dashboard or `curl` check can distinguish
 * "the API is up but recognition is broken" from "the whole app is down".
 */
@Component("aiService")
public class AiServiceHealthIndicator implements HealthIndicator {

    private final RestTemplate restTemplate;

    @Value("${app.flask-ai.url}")
    private String flaskAiUrl;

    public AiServiceHealthIndicator() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public Health health() {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> body = restTemplate.getForObject(flaskAiUrl + "/health", Map.class);

            if (body == null) {
                return Health.down().withDetail("reason", "AI service returned an empty health response").build();
            }

            boolean modelReady = Boolean.TRUE.equals(body.get("modelReady"));
            Health.Builder builder = modelReady ? Health.up() : Health.status("DEGRADED");

            return builder
                    .withDetail("url", flaskAiUrl)
                    .withDetail("modelReady", modelReady)
                    .withDetail("cachedStudents", body.getOrDefault("cachedStudents", "unknown"))
                    .build();

        } catch (RestClientException e) {
            // Down, not an exception bubbling up -- a health check that itself
            // throws is a worse failure mode than one that reports DOWN cleanly.
            return Health.down()
                    .withDetail("url", flaskAiUrl)
                    .withDetail("error", e.getMessage())
                    .build();
        }
    }
}
