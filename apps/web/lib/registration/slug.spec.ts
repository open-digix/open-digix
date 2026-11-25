import { describe, it, expect } from "vitest";
import { toTenantSlug, isValidTenantSlug } from "./slug";

describe("slug utilities", () => {
  describe("toTenantSlug", () => {
    it("converts Vietnamese diacritics correctly", () => {
      expect(toTenantSlug("Công ty Cổ phần Đông Á")).toBe("cong-ty-co-phan-dong-a");
      expect(toTenantSlug("Đà Nẵng & Hà Nội")).toBe("da-nang-ha-noi");
    });

    it("handles Đ and đ correctly", () => {
      expect(toTenantSlug("Đông Đô")).toBe("dong-do");
      expect(toTenantSlug("đường đời")).toBe("duong-doi");
    });

    it("removes special characters and punctuation", () => {
      expect(toTenantSlug("Công ty TNHH @#$ ABC! 123")).toBe("cong-ty-tnhh-abc-123");
      expect(toTenantSlug("Tập đoàn (Việt Nam)...")).toBe("tap-doan-viet-nam");
    });

    it("collapses multiple consecutive hyphens", () => {
      expect(toTenantSlug("a---b---c")).toBe("a-b-c");
    });

    it("removes leading and trailing hyphens", () => {
      expect(toTenantSlug("-abc-def-")).toBe("abc-def");
    });

    it("prepends dn- prefix if slug starts with a number", () => {
      expect(toTenantSlug("3M Việt Nam")).toBe("dn-3m-viet-nam");
      expect(toTenantSlug("123 Đô")).toBe("dn-123-do");
    });

    it("limits length to 40 characters and trims trailing hyphens", () => {
      const longName = "Doanh nghiệp dịch vụ kỹ thuật số toàn diện Việt Nam";
      const slug = toTenantSlug(longName);
      expect(slug.length).toBeLessThanOrEqual(40);
      expect(slug).not.toMatch(/-$/);
      expect(slug).toBe("doanh-nghiep-dich-vu-ky-thuat-so-toan-di");
    });
  });

  describe("isValidTenantSlug", () => {
    it("accepts valid tenant slugs", () => {
      expect(isValidTenantSlug("dong-a")).toBe(true);
      expect(isValidTenantSlug("abc-123")).toBe(true);
      expect(isValidTenantSlug("dn-3m-viet-nam")).toBe(true);
      expect(isValidTenantSlug("digix-lab")).toBe(true);
      expect(isValidTenantSlug("a-b")).toBe(true);
    });

    it("rejects invalid tenant slugs", () => {
      expect(isValidTenantSlug("")).toBe(false);
      expect(isValidTenantSlug("a")).toBe(false); // too short
      expect(isValidTenantSlug("ab")).toBe(false); // too short
      expect(isValidTenantSlug("3m-viet-nam")).toBe(false); // starts with number
      expect(isValidTenantSlug("-abc")).toBe(false); // starts with hyphen
      expect(isValidTenantSlug("abc-")).toBe(false); // ends with hyphen
      expect(isValidTenantSlug("A-B-C")).toBe(false); // uppercase
      expect(isValidTenantSlug("abc_def")).toBe(false); // underscore
      expect(isValidTenantSlug("abc def")).toBe(false); // space
      expect(isValidTenantSlug("a".repeat(41))).toBe(false); // too long
    });
  });
});
