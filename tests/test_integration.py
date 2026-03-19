"""Integration test against the real Sejong portal.

Run: SEJONG_USERNAME=학번 SEJONG_PASSWORD=비밀번호 pytest tests/test_integration.py -v -s

NOTE: Each feature requires its own SSO login session.
      The portal limits login attempts, so we test one feature per run.
      Use -k to select: pytest -k grades, pytest -k enrollments, pytest -k scholarships
"""

import asyncio
import os

import pytest

from sejong_auth.client import SejongClient
from sejong_auth.models import EnrollmentReport, GradeReport, ScholarshipReport

pytestmark = pytest.mark.skipif(
    not os.environ.get("SEJONG_USERNAME"),
    reason="Set SEJONG_USERNAME and SEJONG_PASSWORD to run",
)

USERNAME = os.environ.get("SEJONG_USERNAME", "")
PASSWORD = os.environ.get("SEJONG_PASSWORD", "")


def test_all_features():
    """Test all features sequentially in a single test to minimize login attempts."""

    async def _run_all():
        # 1. Grades (separate session)
        async with SejongClient() as client:
            await client.login(USERNAME, PASSWORD)
            grades = await client.get_grades()
            assert isinstance(grades, GradeReport)
            assert grades.student_id == USERNAME
            assert len(grades.grades) > 0
            assert grades.total_gpa > 0
            print(f"\n  [Grades] {grades.student_name}, GPA: {grades.total_gpa}, Courses: {len(grades.grades)}")

        # 2. Enrollments (separate session)
        async with SejongClient() as client:
            await client.login(USERNAME, PASSWORD)
            enroll = await client.get_enrollments()
            assert isinstance(enroll, EnrollmentReport)
            assert enroll.student_id == USERNAME
            print(f"  [Enroll] {enroll.year}/{enroll.semester.value}, {len(enroll.enrollments)} courses, {enroll.total_credits} credits")

        # 3. Scholarships (separate session)
        async with SejongClient() as client:
            await client.login(USERNAME, PASSWORD)
            schol = await client.get_scholarships()
            assert isinstance(schol, ScholarshipReport)
            assert schol.student_id == USERNAME
            assert len(schol.scholarships) > 0
            print(f"  [Schol] {len(schol.scholarships)} scholarships, Total: {schol.total_amount:,}원")

    asyncio.run(_run_all())
