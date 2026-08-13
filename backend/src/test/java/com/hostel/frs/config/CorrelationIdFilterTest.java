package com.hostel.frs.config;

import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

class CorrelationIdFilterTest {

    private final CorrelationIdFilter filter = new CorrelationIdFilter();

    @Test
    void generatesAFreshCorrelationIdWhenCallerSuppliesNone() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/students");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        String echoedId = response.getHeader(CorrelationIdFilter.CORRELATION_ID_HEADER);
        assertThat(echoedId).isNotNull().isNotBlank();
        verify(chain).doFilter(request, response);
        // MDC must be cleared after the request completes -- otherwise a
        // pooled thread handling the next unrelated request would inherit
        // this one's correlation ID.
        assertThat(MDC.get(CorrelationIdFilter.MDC_KEY)).isNull();
    }

    @Test
    void reusesAnIncomingCorrelationIdInsteadOfGeneratingANewOne() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/students");
        request.addHeader(CorrelationIdFilter.CORRELATION_ID_HEADER, "upstream-trace-123");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        assertThat(response.getHeader(CorrelationIdFilter.CORRELATION_ID_HEADER)).isEqualTo("upstream-trace-123");
    }

    @Test
    void mdcIsPopulatedWhileTheDownstreamFilterChainRuns() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/students");
        MockHttpServletResponse response = new MockHttpServletResponse();

        // A chain that captures whatever MDC value is visible *during* the
        // request, not after -- proving the ID is set before downstream
        // filters/controllers run, not only in a header added afterward.
        final String[] mdcDuringRequest = new String[1];
        FilterChain chain = (req, res) -> mdcDuringRequest[0] = MDC.get(CorrelationIdFilter.MDC_KEY);

        filter.doFilter(request, response, chain);

        assertThat(mdcDuringRequest[0]).isNotNull();
        assertThat(mdcDuringRequest[0]).isEqualTo(response.getHeader(CorrelationIdFilter.CORRELATION_ID_HEADER));
    }

    @Test
    void clearsMdcEvenWhenDownstreamChainThrows() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/students");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = (req, res) -> { throw new RuntimeException("downstream failure"); };

        try {
            filter.doFilter(request, response, chain);
        } catch (Exception ignored) {
            // expected -- the point of this test is what happens to MDC afterward
        }

        assertThat(MDC.get(CorrelationIdFilter.MDC_KEY)).isNull();
    }
}
