import { createSwaggerSpec } from 'next-swagger-doc';

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api', // Де шукати файли route.ts
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Nervia API Documentation',
        version: '1.0.0',
        description: 'API for Nervia Web Clipper and Knowledge Graph integration',
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [],
    },
  });
  return spec;
};