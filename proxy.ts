import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. ПУБЛІЧНІ ШЛЯХИ (Тільки ті, де ВЗАГАЛІ не потрібен Supabase)
  // Ми прибираємо звідси /login та /auth, щоб Middleware міг їх обробити нижче
  const isExcludedPath =
    pathname.startsWith("/demo") ||
    pathname.startsWith("/share") ||
    pathname.startsWith("/api/extension/save") ||
    pathname.startsWith("/api/share/") ||
    pathname.includes("/api/webhooks") || 
    pathname.includes("/api/billing/portal") ||
    pathname === "/api/notifications/visit";

  if (isExcludedPath) {
    return NextResponse.next({ request });
  }

  // 2. ІНІЦІАЛІЗАЦІЯ ВІДПОВІДІ ТА КЛІЄНТА
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 3. ПЕРЕВІРКА ЮЗЕРА (Тут Supabase може оновити токен)
  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/auth");

  // 4. ЛОГІКА РЕДІРЕКТІВ
  
  // Якщо юзера немає і це НЕ сторінка логіну — на логін
  if (!user && !isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url, {
      headers: supabaseResponse.headers, // ВАЖЛИВО: зберігаємо сесію
    });
  }

  // Якщо юзер Є і він на сторінці логіну — на головну
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url, {
      headers: supabaseResponse.headers, // ВАЖЛИВО: зберігаємо сесію
    });
  }

  // Для API розширень та іншого
  const isExtensionApi = pathname.startsWith("/api/extension/save");
  if (request.method === "OPTIONS" && isExtensionApi) {
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};