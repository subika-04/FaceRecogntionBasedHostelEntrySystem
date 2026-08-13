import axiosClient from './axiosClient';

// GET /actuator/health -> { status, components: { db, aiService, diskSpace, ... } }
// Publicly reachable at the Spring Security level (see SecurityConfig), but
// component-level detail only appears for an authenticated request -- which
// axiosClient already provides via its Authorization header interceptor.
export const getSystemHealth = () =>
  axiosClient.get('/actuator/health').then((res) => res.data);
