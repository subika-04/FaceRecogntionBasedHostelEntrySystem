package com.hostel.frs.config;

import com.hostel.frs.security.JwtAuthFilter;
import com.hostel.frs.security.JwtAuthenticationEntryPoint;
import com.hostel.frs.security.RoleBasedAccessDeniedHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.security.web.header.writers.StaticHeadersWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationEntryPoint unauthorizedHandler;

    @Autowired
    private RoleBasedAccessDeniedHandler accessDeniedHandler;

    @Autowired
    private JwtAuthFilter jwtAuthFilter;

    // Comma-separated list of allowed browser origins. Defaults cover local
    // Vite/CRA dev servers; set CORS_ALLOWED_ORIGINS in production to your
    // real frontend domain(s) instead of relying on this default.
    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173}")
    private String allowedOrigins;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .headers(this::configureSecurityHeaders)
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(unauthorizedHandler)
                .accessDeniedHandler(accessDeniedHandler)
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/login", "/auth/refresh").permitAll()
                // API documentation is static/generated metadata about the API
                // shape, not data -- safe to expose without auth so developers
                // can browse it before they even have a token.
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**").permitAll()
                // Liveness/readiness probes must be reachable without a JWT
                // (Docker/Kubernetes/load-balancer health checks don't carry
                // one) -- only the narrow health/info surface is public;
                // everything else under /actuator/** (e.g. /actuator/metrics)
                // requires ADMIN, since metrics can reveal internal detail.
                .requestMatchers("/actuator/health/**", "/actuator/info").permitAll()
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                // Real user-management endpoints (see UserController), replacing
                // the previous /staff/** rule that never matched any controller.
                .requestMatchers("/users/**").hasRole("ADMIN")
                .requestMatchers("/analytics/**").hasRole("ADMIN")
                .requestMatchers("/settings/**").hasRole("ADMIN")
                .requestMatchers("/reports/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * Phase A security-headers hardening. Several of these
     * (X-Content-Type-Options, a default frame-options DENY) are already on
     * by default in Spring Security 6 -- they're configured explicitly below
     * anyway so the intended policy is visible in one place instead of
     * relying on framework defaults a future reader might not know about.
     */
    private void configureSecurityHeaders(HeadersConfigurer<HttpSecurity> headers) {
        headers
            .contentTypeOptions(withDefaults -> {}) // X-Content-Type-Options: nosniff
            .frameOptions(frame -> frame.deny())    // X-Frame-Options: DENY (this is a JSON API, never framed)
            .referrerPolicy(referrer -> referrer
                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
            .httpStrictTransportSecurity(hsts -> hsts
                .includeSubDomains(true)
                .maxAgeInSeconds(31536000)) // only actually sent by browsers over HTTPS responses
            .addHeaderWriter(new StaticHeadersWriter("X-XSS-Protection", "0"))
            // "0" (not "1; mode=block") is the current OWASP-recommended value:
            // the legacy browser XSS auditor this header controlled had known
            // bypasses that could be *weaponized* by an attacker to suppress
            // legitimate content, so modern guidance is to explicitly disable
            // it and rely on Content-Security-Policy instead.
            .contentSecurityPolicy(csp -> csp.policyDirectives(
                    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; " +
                    "img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'"))
            // Was `default-src 'none'` when this was a pure JSON API with no
            // served HTML at all. Now that springdoc-openapi serves Swagger
            // UI's HTML/JS/CSS from this same origin, an absolute 'none'
            // would silently block Swagger UI's own scripts/styles from
            // loading -- 'self' allows same-origin static assets (which is
            // all Swagger UI needs) while still blocking any third-party
            // script/style injection. `'unsafe-inline'` on style-src only
            // (not script-src) is a narrow, common concession Swagger UI's
            // bundled CSS needs; it does not weaken protection against
            // injected *scripts*, which remain restricted to same-origin.
            .permissionsPolicy(permissions -> permissions.policy(
                    "geolocation=(), camera=(), microphone=(), payment=()"));
            // The API itself never needs camera/mic access -- the browser's
            // camera permission prompt for face capture is requested by the
            // React app's own origin, not this API's responses.
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
        configuration.setAllowedOriginPatterns(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setExposedHeaders(Collections.singletonList("Authorization"));
        configuration.setAllowCredentials(true);
        // Browsers cache the preflight response for this long, cutting down
        // on repeated OPTIONS round-trips for the same route/method pair.
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
