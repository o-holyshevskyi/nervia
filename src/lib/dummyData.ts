export interface GraphNode {
  id: string;
  group: number;
  val: number;
  type: 'link' | 'note' | 'idea';
  tags: string[];
  content: string;
  fullData?: unknown;
  // D3.js force simulation properties (added during runtime)
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  relationType: 'manual' | 'ai';
  label: string;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export const graphData: GraphData = {
  nodes: [
    // Technology & Development
    { 
      id: "Next.js", 
      group: 1, 
      val: 10, 
      type: 'link', 
      tags: ['frontend', 'react', 'framework'], 
      content: "The React framework for production. Build fast, modern web applications with server-side rendering, static site generation, and more.",
    },
    { 
      id: "React", 
      group: 1, 
      val: 4, 
      type: 'link', 
      tags: ['frontend', 'library', 'javascript'], 
      content: "The library for web and native user interfaces. Component-based architecture for building interactive UIs.",
    },
    { 
      id: "Tailwind CSS", 
      group: 1, 
      val: 4, 
      type: 'link', 
      tags: ['frontend', 'css', 'styling'], 
      content: "A utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.",
    },
    { 
      id: "TypeScript", 
      group: 1, 
      val: 5, 
      type: 'link', 
      tags: ['frontend', 'backend', 'typescript'], 
      content: "TypeScript extends JavaScript by adding types. Enhances developer productivity and code quality.",
    },
    
    // Backend & Infrastructure
    { 
      id: "Supabase", 
      group: 2, 
      val: 4, 
      type: 'link', 
      tags: ['backend', 'database', 'auth'], 
      content: "Open source Firebase alternative. Provides database, authentication, storage, and edge functions.",
    },
    { 
      id: "PostgreSQL", 
      group: 2, 
      val: 3, 
      type: 'note', 
      tags: ['database', 'sql', 'backend'], 
      content: "Powerful, open source object-relational database system with over 30 years of active development.",
    },
    { 
      id: "Docker", 
      group: 2, 
      val: 4, 
      type: 'link', 
      tags: ['devops', 'containerization', 'infrastructure'], 
      content: "Platform for developing, shipping, and running applications in containers.",
    },
    { 
      id: "Vercel", 
      group: 2, 
      val: 3, 
      type: 'link', 
      tags: ['deployment', 'frontend', 'infrastructure'], 
      content: "Frontend cloud platform for static sites and Serverless Functions. Perfect for Next.js deployments.",
    },
    
    // AI & Machine Learning
    { 
      id: "OpenAI", 
      group: 3, 
      val: 5, 
      type: 'link', 
      tags: ['ai', 'machine-learning', 'future'], 
      content: "Artificial intelligence research and deployment company. Creators of GPT models and ChatGPT.",
    },
    { 
      id: "Vector Embeddings", 
      group: 3, 
      val: 4, 
      type: 'note', 
      tags: ['ai', 'machine-learning', 'math'], 
      content: "Numerical representations of text, images, or other data that capture semantic meaning. Essential for semantic search and AI applications.",
    },
    { 
      id: "LangChain", 
      group: 3, 
      val: 3, 
      type: 'link', 
      tags: ['ai', 'framework', 'development'], 
      content: "Framework for developing applications powered by language models. Simplifies building AI-powered applications.",
    },
    { 
      id: "Prompt Engineering", 
      group: 3, 
      val: 4, 
      type: 'idea', 
      tags: ['ai', 'skills', 'development'], 
      content: "The art and science of crafting effective prompts for AI models. Critical skill for maximizing AI capabilities.",
    },
    
    // Productivity & Tools
    { 
      id: "Notion", 
      group: 4, 
      val: 4, 
      type: 'link', 
      tags: ['productivity', 'notes', 'organization'], 
      content: "All-in-one workspace for notes, tasks, wikis, and databases. Flexible tool for personal and team organization.",
    },
    { 
      id: "GitHub", 
      group: 4, 
      val: 5, 
      type: 'link', 
      tags: ['development', 'version-control', 'collaboration'], 
      content: "Platform for version control and collaboration. Essential tool for software development teams.",
    },
    { 
      id: "Figma", 
      group: 4, 
      val: 3, 
      type: 'link', 
      tags: ['design', 'ui', 'collaboration'], 
      content: "Collaborative interface design tool. Used for designing user interfaces, prototypes, and design systems.",
    },
    
    // Learning & Resources
    { 
      id: "MDN Web Docs", 
      group: 5, 
      val: 5, 
      type: 'link', 
      tags: ['learning', 'documentation', 'web'], 
      content: "Comprehensive documentation for web technologies. Essential reference for web developers.",
    },
    { 
      id: "CSS-Tricks", 
      group: 5, 
      val: 4, 
      type: 'link', 
      tags: ['learning', 'css', 'frontend'], 
      content: "Web design and development community. Great resource for CSS techniques and web development tips.",
    },
    { 
      id: "React Patterns", 
      group: 5, 
      val: 3, 
      type: 'note', 
      tags: ['learning', 'react', 'best-practices'], 
      content: "Common patterns and best practices for building React applications. Includes component composition, state management, and performance optimization.",
    },
    
    // Personal Projects & Ideas
    { 
      id: "Personal Portfolio", 
      group: 6, 
      val: 4, 
      type: 'idea', 
      tags: ['personal', 'portfolio', 'showcase'], 
      content: "Idea for a personal portfolio website showcasing projects, skills, and blog posts. Should be built with Next.js and include interactive elements.",
    },
    { 
      id: "E-commerce Analytics Dashboard", 
      group: 6, 
      val: 5, 
      type: 'idea', 
      tags: ['project', 'analytics', 'dashboard'], 
      content: "Concept for a real-time analytics dashboard for e-commerce stores. Would track sales, user behavior, and performance metrics.",
    },
    { 
      id: "AI-Powered Code Reviewer", 
      group: 6, 
      val: 4, 
      type: 'idea', 
      tags: ['project', 'ai', 'development'], 
      content: "Tool that uses AI to review code changes and provide suggestions for improvements, security issues, and best practices.",
    }
  ],
  links: [
    // Manual connections - Technology relationships
    { source: "Next.js", target: "React", relationType: "ai", label: "Built on React", weight: 3 },
    { source: "Next.js", target: "TypeScript", relationType: "manual", label: "TypeScript support", weight: 2 },
    { source: "Next.js", target: "Tailwind CSS", relationType: "ai", label: "Common styling choice", weight: 2 },
    { source: "Next.js", target: "Vercel", relationType: "manual", label: "Optimized deployment platform", weight: 3 },
    
    // Backend connections
    { source: "Supabase", target: "PostgreSQL", relationType: "ai", label: "Powered by PostgreSQL", weight: 3 },
    { source: "Supabase", target: "Docker", relationType: "manual", label: "Can be self-hosted with Docker", weight: 2 },
    { source: "Docker", target: "Vercel", relationType: "ai", label: "Alternative deployment method", weight: 1 },
    
    // AI connections
    { source: "OpenAI", target: "Vector Embeddings", relationType: "manual", label: "Uses embeddings technology", weight: 3 },
    { source: "OpenAI", target: "LangChain", relationType: "ai", label: "Commonly used together", weight: 2 },
    { source: "Vector Embeddings", target: "Prompt Engineering", relationType: "manual", label: "Enhances prompt effectiveness", weight: 2 },
    
    // Productivity connections
    { source: "Notion", target: "GitHub", relationType: "ai", label: "Project documentation", weight: 2 },
    { source: "Figma", target: "Notion", relationType: "manual", label: "Design documentation", weight: 2 },
    { source: "GitHub", target: "Figma", relationType: "ai", label: "Design to code workflow", weight: 2 },
  ]
}