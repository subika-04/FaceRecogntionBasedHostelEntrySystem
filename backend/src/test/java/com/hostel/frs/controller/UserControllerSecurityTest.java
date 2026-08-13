package com.hostel.frs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hostel.frs.dto.request.UserCreateRequest;
import com.hostel.frs.dto.response.UserResponse;
import com.hostel.frs.config.SecurityConfig;
import com.hostel.frs.security.CustomUserDetailsService;
import com.hostel.frs.security.JwtAuthenticationEntryPoint;
import com.hostel.frs.security.JwtTokenProvider;
import com.hostel.frs.security.RoleBasedAccessDeniedHandler;
import com.hostel.frs.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the ADMIN-only enforcement on /users/** end to end through the
 * real SecurityConfig filter chain (not just "does the service method get
 * called") -- this is exactly the kind of check that would have caught the
 * original audit's dead `/staff/**` rule, had it existed at the time: a rule
 * that isn't backed by a matching, tested controller path is worse than
 * useless, since it looks like protection but protects nothing.
 *
 * @Import(SecurityConfig.class) is not optional here. Without it,
 * @WebMvcTest only auto-includes JwtAuthFilter because it happens to also
 * be a raw Filter bean (Spring Boot's MockMvc auto-config registers any
 * Filter bean it finds, independent of Spring Security's own chain) -- the
 * *rules themselves*, defined only inside SecurityConfig's
 * SecurityFilterChain @Bean method, are a plain @Configuration class that
 * @WebMvcTest's slice does NOT pick up on its own. Left unimported, Spring
 * Boot silently falls back to its own default auto-configured security
 * (any authenticated user allowed, no role check at all -- tell-tale sign
 * is the "Using generated security password" log line), and every test
 * below would still compile and even mostly pass while verifying nothing
 * about the real /users/** -> hasRole(ADMIN) rule. Confirmed exactly this
 * happened: staffCannotCreateUsers/staffIsForbiddenFromListingUsers both
 * "passed" against the phantom default chain before this was added.
 */
@WebMvcTest(UserController.class)
@Import({ SecurityConfig.class, JwtAuthenticationEntryPoint.class, RoleBasedAccessDeniedHandler.class })
class UserControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    // SecurityConfig's SecurityFilterChain bean autowires JwtAuthFilter, and
    // @WebMvcTest includes Filter beans in its slice (that's how the real
    // ADMIN-only rule gets exercised below) -- but JwtAuthFilter's own two
    // @Autowired collaborators are plain @Component/@Service beans that
    // @WebMvcTest does NOT include, so they must be mocked here or context
    // startup fails with UnsatisfiedDependencyException before any test runs.
    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @WithMockUser(username = "admin1", roles = "ADMIN")
    void adminCanListUsers() throws Exception {
        when(userService.searchUsers(any(), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.singletonList(UserResponse.builder().id(1L).username("x").build())));

        mockMvc.perform(get("/users"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "staffer1", roles = "STAFF")
    void staffIsForbiddenFromListingUsers() throws Exception {
        mockMvc.perform(get("/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedRequestIsRejected() throws Exception {
        mockMvc.perform(get("/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "staffer1", roles = "STAFF")
    void staffCannotCreateUsers() throws Exception {
        UserCreateRequest request = new UserCreateRequest(
                "New Person", "new@example.com", "newuser", "Pass123!", null, "STAFF", null);

        mockMvc.perform(post("/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin1", roles = "ADMIN")
    void adminCanCreateUser() throws Exception {
        UserCreateRequest request = new UserCreateRequest(
                "New Person", "new@example.com", "newuser", "Pass123!", null, "STAFF", null);
        when(userService.createUser(any(), eq("admin1")))
                .thenReturn(UserResponse.builder().id(9L).username("newuser").build());

        mockMvc.perform(post("/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(username = "admin1", roles = "ADMIN")
    void createUserRejectsInvalidPayloadWith400() throws Exception {
        // Missing required fields (blank username/password/role) should fail
        // bean validation before ever reaching UserService.
        String invalidJson = "{\"fullName\":\"\",\"email\":\"not-an-email\"}";

        mockMvc.perform(post("/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }
}
