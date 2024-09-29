import { NextResponse } from "next/server";

export function middleware(req) {
  const referer = req.headers.get("referer");
  if (req.nextUrl.pathname.startsWith("/api/") && !referer) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
