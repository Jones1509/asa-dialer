/**
 * Røg-test: beviser at test-miljøet (jsdom + React + router) virker, og at
 * ren forretningslogik opfører sig som forventet — uden Supabase/Twilio/netværk.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Supabase-klienten kræver env-variabler og netværk — mockes væk i tests.
vi.mock("@/lib/supabase", () => ({ supabase: {} }));

import { isAdminRole } from "@/lib/auth-roles";
import { cn } from "@/lib/utils";
import NotFound from "@/pages/NotFound";

describe("isAdminRole", () => {
  it("godkender admin og kontor uanset store/små bogstaver og mellemrum", () => {
    expect(isAdminRole("admin")).toBe(true);
    expect(isAdminRole(" Kontor ")).toBe(true);
    expect(isAdminRole("ADMIN")).toBe(true);
  });

  it("afviser andre roller og tomme værdier", () => {
    expect(isAdminRole("saelger")).toBe(false);
    expect(isAdminRole("")).toBe(false);
    expect(isAdminRole(null)).toBe(false);
    expect(isAdminRole(undefined)).toBe(false);
  });
});

describe("cn", () => {
  it("fletter klasser og lader den sidste Tailwind-klasse vinde", () => {
    expect(cn("p-2", false && "hidden", "p-4")).toBe("p-4");
  });
});

describe("NotFound-siden", () => {
  it("renderer 404 med link hjem", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={["/findes-ikke"]}>
        <NotFound />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/");
  });
});
