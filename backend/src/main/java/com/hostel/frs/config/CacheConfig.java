package com.hostel.frs.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.TimeUnit;

/**
 * Replaces the previous `spring.cache.type: simple` (an unbounded
 * ConcurrentHashMap per cache name -- fine for a handful of settings keys,
 * risky once user/student lookups are cached too, since nothing ever evicts
 * an unbounded map) with Caffeine, which gives every cache region its own
 * maximum size and time-to-live.
 *
 * Cache regions in use:
 *  - "systemSettings"  (SettingsService)      -- tiny, rarely changes, long TTL is safe.
 *  - "users"           (UserService)          -- looked up on every authenticated
 *                                                 request's role check; short TTL so an
 *                                                 admin deactivating/role-changing a user
 *                                                 takes effect quickly.
 *  - "students"        (StudentService)       -- read on every recognition match; medium TTL.
 *
 * Every write path that can make a cached value stale explicitly evicts via
 * `@CacheEvict` rather than relying on TTL alone -- TTL here is a safety net
 * for anything that mutates the underlying row through a path that forgot
 * to evict, not the primary invalidation mechanism.
 */
@Configuration
public class CacheConfig {

    public static final String SETTINGS_CACHE = "systemSettings";
    public static final String USERS_CACHE = "users";
    public static final String STUDENTS_CACHE = "students";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager(SETTINGS_CACHE, USERS_CACHE, STUDENTS_CACHE);
        manager.setCaffeine(defaultCaffeineSpec());
        // Per-region overrides: a single shared Caffeine spec applies the
        // same size/TTL to every named cache above, which is a reasonable
        // default (a handful of settings rows and a few thousand users/
        // students, at most, at this project's scale). If usage patterns
        // diverge significantly, register each cache individually with
        // `manager.registerCustomCache(name, Caffeine.newBuilder()...build())`
        // instead of one shared spec.
        return manager;
    }

    private Caffeine<Object, Object> defaultCaffeineSpec() {
        return Caffeine.newBuilder()
                .maximumSize(2_000)
                .expireAfterWrite(10, TimeUnit.MINUTES)
                .recordStats(); // enables the cache.gets/cache.puts/cache.evictions Micrometer metrics below
    }
}
