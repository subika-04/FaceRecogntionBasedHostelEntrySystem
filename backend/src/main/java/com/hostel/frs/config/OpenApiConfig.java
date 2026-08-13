package com.hostel.frs.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Generated documentation, not a hand-written spec: springdoc-openapi scans
 * every @RestController/@RequestMapping/@Valid DTO already in the codebase
 * and builds the spec from that at runtime, so it can't silently drift out
 * of sync with the actual API the way a manually maintained OpenAPI YAML
 * file inevitably does. Reachable at /api/v1/swagger-ui.html once the
 * backend is running (permitted without auth in SecurityConfig so
 * developers can browse the docs before they have a token -- the "Authorize"
 * button lets you paste a bearer token in to actually try requests).
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI frhesOpenApi() {
        final String bearerScheme = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("Face Recognition Hostel Entry System API")
                        .description("Backend REST API for student enrollment, face-recognition-based hostel " +
                                "entry logging, analytics, reports, settings, and user management. " +
                                "Authenticate via POST /auth/login, then use the returned accessToken " +
                                "with the 'Authorize' button below (refresh token travels separately as " +
                                "an httpOnly cookie and is not part of this spec).")
                        .version("v1")
                        .contact(new Contact().name("FRHES Engineering")))
                .servers(List.of(new Server().url("/api/v1").description("Default (matches server.servlet.context-path)")))
                .addSecurityItem(new SecurityRequirement().addList(bearerScheme))
                .components(new Components()
                        .addSecuritySchemes(bearerScheme, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")));
    }
}
