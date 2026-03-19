import { describe, it, expect } from "vitest";
import { SejongClient } from "../../src/index.js";

const USERNAME = process.env.SEJONG_USERNAME ?? "";
const PASSWORD = process.env.SEJONG_PASSWORD ?? "";

describe.skipIf(!USERNAME)("SejongClient Integration", () => {
  it("fetches grades", async () => {
    const client = new SejongClient();
    await client.login(USERNAME, PASSWORD);
    const report = await client.getGrades();

    expect(report.studentId).toBe(USERNAME);
    expect(report.grades.length).toBeGreaterThan(0);
    expect(report.totalGpa).toBeGreaterThan(0);
    console.log(
      `  Grades: ${report.studentName}, GPA=${report.totalGpa}, ${report.grades.length} courses`,
    );
  }, 15000);

  it("fetches enrollments", async () => {
    const client = new SejongClient();
    await client.login(USERNAME, PASSWORD);
    const report = await client.getEnrollments();

    expect(report.studentId).toBe(USERNAME);
    console.log(
      `  Enrollments: ${report.year}/${report.semester}, ${report.enrollments.length} courses, ${report.totalCredits} credits`,
    );
  }, 15000);

  it("fetches scholarships", async () => {
    const client = new SejongClient();
    await client.login(USERNAME, PASSWORD);
    const report = await client.getScholarships();

    expect(report.studentId).toBe(USERNAME);
    expect(report.scholarships.length).toBeGreaterThan(0);
    console.log(
      `  Scholarships: ${report.scholarships.length} items, total=${report.totalAmount.toLocaleString()}원`,
    );
  }, 15000);
});
