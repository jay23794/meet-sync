const apiResponse = (dataSchema?: object) => ({
  type: 'object',
  required: ['success'],
  properties: {
    success: { type: 'boolean' },
    ...(dataSchema ? { data: dataSchema } : {}),
    error: { type: 'string' },
  },
});

const guestAuthResponse = {
  type: 'object',
  required: ['token', 'guestId'],
  properties: {
    token: { type: 'string', description: 'Signed JWT' },
    guestId: { type: 'string', example: 'guest_a1b2c3d4e5f6' },
  },
};

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'VideoChat API',
    version: '0.0.1',
    description: 'REST API for the VideoChat application',
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Local dev' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      GuestAuthResponse: apiResponse(guestAuthResponse),
      ErrorResponse: apiResponse(),
    },
  },
  paths: {
    '/auth/guest': {
      post: {
        tags: ['Auth'],
        summary: 'Create guest session',
        description: 'Issues a new JWT for an anonymous guest user.',
        responses: {
          201: {
            description: 'Guest token created',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GuestAuthResponse' },
                example: {
                  success: true,
                  data: { token: '<jwt>', guestId: 'guest_a1b2c3d4e5f6' },
                },
              },
            },
          },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh guest token',
        description:
          'Issues a new JWT for the guest. If the supplied token is expired or invalid a fresh guest identity is created. If valid, the existing guestId is re-signed.',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Token refreshed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GuestAuthResponse' },
              },
            },
          },
          401: {
            description: 'Authorization header missing or malformed',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
                example: { success: false, error: 'No token provided' },
              },
            },
          },
        },
      },
    },
  },
};
