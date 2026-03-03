'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

const SwaggerUI = dynamic(() => import('swagger-ui-react'), { ssr: false });

export default function ApiDocsPage() {
  return (
    <div className="bg-white min-h-screen">
      {/* Беремо статичний файл замість динамічного роута */}
      <SwaggerUI url="/swagger.json" /> 
    </div>
  );
}