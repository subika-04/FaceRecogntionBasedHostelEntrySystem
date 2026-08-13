# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY pom.xml .
# Cache dependency resolution separately from source changes.
RUN mvn -B dependency:go-offline
COPY src ./src
RUN mvn -B clean package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

RUN useradd --create-home --uid 1000 appuser \
    && mkdir -p /app/uploads \
    && chown -R appuser:appuser /app
USER appuser

COPY --from=build /build/target/*.jar app.jar

EXPOSE 8080

# NOTE: no Spring Boot Actuator dependency is in pom.xml (see the audit report),
# so this checks raw TCP reachability on the app port rather than a real
# `/actuator/health` endpoint. Add `spring-boot-starter-actuator` and expose
# `management.endpoints.web.exposure.include=health` (permitted in
# SecurityConfig) for a real liveness/readiness signal, then swap this line
# for `CMD wget -qO- http://localhost:8080/api/v1/actuator/health || exit 1`.
HEALTHCHECK --interval=15s --timeout=5s --start-period=45s --retries=5 \
    CMD bash -c 'exec 3<>/dev/tcp/localhost/8080' || exit 1

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
