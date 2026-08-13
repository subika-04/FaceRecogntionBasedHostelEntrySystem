package com.hostel.frs.config;

import com.hostel.frs.entity.Role;
import com.hostel.frs.entity.User;
import com.hostel.frs.entity.UserStatus;
import com.hostel.frs.repository.RoleRepository;
import com.hostel.frs.repository.UserRepository;
import com.hostel.frs.service.PasswordPolicyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Replaces the old manual bootstrap workflow (run `HashGen.java` locally to
 * print a BCrypt hash, then hand-write a SQL `INSERT INTO users`). On every
 * startup, if the `users` table is completely empty, this creates exactly
 * one ADMIN account from environment configuration
 * (`BOOTSTRAP_ADMIN_USERNAME` / `BOOTSTRAP_ADMIN_PASSWORD` / etc. -- see
 * application.yml's `app.bootstrap.admin.*`).
 *
 * Deliberately conservative: it does nothing at all once at least one user
 * exists (so it's always safe to leave enabled), and it does nothing if no
 * password was configured -- it will never invent or use a guessable
 * default password.
 */
@Component
@Slf4j
public class BootstrapAdminRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicyService passwordPolicyService;

    @Value("${app.bootstrap.admin.enabled:true}")
    private boolean enabled;

    @Value("${app.bootstrap.admin.username:admin}")
    private String username;

    @Value("${app.bootstrap.admin.email:admin@frhes.local}")
    private String email;

    @Value("${app.bootstrap.admin.full-name:System Administrator}")
    private String fullName;

    @Value("${app.bootstrap.admin.password:}")
    private String password;

    public BootstrapAdminRunner(UserRepository userRepository, RoleRepository roleRepository,
                                 PasswordEncoder passwordEncoder, PasswordPolicyService passwordPolicyService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordPolicyService = passwordPolicyService;
    }

    @Override
    public void run(String... args) {
        if (!enabled) {
            return;
        }
        if (userRepository.count() > 0) {
            // Normal case on every startup after the very first one.
            return;
        }
        if (password == null || password.isBlank()) {
            log.warn("=================================================================");
            log.warn("No users exist yet, and BOOTSTRAP_ADMIN_PASSWORD is not set.");
            log.warn("Set BOOTSTRAP_ADMIN_USERNAME / BOOTSTRAP_ADMIN_PASSWORD in your .env");
            log.warn("and restart the backend to create the first ADMIN account.");
            log.warn("=================================================================");
            return;
        }

        // Bootstrap credentials are deliberately exempted from
        // PasswordPolicyService: this account is created once, from an
        // environment variable the operator controls directly (not via any
        // user-facing signup/reset endpoint), specifically so a known
        // first-login credential can be handed to a new deployment. Every
        // other path that sets a password -- AuthService.changePassword,
        // UserService.createUser/resetPassword -- still goes through
        // PasswordPolicyService.validate() unchanged. We do still enforce a
        // minimum length here so a truly empty/trivial value can't slip
        // through, and we log a one-time reminder to rotate it.
        if (password.length() < 6) {
            log.error("BOOTSTRAP_ADMIN_PASSWORD is too short (minimum 6 characters). No admin account was created.");
            return;
        }
        try {
            passwordPolicyService.validate(password);
        } catch (IllegalArgumentException e) {
            log.warn("BOOTSTRAP_ADMIN_PASSWORD does not satisfy the current PASSWORD_POLICY setting ({}). " +
                    "Creating the account anyway since this is a one-time bootstrap credential, but change it " +
                    "from Settings/Change Password after first login.", e.getMessage());
        }

        Role adminRole = roleRepository.findByNameIgnoreCase("ADMIN")
                .orElseThrow(() -> new IllegalStateException(
                        "ADMIN role not found -- has the Flyway V1 baseline migration run?"));

        User admin = User.builder()
                .fullName(fullName)
                .email(email)
                .username(username)
                .passwordHash(passwordEncoder.encode(password))
                .role(adminRole)
                .status(UserStatus.ACTIVE)
                .build();
        userRepository.save(admin);

        log.info("=================================================================");
        log.info("Bootstrap ADMIN account created: username='{}'. This message will");
        log.info("not appear again -- BootstrapAdminRunner only acts on an empty");
        log.info("users table. Log in and consider disabling BOOTSTRAP_ADMIN_ENABLED");
        log.info("once you've created any additional accounts you need via /users.");
        log.info("=================================================================");
    }
}
