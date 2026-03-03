'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

// Динамічний імпорт, щоб уникнути помилок SSR
const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="bg-white min-h-screen">
      <SwaggerUI url="/api/doc" /> 
    </div>
  );
}